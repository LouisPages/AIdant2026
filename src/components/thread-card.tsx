"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { CircleTag } from "@/components/circle-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGetMember } from "@/context/app-state";
import { getCircle } from "@/data/circles";
import type { Thread, ThreadKind } from "@/data/types";

export const kindLabel: Record<ThreadKind, string> = {
  question: "Question",
  astuce: "Astuce",
  partage: "Partage",
};

export function ThreadCard({
  thread,
  replyCount,
  showCircle,
}: {
  thread: Thread;
  replyCount?: number;
  /** Affiche le cercle d'origine sous forme de tag coloré (fil croisé de plusieurs cercles). */
  showCircle?: boolean;
}) {
  const getMember = useGetMember();
  const author = getMember(thread.authorId);
  const circle = showCircle ? getCircle(thread.circleId) : undefined;
  const replies = thread.replies;
  const total = replyCount ?? replies.length;
  const repliers = [...new Set(replies.map((r) => r.authorId))].slice(0, 3);

  return (
    <Link
      href={`/circles/${thread.circleId}/thread/${thread.id}`}
      className="pressable block rounded-card border border-line bg-surface p-4 shadow-card"
    >
      {circle && <CircleTag circle={circle} className="mb-3" />}
      <div className="flex items-center gap-3">
        <Avatar avatar={author.avatar} tone={author.tone} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-semibold text-ink">{author.pseudo}</p>
          <p className="text-label text-ink-2">{thread.time}</p>
        </div>
        <Badge tone={thread.kind === "question" ? "sky" : "teal"}>{kindLabel[thread.kind]}</Badge>
      </div>
      <h3 className="mt-3">{thread.title}</h3>
      <p className="mt-1 line-clamp-3 text-small text-ink-2">{thread.body}</p>
      <div className="mt-3 flex items-center gap-2 text-small text-ink-2">
        {total > 0 ? (
          <>
            <span className="flex -space-x-2">
              {repliers.map((id) => {
                const m = getMember(id);
                return <Avatar key={id} avatar={m.avatar} tone={m.tone} size="sm" className="ring-2 ring-surface" />;
              })}
            </span>
            Des pairs ont répondu
          </>
        ) : (
          <>
            <MessageCircle size={20} strokeWidth={1.5} className="text-mute" />
            Soyez le premier à répondre
          </>
        )}
      </div>
    </Link>
  );
}
