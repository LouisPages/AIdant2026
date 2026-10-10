/**
 * Textes envoyés au modèle d'embeddings. Fonctions pures, partagées par l'application et par `npm run db:embed`.
 * Un même texte donne toujours la même empreinte : un vecteur n'est recalculé que si son texte change.
 */
import { detailKey, realValues, type Answers } from "@/lib/questionnaire";
import { tagLabel, profileTags } from "@/lib/tags";
import type { AiSuggestion, Circle, Resource, Thread } from "@/lib/types";

export type EmbedKind = "circle" | "thread" | "resource" | "suggestion";

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);
const MAX_CHARS = 1600;

/** Description du cercle et titres de ses fils les plus récents : le cercle est défini par ce qui s'y dit. */
export function circleDocument(circle: Circle, threads: Thread[]): string {
  const titles = threads
    .filter((t) => t.circleId === circle.id)
    .slice(0, 6)
    .map((t) => t.title);
  return clip(
    [`${circle.name}. ${circle.description}`, titles.length ? `On y parle de : ${titles.join(" ; ")}.` : ""]
      .filter(Boolean)
      .join(" "),
    MAX_CHARS,
  );
}

/** Titre, texte et début des deux premières réponses. */
export function threadDocument(thread: Thread): string {
  const replies = thread.replies.slice(0, 2).map((r) => r.body);
  return clip([thread.title + ".", thread.body, ...replies].join(" "), MAX_CHARS);
}

export const resourceDocument = (r: Resource) => clip(`${r.title}. ${r.description} ${r.steps.slice(0, 3).join(" ")}`, MAX_CHARS);

export const suggestionDocument = (s: AiSuggestion) => clip(`${s.title}. ${s.text} ${s.reason}`, MAX_CHARS);

const RELATION: Record<string, string> = {
  conjoint: "J'accompagne mon conjoint ou ma conjointe",
  parent: "J'aide un de mes parents",
  enfant: "J'aide mon enfant",
  autre: "J'accompagne un proche",
};
const STAGE: Record<string, string> = {
  "moins-1": "depuis moins d'un an",
  "1-3": "depuis un à trois ans",
  "plus-3": "depuis plus de trois ans",
  apres: "et je ne suis plus aidant aujourd'hui",
};
const SITUATION: Record<string, string> = {
  age: "qui perd de son autonomie avec l'âge",
  handicap: "en situation de handicap",
  chronique: "atteint d'une maladie chronique ou neurodégénérative",
  accident: "après un accident",
};
const RHYTHM: Record<string, string> = {
  continu: "avec une présence presque continue",
  regulier: "plus de vingt heures par semaine",
  ponctuel: "quelques heures par semaine",
};

/**
 * Récit à la première personne tiré des réponses du questionnaire. C'est ce texte, et lui seul, qui est
 * envoyé au modèle d'embeddings : aucune donnée d'identité, uniquement la situation d'aidance.
 */
export function profileNarrative(answers: Answers): string {
  const one = (id: string) => realValues(answers, id)[0];
  const detail = realValues(answers, "situation").length ? answers[detailKey("situation")]?.[0] : undefined;
  const parts: string[] = [];

  const rel = RELATION[one("relation") ?? ""] ?? "J'accompagne un proche";
  const sit = detail && detail !== "Autre" ? `atteint de ${detail}` : (SITUATION[one("situation") ?? ""] ?? "");
  parts.push([rel, sit, STAGE[one("depuis") ?? ""], RHYTHM[one("rythme") ?? ""]].filter(Boolean).join(" ") + ".");

  const tags = new Set(profileTags(answers));
  if (tags.has("vie:avec")) parts.push("Nous vivons ensemble.");
  if (tags.has("vie:sans")) parts.push("Nous ne vivons pas ensemble.");
  if (tags.has("ent:seul")) parts.push("Je me sens plutôt seul(e) dans cette aide.");
  if (tags.has("pro:salarie")) parts.push("Je travaille en parallèle.");
  if (tags.has("pro:retraite")) parts.push("Je suis retraité(e).");

  const themes = [...tags].filter((t) => t.startsWith("theme:")).map((t) => tagLabel(t));
  if (themes.length) parts.push(`Ce qui pèse en ce moment : ${themes.join(", ")}.`);
  const needs = [...tags].filter((t) => t.startsWith("need:")).map((t) => tagLabel(t));
  if (needs.length) parts.push(`Je cherche : ${needs.join(", ")}.`);
  return parts.join(" ");
}
