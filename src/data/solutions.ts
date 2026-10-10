export type AiSuggestion = {
  id: string;
  title: string;
  text: string;
  reason: string;
  href: string;
  cta: string;
  /** Mots-clés (identifiants de thèmes du questionnaire) qui rendent la suggestion plus pertinente. */
  topics: string[];
};

export type PersonRecommendation = {
  memberId: string;
  traits: string[];
  reason: string;
};

export const aiSuggestions: AiSuggestion[] = [
  {
    id: "s-rituel",
    title: "Essayer un rituel du soir",
    text: "Plusieurs aidants de votre situation ont retrouvé des nuits plus calmes avec une routine identique chaque soir.",
    reason: "Vous avez indiqué que la fatigue pèse en ce moment.",
    href: "/circles/c-conjoints/thread/t1",
    cta: "Lire la discussion",
    topics: ["fatigue", "sommeil"],
  },
  {
    id: "s-repit",
    title: "Rejoindre « Répit et respiration »",
    text: "Un cercle pour parler des solutions de garde, des haltes et des week-ends de répit.",
    reason: "Vous aidez beaucoup d'heures par semaine, ce cercle est souvent apprécié.",
    href: "/circles/c-repit",
    cta: "Voir le cercle",
    topics: ["repit", "temps", "fatigue"],
  },
  {
    id: "s-carnet",
    title: "Tenir un carnet pour les rendez-vous",
    text: "Une astuce partagée par un pair pour ne plus oublier ses questions au médecin.",
    reason: "Vous avez cherché des astuces concrètes.",
    href: "/circles/c-conjoints/thread/t2",
    cta: "Lire l'astuce",
    topics: ["astuces", "demarches"],
  },
  {
    id: "s-culpabilite",
    title: "En parler, tout simplement",
    text: "La culpabilité est partagée par presque tous les aidants. Un cercle lui est consacré, sans jugement.",
    reason: "Vous avez mentionné la culpabilité.",
    href: "/circles/c-culpabilite",
    cta: "Voir le cercle",
    topics: ["culpabilite", "ecoute", "peur"],
  },
];

export const peopleRecommendations: PersonRecommendation[] = [
  {
    memberId: "nenuphar",
    traits: ["Conjoint", "Maladie de Parkinson", "Depuis 1 an"],
    reason: "Même situation que vous, et elle lit surtout pour s'inspirer des autres.",
  },
  {
    memberId: "plume",
    traits: ["Après l'aidance", "Conjoint", "Ancienne aidante"],
    reason: "Elle a traversé les mêmes nuits agitées et aime accompagner celles et ceux qui débutent.",
  },
  {
    memberId: "soleil",
    traits: ["Aidant solo", "Répit", "Fatigue"],
    reason: "Il cherche lui aussi des solutions de répit et des astuces pour souffler.",
  },
];

export const articleIds = ["sommeil", "repit", "droits", "culpabilite", "conge", "apa"];

/** Articles à remonter en priorité selon les thèmes choisis. */
export const articleTopics: Record<string, string[]> = {
  sommeil: ["fatigue", "sommeil"],
  repit: ["repit", "temps", "fatigue"],
  droits: ["aides", "finances", "demarches"],
  culpabilite: ["culpabilite", "peur", "ecoute"],
  conge: ["travail", "temps"],
  apa: ["demarches", "finances", "aides"],
};
