import type { Resource } from "./types";

export const resources: Record<string, Resource> = {
  sommeil: {
    id: "sommeil",
    title: "Retrouver un sommeil réparateur quand on est aidant",
    description: "Des rituels simples pour protéger vos nuits, même quand elles sont agitées.",
    kind: "Article Nello",
    minutes: 4,
    steps: [
      "Garder des horaires de coucher réguliers, autant que possible.",
      "Prévoir une courte sieste sans culpabilité dans la journée.",
      "Demander un relais ponctuel pour récupérer une nuit complète.",
    ],
  },
  droits: {
    id: "droits",
    title: "Vos droits d'aidant en 5 minutes",
    description: "Congé de proche aidant, droit au répit, aides financières : l'essentiel à connaître.",
    kind: "Guide Nello",
    minutes: 5,
    steps: [
      "Identifier les droits qui correspondent à votre situation.",
      "Rassembler les justificatifs utiles.",
      "Être accompagné pour les démarches par un point d'information.",
    ],
  },
  culpabilite: {
    id: "culpabilite",
    title: "Comprendre et apaiser la culpabilité de l'aidant",
    description: "Pourquoi elle est si courante, et comment lui faire une place sans qu'elle prenne toute la place.",
    kind: "Article Nello",
    minutes: 6,
    steps: [
      "Reconnaître que ce sentiment est partagé par la plupart des aidants.",
      "Parler de ce que l'on ressent à une personne de confiance.",
      "S'accorder des temps pour soi, sans les justifier.",
    ],
  },
  repit: {
    id: "repit",
    title: "Trouver une solution de répit près de chez vous",
    description: "Accueil de jour, hébergement temporaire, relayage : les options expliquées simplement.",
    kind: "Article Nello",
    minutes: 5,
    steps: [
      "Faire le point sur le besoin : quelques heures, un week-end, une semaine.",
      "Contacter la plateforme de répit de votre département.",
      "Demander la prise en charge possible selon la situation.",
    ],
  },
  apa: {
    id: "apa",
    title: "Allocation personnalisée d'autonomie : les étapes",
    description: "Constituer le dossier et préparer la visite d'évaluation.",
    kind: "Aide financière",
    minutes: 7,
    steps: [
      "Rassembler les pièces d'identité et le dernier avis d'imposition.",
      "Déposer le dossier auprès du conseil départemental.",
      "Se préparer à la visite d'évaluation à domicile.",
    ],
  },
  conge: {
    id: "conge",
    title: "Congé de proche aidant : en parler à son employeur",
    description: "Vos droits, la démarche, et comment l'aborder sereinement.",
    kind: "Article Nello",
    minutes: 4,
    steps: [
      "Vérifier les conditions de la personne aidée.",
      "Prévenir l'employeur dans les délais prévus.",
      "Demander une indemnisation si vous y avez droit.",
    ],
  },
};
