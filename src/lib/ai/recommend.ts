/**
 * Recommandation en trois niveaux (tags, caractéristiques de l'aidant, sémantique).
 * L'interface ne l'appelle jamais directement : elle passe par `lib/services`. Si Bedrock ne répond pas ou si
 * l'index est vide, le niveau 3 est simplement ignoré et le classement repose sur les deux premiers niveaux.
 */
import { loadCatalog, loadSolutionData } from "@/lib/db/catalog";
import type { Answers } from "@/lib/questionnaire";
import { detailLabels, detectNeedTags, detectThemeTags, profileTags, tagLabel, topicsToTags } from "@/lib/tags";
import type { AiSuggestion, Circle, PersonRecommendation, Resource, Thread } from "@/lib/types";
import { profileNarrative } from "./documents";
import { embedQuery, loadIndex, vectorKey } from "./index-store";
import {
  detailMismatch,
  detailsOf,
  diversify,
  scoreItems,
  tagSimilarity,
  tierTwo,
  type Scored,
} from "./scoring";
import { cosine } from "./vector";
import { JOINED_BONUS, MMR_LAMBDA, SIMILAR_THREAD_MIN_COSINE } from "./weights";

export type Recommendation = {
  rank: number;
  circle: Circle;
  reason: string;
};

export type Explained<T> = T & { why: Scored };

const listFr = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Vecteur du récit de l'aidant et index : chargés en parallèle, tous deux facultatifs. */
async function semanticContext(answers: Answers) {
  const [index, profileVec] = await Promise.all([loadIndex(), embedQuery(profileNarrative(answers))]);
  return { index, profileVec: index.vectors.size > 0 ? profileVec : null };
}

/** Explication ancrée uniquement sur ce qui a réellement servi au calcul. */
export function explainReason(matched: string[], memberCount?: number, anchorLabel?: string): string {
  const own = matched.filter((t) => !t.startsWith("det:"));
  const themes = own.filter((t) => t.startsWith("theme:")).map((t) => tagLabel(t));
  const needs = own.filter((t) => t.startsWith("need:")).map((t) => tagLabel(t));
  const traits = own.filter((t) => !t.startsWith("theme:") && !t.startsWith("need:")).map((t) => lowerFirst(tagLabel(t)));
  const sentences: string[] = [];

  if (anchorLabel) {
    sentences.push(
      `Vous accompagnez un proche dont la situation est « ${anchorLabel} » : ${
        memberCount ? `${memberCount.toLocaleString("fr-FR")} aidants` : "des aidants"
      } vivent la même chose au quotidien, et en parlent ici avec franchise.`,
    );
  }
  if (traits.length) sentences.push(`Votre profil ressemble à celui des membres : ${listFr(traits.slice(0, 3))}.`);
  if (themes.length)
    sentences.push(
      `Vous nous avez dit que ${listFr(themes.slice(0, 3))} ${themes.length > 1 ? "pèsent" : "pèse"} en ce moment : des pairs en parlent ici avec douceur.`,
    );
  if (needs.length) sentences.push(`Vous cherchez ${listFr(needs.slice(0, 3))} : c'est un sujet central ici.`);
  return sentences.length ? sentences.join(" ") : "Des échanges proches de ce que vous décrivez.";
}

/** Cercles recommandés (5 au plus). Les cercles de situations précises ne sont proposés qu'à l'aidant concerné. */
export async function rankCircles(answers: Answers, count = 5): Promise<Explained<Recommendation>[]> {
  const [{ circles, questions }, { index, profileVec }] = await Promise.all([loadCatalog(), semanticContext(answers)]);
  const profile = profileTags(answers);
  const labels = detailLabels(questions);

  const candidates = circles
    .filter((c) => !detailMismatch(profile, c.tags ?? []))
    .map((c) => ({ id: c.id, tags: c.tags ?? [], vec: index.vectors.get(vectorKey("circle", c.id)), circle: c }));

  const ranked = scoreItems(candidates, profile, profileVec);
  const picked = diversify(ranked, count, MMR_LAMBDA);

  const out: Explained<Recommendation>[] = picked.map((s, i) => {
    const anchor = detailsOf(s.item.tags).find((d) => profile.includes(d));
    return {
      rank: i + 1,
      circle: s.item.circle,
      reason: explainReason(s.matchedTags, s.item.circle.memberCount, anchor ? tagLabel(anchor, labels) : undefined),
      why: s,
    };
  });
  return out;
}

