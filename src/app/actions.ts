"use server";

/**
 * Server Actions : toutes les écritures passent par ici, après validation des entrées.
 * L'identité vient uniquement du cookie de session (jamais d'un paramètre envoyé par le navigateur).
 */
import { loadCatalog } from "@/lib/db/catalog";
import { saveModerationDecision } from "@/lib/db/moderation";
import {
  createMessage,
  createReply,
  createReport,
  createThread,
  deleteUserData,
  exportUser,
  loadUser,
  requestContact,
  saveAnswers,
  saveConsent,
  saveJoined,
  saveProfile,
  setConversationStatus,
} from "@/lib/db/user";
import { getSessionId } from "@/lib/session";
import type { Answers } from "@/lib/questionnaire";
import type { ConversationStatus, Reply, Thread, ThreadKind, UserProfile, UserState } from "@/lib/types";

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
  return createThread(sid, {
    id: id(input.id),
    circleId,
    kind: input.kind,
    title: text(input.title, 120, "titre", 1),
    body: text(input.body, 4000, "message", 1),
  });
}

export async function publishReplyAction(input: { id: string; threadId: string; body: string }): Promise<Reply> {
  const sid = await getSessionId();
  return createReply(sid, {
    id: id(input.id),
    threadId: id(input.threadId, "fil"),
    body: text(input.body, 4000, "réponse", 1),
  });
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
  return createMessage(sid, await memberId(member), text(body, 4000, "message", 1), id(messageId));
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
