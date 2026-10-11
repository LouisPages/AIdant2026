"use server";

/**
 * Couche « IA » : l'interface n'appelle que ces fonctions (Server Functions), dont les signatures sont stables.
 *
 * La recommandation suit trois niveaux, dans cet ordre : tags communs, caractéristiques de l'aidant, sémantique
 * (voir `lib/ai/`). Si Amazon Bedrock est indisponible, elle repose sur les deux premiers niveaux seulement.
 * Un fichier « use server » ne peut exporter que des fonctions asynchrones : la logique est dans `lib/ai`.
 */
import { loadCatalog, loadHelpResources } from "@/lib/db/catalog";
import { rankCircles, rankSolutions, rankThreads, similarThreads, type SolutionsResult } from "@/lib/ai/recommend";
import { deliverLetter } from "@/lib/news/deliver";
import { resolveNewsTopic } from "@/lib/news/topic";
import type { CircleLetter } from "@/lib/news/types";
import { localCheck } from "@/lib/moderation/local";
import { moderate } from "@/lib/moderation/moderate";
import type { ModerationContext, ModerationVerdict } from "@/lib/moderation/types";
import type { Answers } from "@/lib/questionnaire";
import type { Circle, Thread } from "@/lib/types";

export type Recommendation = {
  rank: number;
  circle: Circle;
  reason: string;
};

/** Classe 5 cercles selon le profil et explique chaque suggestion. */
export async function recommendCircles(answers: Answers): Promise<Recommendation[]> {
  const ranked = await rankCircles(answers, 5);
  return ranked.map(({ rank, circle, reason }) => ({ rank, circle, reason }));
}

export type { ModerationContext, ModerationVerdict } from "@/lib/moderation/types";

/**
 * Vérification avant publication. Invisible quand tout va bien : le message est publié sans écran intermédiaire.
 * Si le message est refusé, l'interface affiche une explication et garde le texte pour le reformuler.
 * Si l'auteur semble en difficulté (détresse, dévalorisation de soi), le message est publié et une aide discrète
 * est proposée (`support`). Le `context` (fil auquel on répond, derniers messages privés) aide les juges à lire une
 * réponse sèche ou moqueuse. Le même contrôle est refait côté serveur à la publication, avec un contexte lu en base.
 */
export async function moderateMessage(text: string, context?: ModerationContext): Promise<ModerationVerdict> {
  const { verdict, signal } = await moderate(text, context);
  if (verdict.decision === "block" || !signal) return verdict;
  return { decision: "publish", support: await loadHelpResources() };
}

/** Repère un message de détresse ou de dévalorisation (règles locales seulement : sans réseau). */
export async function detectDistress(text: string): Promise<{ distress: boolean }> {
  return { distress: localCheck(text).signal !== null };
}

/** Suggère des fils déjà traités avant de publier une question. */
export async function findSimilarThreads(text: string, circleId: string): Promise<Thread[]> {
  return similarThreads(text, circleId);
}

/**
 * Lettre épinglée du filtre en cours. La même pour tous les aidants d'un sujet.
 * `null` si aucune source fiable n'a d'article : le fil s'affiche quand même.
 */
export async function getCircleLetter(selected: string[], answers: Answers): Promise<CircleLetter | null> {
  try {
    const { circles } = await loadCatalog();
    return await deliverLetter(resolveNewsTopic(selected, answers, circles));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn(`[lettre] ${(error as Error).message}`);
    return null;
  }
}

/** Messages les plus pertinents, tous cercles confondus. Les cercles du membre sont favorisés. */
export async function getRelevantThreads(joined: string[], answers: Answers): Promise<Thread[]> {
  const ranked = await rankThreads(joined, answers);
  return ranked.map((r) => r.thread);
}

export type Solutions = SolutionsResult;

/** Articles Nello, suggestions IA et aidants à découvrir, classés selon le profil. */
export async function recommendSolutions(answers: Answers): Promise<Solutions> {
  return rankSolutions(answers);
}
