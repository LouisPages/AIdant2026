import type { SeedModerationCase } from "./seed-types";

export const moderationCases: SeedModerationCase[] = [
  {
    id: "mod1",
    type: "ton",
    circleId: "c-parent",
    authorId: "soleil",
    message:
      "Franchement, ceux qui placent leurs parents en maison de retraite ne méritent pas qu'on les écoute. C'est de l'abandon, point.",
    receivedAt: "Il y a 6 min",
    aiLabel: "Ton jugeant",
    aiReason:
      "Le message juge directement d'autres membres. Il est mis en attente avant publication.",
    aiSuggestion:
      "Pour moi, placer un proche en établissement a été très difficile à accepter. J'ai besoin d'en parler avec des personnes qui ont fait un autre choix.",
    actions: [
      { id: "invite", label: "Inviter l'auteur à reformuler", recommended: true },
      { id: "publish", label: "Publier tel quel" },
      { id: "remove", label: "Retirer" },
    ],
  },
  {
    id: "mod2",
    type: "medical",
    circleId: "c-neuro",
    authorId: "nenuphar",
    message:
      "Ma mère dort mal, je lui donne un demi-comprimé de plus le soir, ça marche très bien. Vous pouvez essayer 10 mg de plus aussi.",
    receivedAt: "Il y a 21 min",
    aiLabel: "Dose de médicament",
    aiReason:
      "Le message recommande une dose à d'autres membres. Les conseils médicaux sont hors périmètre.",
    aiSuggestion:
      "Ma mère dort mal, et nous en avons parlé à son médecin. Si vous êtes dans le même cas, je vous encourage à en parler avec le vôtre.",
    actions: [
      { id: "edit", label: "Publier sans la dose", recommended: true },
      { id: "publish", label: "Publier tel quel" },
      { id: "remove", label: "Retirer" },
    ],
  },
  {
    id: "mod3",
    type: "detresse",
    circleId: "c-solos",
    authorId: "soleil",
    message:
      "Je n'en peux plus. Parfois je me dis que tout le monde serait mieux sans moi, que je ne vais pas tenir comme ça jusqu'à la fin de l'année.",
    receivedAt: "Il y a 2 min",
    aiLabel: "Détresse détectée",
    aiReason:
      "Le message révèle un épuisement profond et des idées sombres. Il est conservé et publié, avec les ressources d'aide affichées à l'auteur.",
    actions: [
      { id: "contact", label: "Contacter la personne", recommended: true },
      { id: "keep", label: "Garder en suivi" },
    ],
  },
  {
    id: "mod4",
    type: "medical",
    circleId: "c-d-maladie-de-parkinson",
    authorId: "thym",
    message:
      "Mon père a arrêté son traitement du soir parce qu'il dormait mal, et depuis ça va mieux. Vous devriez essayer de supprimer la dernière prise.",
    receivedAt: "Il y a 38 min",
    aiLabel: "Conseil sur un traitement",
    aiReason:
      "Le message encourage d'autres membres à modifier un traitement. Les conseils médicaux sont hors périmètre.",
    aiSuggestion:
      "Mon père dormait mal avec son traitement du soir. On en a parlé avec son neurologue, qui a ajusté les horaires. Je vous encourage à en parler avec le vôtre.",
    actions: [
      { id: "edit", label: "Publier sans le conseil", recommended: true },
      { id: "publish", label: "Publier tel quel" },
      { id: "remove", label: "Retirer" },
    ],
  },
  {
    id: "mod5",
    type: "ton",
    circleId: "c-salaries",
    authorId: "capucine",
    message:
      "Les employeurs qui refusent un aménagement d'horaires sont tous des profiteurs. Dénoncez-les sur les réseaux, ils méritent la honte.",
    receivedAt: "Il y a 1 h",
    aiLabel: "Appel à la vindicte",
    aiReason:
      "Le message incite à exposer publiquement des personnes ou des entreprises. Il est mis en attente avant publication.",
    aiSuggestion:
      "Mon employeur a d'abord refusé l'aménagement, et j'ai trouvé cela très dur. J'ai fini par obtenir un accord avec l'aide de la médecine du travail.",
    actions: [
      { id: "invite", label: "Inviter l'auteur à reformuler", recommended: true },
      { id: "publish", label: "Publier tel quel" },
      { id: "remove", label: "Retirer" },
    ],
  },
  {
    id: "mod6",
    type: "detresse",
    circleId: "c-longue",
    authorId: "hetre",
    message:
      "Dix ans que je tiens, et ce soir je n'ai plus la force. Je ne vois plus l'intérêt de continuer, je suis tellement fatigué de tout.",
    receivedAt: "Il y a 12 min",
    aiLabel: "Détresse détectée",
    aiReason:
      "Le message révèle un épuisement profond et un sentiment de perte de sens. Il est conservé et publié, avec les ressources d'aide affichées à l'auteur.",
    actions: [
      { id: "contact", label: "Contacter la personne", recommended: true },
      { id: "keep", label: "Garder en suivi" },
    ],
  },
];

export const helpResources = [
  { name: "3114", detail: "Numéro national de prévention du suicide, gratuit, 24 h/24" },
  { name: "SOS Amitié", detail: "Une écoute anonyme et confidentielle" },
];
