import { moreConversations } from "./conversations-more";
import type { SeedConversation } from "./seed-types";

export const conversations: SeedConversation[] = [
  ...moreConversations,
  {
    memberId: "tilleul",
    status: "accepted",
    circleId: "c-conjoints",
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Bonjour ! J'ai vu votre question sur les nuits agitées. Je suis passée par là, si vous voulez en parler plus tranquillement.",
        time: "Hier, 18:42",
      },
      {
        id: "m2",
        from: "me",
        text: "Merci beaucoup, ça me touche. Avec plaisir.",
        time: "Hier, 19:05",
      },
      {
        id: "m3",
        from: "them",
        text: "Ce qui m'a le plus aidée, c'est de ne plus lutter : accepter que certaines nuits soient comme ça, et récupérer en journée quand c'est possible.",
        time: "Hier, 19:12",
      },
      {
        id: "m4",
        from: "them",
        text: "Et n'hésitez pas à me dire si vous avez besoin d'une oreille ce soir.",
        time: "Hier, 19:13",
      },
    ],
  },
  {
    memberId: "marguerite",
    status: "pending-in",
    circleId: "c-neuro",
    messages: [
      {
        id: "m5",
        from: "them",
        text: "Bonjour, votre message dans le cercle m'a beaucoup parlé. Est-ce que vous seriez d'accord pour qu'on échange en privé ?",
        time: "Ce matin, 08:20",
      },
    ],
  },
  {
    memberId: "brise",
    status: "accepted",
    circleId: "c-handicap-enfant",
    messages: [
      {
        id: "m6",
        from: "me",
        text: "Bonjour, merci d'avoir répondu dans le cercle. Comment avez-vous préparé le dossier pour la MDPH ?",
        time: "Lundi, 21:10",
      },
      {
        id: "m7",
        from: "them",
        text: "Avec plaisir ! J'ai tout rassemblé dans une pochette, avec un petit résumé d'une page sur le quotidien de mon fils. Ça m'a évité de tout réexpliquer.",
        time: "Lundi, 21:34",
      },
      {
        id: "m8",
        from: "them",
        text: "Je peux vous envoyer le modèle de résumé si vous voulez.",
        time: "Lundi, 21:35",
      },
    ],
  },
  {
    memberId: "aubepine",
    status: "accepted",
    circleId: "c-repit",
    messages: [
      {
        id: "m9",
        from: "them",
        text: "Merci pour votre message sur l'accueil de jour, je ne savais pas que c'était possible près de chez moi.",
        time: "Mardi, 17:48",
      },
      {
        id: "m10",
        from: "me",
        text: "Avec plaisir. Le premier essai m'a fait du bien, même si j'ai culpabilisé au début.",
        time: "Mardi, 18:20",
      },
      {
        id: "m11",
        from: "them",
        text: "Je comprends tellement. Je vais essayer jeudi, je vous dis comment ça s'est passé.",
        time: "Mardi, 18:27",
      },
    ],
  },
  {
    memberId: "glycine",
    status: "accepted",
    circleId: "c-longue",
    messages: [
      {
        id: "m12",
        from: "them",
        text: "Bonsoir, j'ai lu votre présentation. Après six ans, je me souviens très bien des premiers mois.",
        time: "Samedi, 20:02",
      },
      {
        id: "m13",
        from: "me",
        text: "Merci, c'est rassurant de parler à quelqu'un qui est passé par là. Qu'est-ce qui vous a le plus aidée ?",
        time: "Samedi, 20:40",
      },
      {
        id: "m14",
        from: "them",
        text: "Une heure par semaine rien que pour moi, sans exception. Au début ça paraît impossible, puis ça devient indispensable.",
        time: "Samedi, 21:03",
      },
    ],
  },
  {
    memberId: "cedre",
    status: "pending-out",
    circleId: "c-salaries",
    messages: [],
  },
];
