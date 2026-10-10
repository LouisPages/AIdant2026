"use client";

import { Check, ChevronDown, PenLine, ShieldCheck, Sprout, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { formatMembers } from "@/components/circle-card";
import { ComposerSheet } from "@/components/composer-sheet";
import { ThreadCard } from "@/components/thread-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { familyTone } from "@/lib/tones";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { EmptyState } from "@/components/ui/misc";
import { useAppState } from "@/context/app-state";
import { cn } from "@/lib/cn";

export default function CircleFeed() {
  const { id } = useParams<{ id: string }>();
  const { catalog, getCircle, joined, setJoined, userThreads, userReplies, showToast } = useAppState();
  const { charter, familyLabels, threads } = catalog;
  const circle = getCircle(id);
  const [composer, setComposer] = useState(false);
  const [charterOpen, setCharterOpen] = useState(false);
  const [older, setOlder] = useState(false);

  if (!circle) {
    return (
      <>
        <Header title="Cercle introuvable" back="/circles" />
        <EmptyState icon={Sprout} title="Ce cercle n'existe pas" text="Retournez à la liste pour en choisir un autre." />
      </>
    );
  }

  const isMember = joined.includes(circle.id);
  const own = userThreads.filter((t) => t.circleId === circle.id);
  const recent = threads.filter((t) => t.circleId === circle.id && !t.older);
  const archive = threads.filter((t) => t.circleId === circle.id && t.older);
  const list = [...own, ...recent, ...(older ? archive : [])];
  const hasOlder = archive.length > 0 && !older;

  return (
    <>
      <Header title={circle.name} back="/circles" subtitle={circle.description} />
      <main className="space-y-4 px-5">
        <div className="-mt-1 flex flex-wrap items-center gap-2">
          <Badge tone={familyTone[circle.family]}>{familyLabels[circle.family]}</Badge>
          <span className="inline-flex items-center gap-1 text-label text-ink-2">
            <Users size={14} strokeWidth={1.5} />
            {formatMembers(circle.memberCount)}
          </span>
        </div>
        {isMember ? (
          <Button onClick={() => setComposer(true)} icon={<PenLine size={20} strokeWidth={1.5} />}>
            Écrire dans ce cercle
          </Button>
        ) : (
          <Button
            onClick={() => {
              setJoined([...joined, circle.id]);
              showToast("Vous avez rejoint ce cercle");
            }}
          >
            Rejoindre ce cercle
          </Button>
        )}
        {!isMember && <p className="text-center text-small text-ink-2">Vous pouvez aussi simplement lire, sans écrire.</p>}

        <Card className="p-0">
          <button
            type="button"
            onClick={() => setCharterOpen((o) => !o)}
            aria-expanded={charterOpen}
            className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left"
          >
            <ShieldCheck size={20} strokeWidth={1.5} className="text-teal" />
            <span className="flex-1 text-small font-semibold text-teal-dark">Charte de bienveillance</span>
            <ChevronDown
              size={20}
              strokeWidth={1.5}
              className={cn("text-mute transition-transform duration-200", charterOpen && "rotate-180")}
            />
          </button>
          {charterOpen && (
            <ul className="animate-fade space-y-2 px-4 pb-4">
              {charter.map((c) => (
                <li key={c} className="flex gap-2 text-small text-ink-2">
                  <Check size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-teal" />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="pt-2">
          <h2 className="mb-3">Les échanges</h2>
          {list.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title="Un espace calme pour l'instant"
              text="Une présentation en deux lignes suffit pour lancer la conversation."
              tone="sky"
            />
          ) : (
            <ul className="space-y-3">
              {list.map((t) => (
                <li key={t.id}>
                  <ThreadCard thread={t} replyCount={t.replies.length + (userReplies[t.id]?.length ?? 0)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {list.length > 0 && (
          <div className="pt-2">
            {hasOlder ? (
              <Button variant="tertiary" onClick={() => setOlder(true)}>
                Voir les échanges plus anciens
              </Button>
            ) : (
              <p className="py-3 text-center text-small text-ink-2">Vous avez tout lu pour l'instant. Prenez soin de vous.</p>
            )}
          </div>
        )}
      </main>

      <ComposerSheet open={composer} onClose={() => setComposer(false)} circleId={circle.id} />
    </>
  );
}
