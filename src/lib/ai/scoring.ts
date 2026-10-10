/**
 * Calcul de pertinence en trois niveaux. Fonctions pures : mêmes entrées, mêmes sorties, testables sans réseau.
 *
 *   Niveau 1  tags communs (thèmes et besoins)               pondération WEIGHTS.tags
 *   Niveau 2  caractéristiques de l'aidant (lien, situation…) pondération WEIGHTS.profile
 *   Niveau 3  sémantique (cosinus récit / texte)              pondération WEIGHTS.semantic
 *
 * Garde-fou : un élément sans aucun tag ni caractéristique en commun passe après tous ceux qui en ont,
 * quel que soit son score sémantique. Le sens départage, il ne remplace pas les critères explicites.
 */
import { PROFILE_AXES, axisOf, tierOf } from "@/lib/tags";
import { CONFLICT_PENALTY, DETAIL_ANCHOR_BONUS, WEIGHTS } from "./weights";
import { cosine, minMax } from "./vector";

export type Scorable = { id: string; tags: string[]; vec?: Float32Array | null };

export type Scored<T extends Scorable = Scorable> = {
  item: T;
  /** Contribution de chaque niveau au score final (déjà pondérée). */
  parts: { tags: number; profile: number; semantic: number; anchor: number; bonus: number };
  total: number;
  /** Vrai si au moins un tag ou une caractéristique de l'aidant se retrouve dans l'élément. */
  matched: boolean;
  /** Tags de l'élément qui correspondent à l'aidant, pour expliquer la recommandation. */
  matchedTags: string[];
  /** Cosinus brut avec le récit de l'aidant (null si indisponible). */
  cosine: number | null;
};

const unique = <T,>(list: T[]) => [...new Set(list)];

/** Niveau 1 : cosinus binaire entre les thèmes et besoins de l'aidant et ceux de l'élément, favorable aux éléments précis. */
export function tierOne(profile: string[], itemTags: string[]): { score: number; matched: string[] } {
  const p = unique(profile.filter((t) => tierOf(t) === 1));
  const i = unique(itemTags.filter((t) => tierOf(t) === 1));
  const matched = i.filter((t) => p.includes(t));
  if (matched.length === 0) return { score: 0, matched };
  const score = matched.length / Math.sqrt(i.length * Math.min(p.length, 4));
  return { score: Math.min(1, score), matched };
}

/** Niveau 2 : part du poids des axes de l'élément qui concordent (précision), croisée avec ce qu'il couvre du profil. */
export function tierTwo(profile: string[], itemTags: string[]): { score: number; matched: string[]; conflict: number } {
  const axes = Object.keys(PROFILE_AXES) as (keyof typeof PROFILE_AXES)[];
  const p = profile.filter((t) => tierOf(t) === 2);
  const i = itemTags.filter((t) => tierOf(t) === 2);
  let matchedW = 0;
  let declaredW = 0;
  let totalW = 0;
  let conflictW = 0;
  const matched: string[] = [];
  for (const axis of axes) {
    const w = PROFILE_AXES[axis];
    const pa = p.filter((t) => axisOf(t) === axis);
    const ia = i.filter((t) => axisOf(t) === axis);
    if (pa.length) totalW += w;
    if (ia.length) declaredW += w;
    const hit = ia.filter((t) => pa.includes(t));
    if (pa.length && ia.length && hit.length === 0) conflictW += w;
    if (hit.length) {
      matchedW += w;
      matched.push(...hit);
    }
  }
  const conflict = declaredW === 0 ? 0 : conflictW / declaredW;
  if (matchedW === 0 || declaredW === 0 || totalW === 0) return { score: 0, matched, conflict };
  return { score: Math.pow(matchedW / declaredW, 0.6) * Math.pow(matchedW / totalW, 0.4), matched, conflict };
}

/** Précisions (`det:*`) d'un ensemble de tags. */
export const detailsOf = (tags: string[]) => tags.filter((t) => t.startsWith("det:"));

/** L'élément est réservé à une précision (maladie, handicap) que l'aidant n'a pas indiquée. */
export function detailMismatch(profile: string[], itemTags: string[]): boolean {
  const own = detailsOf(itemTags);
  if (own.length === 0) return false;
  const mine = detailsOf(profile);
  return !own.some((d) => mine.includes(d));
}

