"use client";

import { Check, Search, SearchX, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatMembers } from "@/components/circle-card";
import { CircleIcon } from "@/components/circle-icon";
import { OnboardingShell } from "@/components/onboarding-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { useAppState } from "@/context/app-state";
import { circles, familyLabels } from "@/data/circles";
import type { Circle } from "@/data/types";
import { cn } from "@/lib/cn";
import { recommendCircles, type Recommendation } from "@/lib/services";
import { familyTone } from "@/lib/tones";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function SelectableCircle({
  circle,
  selected,
  onToggle,
  reason,
  highlight,
}: {
  circle: Circle;
  selected: boolean;
  onToggle: () => void;
  reason?: string;
  highlight?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "pressable w-full rounded-card border bg-surface p-4 text-left shadow-card",
        selected ? "border-teal" : "border-line",
      )}
    >
      <div className="flex items-start gap-3">
        <CircleIcon name={circle.icon} family={circle.family} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3>{circle.name}</h3>
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-chip border transition-colors duration-200",
                selected ? "border-teal bg-teal text-white" : "border-line bg-surface",
              )}
            >
              {selected && <Check size={16} strokeWidth={2} />}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {highlight && <Badge tone="info">{highlight}</Badge>}
            <Badge tone={familyTone[circle.family]}>{familyLabels[circle.family]}</Badge>
            <span className="inline-flex items-center gap-1 text-label text-ink-2">
              <Users size={14} strokeWidth={1.5} />
              {formatMembers(circle.memberCount)}
            </span>
          </div>
        </div>
      </div>
      {reason ? (
        <div className="mt-3 flex gap-2 rounded-control bg-sky-soft p-3">
          <Sparkles size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-navy" />
          <p className="text-small text-ink">{reason}</p>
        </div>
      ) : (
        <p className="mt-3 text-small text-ink-2">{circle.description}</p>
      )}
    </button>
  );
}

export default function SuggestedCircles() {
  const router = useRouter();
  const { answers, setJoined } = useAppState();
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    recommendCircles(answers).then((r) => {
      if (!alive) return;
      setRecs(r);
      setSelected(r.slice(0, 2).map((x) => x.circle.id));
    });
    return () => {
      alive = false;
    };
  }, [answers]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const results = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return [];
    return circles.filter((c) => norm(`${c.name} ${c.description} ${familyLabels[c.family]}`).includes(q));
  }, [query]);

  const searching = query.trim().length > 0;

  const join = () => {
    setJoined(selected);
    router.push("/onboarding/first-steps");
  };

  return (
    <OnboardingShell
      back="/onboarding/profile"
      title="Des cercles pour vous"
      subtitle="Sélectionnés pour vous, avec la raison à chaque fois. Rejoignez-en un ou plusieurs, et changez quand vous voulez."
      footer={
        <Button onClick={join} disabled={selected.length === 0}>
          {selected.length === 0
            ? "Choisir au moins un cercle"
            : selected.length === 1
              ? "Rejoindre ce cercle"
              : `Rejoindre ces ${selected.length} cercles`}
        </Button>
      }
    >
      <div className="relative mb-4">
        <Search size={20} strokeWidth={1.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un cercle"
          aria-label="Rechercher un cercle"
          className="pl-12"
        />
      </div>

      {searching ? (
        results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Aucun cercle trouvé"
            text="Essayez un autre mot, par exemple « répit », « travail » ou « Parkinson »."
            tone="sky"
          />
        ) : (
          <ul className="space-y-3" aria-label="Résultats de la recherche">
            {results.map((c) => (
              <li key={c.id}>
                <SelectableCircle circle={c} selected={selected.includes(c.id)} onToggle={() => toggle(c.id)} />
              </li>
            ))}
          </ul>
        )
      ) : !recs ? (
        <div className="flex flex-col items-center py-16 text-center" aria-live="polite">
          <span className="mb-4 flex size-16 animate-pulse items-center justify-center rounded-full bg-teal-soft text-teal-dark">
            <Sparkles size={28} strokeWidth={1.5} />
          </span>
          <p className="text-body text-ink-2">Nous cherchons des personnes qui vous ressemblent…</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recs.map(({ circle, reason, rank }) => (
            <li key={circle.id} className="animate-screen" style={{ animationDelay: `${rank * 60}ms` }}>
              <SelectableCircle
                circle={circle}
                selected={selected.includes(circle.id)}
                onToggle={() => toggle(circle.id)}
                reason={reason}
                highlight={rank === 1 ? "Le plus proche de vous" : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </OnboardingShell>
  );
}
