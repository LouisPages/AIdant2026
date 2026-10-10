import type { Member } from "./types";

export const ME_ID = "me";

export const members: Record<string, Member> = {
  tilleul: {
    id: "tilleul",
    pseudo: "Tilleul",
    avatar: "leaf",
    tone: "teal",
    bio: "J'accompagne mon mari depuis 4 ans. Ici pour partager des astuces du quotidien.",
  },
  marguerite: {
    id: "marguerite",
    pseudo: "Marguerite",
    avatar: "flower",
    tone: "sky",
    bio: "Aidante de ma mère. J'aime les petites victoires et les longues promenades.",
  },
  cedre: {
    id: "cedre",
    pseudo: "Cèdre",
    avatar: "mountain",
    tone: "teal",
    bio: "Je travaille à temps partiel pour aider mon père. Je lis beaucoup, j'écris un peu.",
  },
  brise: {
    id: "brise",
    pseudo: "Brise du matin",
    avatar: "waves",
    tone: "sky",
    bio: "Maman d'un garçon de 9 ans. On avance pas à pas.",
  },
  plume: {
    id: "plume",
    pseudo: "Plume",
    avatar: "feather",
    tone: "teal",
    bio: "Après l'aidance, je reste là pour écouter celles et ceux qui commencent.",
  },
  soleil: {
    id: "soleil",
    pseudo: "Soleil d'hiver",
    avatar: "sun",
    tone: "sky",
    bio: "Aidant solo depuis 2 ans. Je cherche des solutions de répit.",
  },
  aubepine: {
    id: "aubepine",
    pseudo: "Aubépine",
    avatar: "moon",
    tone: "sky",
    bio: "Je m'occupe de mon frère. Les soirées calmes sont mes petits trésors.",
  },
  glycine: {
    id: "glycine",
    pseudo: "Glycine",
    avatar: "flower",
    tone: "teal",
    bio: "Aidante depuis 6 ans. J'ai appris à demander de l'aide, et c'est un chemin.",
  },
  nenuphar: {
    id: "nenuphar",
    pseudo: "Nénuphar",
    avatar: "sprout",
    tone: "teal",
  },
  me: {
    id: "me",
    pseudo: "Camomille",
    avatar: "flower",
    tone: "teal",
    bio: "",
  },
};

export const suggestedPseudos = ["Camomille", "Églantine", "Sauge", "Bruyère", "Source", "Aurore"];
