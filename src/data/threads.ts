import type { Thread } from "./types";

export const threads: Thread[] = [
  // --- Accompagner son conjoint ---
  {
    id: "t1",
    circleId: "c-conjoints",
    authorId: "marguerite",
    kind: "question",
    title: "Comment gérer les nuits agitées ?",
    body: "Mon mari se réveille plusieurs fois par nuit, un peu perdu. Je suis à bout de fatigue. Est-ce que certains d'entre vous ont trouvé des gestes ou des rituels qui aident à retrouver le calme ?",
    time: "Il y a 2 h",
    replies: [
      {
        id: "r1",
        authorId: "tilleul",
        body: "Chez nous, une lampe de chevet très douce et une musique toujours identique ont changé beaucoup de choses. Il comprend que c'est la nuit et se rendort plus vite.",
        time: "Il y a 1 h",
      },
      {
        id: "r2",
        authorId: "plume",
        body: "Courage. On a fait la même chose avec une routine du soir en cinq étapes, toujours dans le même ordre. Ça prend deux semaines pour s'installer, mais ça vaut le coup.",
        time: "Il y a 40 min",
      },
      {
        id: "r3",
        authorId: "marguerite",
        body: "Merci à vous deux, je vais essayer la lampe dès ce soir.",
        time: "Il y a 15 min",
      },
    ],
    summary:
      "Les pairs conseillent un rituel du soir identique chaque jour, une lumière douce et une musique familière. L'effet se voit après environ deux semaines.",
  },
  {
    id: "t2",
    circleId: "c-conjoints",
    authorId: "tilleul",
    kind: "astuce",
    title: "Un carnet de bord pour les rendez-vous",
    body: "Je note chaque soir trois choses : ce qui s'est bien passé, ce qui a été difficile, une question pour le médecin. Au rendez-vous, tout est là, et je me sens moins dépassée.",
    time: "Hier",
    replies: [
      {
        id: "r4",
        authorId: "cedre",
        body: "Excellente idée, je m'y mets. J'oubliais toujours la moitié de mes questions.",
        time: "Hier",
      },
    ],
  },
  {
    id: "t3",
    circleId: "c-conjoints",
    authorId: "nenuphar",
    kind: "partage",
    title: "Je me présente",
    body: "Bonjour, je m'appelle Nénuphar. J'accompagne mon mari, atteint de la maladie de Parkinson, depuis un an. Je lis beaucoup ici et ça m'aide déjà.",
    time: "Il y a 3 jours",
    replies: [
      {
        id: "r5",
        authorId: "tilleul",
        body: "Bienvenue Nénuphar, vous êtes au bon endroit.",
        time: "Il y a 3 jours",
      },
    ],
  },
  {
    id: "t3b",
    circleId: "c-conjoints",
    authorId: "plume",
    kind: "partage",
    title: "Ce qui m'a aidée à reprendre un peu de temps pour moi",
    body: "Un après-midi par semaine, une amie reste avec lui. Au début je culpabilisais. Maintenant je sais que ce temps nous aide tous les deux.",
    time: "Il y a 2 semaines",
    replies: [],
    older: true,
  },

  // --- Maladie chronique ou neurodégénérative ---
  {
    id: "t4",
    circleId: "c-neuro",
    authorId: "cedre",
    kind: "question",
    title: "Faut-il reparler du diagnostic à chaque fois ?",
    body: "Mon père oublie qu'il est malade et pose la question chaque semaine. Je ne sais jamais si je dois répondre franchement ou dévier.",
    time: "Il y a 5 h",
    replies: [
      {
        id: "r6",
        authorId: "plume",
        body: "Nous, on répondait avec douceur, en restant simple, et on passait vite à autre chose. L'important, c'était son apaisement plus que la vérité exacte.",
        time: "Il y a 3 h",
      },
    ],
  },
  {
    id: "t5",
    circleId: "c-neuro",
    authorId: "marguerite",
    kind: "astuce",
    title: "Des photos étiquetées pour les repères",
    body: "On a collé des photos avec le prénom de chacun sur la porte du salon. Elle s'en sert chaque jour et reste plus sereine avec ses petits-enfants.",
    time: "Il y a 2 jours",
    replies: [],
  },

  // --- Aidants solos ---
  {
    id: "t6",
    circleId: "c-solos",
    authorId: "soleil",
    kind: "question",
    title: "Comment demander de l'aide à ses proches ?",
    body: "J'ai du mal à demander, et personne ne propose. Comment avez-vous fait pour oser, sans avoir l'impression de déranger ?",
    time: "Il y a 4 h",
    replies: [
      {
        id: "r7",
        authorId: "cedre",
        body: "Je demande des choses très précises : « peux-tu passer mardi à 15 h une heure ? » C'est plus facile pour eux de dire oui.",
        time: "Il y a 2 h",
      },
    ],
    resourceId: "repit",
    summary:
      "Les pairs conseillent de formuler des demandes précises et ponctuelles, plutôt qu'un appel à l'aide général.",
  },
  {
    id: "t7",
    circleId: "c-solos",
    authorId: "nenuphar",
    kind: "partage",
    title: "Une petite victoire aujourd'hui",
    body: "J'ai pris trente minutes pour marcher dehors, sans téléphone. Rien d'extraordinaire, mais je me suis sentie moi pour la première fois depuis longtemps.",
    time: "Hier",
    replies: [
      {
        id: "r8",
        authorId: "soleil",
        body: "Quel bonheur de lire ça. Bravo.",
        time: "Hier",
      },
    ],
  },

  // --- Répit et respiration ---
  {
    id: "t8",
    circleId: "c-repit",
    authorId: "brise",
    kind: "question",
    title: "Quelqu'un a déjà testé l'accueil de jour ?",
    body: "On m'en a parlé pour mon fils. J'ai peur qu'il se sente abandonné. Comment ça s'est passé pour vous ?",
    time: "Il y a 6 h",
    replies: [
      {
        id: "r9",
        authorId: "tilleul",
        body: "On a commencé par deux demi-journées. Il a vite repéré ses habitudes, et moi j'ai respiré enfin. Demandez une visite avant, c'est rassurant.",
        time: "Il y a 4 h",
      },
    ],
    resourceId: "repit",
  },
  {
    id: "t9",
    circleId: "c-repit",
    authorId: "plume",
    kind: "astuce",
    title: "Organiser un week-end de répit",
    body: "Prévenir trois mois à l'avance, visiter la structure, laisser une fiche d'habitudes d'une page. Tout s'est bien passé.",
    time: "Il y a 4 jours",
    replies: [],
  },

  // --- Aider et travailler ---
  {
    id: "t10",
    circleId: "c-salaries",
    authorId: "cedre",
    kind: "question",
    title: "Comment annoncer à son employeur qu'on est aidant ?",
    body: "Je ne sais pas comment aborder le sujet sans que ça pèse sur ma carrière. Avez-vous eu des expériences positives ?",
    time: "Il y a 1 jour",
    replies: [
      {
        id: "r10",
        authorId: "plume",
        body: "J'ai commencé par parler de mes besoins d'horaires, sans entrer dans les détails. Mon manager a été à l'écoute.",
        time: "Il y a 20 h",
      },
    ],
    resourceId: "conge",
  },
  {
    id: "t11",
    circleId: "c-salaries",
    authorId: "tilleul",
    kind: "astuce",
    title: "Télétravail et rendez-vous médicaux",
    body: "J'ai regroupé tous les rendez-vous sur une même demi-journée toutes les deux semaines. Mon équipe s'organise autour.",
    time: "Il y a 5 jours",
    replies: [],
  },

  // --- Démarches administratives ---
  {
    id: "t12",
    circleId: "c-demarches",
    authorId: "marguerite",
    kind: "question",
    title: "Par où commencer pour l'allocation d'autonomie ?",
    body: "Les dossiers sont décourageants. Y a-t-il une première étape simple pour ne pas se perdre ?",
    time: "Il y a 8 h",
    replies: [
      {
        id: "r11",
        authorId: "soleil",
        body: "Appelez d'abord le point d'accueil du département. Ils m'ont envoyé la liste exacte des pièces.",
        time: "Il y a 6 h",
      },
    ],
    resourceId: "apa",
  },
  {
    id: "t13",
    circleId: "c-demarches",
    authorId: "tilleul",
    kind: "astuce",
    title: "Une pochette unique pour tous les papiers",
    body: "Une pochette par personne, avec une feuille de suivi des appels. Fini les « on vous a déjà envoyé ça ».",
    time: "Il y a 3 jours",
    replies: [],
  },

  // --- Culpabilité ---
  {
    id: "t14",
    circleId: "c-culpabilite",
    authorId: "nenuphar",
    kind: "partage",
    title: "Se sentir coupable quand on s'agace",
    body: "Hier je me suis agacée, et je m'en veux encore. Est-ce que ça passe ? Comment vous en faites-vous quelque chose de doux ?",
    time: "Il y a 7 h",
    replies: [
      {
        id: "r12",
        authorId: "plume",
        body: "Cela passe, et cela veut juste dire que vous avez besoin de souffler. Parlez-vous comme à une amie.",
        time: "Il y a 5 h",
      },
    ],
  },

  // --- Aider un parent ---
  {
    id: "t15",
    circleId: "c-parent",
    authorId: "marguerite",
    kind: "question",
    title: "Quand parler de l'entrée en établissement ?",
    body: "Ma mère refuse d'en entendre parler. Comment amener le sujet sans rompre la confiance ?",
    time: "Il y a 1 jour",
    replies: [
      {
        id: "r13",
        authorId: "cedre",
        body: "On a fait des visites « pour voir » sans engagement. Cela a ouvert la discussion, petit à petit.",
        time: "Il y a 22 h",
      },
    ],
  },
  {
    id: "t16",
    circleId: "c-parent",
    authorId: "tilleul",
    kind: "astuce",
    title: "Un appel vidéo quotidien de cinq minutes",
    body: "Un rituel court mais régulier. Il rassure mon père et me rassure aussi.",
    time: "Il y a 3 jours",
    replies: [],
  },

  // --- Début de l'aidance ---
  {
    id: "t17",
    circleId: "c-debut",
    authorId: "plume",
    kind: "partage",
    title: "Ce que j'aurais aimé savoir au début",
    body: "Que demander de l'aide n'est pas un échec. Que les premiers mois sont les plus durs. Et qu'on s'en sort, ensemble.",
    time: "Il y a 2 jours",
    replies: [],
  },
];

export const getThread = (id: string) => threads.find((t) => t.id === id);
