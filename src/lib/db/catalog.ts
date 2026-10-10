/** Lecture du contenu partagé (cercles, fils, ressources, questionnaire…) dans DynamoDB. */
import type { Question } from "@/lib/questionnaire";
import type {
  AiSuggestion,
  Catalog,
  Circle,
  CircleFamily,
  HelpResource,
  Member,
  PersonRecommendation,
  Reply,
  Resource,
  Thread,
} from "@/lib/types";
import { queryType, type Item } from "./client";
import { stripKeys } from "./keys";

const byOrder = (a: Item, b: Item) => (Number(a.order) || 0) - (Number(b.order) || 0);

type ContentMap = Record<string, unknown>;

async function loadContent(): Promise<ContentMap> {
  const items = await queryType("content");
  return Object.fromEntries(items.map((i) => [i.PK.replace("CONTENT#", ""), i.value]));
}

async function loadCatalogUncached(): Promise<Catalog> {
  const [circleItems, memberItems, threadItems, replyItems, resourceItems, questionItems, content] = await Promise.all([
    queryType("circle"),
    queryType("member"),
    queryType("thread"),
    queryType("reply"),
    queryType("resource"),
    queryType("question"),
    loadContent(),
  ]);

  if (circleItems.length === 0) {
    throw Object.assign(
      new Error("La base est vide : lancez « npm run db:create » puis « npm run db:seed »."),
      { name: "DatabaseNotSeeded" },
    );
  }

  const circles = circleItems.sort(byOrder).map((i) => stripKeys(i) as unknown as Circle);

  const members = Object.fromEntries(
    memberItems.map((i) => {
      const m = stripKeys(i) as unknown as Member;
      return [m.id, m];
    }),
  );

  const repliesByThread = new Map<string, Reply[]>();
  [...replyItems]
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .forEach((i) => {
      const { threadId, ...reply } = stripKeys(i) as unknown as Reply & { threadId: string };
      const list = repliesByThread.get(threadId) ?? [];
      list.push(reply);
      repliesByThread.set(threadId, list);
    });

  const threads = threadItems.sort(byOrder).map((i) => {
    const t = stripKeys(i) as unknown as Thread;
    return { ...t, replies: repliesByThread.get(t.id) ?? [] };
  });

  const resources = Object.fromEntries(
    resourceItems.map((i) => {
      const r = stripKeys(i) as unknown as Resource;
      return [r.id, r];
    }),
  );

  const questions = questionItems.sort(byOrder).map((i) => stripKeys(i) as unknown as Question);

  const topics = (content.topics ?? { seedTopics: [], relatedTopics: {} }) as Pick<
    Catalog,
    "seedTopics" | "relatedTopics"
  >;

  return {
    circles,
    members,
    threads,
    resources,
    questions,
    seedTopics: topics.seedTopics,
    relatedTopics: topics.relatedTopics,
    familyLabels: (content.familyLabels ?? {}) as Record<CircleFamily, string>,
    charter: (content.charter ?? []) as string[],
    pseudos: (content.pseudos ?? []) as string[],
  };
}

// Le contenu partagé change rarement : un cache mémoire de quelques secondes évite des lectures répétées.
const CACHE_MS = 10_000;
const globalCache = globalThis as unknown as { __catalog?: { at: number; value: Promise<Catalog> } };

export function loadCatalog(): Promise<Catalog> {
  const hit = globalCache.__catalog;
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = loadCatalogUncached();
  globalCache.__catalog = { at: Date.now(), value };
  // Une erreur ne doit pas rester en cache.
  value.catch(() => {
    if (globalCache.__catalog?.value === value) globalCache.__catalog = undefined;
  });
  return value;
}

/** Données utilisées par la recommandation de solutions. */
export async function loadSolutionData(): Promise<{
  suggestions: AiSuggestion[];
  people: PersonRecommendation[];
}> {
  const [suggestions, people] = await Promise.all([queryType("suggestion"), queryType("person")]);
  return {
    suggestions: suggestions.sort(byOrder).map((i) => stripKeys(i) as unknown as AiSuggestion),
    people: people.sort(byOrder).map((i) => stripKeys(i) as unknown as PersonRecommendation),
  };
}

export async function loadHelpResources(): Promise<HelpResource[]> {
  const content = await loadContent();
  return (content.helpResources ?? []) as HelpResource[];
}
