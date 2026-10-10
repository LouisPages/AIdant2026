/**
 * Agrégation des indices en un verdict. Chaque source (règles, scores Guardrails, garde-fou binaire, juges) dépose
 * des indices par catégorie, à un niveau « ferme » ou « gris ». Puis :
 *   - un indice ferme, ou deux sources indépendantes au moins grises sur la même catégorie  → refus ferme ;
 *   - un seul indice gris                                                                   → zone grise ;
 *   - rien                                                                                  → publié.
 * La détresse et la dévalorisation de soi ne bloquent jamais : elles produisent un signal pour l'équipe humaine.
 * Fonction pure : facile à rejouer dans `npm run ai:eval`.
 */
import type { GuardrailResult, GuardrailScores } from "./guardrail";
import type { JudgeLabel, JudgeOpinion } from "./judge";
import type { LocalResult } from "./local";
import { ATTACK_GRAY, CATEGORY_PRIORITY, GUARDRAIL_CONTENT, JUDGE, LABEL_CATEGORY, PII_FIRM } from "./policy";
import { BLOCK_MESSAGES, GRAY_MESSAGE, strongest, type BlockCategory, type ModerationOutcome, type Severity, type Signal } from "./types";

export type Evidence = {
  local: LocalResult;
  scores: GuardrailScores | null;
  guard: GuardrailResult | null;
  primary: JudgeOpinion | null;
  second: JudgeOpinion | null;
  /** Vrai si tous les contrôles lancés ont répondu. */
  complete: boolean;
};

type Source = ModerationOutcome["source"];
/** `strength` (0–100) sert à choisir la catégorie montrée à l'auteur quand plusieurs sont retenues. */
type Clue = { category: BlockCategory; level: Severity; source: Source; origin: string; note: string; strength: number };

const BLOCKING = (Object.keys(LABEL_CATEGORY) as JudgeLabel[]).filter((l) => LABEL_CATEGORY[l] !== "signal");

type Role = "primary" | "second";
const firmFor = (role: Role) => (role === "primary" ? JUDGE.firm : JUDGE.secondFirm);
const grayFor = (role: Role) => (role === "primary" ? JUDGE.gray : JUDGE.secondGray);

/**
 * Sévérité la plus forte qu'un juge attribue à une catégorie bloquante. Le cas « medical » est tranché par
 * l'intention : un récit (« notre médecin a ajusté ») ne compte pas, sauf si le juge le note déjà comme grave.
 */
function judgeScore(o: JudgeOpinion, category: BlockCategory, role: Role): { score: number; label: JudgeLabel | null } {
  let best: { score: number; label: JudgeLabel | null } = { score: 0, label: null };
  for (const label of BLOCKING) {
    if (LABEL_CATEGORY[label] !== category) continue;
    const s = o.scores[label] ?? 0;
    if (label === "medical" && o.intent !== "consigne" && s < firmFor(role)) continue;
    if (s > best.score) best = { score: s, label };
  }
  return best;
}

const judgeClues = (o: JudgeOpinion | null, role: Role): Clue[] => {
  if (!o) return [];
  const clues: Clue[] = [];
  for (const category of CATEGORY_PRIORITY) {
    const { score, label } = judgeScore(o, category, role);
    const level: Severity | null = score >= firmFor(role) ? "ferme" : score >= grayFor(role) ? "zone_grise" : null;
    if (level) clues.push({ category, level, source: "judge", origin: role, note: `${label} ${score}`, strength: score });
  }
  return clues;
};

/** Un juge corrobore un indice venu d'ailleurs s'il voit au moins un cas « limite » dans la même catégorie. */
const corroborates = (o: JudgeOpinion | null, category: BlockCategory, role: Role) =>
  !!o && judgeScore(o, category, role).score >= JUDGE.corroborate;

/** Le juge a répondu et ne voit rien, même de léger, dans cette catégorie. */
const judgeCleanOn = (o: JudgeOpinion | null, category: BlockCategory) =>
  !!o && BLOCKING.every((l) => LABEL_CATEGORY[l] !== category || (o.scores[l] ?? 0) < JUDGE.clean);