export type ScoreOptions = {
  /** Bonus ajouté au score final d'un élément (ex. cercle déjà rejoint). */
  bonus?: (id: string) => number;
};

/** Note chaque élément selon le profil et, si disponible, le vecteur du récit de l'aidant. Trié du meilleur au moins bon. */
export function scoreItems<T extends Scorable>(
  items: T[],
  profile: string[],
  profileVec: Float32Array | null,
  options: ScoreOptions = {},
): Scored<T>[] {
  const cos = items.map((it) => (profileVec && it.vec ? cosine(profileVec, it.vec) : null));
  const known = cos.filter((c): c is number => c !== null);
  const useSemantic = known.length > 0;
  const normalised = new Map<number, number>();
  if (useSemantic) {
    const norm = minMax(known);
    let k = 0;
    cos.forEach((c, idx) => {
      if (c !== null) normalised.set(idx, norm[k++]);
    });
  }

  // Sans sémantique, on répartit son poids sur les deux premiers niveaux au prorata.
  const base = WEIGHTS.tags + WEIGHTS.profile;
  const wT = useSemantic ? WEIGHTS.tags : WEIGHTS.tags / base;
  const wP = useSemantic ? WEIGHTS.profile : WEIGHTS.profile / base;
  const wS = useSemantic ? WEIGHTS.semantic : 0;
  const mineDetails = detailsOf(profile);

  const scored = items.map((item, idx) => {
    const one = tierOne(profile, item.tags);
    const two = tierTwo(profile, item.tags);
    const anchored = detailsOf(item.tags).some((d) => mineDetails.includes(d));
    // Un élément qui contredit le profil (ex. « après l'aidance » pour un aidant actif) est atténué.
    const calm = 1 - CONFLICT_PENALTY * two.conflict;
    const parts = {
      tags: wT * one.score * calm,
      profile: wP * two.score,
      semantic: wS * (normalised.get(idx) ?? 0) * calm,
      anchor: anchored ? DETAIL_ANCHOR_BONUS : 0,
      bonus: options.bonus?.(item.id) ?? 0,
    };
    const total = parts.tags + parts.profile + parts.semantic + parts.anchor + parts.bonus;
    return {
      item,
      parts,
      total,
      // Un bonus explicite (cercle rejoint) vaut préférence de l'aidant : l'élément n'est pas relégué.
      matched: one.matched.length > 0 || two.matched.length > 0 || parts.bonus > 0,
      matchedTags: [...two.matched, ...one.matched],
      cosine: cos[idx],
    } satisfies Scored<T>;
  });

  // Les éléments qui ont un point commun explicite passent toujours avant les autres.
  return scored.sort((a, b) => Number(b.matched) - Number(a.matched) || b.total - a.total);
}

/** Jaccard entre deux ensembles de tags : mesure de ressemblance entre éléments, utilisée pour la diversité. */
export function tagSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const sb = new Set(b);
  const common = a.filter((t) => sb.has(t)).length;
  return common / (a.length + b.length - common);
}

/** Sélection MMR : garde les éléments pertinents en évitant les doublons proches les uns des autres. */
export function diversify<T extends Scorable>(
  ranked: Scored<T>[],
  count: number,
  lambda: number,
  similarity: (a: T, b: T) => number = (a, b) => tagSimilarity(a.tags, b.tags),
): Scored<T>[] {
  const pool = [...ranked];
  const chosen: Scored<T>[] = [];
  while (chosen.length < count && pool.length) {
    let bestIdx = 0;
    let bestValue = -Infinity;
    pool.forEach((cand, idx) => {
      const redundancy = chosen.reduce((m, c) => Math.max(m, similarity(cand.item, c.item)), 0);
      // Un élément sans point commun garde son rang derrière les autres : on ne l'avance pas par diversité.
      const value = lambda * cand.total - (1 - lambda) * redundancy + (cand.matched ? 1 : 0);
      if (value > bestValue) {
        bestValue = value;
        bestIdx = idx;
      }
    });
    chosen.push(pool.splice(bestIdx, 1)[0]);
  }
  return chosen;
}
