/**
 * Accès Amazon Bedrock (serveur uniquement). Région unique : us-east-1 (les autres sont refusées par le compte).
 *
 * Principe : l'IA est un plus, jamais une dépendance. Toute fonction `try*` renvoie `null` en cas d'échec
 * (réseau, droits, quota, délai) et un disjoncteur coupe les appels pendant une minute après des échecs répétés.
 */
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { TIMEOUTS } from "./weights";

export const AI_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
export const EMBED_MODEL_ID = process.env.BEDROCK_EMBED_MODEL_ID || "amazon.titan-embed-text-v2:0";
export const EMBED_DIMENSIONS = 512;

/** `bedrock` (par défaut) ou `rules` : tout en local, sans aucun appel AWS. */
export const aiMode = (): "bedrock" | "rules" => (process.env.AI_MODE === "rules" ? "rules" : "bedrock");

const g = globalThis as unknown as {
  __bedrock?: BedrockRuntimeClient;
  __breaker?: { failures: number; openUntil: number };
};

export function runtimeClient(): BedrockRuntimeClient {
  return (g.__bedrock ??= new BedrockRuntimeClient({ region: AI_REGION, maxAttempts: 2 }));
}

const breaker = () => (g.__breaker ??= { failures: 0, openUntil: 0 });

/** Faux pendant la minute qui suit trois échecs consécutifs, ou si le mode « rules » est actif. */
export const bedrockAvailable = () => aiMode() === "bedrock" && Date.now() >= breaker().openUntil;

export function reportBedrock(ok: boolean, error?: unknown) {
  const b = breaker();
  if (ok) {
    b.failures = 0;
    return;
  }
  b.failures += 1;
  if (error && process.env.NODE_ENV !== "production") {
    console.warn(`[ia] Bedrock indisponible (${(error as Error).name ?? "erreur"}) : repli sur les règles locales.`);
  }
  if (b.failures >= 3) b.openUntil = Date.now() + 60_000;
}

/** Vecteur normalisé de 512 dimensions. Lève une erreur en cas d'échec (utilisé par les scripts). */
export async function embedText(text: string, timeoutMs: number = TIMEOUTS.embedMs): Promise<Float32Array> {
  const res = await runtimeClient().send(
    new InvokeModelCommand({
      modelId: EMBED_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({ inputText: text.slice(0, 8000), dimensions: EMBED_DIMENSIONS, normalize: true }),
    }),
    { abortSignal: AbortSignal.timeout(timeoutMs) },
  );
  const parsed = JSON.parse(new TextDecoder().decode(res.body)) as { embedding: number[] };
  return Float32Array.from(parsed.embedding);
}

/** Comme `embedText`, mais renvoie `null` au lieu de lever une erreur, et respecte le disjoncteur. */
export async function tryEmbed(text: string): Promise<Float32Array | null> {
  if (!bedrockAvailable() || text.trim().length === 0) return null;
  try {
    const v = await embedText(text);
    reportBedrock(true);
    return v;
  } catch (e) {
    reportBedrock(false, e);
    return null;
  }
}
