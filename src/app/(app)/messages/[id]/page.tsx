"use client";

import { ChevronLeft, Hourglass, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useAppState, useGetMember } from "@/context/app-state";
import { TimeText } from "@/components/time-text";
import { cn } from "@/lib/cn";
import { moderateMessage } from "@/lib/services";

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const { statuses, conversations, setStatus, sendChat, showToast } = useAppState();
  const getMember = useGetMember();
  const member = getMember(id);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const status = statuses[id];
  const messages = conversations[id]?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    await moderateMessage(t);
    sendChat(id, t);
    setText("");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-bg px-3 pb-3 pt-5">
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

      <main className="flex-1 space-y-3 px-5 pb-4 pt-2">
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

        {messages.map((m) => (
          <div key={m.id} className={cn("animate-screen flex flex-col", m.from === "me" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-card px-4 py-3 text-body",
                m.from === "me" ? "bg-teal text-white" : "border border-line bg-surface text-ink shadow-card",
              )}
            >
              {m.text}
            </div>
            <TimeText value={m.createdAt} variant="chat" className="mt-1 text-label text-ink-2" />
          </div>
        ))}
        <div ref={endRef} />
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
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrire un message…"
            rows={1}
            aria-label="Votre message"
            className="!min-h-12 max-h-32 py-3"
          />
          <button
            type="submit"
            disabled={!text.trim()}
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
