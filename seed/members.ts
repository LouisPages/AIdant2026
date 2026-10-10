import type { Member } from "@/lib/types";

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
  ...Object.fromEntries(
    (
      [
        ["lavande", "Lavande", "moon", "sky", "Je prends soin de ma mère depuis son AVC. Les soirées tranquilles me ressourcent."],
        ["genet", "Genêt", "sun", "teal", "Aidant de mon frère autiste. Je cherche surtout à ne pas m'épuiser."],
        ["mimosa", "Mimosa", "flower", "sky", "Jeune retraitée, j'accompagne mon mari atteint d'Alzheimer."],
        ["bleuet", "Bleuet", "sprout", "teal", "Maman d'une jeune fille polyhandicapée. Merci de me lire."],
        ["coquelicot", "Coquelicot", "flower", "sky", "Je concilie un emploi à temps plein et l'aide à mon père. Pas toujours simple."],
        ["fougere", "Fougère", "leaf", "teal", "Aidante de ma sœur depuis son cancer. On avance semaine après semaine."],
        ["ajonc", "Ajonc", "mountain", "sky", "J'ai accompagné ma femme jusqu'au bout. Je reste pour ceux qui commencent."],
        ["pervenche", "Pervenche", "flower", "teal", "Fille unique d'une maman qui perd la mémoire. Je vis à 300 km."],
        ["jasmin", "Jasmin", "leaf", "sky", "Je suis papa solo d'un ado en situation de handicap moteur."],
        ["myosotis", "Myosotis", "feather", "teal", "Je tiens un carnet de bord depuis trois ans. J'aime partager ce qui marche."],
        ["lilas", "Lilas", "flower", "sky", "Aidante de mon conjoint après son accident de moto. Tout a basculé en une seconde."],
        ["romarin", "Romarin", "sprout", "teal", "Infirmier de métier, aidant à la maison. Je sais combien c'est différent."],
        ["thym", "Thym", "leaf", "sky", "Mon père a la maladie de Parkinson. Je prends le temps de lire et d'écouter."],
        ["erable", "Érable", "mountain", "teal", "Je m'occupe de mes deux parents. Beaucoup de rendez-vous, peu de pauses."],
        ["saule", "Saule", "waves", "sky", "Aidante de mon fils schizophrène. J'apprends à lâcher prise."],
        ["olivier", "Olivier", "sun", "teal", "Je viens de commencer à aider ma mère. Je découvre tout."],
        ["hetre", "Hêtre", "mountain", "sky", "Aidant depuis 10 ans. La durée change tout, il faut savoir se préserver."],
        ["camelia", "Camélia", "flower", "teal", "Ancienne aidante de mon père. Je reprends goût aux choses petit à petit."],
        ["iris", "Iris", "feather", "sky", "Aidante d'un ami proche, sans lien familial. On nous oublie souvent."],
        ["orchidee", "Orchidée", "sprout", "teal", "Maman d'un petit garçon porteur de trisomie 21. Fière de lui chaque jour."],
        ["noisetier", "Noisetier", "leaf", "sky", "J'aide ma voisine âgée. Je n'étais pas préparé à tout ça."],
        ["capucine", "Capucine", "sun", "teal", "Aidante et salariée en télétravail. J'ai appris à poser mes limites."],
      ] as const
    ).map(([id, pseudo, avatar, tone, bio]) => [id, { id, pseudo, avatar, tone, bio } satisfies Member]),
  ),
  me: {
    id: "me",
    pseudo: "Camomille",
    avatar: "flower",
    tone: "teal",
    bio: "",
  },
};

export const suggestedPseudos = ["Camomille", "Églantine", "Sauge", "Bruyère", "Source", "Aurore"];
