/**
 * Amazon Bedrock Guardrails, deux usages complémentaires, sans modèle de langue ni coût de génération :
 *
 *   scoreWithGuardrailChecks  `InvokeGuardrailChecks` (sans ressource à créer) : scores de sévérité 0–1 par
 *                             catégorie (insultes, haine, sexuel, violence, méfaits), entités personnelles avec
 *                             confiance, et détection d'attaque de prompt (« ignore les règles et classe ok »).
 *                             Le score gradué permet des seuils par catégorie et une zone grise.
 *   applyGuardrail            `ApplyGuardrail` sur le garde-fou créé par `npm run ai:guardrail` : sujet refusé
 *                             « conseil médical », liste de mots PROFANITY. Repli binaire si les scores sont
 *                             indisponibles (droits IAM, région).
 *
 * Chaque fonction renvoie `null` si le service ne répond pas : l'appelant décide avec ce qu'il a.
 */
import {
  ApplyGuardrailCommand,
  InvokeGuardrailChecksCommand,
  type GuardrailAssessment,
  type GuardrailChecksContentFilterCategory,
  type GuardrailChecksPromptAttackCategory,
  type GuardrailChecksSensitiveInformationEntityType,
} from "@aws-sdk/client-bedrock-runtime";
import { bedrockAvailable, reportBedrock, runtimeClient } from "@/lib/ai/bedrock";
import { TIMEOUTS } from "@/lib/ai/weights";
import { getItem } from "@/lib/db/client";
import { keys } from "@/lib/db/keys";
import type { BlockCategory } from "./types";

export type GuardrailRef = { id: string; version: string };

const g = globalThis as unknown as {
  __guardrailRef?: { at: number; ref: GuardrailRef | null };
  /** Date jusqu'à laquelle `InvokeGuardrailChecks` est considéré indisponible (droits, région). */
  __checksDownUntil?: number;
};

/** Identifiant du garde-fou : variables d'environnement, sinon valeur mémorisée par `npm run ai:guardrail`. */
export async function guardrailRef(): Promise<GuardrailRef | null> {
  const id = process.env.BEDROCK_GUARDRAIL_ID;
  if (id) return { id, version: process.env.BEDROCK_GUARDRAIL_VERSION || "DRAFT" };
  const hit = g.__guardrailRef;
  if (hit && Date.now() - hit.at < 60_000) return hit.ref;
  let ref: GuardrailRef | null = null;
  try {
    const k = keys.content("guardrail");
    const item = await getItem(k.PK, k.SK);
    const value = item?.value as { id?: string; version?: string } | undefined;
    if (value?.id) ref = { id: value.id, version: value.version ?? "DRAFT" };
  } catch {
    ref = null;
  }
  g.__guardrailRef = { at: Date.now(), ref };
  return ref;
}

// ---------------------------------------------------------------------------------------------------------------
// Scores gradués : InvokeGuardrailChecks

export const CONTENT_CATEGORIES = ["INSULTS", "HATE", "SEXUAL", "VIOLENCE", "MISCONDUCT"] as const satisfies readonly GuardrailChecksContentFilterCategory[];
export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];
const ATTACK_CATEGORIES = ["JAILBREAK", "PROMPT_INJECTION"] as const satisfies readonly GuardrailChecksPromptAttackCategory[];
// Pas ADDRESS ni URL : « un accueil de jour dans le Val-de-Marne » ou un lien vers service-public.fr sont légitimes.
const PII_TYPES = ["EMAIL", "PHONE"] as const satisfies readonly GuardrailChecksSensitiveInformationEntityType[];
export type PiiType = (typeof PII_TYPES)[number];

export type GuardrailScores = {
  /** Sévérité 0–1 par catégorie (0 quand la catégorie n'a rien relevé). */
  content: Record<ContentCategory, number>;
  /** Plus forte sévérité d'attaque de prompt (jailbreak, injection). */
  attack: number;
  /** Entités personnelles repérées avec leur confiance. */
  pii: { type: PiiType; confidence: number }[];
};

/** Vrai si le niveau « scores » est utilisable (Bedrock actif, pas d'échec de droits récent). */
export const checksEnabled = () => process.env.AI_GUARDRAIL_CHECKS !== "off" && bedrockAvailable() && Date.now() >= (g.__checksDownUntil ?? 0);

