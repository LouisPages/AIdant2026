/**
 * Réglages de la recommandation. Tout se règle ici, rien n'est caché dans le code de calcul.
 *
 * Ordre de priorité voulu : 1) tags communs (thèmes, besoins), 2) caractéristiques de l'aidant,
 * 3) sémantique (description et messages des cercles). La sémantique ne fait que départager.
 */
export const WEIGHTS = {
  /** Niveau 1 : thèmes et besoins en commun. */
  tags: 0.5,
  /** Niveau 2 : lien, situation, précision, ancienneté, entourage, etc. */
  profile: 0.3,
  /** Niveau 3 : proximité de sens entre le récit de l'aidant et le texte de l'élément. */
  semantic: 0.2,
} as const;

/** Bonus quand l'élément porte la précision exacte de l'aidant (ex. maladie d'Alzheimer). */
export const DETAIL_ANCHOR_BONUS = 0.15;

/** Bonus pour un élément d'un cercle déjà rejoint. */
export const JOINED_BONUS = 0.25;

/** Atténuation maximale (part du score tags + sémantique) quand l'élément contredit le profil, ex. « après l'aidance » pour un aidant actif. */
export const CONFLICT_PENALTY = 0.6;

/** Compromis pertinence / diversité pour les listes courtes (1 = pertinence seule). */
export const MMR_LAMBDA = 0.75;

/** Similarité minimale (cosinus Titan) pour proposer un fil proche. Calibré avec `npm run ai:check` : fils liés 0,39 à 0,46, hors sujet 0,17. */
export const SIMILAR_THREAD_MIN_COSINE = 0.36;

/** Délais : l'IA ne doit jamais ralentir l'application. */
export const TIMEOUTS = {
  embedMs: 2500,
  guardrailMs: 3000,
  /** Les juges raisonnent en une phrase avant de noter : un peu plus long qu'un simple label. */
  llmMs: 6000,
} as const;
