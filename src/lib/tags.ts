/**
 * Taxonomie de tags commune à l'aidant, aux cercles, aux fils, aux membres et aux ressources.
 *
 * Un tag s'écrit `axe:valeur`. Les identifiants reprennent ceux du questionnaire d'accueil.
 *   Niveau 1 (thèmes et besoins) : theme:*  need:*
 *   Niveau 2 (caractéristiques)  : rel:* sit:* det:* stage:* rythme:* vie:* ent:* pro:*
 * Fonctions pures, utilisables côté serveur, côté client et dans les scripts.
 */
import { detailKey, realValues, slug, type Answers } from "./questionnaire";

/** Ce qui pèse (questionnaire, partie « poids »). */
export const THEMES = [
  "fatigue",
  "solitude",
  "demarches",
  "travail",
  "culpabilite",
  "sommeil",
  "finances",
  "temps",
  "sante",
  "peur",
  "couple",
] as const;

/** Ce que l'aidant vient chercher (questionnaire, partie « recherche »). */
export const NEEDS = ["ecoute", "astuces", "partager", "lire", "repit", "temoignages", "aides", "rencontrer"] as const;

export type Theme = (typeof THEMES)[number];
export type Need = (typeof NEEDS)[number];

/** Axes de niveau 2 et leur poids dans la comparaison des caractéristiques (somme = 1). */
export const PROFILE_AXES = {
  det: 0.35,
  sit: 0.2,
  rel: 0.2,
  stage: 0.08,
  ent: 0.05,
  rythme: 0.04,
  vie: 0.04,
  pro: 0.04,
} as const;

export type ProfileAxis = keyof typeof PROFILE_AXES;

const TAG_AXES = ["theme", "need", ...Object.keys(PROFILE_AXES)] as const;
const AXIS_VALUES: Record<string, readonly string[] | undefined> = {
  theme: THEMES,
  need: NEEDS,
  rel: ["conjoint", "parent", "enfant", "autre"],
  sit: ["age", "handicap", "chronique", "accident"],
  stage: ["moins-1", "1-3", "plus-3", "apres"],
  rythme: ["ponctuel", "regulier", "continu"],
  vie: ["avec", "sans"],
  ent: ["seul", "entoure"],
  pro: ["salarie", "etudiant", "recherche", "retraite", "sans"],
};

export const axisOf = (tag: string) => tag.slice(0, tag.indexOf(":"));
export const valueOf = (tag: string) => tag.slice(tag.indexOf(":") + 1);

/** Niveau d'un tag : 1 pour les thèmes et les besoins, 2 pour les caractéristiques de l'aidant. */
export const tierOf = (tag: string): 1 | 2 => (tag.startsWith("theme:") || tag.startsWith("need:") ? 1 : 2);

export const themeTag = (id: string) => `theme:${id}`;
export const needTag = (id: string) => `need:${id}`;
export const detailTag = (detail: string) => `det:${slug(detail)}`;

/** Tag d'un identifiant de thème ou de besoin (utilisé par les ressources et les suggestions). */
export function topicTag(id: string): string | undefined {
  if ((THEMES as readonly string[]).includes(id)) return themeTag(id);
  if ((NEEDS as readonly string[]).includes(id)) return needTag(id);
  return undefined;
}

/** Vrai si le tag est connu (les précisions `det:*` sont libres mais doivent avoir un identifiant propre). */
export function isKnownTag(tag: string): boolean {
  if (!/^[a-z]+:[a-z0-9-]+$/.test(tag)) return false;
  const axis = axisOf(tag);
  if (!(TAG_AXES as readonly string[]).includes(axis)) return false;
  if (axis === "det") return true;
  return AXIS_VALUES[axis]?.includes(valueOf(tag)) ?? false;
}

/** Convertit les réponses du questionnaire en tags de l'aidant. */
export function profileTags(answers: Answers): string[] {
  const tags = new Set<string>();
  const one = (axis: string, partId: string) => {
    for (const v of realValues(answers, partId)) tags.add(`${axis}:${v}`);
  };
  one("rel", "relation");
  one("sit", "situation");
  one("stage", "depuis");
  one("rythme", "rythme");
  one("vie", "cohabitation");
  one("ent", "entourage");
  one("pro", "pro");
  one("theme", "poids");
  one("need", "recherche");
  const detail = realValues(answers, "situation").length > 0 ? answers[detailKey("situation")]?.[0] : undefined;
  if (detail && detail !== "Autre") tags.add(detailTag(detail));
  return [...tags].filter(isKnownTag);
}

