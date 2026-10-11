/** Données de l'utilisateur anonyme d'une session (partition USER#<sid>). */
import { randomUUID } from "node:crypto";
import type {
  ChatMessage,
  Conversation,
  ConversationStatus,
  Reply,
  Thread,
  ThreadKind,
  UserPreferences,
  UserProfile,
  UserState,
} from "@/lib/types";
import {
  batchDelete,
  batchPut,
  deleteItem,
  getItem,
  putItem,
  queryPartition,
  ttl,
  updateItem,
  type Item,
} from "./client";
import { normalizePreferences } from "@/lib/preferences";
import { keys, stripKeys } from "./keys";

type DemoUser = {
  profile: UserProfile;
  emptyProfile: UserProfile;
  answers: Record<string, string[]>;
  joined: string[];
  consent: boolean;
};

const notSeeded = () =>
  Object.assign(new Error("La base est vide : lancez « npm run db:create » puis « npm run db:seed »."), {
    name: "DatabaseNotSeeded",
  });

/**
 * Crée la partition d'un utilisateur : profil, réponses, cercles et conversations de départ.
 * - `demo` : profil de démonstration complet (accès direct à l'application).
 * - `empty` : profil vierge (après suppression des données), seules les conversations d'accueil restent.
 */
export async function initUser(sid: string, mode: "demo" | "empty") {
  const demo = (await getItem(keys.demoUser().PK, keys.demoUser().SK)) as unknown as (Item & DemoUser) | undefined;
  if (!demo) throw notSeeded();

  const convItems = await queryPartition("DEMO#conversation");
  const expires = ttl();
  const copies: Item[] = convItems.map((i) => {
    const { PK: _pk, SK, GSI1PK: _g1, GSI1SK: _g2, ...rest } = i as Item & { GSI1PK?: string; GSI1SK?: string };
    void _pk; void _g1; void _g2;
    return { PK: keys.user(sid), SK, ...rest, ttl: expires } as Item;
  });
  if (copies.length) await batchPut(copies);

  await putItem({
    ...keys.userMeta(sid),
    profile: mode === "demo" ? demo.profile : demo.emptyProfile,
    answers: mode === "demo" ? demo.answers : {},
    joined: mode === "demo" ? demo.joined : [],
    consent: demo.consent,
    createdAt: new Date().toISOString(),
    ttl: expires,
  } as Item);
}

/** Garantit l'existence de la partition de l'utilisateur (première visite, ou expiration du TTL). */
export async function ensureUser(sid: string) {
  const meta = await getItem(keys.userMeta(sid).PK, keys.userMeta(sid).SK);
  if (!meta) await initUser(sid, "demo");
}

