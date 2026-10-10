import type { SeedConversation } from "./seed-types";

/** Échanges privés supplémentaires (en plus de ceux de conversations.ts). */
export const moreConversations: SeedConversation[] = [
  {
    memberId: "plume",
    status: "accepted",
    circleId: "c-debut",
    messages: [
      { id: "mc1", from: "them", text: "Bonjour, j'ai lu votre première question dans « Début de l'aidance ». Je me souviens très bien de cette période. Je suis là si vous voulez en parler.", time: "Dimanche, 10:12" },
      { id: "mc2", from: "me", text: "Merci, ça me touche. Je me sens un peu perdue avec tous ces papiers.", time: "Dimanche, 10:40" },
      { id: "mc3", from: "them", text: "Normal. Une seule chose à faire cette semaine : appeler le point d'information de votre département. Le reste viendra ensuite.", time: "Dimanche, 10:44" },
      { id: "mc4", from: "me", text: "D'accord, je le fais lundi matin. Merci pour votre douceur.", time: "Dimanche, 11:02" },
      { id: "mc5", from: "them", text: "Avec plaisir. Et n'hésitez pas à me dire comment ça s'est passé.", time: "Dimanche, 11:05" },
      { id: "mc6", from: "me", text: "J'ai appelé, ils m'ont donné un rendez-vous jeudi. Merci mille fois.", time: "Lundi, 09:30" },
      { id: "mc7", from: "them", text: "Quelle belle nouvelle. Pensez à noter vos questions avant le rendez-vous.", time: "Lundi, 09:41" },
    ],
  },
  {
    memberId: "lavande",
    status: "accepted",
    circleId: "c-conjoints",
    messages: [
      { id: "mc8", from: "them", text: "Je voulais vous remercier pour votre réponse sur les soirées sans médicaments. On a essayé hier, c'était étrange et doux à la fois.", time: "Hier, 21:15" },
      { id: "mc9", from: "me", text: "Ça me fait très plaisir. Qu'avez-vous fait ensemble ?", time: "Hier, 21:30" },
      { id: "mc10", from: "them", text: "On a regardé de vieilles photos de voyage. Il a retrouvé le nom d'une ville, il en était tout ému.", time: "Hier, 21:34" },
      { id: "mc11", from: "me", text: "Quel beau moment. Gardez ce rituel, il vous fera du bien à tous les deux.", time: "Hier, 21:50" },
    ],
  },
  {
    memberId: "pervenche",
    status: "accepted",
    circleId: "c-parent",
    messages: [
      { id: "mc12", from: "them", text: "Bonjour, votre message sur l'aide à distance m'a beaucoup aidée. Puis-je vous poser une question plus précise ?", time: "Mardi, 19:02" },
      { id: "mc13", from: "me", text: "Bien sûr, je vous écoute.", time: "Mardi, 19:20" },
      { id: "mc14", from: "them", text: "Comment avez-vous choisi le bracelet d'alerte ? Il y en a tellement et je ne sais pas lequel prendre.", time: "Mardi, 19:25" },
      { id: "mc15", from: "me", text: "J'ai regardé ceux avec détection de chute automatique et un bouton simple. La plateforme du département m'a donné une liste de modèles.", time: "Mardi, 19:48" },
      { id: "mc16", from: "them", text: "Parfait, je les appelle demain. Merci du fond du cœur.", time: "Mardi, 19:52" },
    ],
  },
  {
    memberId: "ajonc",
    status: "pending-in",
    circleId: "c-apres",
    messages: [
      { id: "mc17", from: "them", text: "Bonsoir, j'ai vu votre message dans « Après l'aidance ». Je traverse la même chose. Accepteriez-vous d'en parler en privé ?", time: "Ce matin, 07:50" },
    ],
  },
  {
    memberId: "orchidee",
    status: "accepted",
    circleId: "c-handicap-enfant",
    messages: [
      { id: "mc18", from: "them", text: "Bonjour ! Merci pour votre idée de fiche d'une page pour l'école, on l'a faite hier soir avec mon mari.", time: "Jeudi, 20:14" },
      { id: "mc19", from: "me", text: "Avec plaisir. Vous y avez mis quoi ?", time: "Jeudi, 20:31" },
      { id: "mc20", from: "them", text: "Ses goûts, ce qui l'apaise, ce qui l'angoisse, et comment réagir en cas de crise. L'enseignante nous a remerciés.", time: "Jeudi, 20:36" },
      { id: "mc21", from: "me", text: "C'est exactement ça. Je suis ravie pour vous.", time: "Jeudi, 20:49" },
      { id: "mc22", from: "them", text: "Je vous tiens au courant de la rentrée.", time: "Jeudi, 20:51" },
    ],
  },
  {
    memberId: "coquelicot",
    status: "accepted",
    circleId: "c-salaries",
    messages: [
      { id: "mc23", from: "me", text: "Bonjour, j'ai lu votre message sur votre manager. Comment avez-vous abordé la question du congé de proche aidant ?", time: "Vendredi, 12:10" },
      { id: "mc24", from: "them", text: "J'ai demandé un rendez-vous de 20 minutes, j'ai dit simplement : « j'aide mon père et j'aurai besoin d'aménager mes horaires ».", time: "Vendredi, 12:35" },
      { id: "mc25", from: "them", text: "Pas besoin d'entrer dans les détails. Et j'avais préparé deux propositions concrètes.", time: "Vendredi, 12:36" },
      { id: "mc26", from: "me", text: "Merci, c'est très clair. Je vais préparer mes propositions ce week-end.", time: "Vendredi, 12:58" },
    ],
  },
  {
    memberId: "thym",
    status: "accepted",
    circleId: "c-d-maladie-de-parkinson",
    messages: [
      { id: "mc27", from: "them", text: "Bonsoir, j'ai remarqué que nous suivons tous les deux une personne atteinte de Parkinson. Comment se passent vos nuits ?", time: "Mercredi, 22:05" },
      { id: "mc28", from: "me", text: "En dents de scie, mais mieux depuis que nous avons ajusté les horaires du traitement.", time: "Mercredi, 22:30" },
      { id: "mc29", from: "them", text: "Pareil chez nous. Le neurologue a décalé une prise, et mon père dort mieux. Je pensais que c'était sans espoir.", time: "Mercredi, 22:36" },
      { id: "mc30", from: "me", text: "Surtout, n'hésitez pas à noter les moments de la journée. Ça aide énormément pour ajuster.", time: "Mercredi, 22:49" },
    ],
  },
  {
    memberId: "hetre",
    status: "pending-out",
    circleId: "c-longue",
    messages: [],
  },
  {
    memberId: "mimosa",
    status: "accepted",
    circleId: "c-d-maladie-d-alzheimer",
    messages: [
      { id: "mc31", from: "them", text: "Bonjour, j'ai lu votre message dans le cercle Alzheimer. Vous avez trouvé de si belles façons d'être présent.", time: "Samedi, 16:12" },
      { id: "mc32", from: "me", text: "Merci, ça me touche. C'est encore tout nouveau pour moi, je tâtonne beaucoup.", time: "Samedi, 16:40" },
      { id: "mc33", from: "them", text: "Nous tâtonnons tous. Ce qui m'aide : écrire chaque soir une chose qui s'est bien passée, même minuscule.", time: "Samedi, 16:44" },
      { id: "mc34", from: "me", text: "Je vais essayer dès ce soir. Merci pour cette idée toute simple.", time: "Samedi, 17:01" },
      { id: "mc35", from: "them", text: "N'hésitez pas à m'écrire quand vous voulez.", time: "Samedi, 17:03" },
    ],
  },
];
