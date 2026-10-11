"use server";

/**
 * Server Actions : toutes les écritures passent par ici, après validation des entrées.
 * L'identité vient uniquement du cookie de session (jamais d'un paramètre envoyé par le navigateur).
 */
import { loadCatalog } from "@/lib/db/catalog";
import { getItem, queryPartition } from "@/lib/db/client";
import { keys } from "@/lib/db/keys";
import { createModerationCase, saveModerationDecision } from "@/lib/db/moderation";
import { contestCase, signalCase } from "@/lib/moderation/cases";
import { moderate } from "@/lib/moderation/moderate";
import type { ModerationContext, ModerationOutcome } from "@/lib/moderation/types";
import {
  createMessage,
  createReply,
  createReport,
  createThread,
  deleteMessage,
  hideContent,
  deleteUserData,
  exportUser,
  loadUser,
  requestContact,
  saveAnswers,
  saveConsent,
  saveJoined,
  savePreferences,
  saveProfile,
  setConversationStatus,
} from "@/lib/db/user";
import { getSessionId } from "@/lib/session";
import type { Answers } from "@/lib/questionnaire";
import { PREFERENCE_KEYS } from "@/lib/preferences";
import type {
  ConversationStatus,
  Reply,
  Thread,
  ThreadKind,
  UserPreferences,
  UserProfile,
  UserState,
} from "@/lib/types";

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const AVATARS = ["leaf", "sun", "feather", "moon", "waves", "mountain", "flower", "sprout"];
const KINDS: ThreadKind[] = ["question", "astuce", "partage"];
const STATUSES: ConversationStatus[] = ["accepted", "pending-in", "pending-out"];

function fail(message: string): never {
  throw new Error(message);
}

const id = (value: unknown, what = "identifiant"): string =>
  typeof value === "string" && ID.test(value) ? value : fail(`Valeur invalide : ${what}`);

const text = (value: unknown, max: number, what: string, min = 0): string => {
  if (typeof value !== "string") fail(`Valeur invalide : ${what}`);
  const v = value.trim();
  if (v.length < min || v.length > max) fail(`Valeur invalide : ${what}`);
  return v;
};

function cleanAnswers(value: unknown): Answers {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail("Réponses invalides");
  const out: Answers = {};
  for (const [key, list] of Object.entries(value)) {
    if (!/^[a-z_]{1,40}$/.test(key) || !Array.isArray(list) || list.length > 30) fail("Réponses invalides");
    out[key] = list.map((v) => text(v, 120, "réponse"));
  }
  return out;
}

/**
 * Modération côté serveur : l'interface vérifie avant d'envoyer, mais seul ce contrôle fait foi.
 * Le verdict est en cache : un message déjà vérifié par l'interface ne déclenche pas un second appel.
 */
async function enforceModeration(text: string, context?: ModerationContext): Promise<ModerationOutcome> {
  const outcome = await moderate(text, context);
  if (outcome.verdict.decision === "block") fail("Message refusé par la modération");
  return outcome;
}

/** Contexte d'une réponse : le fil auquel on répond, lu en base (jamais fourni par le navigateur). */
async function replyContext(sid: string, threadId: string): Promise<{ context: ModerationContext; circleId: string }> {
  const { threads } = await loadCatalog();
  const shared = threads.find((t) => t.id === threadId);
  const own = shared ? undefined : await getItem(keys.userThread(sid, threadId).PK, keys.userThread(sid, threadId).SK);
  const parent = shared ?? (own as { title?: string; body?: string; circleId?: string } | undefined);
  const text = parent ? `${parent.title ?? ""}. ${parent.body ?? ""}`.trim() : "";
  return { context: text ? { parent: text } : {}, circleId: String(parent?.circleId ?? "") };
}

