"use client";

import { PenLine, Search, SearchX, Sprout, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatMembers } from "@/components/circle-card";
import { CircleIcon } from "@/components/circle-icon";
import { ComposerSheet } from "@/components/composer-sheet";
import { ThreadCard } from "@/components/thread-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { useAppState } from "@/context/app-state";
import { allCircles, circles, detailCircles, familyLabels } from "@/data/circles";
import type { Thread } from "@/data/types";
import { cn } from "@/lib/cn";
import { getRelevantThreads } from "@/lib/services";
import { toneFor } from "@/lib/tones";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Puce de filtre : mêmes couleurs que les tags de cercle des messages ; la sélection se marque par un contour. */
function FilterChip({
  tone,
  selected,
  onClick,
  children,
}: {
  tone: string;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-chip border px-4 text-small font-medium",
        tone,
        selected ? "border-current/45" : "border-transparent",
      )}
    >
      {children}
    </button>
  );
}

export default function CirclesHome() {
  const { joined, setJoined, answers, userThreads, userReplies, showToast } = useAppState();
  const [ranked, setRanked] = useState<Thread[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [composer, setComposer] = useState(false);

  useEffect(() => {
    let alive = true;
    getRelevantThreads(joined, answers).then((r) => alive && setRanked(r));
    return () => {
      alive = false;
    };
  }, [joined, answers]);

  // Cercles du membre en premier, puis les autres.
  const ordered = useMemo(
    () => [
      ...detailCircles.filter((c) => joined.includes(c.id)),
      ...circles.filter((c) => joined.includes(c.id)),
      ...circles.filter((c) => !joined.includes(c.id)),
    ],
    [joined],
  );

  const q = norm(query.trim());
  const searching = q.length > 0;
  const matches = searching
    ? allCircles.filter((c) => norm(`${c.name} ${c.description} ${familyLabels[c.family]}`).includes(q))
    : [];
  const chips = searching ? matches : ordered;

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const feed = useMemo(() => {
    const all = [...userThreads, ...(ranked ?? [])];
    return selected.length ? all.filter((t) => selected.includes(t.circleId)) : all;
  }, [userThreads, ranked, selected]);

  const single = selected.length === 1 ? allCircles.find((c) => c.id === selected[0]) : undefined;
  const singleJoined = single ? joined.includes(single.id) : false;

  return (
    <>
      <Header title="Cercles" subtitle="Les échanges qui comptent pour vous, de tous vos cercles." />

      <div>
        <div className="relative px-5">
          <Search size={20} strokeWidth={1.5} className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-mute" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un cercle"
            aria-label="Rechercher un cercle"
            className="pl-12"
          />
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-bg pb-2 pt-3">
        <div className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrer par cercle">
          {!searching && (
            <FilterChip tone="bg-teal-soft text-teal-dark" selected={selected.length === 0} onClick={() => setSelected([])}>
              Tous
            </FilterChip>
          )}
          {chips.map((c) => (
            <FilterChip
              key={c.id}
              tone={toneFor(c.family).soft}
              selected={selected.includes(c.id)}
              onClick={() => toggle(c.id)}
            >
              {c.name}
            </FilterChip>
          ))}
        </div>
      </div>

      <main className="mt-3 space-y-4 px-5">
        {searching && (
          <section>
            <h2 className="mb-3">Cercles trouvés</h2>
            {matches.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="Aucun cercle trouvé"
                text="Essayez un autre mot, par exemple « répit », « travail » ou « Parkinson »."
                tone="sky"
              />
            ) : (
              <ul className="space-y-3">
                {matches.map((c) => (
                  <li key={c.id}>
                    <Card className="flex items-center gap-3">
                      <CircleIcon name={c.icon} family={c.family} />
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-semibold leading-snug">{c.name}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-label text-ink-2">
                          <Users size={14} strokeWidth={1.5} />
                          {formatMembers(c.memberCount)}
                        </p>
                      </div>
                      {joined.includes(c.id) ? (
                        <Button href={`/circles/${c.id}`} variant="secondary" full={false} className="h-11 px-4">
                          Ouvrir
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          full={false}
                          className="h-11 px-4"
                          onClick={() => {
                            setJoined([...joined, c.id]);
                            showToast("Vous avez rejoint ce cercle");
                          }}
                        >
                          Rejoindre
                        </Button>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!searching && single && (
          <Card className="space-y-3">
            <div className="flex items-start gap-3">
              <CircleIcon name={single.icon} family={single.family} />
              <div className="min-w-0 flex-1">
                <h2 className="text-h3">{single.name}</h2>
                <p className="mt-0.5 text-small text-ink-2">{single.description}</p>
                <p className="mt-1.5 inline-flex items-center gap-1 text-label text-ink-2">
                  <Users size={14} strokeWidth={1.5} />
                  {formatMembers(single.memberCount)}
                </p>
              </div>
            </div>
            {singleJoined ? (
              <Button onClick={() => setComposer(true)} icon={<PenLine size={20} strokeWidth={1.5} />}>
                Écrire dans ce cercle
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setJoined([...joined, single.id]);
                  showToast("Vous avez rejoint ce cercle");
                }}
              >
                Rejoindre ce cercle
              </Button>
            )}
            <Link
              href={`/circles/${single.id}`}
              className="pressable flex min-h-11 items-center justify-center rounded-control text-small font-semibold text-teal-dark"
            >
              Voir le cercle
            </Link>
          </Card>
        )}

        {!searching && (
          <section>
            <h2 className="mb-3">
              {selected.length === 0
                ? "Les plus pertinents pour vous"
                : selected.length === 1
                  ? "Les échanges"
                  : "Dans vos cercles choisis"}
            </h2>
            {ranked === null ? (
              <p className="py-8 text-center text-small text-ink-2">Nous choisissons ce qui vous concerne…</p>
            ) : feed.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="Un espace calme pour l'instant"
                text="Une présentation en deux lignes suffit pour lancer la conversation."
                tone="sky"
              />
            ) : (
              <ul className="space-y-3">
                {feed.map((t) => (
                  <li key={t.id} className="animate-screen">
                    <ThreadCard
                      thread={t}
                      showCircle={selected.length !== 1}
                      replyCount={t.replies.length + (userReplies[t.id]?.length ?? 0)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {feed.length > 0 && (
              <p className="py-6 text-center text-small text-ink-2">Vous avez tout lu pour l'instant. Prenez soin de vous.</p>
            )}
          </section>
        )}
      </main>

      {single && <ComposerSheet open={composer} onClose={() => setComposer(false)} circleId={single.id} />}
    </>
  );
}

