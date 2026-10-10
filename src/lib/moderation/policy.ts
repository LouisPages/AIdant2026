/**
 * Politique de modération : tous les seuils sont ici, avec leur raison. Un seuil est une décision de politique,
 * pas un hyperparamètre : on le change après avoir rejoué `npm run ai:eval`, et on note pourquoi.
 *
 * Deux niveaux de refus :
 *   ferme       une règle locale, un score fort, ou deux sources indépendantes d'accord sur la même catégorie ;
 *   zone_grise  une seule source, à un niveau modéré : refus prudent, avec invitation à reformuler ou à demander
 *               une relecture humaine.
 *
 * Le coût des erreurs n'est pas symétrique : refuser à tort un aidant à bout le fait taire ; laisser passer une
 * moquerie blesse un lecteur fragile. La zone grise, avec son bouton de relecture, est le compromis : on refuse
 * par prudence, mais personne n'est réduit au silence sans recours.
 */
import type { ContentCategory } from "./guardrail";
import type { JudgeLabel } from "./judge";
import type { BlockCategory } from "./types";

/** Sévérité des juges (0–100), alignée sur les paliers de la consigne (40 limite, 60 problématique, 80 grave). */
export const JUDGE = {
  /** Le juge principal refuse seul à partir de « problématique ». */
  firm: 60,
  /**
   * En dessous, un seul juge ne fait qu'ouvrir la zone grise. Mesuré (`--sweep`) : à 30, aucun bénin du jeu n'est
   * touché et le sarcasme poli (« merci quand même hein », noté 35) est retenu ; à 40, il passe.
   */
  gray: 30,
  /**
   * Le second juge (Nova Lite : famille différente, mais il note 100 un peu partout dès qu'un message le choque)
   * ne refuse jamais seul : il ouvre la zone grise à « problématique » et corrobore le reste.
   */
  secondFirm: 101,
  secondGray: 60,
  /** Niveau auquel un juge corrobore un indice venu d'ailleurs (règle binaire, score Guardrails, autre juge). */
  corroborate: 30,
  /** Niveau auquel une dévalorisation ou une détresse déclenche l'aide et l'alerte à l'équipe. */
  signal: 40,
  /**
   * En dessous, le juge principal est « serein » sur une catégorie : il lève un indice gris de Guardrails (le sujet
   * médical réagit à tout récit de traitement, VIOLENCE monte sur une détresse tournée vers soi).
   */
  clean: 20,
} as const;

/**
 * Scores Guardrails (0–1, quantifiés par pas de 0,2). Mesure sur des phrases françaises : une insulte franche
 * (« connards ») ne monte qu'à 0,20, un jailbreak à 0,80, un e-mail ou un téléphone à 1,00. Les filtres de contenu
 * sont donc un indice d'appoint pour le français, pas le juge principal : seuls les scores élevés comptent seuls.
 */
export const GUARDRAIL_CONTENT: Record<ContentCategory, { firm: number; gray: number; category: BlockCategory } | null> = {
  INSULTS: { firm: 0.8, gray: 0.6, category: "ton" },
  HATE: { firm: 0.6, gray: 0.4, category: "ton" },
  SEXUAL: { firm: 0.6, gray: 0.4, category: "contenu" },
  VIOLENCE: { firm: 0.8, gray: 0.6, category: "violence" },
  // « Méfaits » (fraude, armes, drogue…) : hors sujet ici, et trop large pour un espace où l'on parle de médicaments.
  MISCONDUCT: null,
};

/** Une consigne adressée au modérateur (« ignore les règles ») n'a rien à faire dans un message d'aidant. */
export const ATTACK_GRAY = 0.7;

/** Entités personnelles : à cette confiance, Guardrails ne se trompe pas sur un e-mail ou un téléphone. */
export const PII_FIRM = 0.8;

/** Catégories bloquantes et correspondance avec le message montré à l'auteur. */
export const LABEL_CATEGORY: Record<JudgeLabel, BlockCategory | "signal"> = {
  insulte: "ton",
  moquerie: "ton",
  jugement: "ton",
  vindicte: "ton",
  haine: "ton",
  irrespect: "irrespect",
  sexuel: "contenu",
  violence: "violence",
  medical: "medical",
  coordonnees: "coordonnees",
  autodenigrement: "signal",
  detresse: "signal",
};

/** Quand plusieurs catégories sont retenues, la plus parlante pour l'auteur est montrée en premier. */
export const CATEGORY_PRIORITY: BlockCategory[] = ["coordonnees", "violence", "medical", "irrespect", "ton", "contenu"];