function buildState(items: Item[]): UserState {
  const meta = items.find((i) => i.SK === "META") as (Item & Partial<DemoUser>) | undefined;
  if (!meta) throw notSeeded();

  const userThreads: Thread[] = items
    .filter((i) => i.SK.startsWith("THREAD#"))
    .map((i) => ({ ...(stripKeys(i) as unknown as Thread), replies: [] }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const userReplies: Record<string, Reply[]> = {};
  for (const i of items.filter((x) => x.SK.startsWith("REPLY#"))) {
    const { threadId, ...reply } = stripKeys(i) as unknown as Reply & { threadId: string };
    (userReplies[threadId] ??= []).push(reply);
  }

  const conversations: Record<string, Conversation> = {};
  for (const i of items.filter((x) => x.SK.startsWith("CONV#"))) {
    const { memberId, status, circleId } = i as unknown as Conversation;
    conversations[memberId] = { memberId, status, circleId, messages: [] };
  }
  for (const i of items.filter((x) => x.SK.startsWith("MSG#"))) {
    const { memberId, ...msg } = stripKeys(i) as unknown as ChatMessage & { memberId: string };
    conversations[memberId]?.messages.push(msg);
  }
  for (const c of Object.values(conversations)) c.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const reported = items.filter((i) => i.SK.startsWith("REPORT#")).map((i) => String(i.SK).slice("REPORT#".length));
  const hiddenIds = Array.isArray(meta.hiddenIds)
    ? (meta.hiddenIds as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  return {
    profile: meta.profile as UserProfile,
    answers: (meta.answers ?? {}) as Record<string, string[]>,
    joined: (meta.joined ?? []) as string[],
    consent: meta.consent !== false,
    preferences: normalizePreferences(meta.preferences),
    userThreads,
    userReplies,
    conversations,
    reported,
    hiddenIds,
  };
}

export async function loadUser(sid: string): Promise<UserState> {
  let items = await queryPartition(keys.user(sid));
  if (!items.some((i) => i.SK === "META")) {
    await initUser(sid, "demo");
    items = await queryPartition(keys.user(sid));
  }
  return buildState(items);
}

/** Met à jour un champ de la fiche de l'utilisateur et prolonge son TTL. */
async function setMeta(
  sid: string,
  field: "profile" | "answers" | "joined" | "consent" | "preferences" | "hiddenIds",
  value: unknown,
) {
  await ensureUser(sid);
  const { PK, SK } = keys.userMeta(sid);
  await updateItem(PK, SK, { [field]: value, ttl: ttl() });
}

export const saveProfile = (sid: string, profile: UserProfile) => setMeta(sid, "profile", profile);
export const saveAnswers = (sid: string, answers: Record<string, string[]>) => setMeta(sid, "answers", answers);
export const saveJoined = (sid: string, joined: string[]) => setMeta(sid, "joined", joined);
export const saveConsent = (sid: string, consent: boolean) => setMeta(sid, "consent", consent);
export const savePreferences = (sid: string, preferences: UserPreferences) => setMeta(sid, "preferences", preferences);

export async function createThread(
  sid: string,
  input: { id: string; circleId: string; kind: ThreadKind; title: string; body: string },
): Promise<Thread> {
  await ensureUser(sid);
  const thread: Thread = { ...input, authorId: "me", createdAt: new Date().toISOString(), replies: [] };
  const { replies: _replies, ...stored } = thread;
  void _replies;
  await putItem({ ...keys.userThread(sid, thread.id), ...stored, ttl: ttl() } as Item);
  return thread;
}

export async function createReply(sid: string, input: { id: string; threadId: string; body: string }): Promise<Reply> {
  await ensureUser(sid);
  const reply: Reply = { id: input.id, authorId: "me", body: input.body, createdAt: new Date().toISOString() };
  await putItem({
    ...keys.userReply(sid, input.threadId, reply.id, reply.createdAt),
    ...reply,
    threadId: input.threadId,
    ttl: ttl(),
  } as Item);
  return reply;
}

export async function setConversationStatus(sid: string, memberId: string, status: ConversationStatus) {
  await ensureUser(sid);
  const { PK, SK } = keys.userConv(sid, memberId);
  const existing = await getItem(PK, SK);
  await putItem({ PK, SK, memberId, circleId: existing?.circleId ?? "", status, ttl: ttl() } as Item);
}

/** Demande de contact : sans effet si une conversation existe déjà. */
export async function requestContact(sid: string, memberId: string) {
  await ensureUser(sid);
  const { PK, SK } = keys.userConv(sid, memberId);
  try {
    await putItem({ PK, SK, memberId, circleId: "", status: "pending-out", ttl: ttl() } as Item, { ifNotExists: true });
  } catch (e) {
    if ((e as { name?: string }).name !== "ConditionalCheckFailedException") throw e;
  }
}

export async function createMessage(sid: string, memberId: string, text: string, id?: string): Promise<ChatMessage> {
  await ensureUser(sid);
  const msg: ChatMessage = { id: id ?? randomUUID(), from: "me", text, createdAt: new Date().toISOString() };
  await putItem({ ...keys.userMsg(sid, memberId, msg.id, msg.createdAt), ...msg, memberId, ttl: ttl() } as Item);
  return msg;
}

/** Suppression d'un message de conversation (outil de démonstration). */
export async function deleteMessage(sid: string, memberId: string, messageId: string) {
  const items = await queryPartition(keys.user(sid), `MSG#${memberId}#`);
  const target = items.find((i) => i.id === messageId);
  if (target) await deleteItem(target.PK, target.SK);
}

/**
 * Démo : masque un fil ou une réponse, et efface ceux publiés par la session.
 * Le contenu partagé (seed) n'est pas détruit, seulement masqué pour cet utilisateur.
 */
export async function hideContent(sid: string, contentId: string, threadId?: string) {
  await ensureUser(sid);
  const { PK, SK } = keys.userMeta(sid);
  const meta = await getItem(PK, SK);
  const hidden = Array.isArray(meta?.hiddenIds) ? (meta.hiddenIds as string[]) : [];
  if (!hidden.includes(contentId)) {
    await updateItem(PK, SK, { hiddenIds: [...hidden, contentId], ttl: ttl() });
  }

  const own = keys.userThread(sid, contentId);
  const thread = await getItem(own.PK, own.SK);
  if (thread) {
    const replies = await queryPartition(keys.user(sid), `REPLY#${contentId}#`);
    await batchDelete([{ PK: own.PK, SK: own.SK }, ...replies.map((r) => ({ PK: r.PK, SK: r.SK }))]);
    return;
  }

  const prefix = threadId ? `REPLY#${threadId}#` : "REPLY#";
  const reply = (await queryPartition(keys.user(sid), prefix)).find((i) => i.id === contentId);
  if (reply) await deleteItem(reply.PK, reply.SK);
}

export async function createReport(sid: string, targetId: string, reason: string) {
  await ensureUser(sid);
  await putItem({
    ...keys.userReport(sid, targetId),
    targetId,
    reason,
    createdAt: new Date().toISOString(),
    ttl: ttl(),
  } as Item);
}

/** Export complet des données de l'utilisateur (droit d'accès / de portabilité). */
export async function exportUser(sid: string) {
  const items = await queryPartition(keys.user(sid));
  const state = buildState(items);
  const reports = items
    .filter((i) => i.SK.startsWith("REPORT#"))
    .map((i) => ({ contenu: i.targetId, motif: i.reason, date: i.createdAt }));
  return {
    exportedAt: new Date().toISOString(),
    profil: state.profile,
    reponsesAuQuestionnaire: state.answers,
    cerclesRejoints: state.joined,
    consentement: state.consent,
    preferences: state.preferences,
    messagesPublies: state.userThreads.map((t) => ({
      cercle: t.circleId,
      type: t.kind,
      titre: t.title,
      texte: t.body,
      date: t.createdAt,
    })),
    reponsesPubliees: Object.entries(state.userReplies).flatMap(([fil, list]) =>
      list.map((r) => ({ fil, texte: r.body, date: r.createdAt })),
    ),
    conversationsPrivees: Object.values(state.conversations).map((c) => ({
      avec: c.memberId,
      statut: c.status,
      messages: c.messages.map((m) => ({ de: m.from, texte: m.text, date: m.createdAt })),
    })),
    signalements: reports,
  };
}

/** Supprime toutes les données de l'utilisateur, puis recrée une fiche vierge (droit à l'effacement). */
export async function deleteUserData(sid: string) {
  const items = await queryPartition(keys.user(sid));
  if (items.length) await batchDelete(items.map((i) => ({ PK: i.PK, SK: i.SK })));
  await initUser(sid, "empty");
}
