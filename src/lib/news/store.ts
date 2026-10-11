/** Cache partagé des lettres (une par sujet, sans date d'expiration : la périmée reste lisible). */
import { getItem, putItem, type Item } from "@/lib/db/client";
import { keys } from "@/lib/db/keys";
import type { CircleLetter, NewsLink } from "./types";

const isLink = (value: unknown): value is NewsLink => {
  if (!value || typeof value !== "object") return false;
  const link = value as NewsLink;
  return (
    typeof link.title === "string" &&
    typeof link.url === "string" &&
    link.url.startsWith("https://") &&
    typeof link.source === "string" &&
    (link.date === undefined || typeof link.date === "string")
  );
};

export async function readLetter(topicId: string): Promise<CircleLetter | null> {
  const key = keys.newsLetter(topicId);
  const item = await getItem(key.PK, key.SK);
  if (!item || !Array.isArray(item.links)) return null;
  const links = item.links.filter(isLink);
  if (links.length === 0 || typeof item.generatedAt !== "string") return null;
  return {
    topicId,
    label: typeof item.label === "string" ? item.label : topicId,
    summary: typeof item.summary === "string" && item.summary.trim() ? item.summary : null,
    links,
    generatedAt: item.generatedAt,
  };
}

export async function writeLetter(letter: CircleLetter): Promise<void> {
  const key = keys.newsLetter(letter.topicId);
  const item: Item = {
    ...key,
    topicId: letter.topicId,
    label: letter.label,
    summary: letter.summary,
    links: letter.links,
    generatedAt: letter.generatedAt,
  };
  await putItem(item);
}