/** Libellés courts pour afficher les raisons et les traits. */
const LABELS: Record<string, string> = {
  "rel:conjoint": "Conjoint",
  "rel:parent": "Parent",
  "rel:enfant": "Enfant",
  "rel:autre": "Proche",
  "sit:age": "Perte d'autonomie liée à l'âge",
  "sit:handicap": "Handicap",
  "sit:chronique": "Maladie chronique ou neurodégénérative",
  "sit:accident": "Suite d'un accident",
  "stage:moins-1": "Depuis moins d'un an",
  "stage:1-3": "Depuis 1 à 3 ans",
  "stage:plus-3": "Depuis plus de 3 ans",
  "stage:apres": "Après l'aidance",
  "ent:seul": "Aidant plutôt seul",
  "ent:entoure": "Plutôt entouré",
  "vie:avec": "Vit avec la personne aidée",
  "vie:sans": "Vit séparément",
  "pro:salarie": "En emploi",
  "pro:retraite": "Retraité",
  "rythme:continu": "Présence presque continue",
  "rythme:regulier": "Plus de 20 heures par semaine",
  "rythme:ponctuel": "Quelques heures par semaine",
  "theme:fatigue": "la fatigue",
  "theme:solitude": "la solitude",
  "theme:demarches": "les démarches",
  "theme:travail": "le travail",
  "theme:culpabilite": "la culpabilité",
  "theme:sommeil": "le sommeil",
  "theme:finances": "l'argent",
  "theme:temps": "le manque de temps",
  "theme:sante": "votre propre santé",
  "theme:peur": "l'avenir qui inquiète",
  "theme:couple": "la vie de couple",
  "need:ecoute": "de l'écoute",
  "need:astuces": "des astuces pratiques",
  "need:partager": "un espace pour partager votre expérience",
  "need:lire": "de quoi lire sans écrire",
  "need:repit": "des solutions de répit",
  "need:temoignages": "des témoignages",
  "need:aides": "de l'aide pour connaître vos droits",
  "need:rencontrer": "des pairs à rencontrer",
};

/** Libellé d'un tag ; `details` associe l'identifiant d'une précision (`det:*`) à son nom lisible. */
export function tagLabel(tag: string, details?: Record<string, string>): string {
  if (tag.startsWith("det:")) return details?.[valueOf(tag)] ?? valueOf(tag).replace(/-/g, " ");
  return LABELS[tag] ?? valueOf(tag);
}

/** Table identifiant de précision vers nom lisible, à partir des questions du catalogue. */
export function detailLabels(
  questions: { parts: { id: string; options: { details?: string[] }[] }[] }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of questions)
    for (const p of q.parts)
      if (p.id === "situation") for (const o of p.options) for (const d of o.details ?? []) out[slug(d)] ??= d;
  return out;
}

const flat = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[’]/g, "'");

/** Détection de thèmes dans un texte libre (sans accents, en minuscules). Règles volontairement simples et lisibles. */
const THEME_RULES: Record<Theme, RegExp> = {
  fatigue: /fatigu|epuis|a bout|vide[e ]|souffler|plus la force|n'en peux plus/,
  sommeil: /nuit|dorm|sommeil|reveil|insomn|sieste|endorm/,
  solitude: /\bseul|solitude|isol|personne pour|sans aucun appui/,
  demarches: /dossier|allocation|\bapa\b|mdph|papier|demarche|formulaire|courrier|assistante sociale|point d'information/,
  finances: /argent|financ|\bcout|budget|credit d'impot|retraite petite|petite retraite|prise en charge/,
  travail: /employeur|travail|manager|bureau|teletravail|collegue|emploi|carriere|\brh\b/,
  culpabilite: /coupable|culpabil|honte|m'en veux|pardonn|abandon/,
  temps: /manque de temps|pas le temps|temps pour moi|agenda|organis|planning|temps rien que pour moi/,
  sante: /ma propre sante|ma sante|mon propre|psycholog|depress|burn|mon medecin|medecin traitant|mes propres soins/,
  peur: /peur|inquiet|angoiss|avenir|apres nous|terrifi|crainte|redout/,
  couple: /couple|intimit|tendresse|complicit|vie a deux|notre mariage|ma femme et moi|mon mari et moi/,
};

const NEED_RULES: Partial<Record<Need, RegExp>> = {
  repit: /repit|accueil de jour|relais|hebergement temporaire|halte|relayage|souffler|week-end/,
  aides: /droits?\b|aide financiere|\bapa\b|mdph|allocation|conge de proche|prestation/,
  rencontrer: /groupe de parole|rencontr|associations?\b|cafe des aidants|entre aidants/,
};

/** Thèmes (`theme:*`) repérés dans un texte. */
export const detectThemeTags = (text: string): string[] => {
  const t = flat(text);
  return THEMES.filter((id) => THEME_RULES[id].test(t)).map(themeTag);
};

/** Besoins (`need:*`) repérés dans un texte. */
export const detectNeedTags = (text: string): string[] => {
  const t = flat(text);
  return Object.entries(NEED_RULES)
    .filter(([, re]) => re.test(t))
    .map(([id]) => needTag(id));
};

/** Tags d'un thème ou d'un besoin à partir de listes d'identifiants (ressources, suggestions). */
export const topicsToTags = (topics: string[] = []) => [
  ...new Set(topics.map(topicTag).filter((t): t is string => Boolean(t))),
];
