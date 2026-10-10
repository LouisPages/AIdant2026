export type Option = {
  id: string;
  label: string;
  /** Précisions possibles (liste déroulante facultative) quand l'option est choisie. */
  details?: string[];
  /** Permet d'écrire sa propre réponse. */
  other?: boolean;
};

export type QuestionPart = {
  id: string;
  label?: string;
  options: Option[];
  multiple?: boolean;
};

export type Question = {
  id: string;
  kind?: "choice" | "topics";
  title: string;
  hint?: string;
  parts: QuestionPart[];
};

export const SKIP = "skip";

/** Clés des réponses complémentaires, stockées à côté de la réponse principale. */
export const detailKey = (partId: string) => `${partId}_detail`;
export const otherKey = (partId: string) => `${partId}_other`;

const situationDetails = {
  age: [
    "Maladie d'Alzheimer",
    "Maladie à corps de Lewy",
    "Démence vasculaire",
    "Maladie de Parkinson",
    "Troubles de la mémoire",
    "Perte de mobilité",
    "Chutes à répétition",
    "Déficience visuelle",
    "Déficience auditive",
    "Dénutrition",
    "Fin de vie, soins palliatifs",
    "Autre",
  ],
  handicap: [
    "Trisomie 21",
    "Autisme (TSA)",
    "Troubles dys",
    "Déficience intellectuelle",
    "Paralysie cérébrale",
    "Handicap moteur",
    "Handicap visuel",
    "Handicap auditif",
    "Polyhandicap",
    "Troubles psychiques",
    "Maladie rare",
    "Autre",
  ],
  chronique: [
    "Maladie de Parkinson",
    "Sclérose en plaques",
    "Sclérose latérale amyotrophique (SLA)",
    "Maladie d'Alzheimer et apparentées",
    "Maladie de Huntington",
    "Cancer",
    "Diabète",
    "Insuffisance rénale, dialyse",
    "Insuffisance respiratoire (BPCO)",
    "Insuffisance cardiaque",
    "Séquelles d'AVC",
    "Épilepsie",
    "Maladie de Crohn",
    "Polyarthrite rhumatoïde",
    "Maladie psychique",
    "Fibromyalgie",
    "Autre",
  ],
  accident: [
    "Traumatisme crânien",
    "Lésion de la moelle épinière",
    "Amputation",
    "Séquelles d'AVC",
    "Brûlures graves",
    "Fractures complexes",
    "Accident du travail",
    "Autre",
  ],
};

export const questions: Question[] = [
  {
    id: "relation",
    title: "Qui accompagnez-vous ?",
    hint: "Cela nous aide à vous proposer des personnes dans une situation proche de la vôtre.",
    parts: [
      {
        id: "relation",
        options: [
          { id: "conjoint", label: "Mon conjoint ou ma conjointe" },
          { id: "parent", label: "Un de mes parents" },
          { id: "enfant", label: "Mon enfant" },
          { id: "autre", label: "Un autre proche", other: true },
        ],
      },
    ],
  },
  {
    id: "situation",
    title: "Quelle est la situation de la personne que vous aidez ?",
    hint: "Vous pouvez préciser la maladie ou le handicap, si vous le souhaitez.",
    parts: [
      {
        id: "situation",
        options: [
          { id: "age", label: "Perte d'autonomie liée à l'âge", details: situationDetails.age },
          { id: "handicap", label: "Handicap", details: situationDetails.handicap },
          { id: "chronique", label: "Maladie chronique ou neurodégénérative", details: situationDetails.chronique },
          { id: "accident", label: "Suite d'un accident", details: situationDetails.accident },
        ],
      },
    ],
  },
  {
    id: "rythme",
    title: "Depuis quand aidez-vous, et à quel rythme ?",
    parts: [
      {
        id: "depuis",
        label: "Depuis",
        options: [
          { id: "moins-1", label: "Moins d'un an" },
          { id: "1-3", label: "1 à 3 ans" },
          { id: "plus-3", label: "Plus de 3 ans" },
        ],
      },
      {
        id: "rythme",
        label: "Rythme",
        options: [
          { id: "ponctuel", label: "Quelques heures par semaine" },
          { id: "regulier", label: "Plus de 20 heures par semaine" },
          { id: "continu", label: "Présence presque continue" },
        ],
      },
    ],
  },
  {
    id: "vie",
    title: "Votre quotidien",
    parts: [
      {
        id: "cohabitation",
        label: "Je vis",
        options: [
          { id: "avec", label: "Avec la personne aidée" },
          { id: "sans", label: "Séparément" },
        ],
      },
      {
        id: "entourage",
        label: "Je suis",
        options: [
          { id: "seul", label: "Plutôt seul(e)" },
          { id: "entoure", label: "Plutôt entouré(e)" },
        ],
      },
    ],
  },
  {
    id: "pro",
    title: "Votre situation",
    hint: "Jamais visible de votre employeur ni de votre établissement.",
    parts: [
      {
        id: "pro",
        options: [
          { id: "salarie", label: "Je travaille" },
          { id: "etudiant", label: "Je suis étudiant(e)" },
          { id: "recherche", label: "Je suis en recherche d'emploi" },
          { id: "retraite", label: "Je suis retraité(e)" },
          { id: "sans", label: "Je ne travaille pas" },
        ],
      },
    ],
  },
  {
    id: "topics",
    kind: "topics",
    title: "Ce qui vous amène",
    hint: "Choisissez ce qui vous parle : de nouvelles idées apparaissent au fil de vos choix.",
    parts: [
      {
        id: "poids",
        multiple: true,
        options: [
          { id: "fatigue", label: "La fatigue" },
          { id: "solitude", label: "La solitude" },
          { id: "demarches", label: "Les démarches" },
          { id: "travail", label: "Le travail" },
          { id: "culpabilite", label: "La culpabilité" },
          { id: "sommeil", label: "Le sommeil" },
          { id: "finances", label: "L'argent" },
          { id: "temps", label: "Le manque de temps" },
          { id: "sante", label: "Ma propre santé" },
          { id: "peur", label: "L'avenir qui inquiète" },
          { id: "couple", label: "Ma vie de couple" },
        ],
      },
      {
        id: "recherche",
        multiple: true,
        options: [
          { id: "ecoute", label: "Être écouté(e)" },
          { id: "astuces", label: "Des astuces" },
          { id: "partager", label: "Partager mon expérience" },
          { id: "lire", label: "Lire sans écrire" },
          { id: "repit", label: "Des solutions de répit" },
          { id: "temoignages", label: "Des témoignages" },
          { id: "aides", label: "Connaître mes droits" },
          { id: "rencontrer", label: "Rencontrer des pairs" },
        ],
      },
    ],
  },
];

