"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { demoAnswers, type Answers } from "@/data/questionnaire";
import { members } from "@/data/members";
import { conversations } from "@/data/conversations";
import type { AvatarKey, ChatMessage, ConversationStatus, Member, Reply, Thread, ThreadKind } from "@/data/types";

export type UserProfile = { pseudo: string; avatar: AvatarKey; bio: string };

type NewPost = { kind: ThreadKind; title: string; body: string };

type AppState = {
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
  statuses: Record<string, ConversationStatus>;
  setStatus: (memberId: string, status: ConversationStatus) => void;
  requestContact: (memberId: string) => void;
  chat: Record<string, ChatMessage[]>;
  sendChat: (memberId: string, text: string) => void;
  reported: string[];
  report: (id: string) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  resetAll: () => void;
  toast: string | null;
  showToast: (message: string) => void;
};

const emptyProfile: UserProfile = { pseudo: "Camomille", avatar: "flower", bio: "" };

// Profil de démo (accès direct à l'application, sans passer par la personnalisation).
const defaultProfile: UserProfile = {
  ...emptyProfile,
  bio: "J'accompagne mon conjoint depuis quelques années, concerné par la maladie de Parkinson. La fatigue pèse en ce moment. Je viens ici chercher un peu d'écoute et des astuces du quotidien.",
};

const defaultStatuses = () =>
  Object.fromEntries(conversations.map((c) => [c.memberId, c.status])) as Record<string, ConversationStatus>;

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Answers>(demoAnswers);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [joined, setJoinedState] = useState<string[]>(["c-conjoints", "c-solos"]);
  const [userThreads, setUserThreads] = useState<Thread[]>([]);
  const [userReplies, setUserReplies] = useState<Record<string, Reply[]>>({});
  const [statuses, setStatuses] = useState<Record<string, ConversationStatus>>(defaultStatuses);
  const [chat, setChat] = useState<Record<string, ChatMessage[]>>({});
  const [reported, setReported] = useState<string[]>([]);
  const [consent, setConsent] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      answers,
      setPart: (partId, values) => setAnswers((a) => ({ ...a, [partId]: values })),
      clearAnswers: () => setAnswers({}),
      profile,
      updateProfile: (patch) => setProfile((p) => ({ ...p, ...patch })),
      joined,
      setJoined: (ids) => setJoinedState(ids),
      leaveCircle: (id) => setJoinedState((j) => j.filter((x) => x !== id)),
      userThreads,
      addThread: (circleId, post) => {
        const id = `u${++counter.current}`;
        setUserThreads((t) => [
          { id, circleId, authorId: "me", kind: post.kind, title: post.title, body: post.body, time: "À l'instant", replies: [] },
          ...t,
        ]);
        return id;
      },
      userReplies,
      addReply: (threadId, body) =>
        setUserReplies((r) => ({
          ...r,
          [threadId]: [
            ...(r[threadId] ?? []),
            { id: `ur${++counter.current}`, authorId: "me", body, time: "À l'instant" },
          ],
        })),
      statuses,
      setStatus: (memberId, status) => setStatuses((s) => ({ ...s, [memberId]: status })),
      requestContact: (memberId) =>
        setStatuses((s) => (s[memberId] ? s : { ...s, [memberId]: "pending-out" })),
      chat,
      sendChat: (memberId, text) =>
        setChat((c) => ({
          ...c,
          [memberId]: [
            ...(c[memberId] ?? []),
            { id: `c${++counter.current}`, from: "me", text, time: "À l'instant" },
          ],
        })),
      reported,
      report: (id) => setReported((r) => (r.includes(id) ? r : [...r, id])),
      consent,
      setConsent,
      resetAll: () => {
        setAnswers({});
        setProfile(emptyProfile);
        setJoinedState([]);
        setUserThreads([]);
        setUserReplies({});
        setStatuses(defaultStatuses());
        setChat({});
        setReported([]);
        setConsent(true);
      },
      toast,
      showToast,
    }),
    [answers, profile, joined, userThreads, userReplies, statuses, chat, reported, consent, toast, showToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState doit être utilisé dans AppStateProvider");
  return ctx;
}

/** Renvoie un membre ; « me » reflète le profil modifiable de l'utilisateur. */
export function useGetMember() {
  const { profile } = useAppState();
  return useCallback(
    (id: string): Member => {
      if (id === "me") return { id: "me", pseudo: profile.pseudo, avatar: profile.avatar, tone: "teal", bio: profile.bio };
      return members[id] ?? members.nenuphar;
    },
    [profile],
  );
}
