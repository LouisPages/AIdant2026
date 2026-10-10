/**
 * Questionnaire d'accueil : types et fonctions pures.
 * Le contenu (questions, options, thèmes liés) vit dans DynamoDB et arrive via le catalogue.
 */

export type Option = {
  id: string;
  label: string;
  /** Précisions possibles (liste déroulante facultative) quand l'option est choisie. */
  details?: string[];
  /** Permet d'écrire sa propre réponse. */
  other?: boolean;
};

export type QuestionPart = {
  id: string;
  label?: string;
  options: Option[];
  multiple?: boolean;
};

export type Question = {
  id: string;
  kind?: "choice" | "topics";
  title: string;
  hint?: string;
  parts: QuestionPart[];
};

export type Answers = Record<string, string[]>;

export const SKIP = "skip";

/** Clés des réponses complémentaires, stockées à côté de la réponse principale. */
export const detailKey = (partId: string) => `${partId}_detail`;
export const otherKey = (partId: string) => `${partId}_other`;

export function optionLabel(questions: Question[], partId: string, optionId: string): string | undefined {
  for (const q of questions) {
    for (const p of q.parts) {
      if (p.id === partId) return p.options.find((o) => o.id === optionId)?.label;
    }
  }
}

/** Valeurs réelles d'une réponse (sans « je préfère ne pas répondre »). */
export const realValues = (answers: Answers, partId: string) =>
  (answers[partId] ?? []).filter((v) => v !== SKIP);

/** Libellé lisible d'une partie de question, en tenant compte de la saisie libre et des précisions. */
export function describePart(questions: Question[], answers: Answers, partId: string): string[] {
  return realValues(answers, partId).map((v) => {
    const label = optionLabel(questions, partId, v) ?? v;
    const other = answers[otherKey(partId)]?.[0];
    const detail = answers[detailKey(partId)]?.[0];
    if (v === "autre" && other) return `${label} : ${other}`;
    if (detail) return `${label} (${detail})`;
    return label;
  });
}

/** Identifiant stable d'un cercle « maladie / handicap » à partir de la précision choisie. */
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const detailCircleId = (detail: string) => `c-d-${slug(detail)}`;
export { slug };
