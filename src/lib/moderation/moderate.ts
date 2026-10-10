/**
 * Chaîne de modération avant publication :
 *   1. normalisation anti-contournement puis règles locales françaises (coordonnées, doses, insultes, argot de mort,
 *      détresse) : instantané, sans réseau ; un refus local est final ;
 *   2. en PARALLÈLE : scores Amazon Bedrock Guardrails (`InvokeGuardrailChecks` : insultes, haine, sexuel, violence,
 *      entités personnelles, attaque de prompt), garde-fou binaire (`ApplyGuardrail` : sujet médical, liste de mots)
 *      et deux juges de langue à rubrique (Claude Haiku 4.5, Amazon Nova Lite) qui lisent le message dans son
 *      contexte ; la latence est celle du plus lent ;
 *   3. agrégation (`decide.ts`) selon la politique (`policy.ts`) : refus ferme, zone grise, ou publication, avec un
 *      signal d'aide si l'auteur semble en difficulté.
 *
 * Une détresse ou une dévalorisation de soi n'est jamais refusée : le message est publié, l'équipe est prévenue,
 * l'auteur reçoit de l'aide. Si un niveau ne répond pas, les autres font foi : une panne ne bloque jamais la
 * publication (choix assumé : disponibilité de l'espace d'entraide). Seuls les verdicts complets sont mis en cache.
 */
import { hashText } from "@/lib/ai/vector";
import { decide, type Evidence } from "./decide";
import { applyGuardrail, checksEnabled, scoreWithGuardrailChecks } from "./guardrail";
import { judge, judgeEnabled, judgeModel, secondJudgeModel } from "./judge";
import { localCheck } from "./local";
import type { ModerationContext, ModerationOutcome } from "./types";

const CACHE_MS = 10 * 60_000;
const CACHE_MAX = 500;
const g = globalThis as unknown as { __modCache?: Map<string, { at: number; outcome: ModerationOutcome }> };

export type AnalyzeOptions = {
  /** Interroger Guardrails, scores et garde-fou (défaut : oui). */
  guardrail?: boolean;
  /** Juge principal : identifiant de modèle, ou `false` pour s'en passer (défaut : modèle configuré). */
  llm?: string | false;
  /** Second juge : identifiant de modèle, ou `false` pour s'en passer (défaut : modèle configuré). */
  second?: string | false;
  context?: ModerationContext;
};

/** Analyse sans cache, avec des options pour comparer les configurations (`npm run ai:eval`). */
export async function analyze(clean: string, options: AnalyzeOptions = {}): Promise<ModerationOutcome> {
  return decide(await gather(clean, options));
}

/** Rassemble les indices de chaque niveau sans trancher (la décision est dans `decide.ts`). */
export async function gather(clean: string, options: AnalyzeOptions = {}): Promise<Evidence> {
  const local = localCheck(clean);
  const none: Evidence = { local, scores: null, guard: null, primary: null, second: null, complete: true };
  if (local.category) return none;

  const useGuardrail = options.guardrail !== false;
  const primaryModel = options.llm === false ? null : options.llm || judgeModel();
  const secondModel = options.second === false ? null : options.second || secondJudgeModel();
  const judgeInput = { text: clean, normalized: local.normalized.deep, obfuscated: local.normalized.obfuscated, context: options.context };

  const [scores, guard, primary, second] = await Promise.all([
    useGuardrail ? scoreWithGuardrailChecks(clean) : null,
    useGuardrail ? applyGuardrail(clean) : null,
    primaryModel ? judge(judgeInput, primaryModel) : null,
    secondModel ? judge(judgeInput, secondModel) : null,
  ]);

  // Complet si tout ce qui était activé a répondu (le garde-fou binaire est facultatif : il peut ne pas exister).
  const complete =
    (!useGuardrail || !checksEnabled() || scores !== null) &&
    (!primaryModel || !judgeEnabled() || primary !== null) &&
    (!secondModel || !judgeEnabled() || second !== null);

  return { local, scores, guard, primary, second, complete };
}

export async function moderate(text: string, context?: ModerationContext): Promise<ModerationOutcome> {
  const clean = text.trim();
  if (clean.length === 0) return { verdict: { decision: "publish" }, signal: null, source: "none", complete: true };

  const cache = (g.__modCache ??= new Map());
  const key = hashText(`${clean}\u0000${context?.parent ?? ""}\u0000${(context?.previous ?? []).join("\u0001")}`);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.outcome;

  const outcome = await analyze(clean, { context });

  // Une panne passagère ne doit pas figer le verdict : seul un contrôle complet (ou un refus) est mis en cache.
  if (outcome.complete || outcome.verdict.decision === "block") {
    cache.set(key, { at: Date.now(), outcome });
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
  }
  return outcome;
}