export function decide(e: Evidence): ModerationOutcome {
  const clues: Clue[] = [];

  // 1. Règles locales : un refus net, sans attendre personne.
  if (e.local.category) {
    clues.push({ category: e.local.category, level: "ferme", source: "local", origin: "local", note: "règle locale", strength: 100 });
  }

  // 2. Scores Guardrails. Un score modéré est levé si le juge principal ne voit rien dans la catégorie : les filtres
  //    comptent VIOLENCE sur une détresse tournée vers soi, et montent sur le français familier.
  if (e.scores) {
    for (const [cat, policy] of Object.entries(GUARDRAIL_CONTENT)) {
      if (!policy) continue;
      const s = e.scores.content[cat as keyof typeof e.scores.content] ?? 0;
      const level: Severity | null = s >= policy.firm ? "ferme" : s >= policy.gray ? "zone_grise" : null;
      if (level === "zone_grise" && judgeCleanOn(e.primary, policy.category)) continue;
      if (level) clues.push({ category: policy.category, level, source: "guardrail", origin: "scores", note: `${cat} ${s.toFixed(2)}`, strength: s * 100 });
    }
    for (const p of e.scores.pii) {
      if (p.confidence >= PII_FIRM) {
        clues.push({ category: "coordonnees", level: "ferme", source: "guardrail", origin: "scores", note: `${p.type} ${p.confidence.toFixed(2)}`, strength: p.confidence * 100 });
      }
    }
    if (e.scores.attack >= ATTACK_GRAY) {
      clues.push({ category: "ton", level: "zone_grise", source: "guardrail", origin: "attack", note: `attaque de prompt ${e.scores.attack.toFixed(2)}`, strength: 40 });
    }
  }

  // 3. Garde-fou binaire (sujet médical, liste de mots, ou tout si les scores sont indisponibles) : un indice gris,
  //    sauf les coordonnées. Levé si le juge principal est serein sur la catégorie.
  if (e.guard?.blocked) {
    for (const category of e.guard.categories) {
      if (category === "coordonnees") clues.push({ category, level: "ferme", source: "guardrail", origin: "guard", note: "garde-fou", strength: 90 });
      else if (!judgeCleanOn(e.primary, category)) {
        clues.push({ category, level: "zone_grise", source: "guardrail", origin: "guard", note: `garde-fou ${category}`, strength: 40 });
      }
    }
  }

  // 4. Juges.
  clues.push(...judgeClues(e.primary, "primary"), ...judgeClues(e.second, "second"));

  // 5. Corroboration : deux origines distinctes au moins grises sur une catégorie → ferme. Parmi les catégories
  //    retenues, on montre à l'auteur la plus ferme puis la plus forte ; l'ordre de priorité ne départage que les égalités.
  const byCategory = new Map<BlockCategory, Clue[]>();
  for (const c of clues) byCategory.set(c.category, [...(byCategory.get(c.category) ?? []), c]);
  let chosen: { category: BlockCategory; level: Severity; strength: number } | null = null;
  for (const category of CATEGORY_PRIORITY) {
    const list = byCategory.get(category);
    if (!list?.length) continue;
    const origins = new Set(list.map((c) => c.origin));
    // Un juge qui n'a pas ouvert d'indice mais voit un cas « limite » compte aussi comme corroboration.
    if (!origins.has("primary") && corroborates(e.primary, category, "primary")) origins.add("primary");
    if (!origins.has("second") && corroborates(e.second, category, "second")) origins.add("second");
    const firm = list.some((c) => c.level === "ferme") || origins.size >= 2;
    const level: Severity = firm ? "ferme" : "zone_grise";
    // Le second juge note fort un peu partout : seule la force vue par le principal ou les règles départage.
    const strength = Math.max(...list.filter((c) => c.origin !== "second").map((c) => c.strength), 0);
    const better =
      !chosen ||
      (level === "ferme" && chosen.level !== "ferme") ||
      (level === chosen.level && strength > chosen.strength);
    if (better) chosen = { category, level, strength };
  }

  // 6. Signal d'aide : règles ou l'un des juges.
  let signal: Signal | null = e.local.signal;
  for (const o of [e.primary, e.second]) {
    if (!o) continue;
    if ((o.scores.detresse ?? 0) >= JUDGE.signal) signal = strongest(signal, "detresse");
    if ((o.scores.autodenigrement ?? 0) >= JUDGE.signal) signal = strongest(signal, "autodenigrement");
  }

  const rationale = explain(e, clues);

  if (chosen) {
    const { category, level } = chosen;
    const decisive = clues.find((c) => c.category === category && c.level === "ferme") ?? clues.find((c) => c.category === category)!;
    return {
      verdict: { decision: "block", category, severity: level, message: level === "ferme" ? BLOCK_MESSAGES[category] : GRAY_MESSAGE },
      signal,
      source: decisive.source,
      rationale,
      complete: e.complete,
    };
  }
  // Publié : la source dit quel niveau a eu le dernier mot (les juges s'ils ont répondu, sinon Guardrails, sinon les règles).
  const source: Source = e.primary || e.second ? "judge" : e.scores || e.guard ? "guardrail" : "local";
  return { verdict: { decision: "publish" }, signal, source, rationale, complete: e.complete };
}

/** Explication pour la relecture humaine : ce que chaque niveau a vu. */
function explain(e: Evidence, clues: Clue[]): string {
  const parts: string[] = [];
  if (e.local.category) parts.push(`Règle locale : ${e.local.category}${e.local.normalized.obfuscated ? " (texte maquillé)" : ""}.`);
  else if (e.local.normalized.obfuscated) parts.push("Texte maquillé (caractères déguisés).");
  for (const [role, o] of [["Juge principal", e.primary], ["Second juge", e.second]] as const) {
    if (!o) continue;
    const scores = Object.entries(o.scores)
      .filter(([, s]) => (s ?? 0) >= 20)
      .map(([l, s]) => `${l} ${s}`)
      .join(", ");
    parts.push(`${role} : « ${o.reasoning} » (cible ${o.target}, intention ${o.intent}${scores ? `, ${scores}` : ""}).`);
  }
  if (e.scores) {
    const seen = Object.entries(e.scores.content).filter(([, s]) => s > 0).map(([c, s]) => `${c} ${s.toFixed(2)}`);
    if (e.scores.attack > 0) seen.push(`attaque ${e.scores.attack.toFixed(2)}`);
    seen.push(...e.scores.pii.map((p) => `${p.type} ${p.confidence.toFixed(2)}`));
    if (seen.length) parts.push(`Guardrails : ${seen.join(", ")}.`);
  }
  if (e.guard?.blocked) parts.push(`Garde-fou : ${e.guard.categories.join(", ")}.`);
  const retained = clues.map((c) => `${c.category} (${c.level === "ferme" ? "ferme" : "gris"}, ${c.origin})`);
  if (retained.length) parts.push(`Indices retenus : ${retained.join(" ; ")}.`);
  return parts.join(" ");
}
