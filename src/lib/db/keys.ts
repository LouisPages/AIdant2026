/**
 * Schéma de la table unique « aidants » (clés PK / SK, index GSI1 pour lister par type).
 *
 * Contenu partagé (alimenté par `npm run db:seed`) :
 *   CIRCLE#id / META            cercle (GSI1PK = TYPE#circle)
 *   MEMBER#id / META            membre fictif
 *   THREAD#id / META            fil ; THREAD#id / REPLY#<date>#<id> : réponses (TYPE#reply)
 *   RESOURCE#id / META          ressource Nello
 *   SUGGESTION#id / META        suggestion IA
 *   PERSON#memberId / META      aidant recommandé
 *   QUESTION#nn / META          question du questionnaire
 *   CONTENT#nom / META          textes (charte, libellés, pseudos, aides d'urgence, thèmes liés)
 *   MOD#id / META               cas de modération ; MOD#id / DECISION : décision tracée
 *   EMB#type#id / META          vecteur d'embedding (binaire float32) et empreinte du texte source (npm run db:embed)
 *   NEWS / LETTER#sujet         lettre d'actualités partagée (npm run news:refresh)
 *   DEMO#user / META            profil de démonstration copié à la création d'une session
 *   DEMO#conversation / CONV#… et MSG#… : conversations de démonstration
 *
 * Données d'un utilisateur anonyme (sid du cookie), toutes avec un TTL :
 *   USER#sid / META             profil, réponses, cercles rejoints, consentement, préférences
 *   USER#sid / THREAD#id        fils publiés ; REPLY#<fil>#<date>#<id> : réponses publiées
 *   USER#sid / CONV#membre      statut de conversation ; MSG#<membre>#<date>#<id> : messages
 *   USER#sid / REPORT#id        signalements
 */

export type Keys = { PK: string; SK: string; GSI1PK?: string; GSI1SK?: string };

export const pad = (n: number, width = 4) => String(n).padStart(width, "0");

const typed = (type: string, PK: string, SK: string, sort: string): Keys => ({
  PK,
  SK,
  GSI1PK: `TYPE#${type}`,
  GSI1SK: sort,
});

export const keys = {
  circle: (id: string, order: number) => typed("circle", `CIRCLE#${id}`, "META", `${pad(order)}#${id}`),
  member: (id: string) => typed("member", `MEMBER#${id}`, "META", id),
  thread: (id: string, createdAt: string) => typed("thread", `THREAD#${id}`, "META", `${createdAt}#${id}`),
  reply: (threadId: string, id: string, createdAt: string) =>
    typed("reply", `THREAD#${threadId}`, `REPLY#${createdAt}#${id}`, `${threadId}#${createdAt}#${id}`),
  resource: (id: string) => typed("resource", `RESOURCE#${id}`, "META", id),
  suggestion: (id: string, order: number) => typed("suggestion", `SUGGESTION#${id}`, "META", `${pad(order)}#${id}`),
  person: (memberId: string, order: number) => typed("person", `PERSON#${memberId}`, "META", `${pad(order)}#${memberId}`),
  question: (order: number) => typed("question", `QUESTION#${pad(order)}`, "META", pad(order)),
  content: (name: string) => typed("content", `CONTENT#${name}`, "META", name),
  moderation: (id: string, order: number) => typed("moderation", `MOD#${id}`, "META", `${pad(order)}#${id}`),
  moderationDecision: (id: string) => typed("moddecision", `MOD#${id}`, "DECISION", id),
  /** Vecteur d'un cercle, fil, ressource ou solution (voir `lib/ai/index-store.ts`). */
  embedding: (kind: string, id: string) => typed("emb", `EMB#${kind}#${id}`, "META", `${kind}#${id}`),
  /** Lettre partagée d'un sujet. Pas de TTL : la version périmée reste affichée pendant son renouvellement. */
  newsLetter: (topicId: string) => typed("news", "NEWS", `LETTER#${topicId}`, topicId),

  demoUser: (): Keys => ({ PK: "DEMO#user", SK: "META" }),
  demoConv: (memberId: string): Keys => ({ PK: "DEMO#conversation", SK: `CONV#${memberId}` }),
  demoMsg: (memberId: string, id: string, createdAt: string): Keys => ({
    PK: "DEMO#conversation",
    SK: `MSG#${memberId}#${createdAt}#${id}`,
  }),

  user: (sid: string) => `USER#${sid}`,
  userMeta: (sid: string): Keys => ({ PK: `USER#${sid}`, SK: "META" }),
  userThread: (sid: string, id: string): Keys => ({ PK: `USER#${sid}`, SK: `THREAD#${id}` }),
  userReply: (sid: string, threadId: string, id: string, createdAt: string): Keys => ({
    PK: `USER#${sid}`,
    SK: `REPLY#${threadId}#${createdAt}#${id}`,
  }),
  userConv: (sid: string, memberId: string): Keys => ({ PK: `USER#${sid}`, SK: `CONV#${memberId}` }),
  userMsg: (sid: string, memberId: string, id: string, createdAt: string): Keys => ({
    PK: `USER#${sid}`,
    SK: `MSG#${memberId}#${createdAt}#${id}`,
  }),
  /** Cas de modération créé par l'application : rangé chez l'auteur (effacé avec ses données), listé par le back-office via GSI1. */
  userModeration: (sid: string, id: string, createdAt: string): Keys => ({
    PK: `USER#${sid}`,
    SK: `MOD#${id}`,
    GSI1PK: "TYPE#moderation",
    GSI1SK: `live#${createdAt}#${id}`,
  }),
  userReport: (sid: string, id: string): Keys => ({ PK: `USER#${sid}`, SK: `REPORT#${id}` }),
};

/** Retire les attributs techniques d'un élément pour ne garder que le contenu métier. */
export function stripKeys<T extends Record<string, unknown>>(item: T): Omit<T, "PK" | "SK" | "GSI1PK" | "GSI1SK" | "ttl" | "order"> {
  const { PK: _pk, SK: _sk, GSI1PK: _g1, GSI1SK: _g2, ttl: _ttl, order: _order, ...rest } = item;
  void _pk; void _sk; void _g1; void _g2; void _ttl; void _order;
  return rest as never;
}
