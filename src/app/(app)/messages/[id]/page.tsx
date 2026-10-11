"use client";

import { ChevronLeft, Hourglass, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DemoDeleteButton } from "@/components/demo-delete";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useAppState, useGetMember } from "@/context/app-state";
import { TimeText } from "@/components/time-text";
import { cn } from "@/lib/cn";
import { ModerationNotice, useModeration } from "@/components/moderation-notice";

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const { statuses, conversations, setStatus, sendChat, deleteChat, preferences, updatePreferences, showToast } = useAppState();
  const getMember = useGetMember();
  const member = getMember(id);
  const [text, setText] = useState("");

  const status = statuses[id];
  // Demande reçue alors que l'aidant a désactivé les demandes de discussion : elle reste masquée.
  const hiddenRequest = conversations[id]?.status === "pending-in" && !preferences.contactRequests;
  const conversationMessages = conversations[id]?.messages;
  const messages = useMemo(() => (hiddenRequest ? [] : (conversationMessages ?? [])), [hiddenRequest, conversationMessages]);
  const visibleMessages = useMemo(() => [...messages].reverse(), [messages]);
  // Les deux derniers échanges sont transmis aux juges pour lire la réponse dans son contexte.
  const scope = useMemo(
    () => ({
      member: id,
      context: messages.length
        ? { previous: messages.slice(-2).map((m) => `${m.from === "me" ? "Moi" : "L'autre"} : ${m.text}`) }
        : undefined,
    }),
    [id, messages],
  );
  const { checking, refusal, contested, check, clear, contest } = useModeration(scope);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    if (!(await check(t))) return;
    sendChat(id, t);
    setText("");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-30 bg-bg">
        <header className="flex items-center gap-2 px-3 pb-3 pt-5">
          <Link
            href="/messages"
            aria-label="Retour"
            className="pressable flex size-11 items-center justify-center rounded-full text-ink-2"
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </Link>
          <Avatar avatar={member.avatar} tone={member.tone} />
          <div className="min-w-0">
            <p className="truncate text-h3 font-semibold">{member.pseudo}</p>
            <p className="text-label text-ink-2">Rencontré dans un cercle</p>
          </div>
        </header>
        {status === "accepted" && refusal && (
          <div className="px-5 pb-3">
            <ModerationNotice refusal={refusal} contested={contested} onContest={contest} />
          </div>
        )}
      </div>

      <main className="flex-1 space-y-3 px-5 pb-4 pt-2">
        {hiddenRequest && (
          <div className="rounded-card bg-sky-soft p-4">
            <h3 className="text-navy">Les demandes de discussion sont désactivées</h3>
            <p className="mt-1 text-small text-ink-2">
              Cette demande est masquée, {member.pseudo} n'en sait rien. Vous pouvez la retrouver en réactivant les demandes.
            </p>
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => {
                  updatePreferences({ contactRequests: true });
                  showToast("Les demandes de discussion sont activées");
                }}
              >
                Réactiver les demandes
              </Button>
              <Button variant="secondary" href="/messages">
                Retour aux messages
              </Button>
            </div>
          </div>
        )}

        {status === "pending-in" && (
          <div className="rounded-card bg-sky-soft p-4">
            <h3 className="text-navy">{member.pseudo} souhaite échanger avec vous</h3>
            <p className="mt-1 text-small text-ink-2">Vous n'êtes pas obligé(e) de répondre. Vous pouvez refuser, sans explication.</p>
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => {
                  setStatus(id, "accepted");
                  showToast("Vous pouvez maintenant échanger");
                }}
              >
                Accepter
              </Button>
              <Button variant="secondary" href="/messages">
                Pas maintenant
              </Button>
            </div>
          </div>
        )}

        {status === "pending-out" && (
          <div className="flex gap-3 rounded-card bg-teal-soft p-4">
            <Hourglass size={24} strokeWidth={1.5} className="shrink-0 text-teal-dark" />
            <div>
              <h3 className="text-teal-dark">Demande envoyée</h3>
              <p className="mt-1 text-small text-ink-2">
                {member.pseudo} verra votre demande et pourra l'accepter quand elle ou il le souhaite.
              </p>
            </div>
          </div>
        )}

        {visibleMessages.map((m) => (
          <div key={m.id} className={cn("animate-screen flex flex-col", m.from === "me" ? "items-end" : "items-start")}>
            <div className={cn("flex max-w-full items-center gap-1", m.from === "me" && "flex-row-reverse")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-card px-4 py-3 text-body",
                  m.from === "me" ? "bg-teal text-white" : "border border-line bg-surface text-ink shadow-card",
                )}
              >
                {m.text}
              </div>
              <DemoDeleteButton
                onClick={() => {
                  deleteChat(id, m.id);
                  showToast("Message supprimé");
                }}
              />
            </div>
            <TimeText value={m.createdAt} variant="chat" className="mt-1 text-label text-ink-2" />
          </div>
        ))}
      </main>

      {status === "accepted" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="sticky bottom-0 z-30 flex items-end gap-2 bg-bg px-5 pb-6 pt-3"
        >
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              clear();
            }}
            placeholder="Écrire un message…"
            rows={1}
            aria-label="Votre message"
            className="!min-h-12 max-h-32 py-3"
          />
          <button
            type="submit"
            disabled={!text.trim() || checking}
            aria-label="Envoyer"
            className="pressable flex size-12 shrink-0 items-center justify-center rounded-control bg-teal text-white hover:bg-teal-dark disabled:bg-line disabled:text-mute"
          >
            <Send size={20} strokeWidth={1.5} />
          </button>
        </form>
      )}
    </div>
  );
}
