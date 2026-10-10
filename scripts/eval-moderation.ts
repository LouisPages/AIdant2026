/**
 * Mesure la modération sur les phrases étiquetées de seed/moderation-examples.ts : `npm run ai:eval`.
 * Compare plusieurs configurations (règles seules, + Guardrails, + juge principal, jury complet) et, pour chacune,
 * mesure séparément ce qui compte (jamais un seul score global) :
 *   précision sur les bénins   part des messages acceptables ou à aider qui ne sont PAS refusés (faux refus = échec,
 *                              un faux refus en zone grise est signalé à part : moins grave, l'auteur a un recours)
 *   rappel par catégorie       part des violations refusées (ferme ou zone grise), et part de la bonne catégorie
 *   aide                       dévalorisation ou détresse repérée (manquée / en trop)
 *   latence                    p50 et p95 par message
 * Des variantes adversariales (leetspeak, lettres espacées, points) sont dérivées des insultes étiquetées pour
 * tester la normalisation.
 *
 *   npm run ai:eval                                   toutes les configurations
 *   npm run ai:eval -- --models=us.amazon.nova-lite-v1:0   juge principal à comparer (séparés par des virgules)
 *   npm run ai:eval -- --only=jury                    une seule configuration (rules | guardrails | judge | jury)
 *   npm run ai:eval -- --sweep                        trace, pour le juge principal, l'effet du seuil de refus
 *   npm run ai:eval -- --verbose                      liste aussi les bonnes réponses
 */
import { moderationExamples, type Expected, type ModerationExample } from "../seed/moderation-examples";
import { TIMEOUTS } from "../src/lib/ai/weights";
import { decide, type Evidence } from "../src/lib/moderation/decide";
import { DEFAULT_JUDGE_MODEL, DEFAULT_SECOND_JUDGE_MODEL } from "../src/lib/moderation/judge";
import { localCheck } from "../src/lib/moderation/local";
import { gather, type AnalyzeOptions } from "../src/lib/moderation/moderate";
import { LABEL_CATEGORY } from "../src/lib/moderation/policy";
import type { ModerationOutcome } from "../src/lib/moderation/types";

// On mesure la justesse, pas la latence de production : des délais larges évitent qu'un appel lent fausse le résultat.
Object.assign(TIMEOUTS, { guardrailMs: 20_000, llmMs: 30_000 });

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const sweep = args.includes("--sweep");
const only = args.find((a) => a.startsWith("--only="))?.slice("--only=".length);
const modelsArg = args.find((a) => a.startsWith("--models="))?.slice("--models=".length);
const models = modelsArg ? modelsArg.split(",") : [DEFAULT_JUDGE_MODEL];

type Config = { key: string; name: string; options: AnalyzeOptions };
const configs: Config[] = (
  [
    { key: "rules", name: "règles locales seules", options: { guardrail: false, llm: false, second: false } },
    { key: "guardrails", name: "règles + Guardrails (scores + garde-fou)", options: { guardrail: true, llm: false, second: false } },
    ...models.map((m): Config => ({ key: "judge", name: `règles + Guardrails + juge ${m}`, options: { guardrail: true, llm: m, second: false } })),
    ...models.map((m): Config => ({ key: "jury", name: `jury complet : règles + Guardrails + ${m} + ${DEFAULT_SECOND_JUDGE_MODEL}`, options: { guardrail: true, llm: m } })),
  ] satisfies Config[]
).filter((c) => !only || c.key === only);

// ---------------------------------------------------------------------------------------------------------------
// Variantes adversariales : à partir des insultes étiquetées « ton » sans contexte, on maquille le mot le plus long.

const leet = (w: string) => w.replace(/o/g, "0").replace(/a/g, "4").replace(/e/g, "3");
const spaced = (w: string) => w.split("").join(" ");
const dotted = (w: string) => w.split("").join(".");
function adversarial(base: ModerationExample[]): ModerationExample[] {
  const out: ModerationExample[] = [];
  // Seules les insultes que les règles attrapent en clair servent de base : on mesure la normalisation, pas le lexique.
  for (const ex of base.filter((e) => e.expect === "ton" && !e.context && !e.family && localCheck(e.text).category === "ton").slice(0, 6)) {
    const words = ex.text.split(/\s+/);
    // Le mot maquillé est le plus long de ceux dont la suppression fait passer le message : c'est l'insulte.
    const carriers = words.filter((w) => !localCheck(ex.text.replace(w, "")).category);
    const longest = (carriers.length ? carriers : words).reduce((a, b) => (b.replace(/\W/g, "").length > a.replace(/\W/g, "").length ? b : a));
    for (const [name, f] of [["leet", leet], ["espacé", spaced], ["pointé", dotted]] as const) {
      const word = longest.replace(/\W+$/, "");
      const tail = longest.slice(word.length);
      out.push({ text: ex.text.replace(longest, f(word) + tail), expect: "ton", family: `adversarial ${name}` });
    }
  }
  return out;
}

const examples = [...moderationExamples, ...adversarial(moderationExamples)];

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

const isBlock = (e: Expected) => e !== "publish" && e !== "support";
const pct = (n: number, d: number) => (d === 0 ? "  n/a" : `${((100 * n) / d).toFixed(0).padStart(3)} %`);
const quantile = (xs: number[], q: number) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(q * xs.length))] : 0);

type Row = { ex: ModerationExample; outcome: ModerationOutcome; evidence: Evidence; got: Expected; severity?: "ferme" | "zone_grise"; ms: number };

