"use client";

import { Send, Sprout } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PostActions } from "@/components/post-actions";
import { ResourceCard } from "@/components/resource-card";
import { kindLabel } from "@/components/thread-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { useAppState, useGetMember } from "@/context/app-state";
import { TimeText } from "@/components/time-text";
import { moderateMessage } from "@/lib/services";

export default function ThreadPage() {
  const { id, tid } = useParams<{ id: string; tid: string }>();
  const { getCircle, getThread, userReplies, addReply } = useAppState();
  const getMember = useGetMember();
  const [reply, setReply] = useState("");

  const thread = getThread(tid);
  const circle = getCircle(id);

  if (!thread || !circle) {
    return (
      <>
        <Header title="Échange introuvable" back={`/circles/${id}`} />
        <EmptyState icon={Sprout} title="Cet échange n'existe plus" text="Retournez au cercle pour continuer à lire." />
      </>
    );
  }

  const author = getMember(thread.authorId);
  const replies = [...thread.replies, ...(userReplies[thread.id] ?? [])];

  const send = async () => {
    const text = reply.trim();
    if (!text) return;
    await moderateMessage(text);
    addReply(thread.id, text);
    setReply("");
  };

  return (
    <div className="pb-4">
      <Header title={thread.title} back={`/circles/${circle.id}`} />
      <main className="space-y-4 px-5">
        <Link href={`/circles/${circle.id}`} className="-mt-3 block text-small font-medium text-teal-dark">
          {circle.name}
        </Link>

        <Card>
          <div className="flex items-center gap-3">
            <Avatar avatar={author.avatar} tone={author.tone} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-semibold">{author.pseudo}</p>
              <TimeText value={thread.createdAt} className="block text-label text-ink-2" />
            </div>
            <Badge tone={thread.kind === "question" ? "sky" : "teal"}>{kindLabel[thread.kind]}</Badge>
          </div>
          <p className="mt-3 text-body text-ink">{thread.body}</p>
          <PostActions id={thread.id} authorId={thread.authorId} />
        </Card>

        {thread.resourceId && <ResourceCard resourceId={thread.resourceId} />}

        <section>
          <h2 className="mb-3">Réponses de pairs</h2>
          {replies.length === 0 ? (
            <p className="rounded-card bg-surface p-4 text-small text-ink-2 shadow-card">
              Pas encore de réponse. Un pair passera bientôt, vous pouvez aussi répondre ci-dessous.
            </p>
          ) : (
            <ul className="space-y-3">
              {replies.map((r) => {
                const m = getMember(r.authorId);
                return (
                  <li key={r.id} className="animate-screen rounded-card border border-line bg-surface p-4 shadow-card">
                    <div className="flex items-center gap-3">
                      <Avatar avatar={m.avatar} tone={m.tone} size="sm" />
                      <p className="flex-1 truncate text-small font-semibold">{m.pseudo}</p>
                      <TimeText value={r.createdAt} className="text-label text-ink-2" />
                    </div>
                    <p className="mt-2 text-body text-ink">{r.body}</p>
                    <PostActions id={r.id} authorId={r.authorId} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="sticky bottom-0 z-30 mt-6 flex items-end gap-2 bg-bg px-5 pb-6 pt-3"
      >
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Répondre avec bienveillance…"
          rows={1}
          aria-label="Votre réponse"
          className="!min-h-12 max-h-32 py-3"
        />
        <button
          type="submit"
          disabled={!reply.trim()}
          aria-label="Envoyer"
          className="pressable flex size-12 shrink-0 items-center justify-center rounded-control bg-teal text-white hover:bg-teal-dark disabled:bg-line disabled:text-mute"
        >
          <Send size={20} strokeWidth={1.5} />
        </button>
      </form>
    </div>
  );
}
