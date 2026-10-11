export type AvatarKey =
  | "leaf"
  | "sun"
  | "feather"
  | "moon"
  | "waves"
  | "mountain"
  | "flower"
  | "sprout";

export type AvatarTone = "teal" | "sky";

export type Member = {
  id: string;
  pseudo: string;
  avatar: AvatarKey;
  tone: AvatarTone;
  bio?: string;
  /** Tags de la taxonomie (voir `lib/tags.ts`), utilisés pour recommander des aidants proches. */
  tags?: string[];
};

export type CircleFamily = "lien" | "situation" | "contexte" | "parcours" | "besoin";

export type Circle = {
  id: string;
  name: string;
  family: CircleFamily;
  icon: string;
  description: string;
  memberCount: number;
  /** Cercle « maladie / handicap » issu d'une précision du questionnaire. */
  detail?: boolean;
  /** Tags de la taxonomie (voir `lib/tags.ts`). */
  tags?: string[];
};

export type ThreadKind = "question" | "astuce" | "partage";

/** Les dates sont stockées en ISO 8601 ; l'affichage relatif est calculé par `formatRelative`. */
export type Reply = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type Thread = {
  id: string;
  circleId: string;
  authorId: string;
  kind: ThreadKind;
  title: string;
  body: string;
  createdAt: string;
  replies: Reply[];
  resourceId?: string;
  older?: boolean;
  /** Bonus de pertinence éditorial (voir getRelevantThreads). */
  relevance?: number;
  /** Tags hérités du cercle, plus thèmes et besoins détectés dans le texte (voir `lib/tags.ts`). */
  tags?: string[];
};

export type Resource = {
  id: string;
  title: string;
  description: string;
  kind: string;
  steps: string[];
  minutes?: number;
  /** Thèmes du questionnaire qui font remonter cette ressource. */
  topics?: string[];
  /** Position dans la liste des articles recommandés (absent : ressource non proposée comme article). */
  articleOrder?: number;
};

export type AiSuggestion = {
  id: string;
  title: string;
  text: string;
  reason: string;
  href: string;
  cta: string;
  /** Identifiants de thèmes du questionnaire qui rendent la suggestion plus pertinente. */
  topics: string[];
};

export type PersonRecommendation = {
  memberId: string;
  traits: string[];
  reason: string;
};

export type ChatMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  createdAt: string;
};

export type ConversationStatus = "accepted" | "pending-in" | "pending-out";

export type Conversation = {
  memberId: string;
  status: ConversationStatus;
  circleId: string;
  messages: ChatMessage[];
};

export type ModerationCase = {
  id: string;
  type: "ton" | "medical" | "detresse";
  circleId: string;
  authorId: string;
  message: string;
  receivedAt: string;
  aiLabel: string;
  aiReason: string;
  aiSuggestion?: string;
  actions: { id: string; label: string; recommended?: boolean }[];
  /** Cas créé par l'application (détresse repérée, relecture demandée), par opposition au contenu de départ. */
  live?: boolean;
  /** Pseudo et avatar de l'auteur pour les cas créés par l'application (l'identifiant « me » ne désigne qu'une session). */
  authorPseudo?: string;
  authorAvatar?: AvatarKey;
};

export type ModerationDecision = { actionId: string; label: string; decidedAt: string };

export type HelpResource = { name: string; detail: string };

export type UserProfile = { pseudo: string; avatar: AvatarKey; bio: string };

/** Choix de l'aidant sur ce qu'il accepte de recevoir ; appliqués dans toute l'application. */
export type UserPreferences = {
  /** Autorise les autres aidants à proposer une discussion privée (sinon, les demandes reçues sont masquées). */
  contactRequests: boolean;
  /** Affiche « Aidants à découvrir » dans Solutions. */
  peopleSuggestions: boolean;
  /** Affiche « Suggestions de KatIA » dans Solutions. */
  aiSuggestions: boolean;
  /** Limite le fil des Cercles aux cercles rejoints. */
  onlyMyCircles: boolean;
};

/** Contenu partagé, lu dans DynamoDB et transmis au navigateur. */
export type Catalog = {
  /** Tous les cercles, y compris ceux de situations précises (`detail: true`), dans l'ordre éditorial. */
  circles: Circle[];
  members: Record<string, Member>;
  /** Fils du contenu partagé avec leurs réponses, dans l'ordre éditorial. */
  threads: Thread[];
  resources: Record<string, Resource>;
  questions: import("./questionnaire").Question[];
  seedTopics: string[];
  relatedTopics: Record<string, string[]>;
  familyLabels: Record<CircleFamily, string>;
  charter: string[];
  pseudos: string[];
};

/** État propre à l'utilisateur anonyme de la session. */
export type UserState = {
  profile: UserProfile;
  answers: Record<string, string[]>;
  joined: string[];
  consent: boolean;
  preferences: UserPreferences;
  /** Fils publiés par l'utilisateur, du plus récent au plus ancien. */
  userThreads: Thread[];
  /** Réponses publiées par l'utilisateur, par fil. */
  userReplies: Record<string, Reply[]>;
  conversations: Record<string, Conversation>;
  reported: string[];
  /** Démo : identifiants de fils ou réponses masqués (contenu partagé, non détruit). */
  hiddenIds: string[];
};

export type Bootstrap = { catalog: Catalog; user: UserState };
