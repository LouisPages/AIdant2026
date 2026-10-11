/**
 * Lecture des flux RSS et Atom, et des pages d'actualités (liens du même site seulement).
 * Aucune dépendance : le XML de ces flux est assez régulier pour un lecteur court.
 */
import { matchesTopic, type NewsTopic } from "./topic";
import { originsFor, type Origin } from "./sources";
import type { NewsItem } from "./types";

const UA = "EntreAidants/1.0 (lettre d'actualites)";
const RECENT_MS = 180 * 24 * 3600 * 1000;
const OLDEST_MS = 540 * 24 * 3600 * 1000;

const decode = (raw: string) =>
  raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safePoint(Number(dec)));

const safePoint = (cp: number) => (Number.isFinite(cp) && cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : "");

const textOf = (raw: string) => decode(raw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function firstTag(block: string, names: string[]): string {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
    if (match) return textOf(match[1]);
  }
  return "";
}

function atomLink(block: string): string {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map((m) => {
    const href = m[1].match(/href=["']([^"']+)["']/i)?.[1] ?? "";
    const rel = m[1].match(/rel=["']([^"']+)["']/i)?.[1] ?? "alternate";
    return { href: decode(href).trim(), rel };
  });
  return links.find((l) => l.rel === "alternate" && l.href)?.href ?? links.find((l) => l.href)?.href ?? "";
}

function linkOf(block: string): string {
  const plain = block.match(/<link\b[^>]*>([^<]+)<\/link>/i);
  if (plain) return decode(plain[1]).trim();
  const fromAtom = atomLink(block);
  if (fromAtom) return fromAtom;
  const about = block.match(/\brdf:about=["']([^"']+)["']/i);
  return about ? decode(about[1]).trim() : "";
}

function dateOf(block: string): string | undefined {
  const raw = firstTag(block, ["pubDate", "dc:date", "updated", "published", "date"]);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function cleanUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    for (const key of [...parsed.searchParams.keys()]) {
      if (key.startsWith("utm_") || key === "fbclid") parsed.searchParams.delete(key);
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** Même site, en ignorant « www ». Un sous-domaine du site du flux est accepté (presse.inserm.fr). */
export function sameSite(itemUrl: string, baseUrl: string): boolean {
  const item = hostOf(itemUrl);
  const base = hostOf(baseUrl);
  if (!item || !base) return false;
  return item === base || item.endsWith(`.${base}`) || base.endsWith(`.${item}`);
}

/** Retire le chrome des sites (partage, fil d'Ariane) pour ne garder qu'un chapô, ou rien. */
function cleanExcerpt(title: string, raw: string): string | undefined {
  let text = raw
    .replace(/ajouter\s+[\s\S]{0,80}?comme favoris/gi, " ")
    .replace(/partager(?:\s+l['’]article|\s+sur|\s+par)[^.]{0,140}/gi, " ")
    .replace(/nouvelle fen[eê]tre/gi, " ")
    .replace(/lire la suite.*/gi, " ")
    .replace(/en savoir \+.*/gi, " ")
    .replace(/l['’]article .+ est apparu en premier sur .+$/i, " ")
    .replace(/accueil\s*>\s*actualit[ée]s\s*>\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const head = title.replace(/\s+/g, " ").trim();
  if (head && text.toLowerCase().startsWith(head.toLowerCase())) {
    text = text.slice(head.length).replace(/^[\s–—\-:|>]+/, "").trim();
  }
  if (text.length < 40) return undefined;
  return text.slice(0, 500);
}

function excerptOf(block: string, title: string): string | undefined {
  const text = firstTag(block, ["description", "summary", "content:encoded"]);
  if (!text) return undefined;
  return cleanExcerpt(title, text);
}

/** Articles d'un flux RSS 2.0 ou Atom. Les blocs sont le XML brut, liens compris. */
export function parseFeed(xml: string): Omit<NewsItem, "source">[] {
  const itemBlocks = [...xml.matchAll(/<item\b[^>]*>[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const blocks = itemBlocks.length ? itemBlocks : [...xml.matchAll(/<entry\b[^>]*>[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  const out: Omit<NewsItem, "source">[] = [];
  for (const block of blocks) {
    const title = firstTag(block, ["title"]);
    const url = cleanUrl(linkOf(block));
    if (title.length < 8 || !url) continue;
    if (/\/feed\/?$/i.test(new URL(url).pathname)) continue;
    const excerpt = excerptOf(block, title);
    const date = dateOf(block);
    out.push({ title, url, ...(date ? { date } : {}), ...(excerpt ? { excerpt } : {}) });
  }
  return out;
}

const SKIP_PATH = /\/(tag|category|author|page|wp-content|wp-json|feed|recherche|search|contact|mentions)(\/|$)/i;

/** Liens d'une page d'actualités : même site, texte assez long, chemin d'article. */
export function parseListing(html: string, pageUrl: string): Omit<NewsItem, "source">[] {
  const out: Omit<NewsItem, "source">[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const rawHref = decode(match[1]).trim();
    const title = textOf(match[2]);
    if (title.length < 25 || title.length > 180) continue;
    let absolute: string;
    try {
      absolute = new URL(rawHref, pageUrl).toString();
    } catch {
      continue;
    }
    const url = cleanUrl(absolute);
    if (!url || !sameSite(url, pageUrl) || seen.has(url)) continue;
    const path = new URL(url).pathname;
    if (SKIP_PATH.test(path) || path.split("/").filter(Boolean).length < 2) continue;
    seen.add(url);
    out.push({ title, url });
    if (out.length >= 8) break;
  }
  return out;
}

function takeRecent(items: NewsItem[]): NewsItem[] {
  const now = Date.now();
  const sorted = [...items].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const recent = sorted.filter((item) => item.date && now - Date.parse(item.date) < RECENT_MS);
  if (recent.length >= 2) return recent.slice(0, 6);
  const within = sorted.filter((item) => !item.date || now - Date.parse(item.date) < OLDEST_MS);
  return within.slice(0, 4);
}

function interleave(groups: NewsItem[][], max: number): NewsItem[] {
  const out: NewsItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < max; i++) {
    let added = false;
    for (const group of groups) {
      const item = group[i];
      if (!item || seen.has(item.url)) continue;
      seen.add(item.url);
      out.push(item);
      added = true;
      if (out.length >= max) break;
    }
    if (!added) break;
  }
  return out;
}

async function readOrigin(origin: Origin): Promise<NewsItem[]> {
  const res = await fetch(origin.url, {
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
    headers: {
      "user-agent": UA,
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.5",
    },
  });
  if (!res.ok) return [];
  const xml = (await res.text()).slice(0, 1_000_000);
  const parsed = origin.kind === "page" ? parseListing(xml, res.url || origin.url) : parseFeed(xml);
  const bases = [origin.url, res.url].filter(Boolean);
  return parsed
    .filter((item) => bases.some((base) => sameSite(item.url, base)))
    .map((item) => ({ ...item, source: origin.name }));
}

/** Jusqu'à six articles du sujet, répartis entre les origines. */
export async function collectItems(topic: NewsTopic): Promise<NewsItem[]> {
  const groups = await Promise.all(
    originsFor(topic).map(async (origin) => {
      try {
        const items = await readOrigin(origin);
        const kept = origin.focused ? items : items.filter((item) => matchesTopic(`${item.title} ${item.excerpt ?? ""}`, topic.keywords));
        return takeRecent(kept);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[lettre] ${origin.name} inaccessible (${(error as Error).name ?? "erreur"}).`);
        }
        return [];
      }
    }),
  );
  return interleave(groups, 6);
}
