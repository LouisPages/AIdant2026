import { situationDetails } from "./questionnaire";
import type { Circle, CircleFamily } from "./types";

export const familyLabels: Record<CircleFamily, string> = {
  lien: "Lien avec la personne aidée",
  situation: "Situation de la personne aidée",
  contexte: "Contexte de vie",
  parcours: "Moment du parcours",
  besoin: "Besoin du moment",
};

const memberCounts: Record<string, number> = {
  "c-conjoints": 842,
  "c-parent": 1256,
  "c-handicap-enfant": 389,
  "c-neuro": 617,
  "c-autonomie": 934,
  "c-handicap": 478,
  "c-accident": 156,
  "c-solos": 523,
  "c-salaries": 712,
  "c-debut": 1103,
  "c-longue": 468,
  "c-apres": 204,
  "c-repit": 689,
  "c-demarches": 1342,
  "c-sommeil": 421,
  "c-culpabilite": 358,
};

const baseCircles: Omit<Circle, "memberCount">[] = [
  {
    id: "c-conjoints",
    name: "Accompagner son conjoint",
    family: "lien",
    icon: "heart",
    description:
      "Pour celles et ceux qui aident leur mari, leur femme ou leur partenaire au quotidien.",
  },
  {
    id: "c-parent",
    name: "Aider un parent",
    family: "lien",
    icon: "home",
    description: "Enfants qui accompagnent un père ou une mère qui a besoin d'aide.",
  },
  {
    id: "c-handicap-enfant",
    name: "Parents d'un enfant en situation de handicap",
    family: "lien",
    icon: "sprout",
    description: "Un espace pour les parents, entre démarches, fatigue et petites victoires.",
  },
  {
    id: "c-neuro",
    name: "Maladie chronique ou neurodégénérative",
    family: "situation",
    icon: "feather",
    description: "Alzheimer, Parkinson, sclérose en plaques et autres maladies qui durent.",
  },
  {
    id: "c-autonomie",
    name: "Perte d'autonomie liée à l'âge",
    family: "situation",
    icon: "sun",
    description: "Quand les gestes du quotidien deviennent difficiles avec l'âge.",
  },
  {
    id: "c-handicap",
    name: "Handicap mental ou physique",
    family: "situation",
    icon: "compass",
    description: "Échanges entre aidants de personnes en situation de handicap.",
  },
  {
    id: "c-accident",
    name: "Après un accident",
    family: "situation",
    icon: "life-buoy",
    description: "Perte d'autonomie soudaine : comment tenir quand tout bascule.",
  },
  {
    id: "c-solos",
    name: "Aidants solos",
    family: "contexte",
    icon: "moon",
    description: "Vous aidez sans beaucoup d'appui autour de vous ? Vous n'êtes pas seul(e) ici.",
  },
  {
    id: "c-salaries",
    name: "Aider et travailler",
    family: "contexte",
    icon: "briefcase",
    description:
      "Concilier emploi et aidance. Ce cercle n'est jamais visible de votre employeur.",
  },
  {
    id: "c-debut",
    name: "Début de l'aidance",
    family: "parcours",
    icon: "map",
    description: "Les premiers mois : par où commencer et à qui demander.",
  },
  {
    id: "c-longue",
    name: "Aidance de longue durée",
    family: "parcours",
    icon: "mountain",
    description: "Tenir dans la durée sans s'oublier.",
  },
  {
    id: "c-apres",
    name: "Après l'aidance",
    family: "parcours",
    icon: "flower",
    description: "Retrouver sa place quand le rôle d'aidant s'arrête.",
  },
  {
    id: "c-repit",
    name: "Répit et respiration",
    family: "besoin",
    icon: "waves",
    description: "Solutions de garde, haltes, vacances : s'autoriser à souffler.",
  },
  {
    id: "c-demarches",
    name: "Démarches administratives",
    family: "besoin",
    icon: "file",
    description: "Aides, dossiers, droits : on s'entraide pour s'y retrouver.",
  },
  {
    id: "c-sommeil",
    name: "Sommeil et fatigue",
    family: "besoin",
    icon: "moon",
    description: "Astuces et paroles de pairs pour ménager ses nuits.",
  },
  {
    id: "c-culpabilite",
    name: "Culpabilité",
    family: "besoin",
    icon: "heart-handshake",
    description: "Se sentir coupable est courant. En parler aide à l'alléger.",
  },
];

export const circles: Circle[] = baseCircles.map((c) => ({ ...c, memberCount: memberCounts[c.id] ?? 0 }));

/**
 * Cercles « maladie / handicap » : un cercle par précision possible du questionnaire.
 * Ils ne sont pas listés dans les filtres tant que le membre ne les a pas rejoints, mais
 * le premier cercle recommandé reprend la situation précise de la personne aidée.
 */
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const detailCircleId = (detail: string) => `c-d-${slug(detail)}`;

const detailCount: Record<string, number> = { "maladie-de-parkinson": 214 };

const detailGroups: { key: keyof typeof situationDetails; icon: string }[] = [
  { key: "chronique", icon: "feather" },
  { key: "age", icon: "home" },
  { key: "handicap", icon: "sprout" },
  { key: "accident", icon: "mountain" },
];

export const detailCircles: Circle[] = (() => {
  const seen = new Set<string>();
  const list: Circle[] = [];
  for (const { key, icon } of detailGroups) {
    for (const detail of situationDetails[key]) {
      const s = slug(detail);
      if (detail === "Autre" || seen.has(s)) continue;
      seen.add(s);
      const hash = [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 997, 7);
      list.push({
        id: detailCircleId(detail),
        name: `Aidants · ${detail}`,
        family: "situation",
        icon,
        description: `Entre aidants de proches concernés par : ${detail}. Vécu, astuces et questions du quotidien.`,
        memberCount: detailCount[s] ?? 60 + (hash % 280),
      });
    }
  }
  return list;
})();

/** Tous les cercles, y compris ceux de situations précises. */
export const allCircles: Circle[] = [...circles, ...detailCircles];

export const getCircle = (id: string) => allCircles.find((c) => c.id === id);

export const charter = [
  "Nous parlons avec bienveillance, sans juger.",
  "Ce qui est dit ici reste ici : pas de captures d'écran, pas de noms réels.",
  "Nous partageons notre expérience, jamais de conseil médical ou juridique.",
];
