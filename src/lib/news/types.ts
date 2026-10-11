/** Article retenu après lecture d'un flux ou d'une page d'actualités. */
export type NewsItem = {
  title: string;
  url: string;
  source: string;
  /** ISO 8601, absent si la source ne donne pas de date. */
  date?: string;
  excerpt?: string;
};

export type NewsLink = {
  title: string;
  url: string;
  source: string;
  /** Date déjà mise en français, absente si la source n'en donne pas. */
  date?: string;
};

/** Lettre partagée par tous les aidants d'un même sujet. */
export type CircleLetter = {
  topicId: string;
  label: string;
  /** Absent quand le modèle n'a pas rédigé (coupé, ou paragraphe écarté). */
  summary: string | null;
  links: NewsLink[];
  generatedAt: string;
};
