import type { HelpResource } from "@/lib/types";

export type BlockCategory = "ton" | "contenu" | "medical" | "coordonnees" | "violence" | "irrespect";

/**
 * Signal envoyé à l'équipe humaine : le message est publié, jamais bloqué.
 *   detresse         idées noires, épuisement profond
 *   autodenigrement  dévalorisation de soi (« je suis une merde », « je ne sers à rien »)
 */
export type Signal = "detresse" | "autodenigrement";

/**
 * Fermeté du refus.
 *   ferme       une règle, un score fort ou l'accord des juges : le message ne respecte pas la charte
 *   zone_grise  un seul indice, ou un indice modéré : on refuse par prudence, en invitant à reformuler ou à
 *               demander une relecture humaine (le bouton existe déjà dans l'interface)
 */
export type Severity = "ferme" | "zone_grise";

/**
 * Ce que voit l'interface. Le signal n'y figure pas tel quel : l'auteur reçoit seulement, si besoin,
 * une proposition d'aide discrète (`support`), jamais un diagnostic.
 */
export type ModerationVerdict =
  | { decision: "publish"; support?: HelpResource[] }
  | { decision: "block"; category: BlockCategory; severity: Severity; message: string };

/** Contexte de publication : le fil auquel on répond, ou les derniers messages d'une conversation privée. */
export type ModerationContext = {
  /** Titre et début du message auquel on répond. */
  parent?: string;
  /** Derniers échanges d'une conversation privée, du plus ancien au plus récent. */
  previous?: string[];
};

/** Résultat interne, avec ce qui sert à la file de modération. */
export type ModerationOutcome = {
  verdict: ModerationVerdict;
  /** Le message exprime une détresse ou une dévalorisation : il est publié, et un humain est alerté. */
  signal: Signal | null;
  /** Qui a décidé : règles locales, Guardrails, jury de modèles, ou aucun contrôle possible. */
  source: "local" | "guardrail" | "judge" | "none";
  /** Explication lisible (raisonnement du juge, scores) pour la relecture humaine. Jamais montrée à l'auteur. */
  rationale?: string;
  /** Vrai si tous les contrôles distants ont répondu (sinon, le verdict n'est pas mis en cache). */
  complete: boolean;
};

/** Messages d'explication : bienveillants, jamais accusateurs, et ils disent quoi faire. */
export const BLOCK_MESSAGES: Record<BlockCategory, string> = {
  ton: "Ce message contient des propos que la communauté ne souhaite pas voir ici. Vous pouvez le reformuler : vos mots sont les bienvenus, même quand c'est dur.",
  contenu: "Ce message contient un contenu qui n'a pas sa place dans cet espace. Merci de le reformuler.",
  medical:
    "Pour la sécurité de chacun, évitons de conseiller une dose ou l'arrêt d'un traitement. Parlez-en au médecin ou au pharmacien, et partagez plutôt votre expérience.",
  coordonnees:
    "Pour protéger votre anonymat, les numéros de téléphone, adresses e-mail et identifiants de réseaux sociaux ne sont pas acceptés ici. Vous pouvez échanger en messages privés dans l'application.",
  violence:
    "Ce message contient des propos violents. Si vous êtes à bout, vous pouvez le dire autrement : nous sommes là pour vous écouter.",
  irrespect:
    "Parler de la maladie ou de la fin de vie d'un proche avec ces mots peut blesser d'autres aidants. Vous pouvez dire la même chose avec vos mots : nous les accueillerons.",
};

/** Message de la zone grise : le doute profite à la prudence, mais la porte reste ouverte. */
export const GRAY_MESSAGE =
  "Ce message pourrait être mal reçu par d'autres aidants. Vous pouvez le reformuler, ou demander une relecture si vous pensez qu'il respecte la charte.";

/** Poids des signaux : le plus grave l'emporte quand plusieurs sont détectés. */
export const SIGNAL_RANK: Record<Signal, number> = { autodenigrement: 1, detresse: 2 };

export const strongest = (a: Signal | null, b: Signal | null): Signal | null =>
  !a ? b : !b ? a : SIGNAL_RANK[a] >= SIGNAL_RANK[b] ? a : b;