function summarize(name: string, rows: Row[], seconds: number) {
  const benign = rows.filter((r) => !isBlock(r.ex.expect));
  const violations = rows.filter((r) => isBlock(r.ex.expect));
  const falseFirm = benign.filter((r) => isBlock(r.got) && r.severity === "ferme");
  const falseGray = benign.filter((r) => isBlock(r.got) && r.severity === "zone_grise");
  const caught = violations.filter((r) => isBlock(r.got));
  const missed = violations.filter((r) => !isBlock(r.got));
  const wrongCategory = caught.filter((r) => r.got !== r.ex.expect);
  const supportMissed = rows.filter((r) => r.ex.expect === "support" && r.got === "publish");
  const supportExtra = rows.filter((r) => r.ex.expect === "publish" && r.got === "support");
  const latencies = rows.map((r) => r.ms);

  console.log(`=== ${name}  (${seconds.toFixed(0)} s, p50 ${quantile(latencies, 0.5)} ms, p95 ${quantile(latencies, 0.95)} ms)`);
  console.log(
    `bénins non refusés ${pct(benign.length - falseFirm.length - falseGray.length, benign.length)} (${benign.length}) | faux refus fermes ${falseFirm.length}, gris ${falseGray.length}` +
      ` | violations refusées ${pct(caught.length, violations.length)} (${violations.length}) | manquées ${missed.length} | mauvaise catégorie ${wrongCategory.length}` +
      ` | aide manquée ${supportMissed.length}, en trop ${supportExtra.length}`,
  );

  // Rappel par catégorie attendue et par famille.
  const groups = new Map<string, Row[]>();
  for (const r of violations) {
    const key = r.ex.family ? `${r.ex.expect} / ${r.ex.family}` : r.ex.expect;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  for (const [key, list] of [...groups.entries()].sort()) {
    const c = list.filter((r) => isBlock(r.got));
    const firm = c.filter((r) => r.severity === "ferme").length;
    console.log(`  ${key.padEnd(34)} refusées ${pct(c.length, list.length)}  (${firm} fermes, ${c.length - firm} grises, ${list.length - c.length} manquées)`);
  }

  const show = (label: string, list: Row[]) =>
    list.forEach((r) =>
      console.log(
        `  ${label.padEnd(16)} attendu ${r.ex.expect.padEnd(11)} obtenu ${`${r.got}${r.severity === "zone_grise" ? " (gris)" : ""}`.padEnd(18)} via ${r.outcome.source.padEnd(9)} « ${r.ex.text.slice(0, 70)} »`,
      ),
    );
  show("FAUX REFUS FERME", falseFirm);
  show("faux refus gris", falseGray);
  show("manqué", missed);
  show("aide manquée", supportMissed);
  show("aide en trop", supportExtra);
  show("catégorie", wrongCategory);
  if (verbose) show("ok", rows.filter((r) => r.got === r.ex.expect));
  if (verbose) {
    for (const r of rows.filter((r) => isBlock(r.got) || r.ex.family === "négatif difficile").slice(0, 400)) {
      if (r.outcome.rationale) console.log(`      ↳ ${r.outcome.rationale.slice(0, 300)}`);
    }
  }
  console.log("");
  return { falseFirm: falseFirm.length, falseGray: falseGray.length, missed: missed.length };
}

/** Effet du seuil de refus du juge principal, s'il décidait seul : faux refus (bénins) et manqués (violations). */
function sweepJudge(rows: Row[]) {
  const scored = rows.filter((r) => r.evidence.primary);
  if (!scored.length) return;
  const maxBlocking = (r: Row) =>
    Math.max(0, ...Object.entries(r.evidence.primary!.scores).filter(([l]) => LABEL_CATEGORY[l as keyof typeof LABEL_CATEGORY] !== "signal").map(([, s]) => s ?? 0));
  console.log("  Seuil du juge principal (s'il décidait seul, hors règles locales) :");
  for (const t of [20, 30, 40, 50, 60, 70, 80]) {
    const fr = scored.filter((r) => !isBlock(r.ex.expect) && maxBlocking(r) >= t).length;
    const miss = scored.filter((r) => isBlock(r.ex.expect) && maxBlocking(r) < t).length;
    console.log(`    ≥ ${String(t).padStart(2)}  faux refus ${String(fr).padStart(2)}   manqués ${String(miss).padStart(2)}`);
  }
  console.log("");
}

async function main() {
  console.log(`${moderationExamples.length} phrases étiquetées + ${examples.length - moderationExamples.length} variantes adversariales.\n`);
  let failed = false;

  for (const config of configs) {
    // Le premier appel Bedrock est lent (connexion, identifiants) : on le fait avant de mesurer, et on rouvre le disjoncteur.
    (globalThis as { __breaker?: unknown }).__breaker = undefined;
    for (let i = 0; i < 2; i++) await gather(`Bonjour, ceci est un essai ${i}.`, config.options);
    (globalThis as { __breaker?: unknown }).__breaker = undefined;
    const t0 = Date.now();
    const rows = await pool(examples, 4, async (ex): Promise<Row> => {
      const start = Date.now();
      const evidence = await gather(ex.text, { ...config.options, context: ex.context ? { parent: ex.context } : undefined });
      const outcome = decide(evidence);
      const got: Expected = outcome.verdict.decision === "block" ? outcome.verdict.category : outcome.signal ? "support" : "publish";
      return { ex, outcome, evidence, got, severity: outcome.verdict.decision === "block" ? outcome.verdict.severity : undefined, ms: Date.now() - start };
    });
    const r = summarize(config.name, rows, (Date.now() - t0) / 1000);
    if (sweep && config.options.llm) sweepJudge(rows);
    // Un faux refus ferme avec les juges actifs est une régression ; les règles seules et Guardrails seuls sont des filets.
    if (config.options.llm && r.falseFirm > 0) failed = true;
  }

  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
