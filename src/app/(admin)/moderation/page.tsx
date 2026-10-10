"use client";

import { CheckCircle2, ClipboardCheck, LifeBuoy, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge, Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { getCircle } from "@/data/circles";
import { members } from "@/data/members";
import { helpResources, moderationCases } from "@/data/moderation";
import type { ModerationCase } from "@/data/types";

const typeTone = { ton: "warn", medical: "info", detresse: "danger" } as const;

export default function Moderation() {
  const [decisions, setDecisions] = useState<Record<string, { actionId: string; label: string; at: string }>>({});
  const [tab, setTab] = useState<"pending" | "done">("pending");

  const pending = moderationCases.filter((c) => !decisions[c.id]);
  const done = moderationCases.filter((c) => decisions[c.id]);
  const list = tab === "pending" ? pending : done;

  const decide = (c: ModerationCase, actionId: string, label: string) =>
    setDecisions((d) => ({ ...d, [c.id]: { actionId, label, at: "À l'instant" } }));

  return (
    <>
      <header className="bg-bg px-5 pb-4 pt-8">
        <Badge tone="sky">
          <ShieldCheck size={12} strokeWidth={2} /> Espace modérateur
        </Badge>
        <h1 className="mt-3">Modération</h1>
        <p className="mt-2 text-body text-ink-2">
          Les cas que l'IA a mis de côté. Chaque décision est tracée et peut être contestée.
        </p>
      </header>

      <div className="mb-4 flex gap-2 px-5">
        <Chip selected={tab === "pending"} onClick={() => setTab("pending")}>
          En attente ({pending.length})
        </Chip>
        <Chip selected={tab === "done"} onClick={() => setTab("done")}>
          Traités ({done.length})
        </Chip>
      </div>

      <main className="px-5">
        {list.length === 0 ? (
          <EmptyState
            icon={tab === "pending" ? CheckCircle2 : ClipboardCheck}
            title={tab === "pending" ? "Tout est traité" : "Aucune décision pour l'instant"}
            text={tab === "pending" ? "Aucun cas en attente. Merci pour votre vigilance." : "Les décisions apparaîtront ici avec leur trace."}
            tone="sky"
          />
        ) : (
          <ul className="space-y-4">
            {list.map((c) => {
              const author = members[c.authorId];
              const decision = decisions[c.id];
              return (
                <li key={c.id} className="animate-screen">
                  <Card>
                    <div className="flex items-center gap-3">
                      <Avatar avatar={author.avatar} tone={author.tone} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-small font-semibold">{author.pseudo}</p>
                        <p className="truncate text-label text-ink-2">
                          {getCircle(c.circleId)?.name} · {c.receivedAt}
                        </p>
                      </div>
                      <Badge tone={typeTone[c.type]}>{c.aiLabel}</Badge>
                    </div>

                    <blockquote className="mt-3 rounded-control bg-bg p-3 text-body text-ink">{c.message}</blockquote>

                    <div className="mt-3 flex gap-2 rounded-control bg-sky-soft p-3">
                      <Sparkles size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-navy" />
                      <p className="text-small text-ink">{c.aiReason}</p>
                    </div>

                    {c.aiSuggestion && (
                      <div className="mt-3">
                        <p className="text-label font-medium text-ink-2">Reformulation proposée</p>
                        <p className="mt-1 rounded-control border border-line p-3 text-small text-ink">{c.aiSuggestion}</p>
                      </div>
                    )}

                    {c.type === "detresse" && (
                      <div className="mt-3 rounded-control bg-danger-soft p-3">
                        <div className="flex items-center gap-2 text-danger">
                          <LifeBuoy size={20} strokeWidth={1.5} />
                          <p className="text-small font-semibold">Message conservé, jamais supprimé</p>
                        </div>
                        <p className="mt-1 text-small text-ink">Alerte humaine envoyée. Ressources d'aide affichées à l'auteur :</p>
                        <ul className="mt-2 space-y-1">
                          {helpResources.map((r) => (
                            <li key={r.name} className="flex items-start gap-2 text-small text-ink">
                              <Phone size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-danger" />
                              <span>
                                <strong className="font-semibold">{r.name}</strong> · {r.detail}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {decision ? (
                      <div className="mt-4 flex items-start gap-2 rounded-control bg-teal-soft p-3 text-teal-dark">
                        <CheckCircle2 size={20} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="text-small font-semibold">{decision.label}</p>
                          <p className="text-label">Décision tracée · {decision.at} · contestable</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {c.actions.map((a) => (
                          <Button
                            key={a.id}
                            variant={a.recommended ? "secondary" : "tertiary"}
                            onClick={() => decide(c, a.id, a.label)}
                          >
                            {a.label}
                            {a.recommended ? " (conseillé)" : ""}
                          </Button>
                        ))}
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