/** Contexte d'un message privé : les deux derniers échanges, lus en base. */
async function messageContext(sid: string, member: string): Promise<ModerationContext> {
  const items = await queryPartition(keys.user(sid), `MSG#${member}#`);
  const previous = items
    .sort((a, b) => String(a.SK).localeCompare(String(b.SK)))
    .slice(-2)
    .map((m) => `${m.from === "me" ? "Moi" : "L'autre"} : ${String(m.text ?? "")}`);
  return previous.length ? { previous } : {};
}

/** Un message de détresse est publié ; l'équipe humaine est alertée, sans que l'auteur voie autre chose que l'aide proposée. */
async function flagDistress(sid: string, outcome: ModerationOutcome, circleId: string, message: string) {
  if (!outcome.signal) return;
  try {
    const meta = await getItem(keys.userMeta(sid).PK, keys.userMeta(sid).SK);
    const profile = meta?.profile as UserProfile | undefined;
    await createModerationCase(sid, signalCase({ circleId, message, signal: outcome.signal }), {
      pseudo: profile?.pseudo || "Aidant anonyme",
      avatar: profile?.avatar,
    });
  } catch {
    // Le message est déjà publié : un échec d'alerte ne doit pas le faire échouer.
  }
}

async function memberId(value: unknown) {
  const mid = id(value, "membre");
  const { members } = await loadCatalog();
  if (!members[mid]) fail("Membre inconnu");
  return mid;
}

export async function saveProfileAction(profile: UserProfile): Promise<void> {
  const sid = await getSessionId();
  if (!AVATARS.includes(profile?.avatar)) fail("Avatar invalide");
  await saveProfile(sid, {
    pseudo: text(profile.pseudo, 24, "pseudo", 1),
    avatar: profile.avatar,
    bio: text(profile.bio ?? "", 280, "description"),
  });
}

export async function saveAnswersAction(answers: Answers): Promise<void> {
  await saveAnswers(await getSessionId(), cleanAnswers(answers));
}

export async function saveJoinedAction(circleIds: string[]): Promise<void> {
  const sid = await getSessionId();
  if (!Array.isArray(circleIds) || circleIds.length > 200) fail("Cercles invalides");
  const { circles } = await loadCatalog();
  const known = new Set(circles.map((c) => c.id));
  const ids = [...new Set(circleIds.map((c) => id(c, "cercle")))].filter((c) => known.has(c));
  await saveJoined(sid, ids);
}

export async function saveConsentAction(consent: boolean): Promise<void> {
  await saveConsent(await getSessionId(), consent === true);
}

export async function savePreferencesAction(preferences: UserPreferences): Promise<void> {
  const sid = await getSessionId();
  if (typeof preferences !== "object" || preferences === null) fail("Préférences invalides");
  const clean = {} as UserPreferences;
  for (const key of PREFERENCE_KEYS) {
    if (typeof preferences[key] !== "boolean") fail("Préférences invalides");
    clean[key] = preferences[key];
  }
  await savePreferences(sid, clean);
}

export async function publishThreadAction(input: {
  id: string;
  circleId: string;
  kind: ThreadKind;
  title: string;
  body: string;
}): Promise<Thread> {
  const sid = await getSessionId();
  const { circles } = await loadCatalog();
  const circleId = id(input.circleId, "cercle");
  if (!circles.some((c) => c.id === circleId)) fail("Cercle inconnu");
  if (!KINDS.includes(input.kind)) fail("Type de message invalide");
  const title = text(input.title, 120, "titre", 1);
  const body = text(input.body, 4000, "message", 1);
  const outcome = await enforceModeration(`${title} ${body}`);
  const thread = await createThread(sid, { id: id(input.id), circleId, kind: input.kind, title, body });
  // Le titre par défaut reprend le début du message : on ne le répète pas dans le cas transmis à l'équipe.
  const repeated = body.toLowerCase().includes(title.replace(/\s*\?$/, "").toLowerCase());
  await flagDistress(sid, outcome, circleId, repeated ? body : `${title}. ${body}`);
  return thread;
}

