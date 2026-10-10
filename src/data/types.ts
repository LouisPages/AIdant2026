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
};

export type CircleFamily = "lien" | "situation" | "contexte" | "parcours" | "besoin";

export type Circle = {
  id: string;
  name: string;
  family: CircleFamily;
  icon: string;
  description: string;
  memberCount: number;
};

export type ThreadKind = "question" | "astuce" | "partage";

export type Reply = {
  id: string;
  authorId: string;
  body: string;
  time: string;
};

export type Thread = {
  id: string;
  circleId: string;
  authorId: string;
  kind: ThreadKind;
  title: string;
  body: string;
  time: string;
  replies: Reply[];
  resourceId?: string;
  summary?: string;
  older?: boolean;
  /** Bonus de pertinence hardcodé pour la démo (voir getRelevantThreads). */
  relevance?: number;
};

export type Resource = {
  id: string;
  title: string;
  description: string;
  kind: string;
  steps: string[];
  minutes?: number;
};

export type ChatMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
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
};