/** Idées de départ de l'écran « Ce qui vous amène ». */
export const seedTopics = ["fatigue", "solitude", "demarches", "ecoute"];

/** Une idée choisie fait apparaître ces idées liées, comme le choix d'artistes sur Spotify. */
export const relatedTopics: Record<string, string[]> = {
  fatigue: ["sommeil", "temps", "sante"],
  solitude: ["rencontrer", "couple", "partager"],
  demarches: ["finances", "aides", "temps"],
  travail: ["temps", "finances", "repit"],
  culpabilite: ["peur", "partager", "temoignages"],
  sommeil: ["fatigue", "sante", "repit"],
  finances: ["aides", "demarches", "travail"],
  temps: ["repit", "travail", "astuces"],
  sante: ["fatigue", "ecoute", "sommeil"],
  peur: ["ecoute", "temoignages", "culpabilite"],
  couple: ["solitude", "ecoute", "temps"],
  ecoute: ["rencontrer", "culpabilite", "partager"],
  astuces: ["temoignages", "repit", "aides"],
  partager: ["temoignages", "rencontrer", "lire"],
  lire: ["temoignages", "astuces", "aides"],
  repit: ["temps", "astuces", "fatigue"],
  temoignages: ["lire", "partager", "peur"],
  aides: ["finances", "demarches", "travail"],
  rencontrer: ["solitude", "ecoute", "couple"],
};

export type Answers = Record<string, string[]>;

export const demoAnswers: Answers = {
  relation: ["conjoint"],
  situation: ["chronique"],
  situation_detail: ["Maladie de Parkinson"],
  depuis: ["1-3"],
  rythme: ["regulier"],
  cohabitation: ["avec"],
  entourage: ["seul"],
  pro: ["salarie"],
  poids: ["fatigue", "culpabilite"],
  recherche: ["ecoute", "astuces"],
};

export function optionLabel(partId: string, optionId: string): string | undefined {
  for (const q of questions) {
    for (const p of q.parts) {
      if (p.id === partId) return p.options.find((o) => o.id === optionId)?.label;
    }
  }
}

/** Valeurs réelles d'une réponse (sans « je préfère ne pas répondre »). */
export const realValues = (answers: Answers, partId: string) =>
  (answers[partId] ?? []).filter((v) => v !== SKIP);

/** Libellé lisible d'une partie de question, en tenant compte de la saisie libre et des précisions. */
export function describePart(answers: Answers, partId: string): string[] {
  return realValues(answers, partId).map((v) => {
    const label = optionLabel(partId, v) ?? v;
    const other = answers[otherKey(partId)]?.[0];
    const detail = answers[detailKey(partId)]?.[0];
    if (v === "autre" && other) return `${label} : ${other}`;
    if (detail) return `${label} (${detail})`;
    return label;
  });
}
