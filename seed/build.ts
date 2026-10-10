/**
 * Outils d'écriture compacts pour les fils de discussion du seed.
 * - `q` (question), `a` (astuce), `p` (partage) créent un fil.
 * - Une réponse s'écrit `[auteur, texte]` ; l'heure est calculée automatiquement après le fil
 *   (ou donnée en 3e valeur, par exemple `"Il y a 2 h"`).
 * - Les fils de plus de deux semaines sont rangés dans « échanges plus anciens ».
 */
import type { ThreadKind } from "@/lib/types";
import type { SeedThread } from "./seed-types";

export type R = [authorId: string, body: string, time?: string];

function make(
  kind: ThreadKind,
  id: string,
  circleId: string,
  authorId: string,
  title: string,
  body: string,
  time: string,
  replies: R[] = [],
  resourceId?: string,
): SeedThread {
  return {
    id,
    circleId,
    authorId,
    kind,
    title,
    body,
    time,
    replies: replies.map(([rAuthor, rBody, rTime], i) => ({
      id: `${id}-r${i + 1}`,
      authorId: rAuthor,
      body: rBody,
      time: rTime ?? "",
    })),
    ...(resourceId ? { resourceId } : {}),
    ...(/semaine|mois/.test(time) ? { older: true } : {}),
  };
}

/** Une question posée au cercle. */
export const q = (
  id: string,
  circleId: string,
  authorId: string,
  title: string,
  body: string,
  time: string,
  replies?: R[],
  resourceId?: string,
) => make("question", id, circleId, authorId, title, body, time, replies, resourceId);

/** Une astuce partagée. */
export const a = (
  id: string,
  circleId: string,
  authorId: string,
  title: string,
  body: string,
  time: string,
  replies?: R[],
  resourceId?: string,
) => make("astuce", id, circleId, authorId, title, body, time, replies, resourceId);

/** Un témoignage ou un moment de vie. */
export const p = (
  id: string,
  circleId: string,
  authorId: string,
  title: string,
  body: string,
  time: string,
  replies?: R[],
  resourceId?: string,
) => make("partage", id, circleId, authorId, title, body, time, replies, resourceId);
