import type { Conversation } from "./types";

export const conversations: Conversation[] = [
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
    memberId: "cedre",
    status: "pending-out",
    circleId: "c-salaries",
    messages: [],
  },
];

export const getConversation = (memberId: string) =>
  conversations.find((c) => c.memberId === memberId);