export async function publishReplyAction(input: { id: string; threadId: string; body: string }): Promise<Reply> {
  const sid = await getSessionId();
  const threadId = id(input.threadId, "fil");
  const body = text(input.body, 4000, "réponse", 1);
  const { context, circleId } = await replyContext(sid, threadId);
  const outcome = await enforceModeration(body, context);
  const reply = await createReply(sid, { id: id(input.id), threadId, body });
  await flagDistress(sid, outcome, circleId, body);
  return reply;
}

/**
 * Droit de contestation : l'auteur d'un message refusé demande une relecture humaine. Seuls les textes réellement
 * refusés sont acceptés ; le contexte (fil, conversation) est relu en base pour retrouver le même verdict.
 */
export async function contestModerationAction(input: {
  text: string;
  circleId?: string;
  threadId?: string;
  member?: string;
}): Promise<void> {
  const sid = await getSessionId();
  const message = text(input.text, 4000, "message", 1);
  const context = input.threadId
    ? (await replyContext(sid, id(input.threadId, "fil"))).context
    : input.member
      ? await messageContext(sid, await memberId(input.member))
      : undefined;
  const outcome = await moderate(message, context);
  if (outcome.verdict.decision !== "block") fail("Ce message n'a pas été refusé");
  const meta = await getItem(keys.userMeta(sid).PK, keys.userMeta(sid).SK);
  const profile = meta?.profile as UserProfile | undefined;
  await createModerationCase(
    sid,
    contestCase({
      circleId: input.circleId ? id(input.circleId, "cercle") : "",
      message,
      category: outcome.verdict.category,
      severity: outcome.verdict.severity,
      rationale: outcome.rationale,
    }),
    { pseudo: profile?.pseudo || "Aidant anonyme", avatar: profile?.avatar },
  );
}
export async function setConversationStatusAction(member: string, status: ConversationStatus): Promise<void> {
  const sid = await getSessionId();
  if (!STATUSES.includes(status)) fail("Statut invalide");
  await setConversationStatus(sid, await memberId(member), status);
}

export async function requestContactAction(member: string): Promise<void> {
  const sid = await getSessionId();
  await requestContact(sid, await memberId(member));
}

export async function sendMessageAction(member: string, body: string, messageId: string) {
  const sid = await getSessionId();
  const to = await memberId(member);
  const message = text(body, 4000, "message", 1);
  const outcome = await enforceModeration(message, await messageContext(sid, to));
  const saved = await createMessage(sid, to, message, id(messageId));
  await flagDistress(sid, outcome, "", message);
  return saved;
}

/** Démo uniquement : supprime un message d'une conversation de la session courante. */
export async function deleteMessageAction(member: string, messageId: string): Promise<void> {
  const sid = await getSessionId();
  await deleteMessage(sid, await memberId(member), id(messageId, "message"));
}

/** Démo uniquement : masque un fil ou une réponse, et efface ceux de la session. */
export async function deleteContentAction(contentId: string, threadId?: string): Promise<void> {
  const sid = await getSessionId();
  await hideContent(sid, id(contentId, "contenu"), threadId ? id(threadId, "fil") : undefined);
}

export async function reportAction(targetId: string, reason: string): Promise<void> {
  const sid = await getSessionId();
  await createReport(sid, id(targetId, "contenu"), text(reason, 60, "motif", 1));
}

/** Droit d'accès et de portabilité : toutes les données de la session. */
export async function exportMyDataAction() {
  return exportUser(await getSessionId());
}

/** Droit à l'effacement : supprime tout, renvoie l'état vierge. */
export async function deleteMyDataAction(): Promise<UserState> {
  const sid = await getSessionId();
  await deleteUserData(sid);
  return loadUser(sid);
}

/** Back-office : enregistre une décision de modération tracée. */
export async function decideModerationAction(caseId: string, actionId: string, label: string) {
  return saveModerationDecision(id(caseId, "cas"), {
    actionId: id(actionId, "action"),
    label: text(label, 120, "libellé", 1),
  });
}
