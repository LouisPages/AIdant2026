/**
 * Une lettre fraîche (moins de 24 h) est renvoyée telle quelle.
 * Une lettre plus ancienne est renvoyée tout de suite, et renouvelée sans bloquer la page.
 * S'il n'y en a pas, la première visite attend la rédaction. Un échec ne bloque pas le fil.
 */
import { composeLetter } from "./letter";
import { readLetter, writeLetter } from "./store";
import type { NewsTopic } from "./topic";
import type { CircleLetter } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_MS = 10 * 60 * 1000;

const globalForNews = globalThis as unknown as {
  __newsInflight?: Map<string, Promise<CircleLetter | null>>;
  __newsNegative?: Map<string, number>;
};

const inflight = () => (globalForNews.__newsInflight ??= new Map());
const negative = () => (globalForNews.__newsNegative ??= new Map());

/** Relit les flux et enregistre la lettre. `null` si aucune source n'a d'article. */
export async function refreshTopic(topic: NewsTopic): Promise<CircleLetter | null> {
  const letter = await composeLetter(topic);
  if (!letter) return null;
  try {
    await writeLetter(letter);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[lettre] cache non écrit (${(error as Error).name ?? "erreur"}).`);
    }
  }
  return letter;
}

function renew(topic: NewsTopic): Promise<CircleLetter | null> {
  const pending = inflight().get(topic.id);
  if (pending) return pending;
  const job = refreshTopic(topic)
    .catch((error) => {
      if (process.env.NODE_ENV !== "production") console.warn(`[lettre] ${(error as Error).message}`);
      return null;
    })
    .then((letter) => {
      if (!letter) negative().set(topic.id, Date.now() + NEGATIVE_MS);
      else negative().delete(topic.id);
      return letter;
    })
    .finally(() => inflight().delete(topic.id));
  inflight().set(topic.id, job);
  return job;
}

export async function deliverLetter(topic: NewsTopic): Promise<CircleLetter | null> {
  const cached = await readLetter(topic.id).catch(() => null);
  const fresh = cached !== null && Date.now() - Date.parse(cached.generatedAt) < DAY_MS;
  if (cached && fresh) return cached;
  if (cached) {
    if (Date.now() >= (negative().get(topic.id) ?? 0)) void renew(topic);
    return cached;
  }
  if (Date.now() < (negative().get(topic.id) ?? 0)) return null;
  return renew(topic);
}