/** Fils classés pour l'aidant : cercles rejoints favorisés, mais un fil très pertinent d'un autre cercle peut passer devant. */
export async function rankThreads(joined: string[], answers: Answers): Promise<Explained<{ thread: Thread }>[]> {
  const [{ threads }, { index, profileVec }] = await Promise.all([loadCatalog(), semanticContext(answers)]);
  const profile = profileTags(answers);

  const candidates = threads
    .filter((t) => !t.older)
    .filter((t) => joined.includes(t.circleId) || !detailMismatch(profile, t.tags ?? []))
    .map((t) => ({ id: t.id, tags: t.tags ?? [], vec: index.vectors.get(vectorKey("thread", t.id)), thread: t }));

  const byId = new Map(threads.map((t) => [t.id, t]));
  const ranked = scoreItems(candidates, profile, profileVec, {
    bonus: (id) => {
      const t = byId.get(id)!;
      return (joined.includes(t.circleId) ? JOINED_BONUS : 0) + (t.replies.length > 0 ? 0.02 : 0) + (t.relevance ?? 0) * 0.01;
    },
  });
  return ranked.map((s) => ({ thread: s.item.thread, why: s }));
}

/** Fils déjà traités qui ressemblent au brouillon. Le sens (embeddings) est le critère principal ici : il s'agit d'éviter un doublon. */
export async function similarThreads(text: string, circleId: string): Promise<Thread[]> {
  const draft = text.trim();
  if (draft.length < 15) return [];
  const [{ threads }, index, vec] = await Promise.all([loadCatalog(), loadIndex(), embedQuery(draft)]);
  const candidates = threads.filter((t) => t.kind === "question" && t.replies.length > 0);

  const draftTags = [...detectThemeTags(draft), ...detectNeedTags(draft)];

  if (vec && index.vectors.size > 0) {
    return candidates
      .map((t) => {
        const tv = index.vectors.get(vectorKey("thread", t.id));
        const sem = tv ? cosine(vec, tv) : 0;
        const tagBonus = 0.1 * tagSimilarity(draftTags, t.tags ?? []);
        return { t, sem, score: sem + tagBonus + (t.circleId === circleId ? 0.03 : 0) };
      })
      .filter((x) => x.sem >= SIMILAR_THREAD_MIN_COSINE)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((x) => x.t);
  }

  // Repli local : mots communs, avec les thèmes détectés en garde-fou.
  const words = draft.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
  return candidates
    .map((t) => {
      const hay = `${t.title} ${t.body}`.toLowerCase();
      const score =
        words.filter((w) => hay.includes(w)).length + 2 * tagSimilarity(draftTags, t.tags ?? []) + (t.circleId === circleId ? 0.5 : 0);
      return { t, score };
    })
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.t);
}

export type SolutionsResult = {
  articles: Resource[];
  suggestions: AiSuggestion[];
  people: PersonRecommendation[];
};

/** Articles, suggestions et aidants à découvrir. */
export async function rankSolutions(answers: Answers): Promise<SolutionsResult> {
  const [{ resources, members, questions }, { suggestions, people: curated }, { index, profileVec }] = await Promise.all([
    loadCatalog(),
    loadSolutionData(),
    semanticContext(answers),
  ]);
  const profile = profileTags(answers);
  const labels = detailLabels(questions);

  const articleList = Object.values(resources)
    .filter((r) => r.articleOrder !== undefined)
    .sort((a, b) => (a.articleOrder ?? 0) - (b.articleOrder ?? 0));
  const articles = scoreItems(
    articleList.map((r) => ({ id: r.id, tags: topicsToTags(r.topics), vec: index.vectors.get(vectorKey("resource", r.id)), r })),
    profile,
    profileVec,
  ).map((s) => s.item.r);

  const ranked = scoreItems(
    suggestions.map((s) => ({ id: s.id, tags: topicsToTags(s.topics), vec: index.vectors.get(vectorKey("suggestion", s.id)), s })),
    profile,
    profileVec,
  ).map((s) => s.item.s);

  // Aidants dont le parcours ressemble au vôtre : niveau 2 d'abord (aucune sémantique sur les profils).
  const memberItems = Object.values(members)
    .filter((m) => m.id !== "me" && (m.tags?.length ?? 0) > 0)
    .map((m) => ({ id: m.id, tags: m.tags ?? [], member: m }));
  const similar = scoreItems(memberItems, profile, null)
    .filter((s) => s.matched && tierTwo(profile, s.item.tags).score > 0);
  const dynamic = diversify(similar, 3, MMR_LAMBDA).map<PersonRecommendation>((s) => {
    const shared = s.matchedTags.map((t) => tagLabel(t, labels));
    return {
      memberId: s.item.id,
      traits: shared.slice(0, 3),
      reason: `Son parcours ressemble au vôtre : ${listFr(shared.slice(0, 3).map(lowerFirst))}. Un échange doux, quand vous le souhaitez.`,
    };
  });
  const people = [...dynamic, ...curated.filter((c) => !dynamic.some((d) => d.memberId === c.memberId))].slice(0, 3);

  return { articles, suggestions: ranked, people };
}
