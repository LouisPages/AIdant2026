"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  deleteContentAction,
  deleteMessageAction,
  deleteMyDataAction,
  publishReplyAction,
  publishThreadAction,
  reportAction,
  requestContactAction,
  saveAnswersAction,
  saveConsentAction,
  saveJoinedAction,
  savePreferencesAction,
  saveProfileAction,
  sendMessageAction,
  setConversationStatusAction,
} from "@/app/actions";
import type { Answers } from "@/lib/questionnaire";
import type {
  AvatarKey,
  Bootstrap,
  Catalog,
  Circle,
  Conversation,
  ConversationStatus,
  Member,
  Reply,
  Thread,
  ThreadKind,
  UserPreferences,
  UserProfile,
} from "@/lib/types";

export type { UserPreferences, UserProfile };

type NewPost = { kind: ThreadKind; title: string; body: string };

type AppState = {
  /** Contenu partagé lu dans DynamoDB (cercles, fils, ressources, questionnaire…). */
  catalog: Catalog;
  getCircle: (id: string) => Circle | undefined;
  /** Fil du contenu partagé ou publié par l'utilisateur. */
  getThread: (id: string) => Thread | undefined;
  answers: Answers;
  setPart: (partId: string, values: string[]) => void;
  clearAnswers: () => void;
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  joined: string[];
  setJoined: (ids: string[]) => void;
  leaveCircle: (id: string) => void;
  userThreads: Thread[];
  addThread: (circleId: string, post: NewPost) => string;
  userReplies: Record<string, Reply[]>;
  addReply: (threadId: string, body: string) => void;
  conversations: Record<string, Conversation>;
  statuses: Record<string, ConversationStatus>;
  setStatus: (memberId: string, status: ConversationStatus) => void;
  requestContact: (memberId: string) => void;
  sendChat: (memberId: string, text: string) => void;
  /** Démo : supprime un message d'une conversation. */
  deleteChat: (memberId: string, messageId: string) => void;
  /** Démo : masque un fil ou une réponse (les siens et ceux des autres). */
  deletePost: (contentId: string, threadId?: string) => void;
  reported: string[];
  report: (id: string, reason: string) => void;
  /** Préférences de l'aidant : appliquées partout (demandes de discussion, Solutions, fil des Cercles). */
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  /** Supprime toutes les données de l'utilisateur en base et repart d'un profil vierge. */
  resetAll: () => Promise<void>;
  toast: string | null;
  showToast: (message: string) => void;
};

const Ctx = createContext<AppState | null>(null);

