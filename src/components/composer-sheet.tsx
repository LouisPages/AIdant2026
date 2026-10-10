"use client";

import { History } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAppState } from "@/context/app-state";
import type { Thread, ThreadKind } from "@/data/types";
import { findSimilarThreads, moderateMessage } from "@/lib/services";

const kinds: { id: ThreadKind; label: string; placeholder: string }[] = [
  { id: "question", label: "Poser une question", placeholder: "Qu'aimeriez-vous demander aux autres aidants ?" },
  { id: "astuce", label: "Partager une astuce", placeholder: "Qu'est-ce qui vous a aidé(e) ?" },
  { id: "partage", label: "Partager mon vécu", placeholder: "Racontez, à votre rythme." },
];

export function ComposerSheet({
  open,
  onClose,
  circleId,
}: {
  open: boolean;
  onClose: () => void;
  circleId: string;
}) {
  const { addThread, showToast } = useAppState();
  const [kind, setKind] = useState<ThreadKind>("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [similar, setSimilar] = useState<Thread[]>([]);

  useEffect(() => {
    let alive = true;
    const id = setTimeout(() => {
      if (kind !== "question") {
        setSimilar([]);
        return;
      }
      findSimilarThreads(`${title} ${body}`, circleId).then((r) => alive && setSimilar(r));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [kind, title, body, circleId]);

  const current = kinds.find((k) => k.id === kind)!;
  const canPublish = body.trim().length >= 3;

  const publish = async () => {
    // La modération est invisible : le message est publié sans écran intermédiaire.
    await moderateMessage(`${title} ${body}`);
    addThread(circleId, { kind, title: title.trim() || defaultTitle(kind, body), body: body.trim() });
    setTitle("");
    setBody("");
    onClose();
    showToast("Votre message est publié");
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Écrire dans ce cercle">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {kinds.map((k) => (
            <Chip key={k.id} selected={kind === k.id} onClick={() => setKind(k.id)}>
              {k.label}
            </Chip>
          ))}
        </div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Un titre court (facultatif)"
          maxLength={80}
          aria-label="Titre"
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={current.placeholder}
          className="min-h-36"
          aria-label="Message"
        />

        {similar.length > 0 && (
          <div className="animate-fade rounded-card bg-sky-soft p-4">
            <div className="flex items-center gap-2 text-navy">
              <History size={20} strokeWidth={1.5} />
              <h3>Déjà abordé par d'autres</h3>
            </div>
            <ul className="mt-2 space-y-1">
              {similar.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/circles/${t.circleId}/thread/${t.id}`}
                    onClick={onClose}
                    className="block min-h-11 py-2 text-small font-medium text-teal-dark underline-offset-2 hover:underline"
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={publish} disabled={!canPublish}>
          Publier
        </Button>
      </div>
    </BottomSheet>
  );
}

function defaultTitle(kind: ThreadKind, body: string) {
  const first = body.trim().split(/[.?!\n]/)[0].trim();
  if (first.length >= 8 && first.length <= 70) return kind === "question" ? `${first} ?` : first;
  return kind === "question" ? "Ma question" : kind === "astuce" ? "Une astuce" : "Mon vécu";
}
