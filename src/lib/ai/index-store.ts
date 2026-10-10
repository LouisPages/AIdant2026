/**
 * Index vectoriel en mémoire. Les vecteurs sont calculés une fois (`npm run db:embed`), stockés dans DynamoDB
 * (EMB#type#id), puis chargés ici et comparés par produit scalaire : quelques centaines de vecteurs de 512
 * dimensions, donc pas besoin d'un moteur vectoriel dédié.
 */
import { queryType } from "@/lib/db/client";
import { EMBED_DIMENSIONS, EMBED_MODEL_ID, tryEmbed } from "./bedrock";
import type { EmbedKind } from "./documents";
import { hashText, unpackVector } from "./vector";

export type VectorIndex = { vectors: Map<string, Float32Array>; loadedAt: number };

export const vectorKey = (kind: EmbedKind, id: string) => `${kind}#${id}`;

const INDEX_TTL_MS = 5 * 60_000;
const RETRY_AFTER_ERROR_MS = 30_000;

const g = globalThis as unknown as {
  __vindex?: { at: number; ttl: number; value: Promise<VectorIndex> };
  __qcache?: Map<string, Float32Array>;
};

async function loadUncached(): Promise<VectorIndex> {
  const items = await queryType("emb");
  const vectors = new Map<string, Float32Array>();
  for (const item of items) {
    if (item.model !== EMBED_MODEL_ID || item.dim !== EMBED_DIMENSIONS || !item.vec) continue;
    vectors.set(`${item.kind}#${item.refId}`, unpackVector(item.vec as Uint8Array));
  }
  return { vectors, loadedAt: Date.now() };
}

/** Charge l'index (mis en cache). Ne lève jamais d'erreur : un index vide désactive simplement la sémantique. */
export async function loadIndex(): Promise<VectorIndex> {
  const hit = g.__vindex;
  if (hit && Date.now() - hit.at < hit.ttl) return hit.value;
  const value = loadUncached().catch((): VectorIndex => {
    g.__vindex = { at: Date.now(), ttl: RETRY_AFTER_ERROR_MS, value: Promise.resolve({ vectors: new Map(), loadedAt: 0 }) };
    return { vectors: new Map(), loadedAt: 0 };
  });
  g.__vindex = { at: Date.now(), ttl: INDEX_TTL_MS, value };
  return value;
}

/** Vecteur d'un texte libre (récit de l'aidant, brouillon de message), avec un petit cache mémoire. */
export async function embedQuery(text: string): Promise<Float32Array | null> {
  const cache = (g.__qcache ??= new Map());
  const key = hashText(text);
  const hit = cache.get(key);
  if (hit) return hit;
  const v = await tryEmbed(text);
  if (v) {
    cache.set(key, v);
    if (cache.size > 300) cache.delete(cache.keys().next().value as string);
  }
  return v;
}