const newId = (prefix: string) => {
  const raw = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}${raw}`;
};

const SAVE_ERROR = "L'enregistrement n'a pas abouti. Vos modifications restent visibles, réessayez dans un instant.";

export function AppStateProvider({ initial, children }: { initial: Bootstrap; children: ReactNode }) {
  const { catalog, user } = initial;

  const [answers, setAnswers] = useState<Answers>(user.answers);
  const [profile, setProfile] = useState<UserProfile>(user.profile);
  const [joined, setJoinedState] = useState<string[]>(user.joined);
  const [userThreads, setUserThreads] = useState<Thread[]>(user.userThreads);
  const [userReplies, setUserReplies] = useState<Record<string, Reply[]>>(user.userReplies);
  const [conversations, setConversations] = useState<Record<string, Conversation>>(user.conversations);
  const [reported, setReported] = useState<string[]>(user.reported);
  const [hiddenIds, setHiddenIds] = useState<string[]>(user.hiddenIds ?? []);
  const [consent, setConsentState] = useState(user.consent);
  const [preferences, setPreferences] = useState<UserPreferences>(user.preferences);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  /** Lance une écriture en base sans bloquer l'interface ; signale l'échec par un message. */
  const persist = useCallback(
    (work: Promise<unknown>) => {
      work.catch(() => showToast(SAVE_ERROR));
    },
    [showToast],
  );

  /** Regroupe les écritures rapprochées (frappe au clavier, choix successifs) en une seule. */
  const persistSoon = useCallback(
    (key: string, work: () => Promise<unknown>, delay = 450) => {
      clearTimeout(saveTimers.current[key]);
      saveTimers.current[key] = setTimeout(() => persist(work()), delay);
    },
    [persist],
  );

  const answersRef = useRef(answers);
  const profileRef = useRef(profile);
  const preferencesRef = useRef(preferences);

  const circleById = useMemo(() => new Map(catalog.circles.map((c) => [c.id, c])), [catalog.circles]);

  const value = useMemo<AppState>(() => {
    const hidden = new Set(hiddenIds);
    const visibleUserThreads = userThreads.filter((t) => !hidden.has(t.id));
    const visibleUserReplies = Object.fromEntries(
      Object.entries(userReplies).map(([tid, list]) => [tid, list.filter((r) => !hidden.has(r.id))]),
    );
    const visibleCatalog: Catalog = {
      ...catalog,
      threads: catalog.threads
        .filter((t) => !hidden.has(t.id))
        .map((t) => (hidden.size ? { ...t, replies: t.replies.filter((r) => !hidden.has(r.id)) } : t)),
    };

    // Sans demandes de discussion, celles déjà reçues sont masquées (elles reviennent si l'aidant change d'avis).
    const statuses = Object.fromEntries(
      Object.values(conversations)
        .filter((c) => preferences.contactRequests || c.status !== "pending-in")
        .map((c) => [c.memberId, c.status]),
    ) as Record<string, ConversationStatus>;

    const saveAnswers = (next: Answers) => {
      answersRef.current = next;
      persistSoon("answers", () => saveAnswersAction(answersRef.current));
    };

    return {
      catalog: visibleCatalog,
      getCircle: (id) => circleById.get(id),
      getThread: (id) =>
        hidden.has(id)
          ? undefined
          : (visibleUserThreads.find((t) => t.id === id) ?? visibleCatalog.threads.find((t) => t.id === id)),

      answers,
      setPart: (partId, values) => {
        const next = { ...answersRef.current, [partId]: values };
        setAnswers(next);
        saveAnswers(next);
      },
      clearAnswers: () => {
        setAnswers({});
        saveAnswers({});
      },

      profile,
      updateProfile: (patch) => {
        const next = { ...profileRef.current, ...patch };
        profileRef.current = next;
        setProfile(next);
        // Un pseudo vide n'est jamais enregistré (l'écran empêche de continuer tant qu'il est vide).
        persistSoon("profile", () =>
          profileRef.current.pseudo.trim() ? saveProfileAction(profileRef.current) : Promise.resolve(),
        );
      },

      joined,
      setJoined: (ids) => {
        setJoinedState(ids);
        persist(saveJoinedAction(ids));
      },
      leaveCircle: (id) => {
        const next = joined.filter((x) => x !== id);
        setJoinedState(next);
        persist(saveJoinedAction(next));
      },

      userThreads: visibleUserThreads,
      addThread: (circleId, post) => {
        const id = newId("u");
        const thread: Thread = {
          id,
          circleId,
          authorId: "me",
          kind: post.kind,
          title: post.title,
          body: post.body,
          createdAt: new Date().toISOString(),
          replies: [],
        };
        setUserThreads((t) => [thread, ...t]);
        persist(publishThreadAction({ id, circleId, kind: post.kind, title: post.title, body: post.body }));
        return id;
      },

      userReplies: visibleUserReplies,
      addReply: (threadId, body) => {
        const id = newId("ur");
        const reply: Reply = { id, authorId: "me", body, createdAt: new Date().toISOString() };
        setUserReplies((r) => ({ ...r, [threadId]: [...(r[threadId] ?? []), reply] }));
        persist(publishReplyAction({ id, threadId, body }));
      },

      conversations,
      statuses,
      setStatus: (memberId, status) => {
        setConversations((c) => ({
          ...c,
          [memberId]: { memberId, circleId: c[memberId]?.circleId ?? "", messages: c[memberId]?.messages ?? [], status },
        }));
        persist(setConversationStatusAction(memberId, status));
      },
      requestContact: (memberId) => {
        // Écrire à quelqu'un qui nous avait sollicité (demande masquée) revient à accepter son échange.
        if (conversations[memberId]?.status === "pending-in") {
          setConversations((c) => ({ ...c, [memberId]: { ...c[memberId], status: "accepted" } }));
          persist(setConversationStatusAction(memberId, "accepted"));
          return;
        }
        if (conversations[memberId]) return;
        setConversations((c) =>
          c[memberId] ? c : { ...c, [memberId]: { memberId, circleId: "", status: "pending-out", messages: [] } },
        );
        persist(requestContactAction(memberId));
      },
      sendChat: (memberId, text) => {
        const id = newId("c");
        setConversations((c) => {
          const conv = c[memberId] ?? { memberId, circleId: "", status: "accepted" as const, messages: [] };
          return {
            ...c,
            [memberId]: {
              ...conv,
              messages: [...conv.messages, { id, from: "me", text, createdAt: new Date().toISOString() }],
            },
          };
        });
        persist(sendMessageAction(memberId, text, id));
      },
      deleteChat: (memberId, messageId) => {
        setConversations((c) => {
          const conv = c[memberId];
          if (!conv) return c;
          return { ...c, [memberId]: { ...conv, messages: conv.messages.filter((m) => m.id !== messageId) } };
        });
        persist(deleteMessageAction(memberId, messageId));
      },
      deletePost: (contentId, threadId) => {
        setHiddenIds((h) => (h.includes(contentId) ? h : [...h, contentId]));
        setUserThreads((t) => t.filter((x) => x.id !== contentId));
        setUserReplies((r) => {
          const next = { ...r };
          if (threadId) next[threadId] = (next[threadId] ?? []).filter((x) => x.id !== contentId);
          else delete next[contentId];
          return next;
        });
        persist(deleteContentAction(contentId, threadId));
      },

      reported,
      report: (id, reason) => {
        setReported((r) => (r.includes(id) ? r : [...r, id]));
        persist(reportAction(id, reason));
      },

      preferences,
      updatePreferences: (patch) => {
        const next = { ...preferencesRef.current, ...patch };
        preferencesRef.current = next;
        setPreferences(next);
        persistSoon("preferences", () => savePreferencesAction(preferencesRef.current));
      },

      consent,
      setConsent: (v) => {
        setConsentState(v);
        persist(saveConsentAction(v));
      },

      resetAll: async () => {
        Object.values(saveTimers.current).forEach(clearTimeout);
        const fresh = await deleteMyDataAction();
        answersRef.current = fresh.answers;
        profileRef.current = fresh.profile;
        setAnswers(fresh.answers);
        setProfile(fresh.profile);
        setJoinedState(fresh.joined);
        setUserThreads(fresh.userThreads);
        setUserReplies(fresh.userReplies);
        setConversations(fresh.conversations);
        setReported(fresh.reported);
        setHiddenIds(fresh.hiddenIds);
        setConsentState(fresh.consent);
        preferencesRef.current = fresh.preferences;
        setPreferences(fresh.preferences);
      },

      toast,
      showToast,
    };
  }, [
    catalog,
    circleById,
    answers,
    profile,
    joined,
    userThreads,
    userReplies,
    conversations,
    reported,
    hiddenIds,
    consent,
    preferences,
    toast,
    showToast,
    persist,
    persistSoon,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState doit être utilisé dans AppStateProvider");
  return ctx;
}

const unknownMember = (id: string): Member => ({ id, pseudo: "Un membre", avatar: "leaf", tone: "sky" });

/** Renvoie un membre ; « me » reflète le profil modifiable de l'utilisateur. */
export function useGetMember() {
  const { profile, catalog } = useAppState();
  return useCallback(
    (id: string): Member => {
      if (id === "me") return { id: "me", pseudo: profile.pseudo, avatar: profile.avatar as AvatarKey, tone: "teal", bio: profile.bio };
      return catalog.members[id] ?? unknownMember(id);
    },
    [profile, catalog.members],
  );
}