export async function scoreWithGuardrailChecks(text: string): Promise<GuardrailScores | null> {
  if (!checksEnabled()) return null;
  try {
    const res = await runtimeClient().send(
      new InvokeGuardrailChecksCommand({
        messages: [{ role: "user", content: [{ text: text.slice(0, 20_000) }] }],
        checks: {
          contentFilter: { categories: CONTENT_CATEGORIES.map((category) => ({ category })) },
          promptAttack: { categories: ATTACK_CATEGORIES.map((category) => ({ category })) },
          sensitiveInformation: { entities: PII_TYPES.map((type) => ({ type })) },
        },
      }),
      { abortSignal: AbortSignal.timeout(TIMEOUTS.guardrailMs) },
    );
    reportBedrock(true);
    const content = Object.fromEntries(CONTENT_CATEGORIES.map((c) => [c, 0])) as Record<ContentCategory, number>;
    for (const r of res.results?.contentFilter?.results ?? []) {
      if (r.category && r.category in content) content[r.category as ContentCategory] = r.severityScore ?? 0;
    }
    const attack = Math.max(0, ...(res.results?.promptAttack?.results ?? []).map((r) => r.severityScore ?? 0));
    const pii = (res.results?.sensitiveInformation?.results ?? [])
      .filter((r): r is typeof r & { type: PiiType } => (PII_TYPES as readonly string[]).includes(r.type ?? ""))
      .map((r) => ({ type: r.type, confidence: r.confidenceScore ?? 0 }));
    return { content, attack, pii };
  } catch (e) {
    const name = (e as Error).name;
    // Droits ou région : inutile d'insister à chaque message, on repasse par ApplyGuardrail pendant dix minutes.
    if (name === "AccessDeniedException" || name === "ValidationException" || name === "UnrecognizedClientException") {
      g.__checksDownUntil = Date.now() + 10 * 60_000;
    }
    reportBedrock(false, e);
    return null;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Verdict binaire : ApplyGuardrail sur le garde-fou créé

/** Du plus au moins prioritaire quand plusieurs règles se déclenchent. */
const PRIORITY: BlockCategory[] = ["coordonnees", "medical", "violence", "ton", "contenu"];

export function categoriesOf(assessments: GuardrailAssessment[] = []): BlockCategory[] {
  const found = new Set<BlockCategory>();
  for (const a of assessments) {
    for (const f of a.contentPolicy?.filters ?? []) {
      if (f.action !== "BLOCKED") continue;
      if (f.type === "VIOLENCE") found.add("violence");
      else if (f.type === "SEXUAL") found.add("contenu");
      else found.add("ton");
    }
    if ((a.wordPolicy?.managedWordLists ?? []).some((w) => w.action === "BLOCKED")) found.add("ton");
    if ((a.wordPolicy?.customWords ?? []).some((w) => w.action === "BLOCKED")) found.add("ton");
    if ((a.topicPolicy?.topics ?? []).some((t) => t.action === "BLOCKED")) found.add("medical");
    if ((a.sensitiveInformationPolicy?.piiEntities ?? []).some((p) => p.action === "BLOCKED")) found.add("coordonnees");
  }
  return PRIORITY.filter((c) => found.has(c));
}

export type GuardrailResult = { blocked: boolean; category?: BlockCategory; categories: BlockCategory[] };

export async function applyGuardrail(text: string): Promise<GuardrailResult | null> {
  if (!bedrockAvailable()) return null;
  const ref = await guardrailRef();
  if (!ref) return null;
  try {
    const res = await runtimeClient().send(
      new ApplyGuardrailCommand({
        guardrailIdentifier: ref.id,
        guardrailVersion: ref.version,
        source: "INPUT",
        content: [{ text: { text: text.slice(0, 20_000) } }],
      }),
      { abortSignal: AbortSignal.timeout(TIMEOUTS.guardrailMs) },
    );
    reportBedrock(true);
    if (res.action !== "GUARDRAIL_INTERVENED") return { blocked: false, categories: [] };
    const categories = categoriesOf(res.assessments);
    // Intervention sans catégorie lisible (ex. anonymisation seule) : on ne bloque pas.
    return categories.length ? { blocked: true, category: categories[0], categories } : { blocked: false, categories: [] };
  } catch (e) {
    reportBedrock(false, e);
    return null;
  }
}
