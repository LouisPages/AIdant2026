"use client";

import { ArrowRight, Sparkles, Users, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ResourceCard } from "@/components/resource-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { useAppState, useGetMember } from "@/context/app-state";
import { recommendSolutions, type Solutions as SolutionsData } from "@/lib/services";

export default function SolutionsPage() {
  const { answers, statuses, requestContact, preferences, showToast } = useAppState();
  const getMember = useGetMember();
  const [data, setData] = useState<SolutionsData | null>(null);

  useEffect(() => {
    let alive = true;
    recommendSolutions(answers).then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [answers]);

  return (
    <>
      <Header title="Solutions" subtitle="Des ressources et des personnes choisies pour votre situation." />
      <main className="space-y-8 px-5">
        {!data ? (
          <p className="py-12 text-center text-small text-ink-2">Nous préparons vos suggestions…</p>
        ) : (
          <>
            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2>Articles Nello pour vous</h2>
                <Badge tone="teal">Nello</Badge>
              </div>
              <ul className="space-y-3">
                {data.articles.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <ResourceCard resourceId={a.id} />
                  </li>
                ))}
              </ul>
            </section>

            {preferences.aiSuggestions && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2>Suggestions de KatIA</h2>
                <Badge tone="info">
                  <Sparkles size={12} strokeWidth={2} /> IA
                </Badge>
              </div>
              <ul className="space-y-3">
                {data.suggestions.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <Card>
                      <h3>{s.title}</h3>
                      <p className="mt-1 text-small text-ink-2">{s.text}</p>
                      <div className="mt-3 flex gap-2 rounded-control bg-sky-soft p-3">
                        <Sparkles size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-navy" />
                        <p className="text-small text-ink">{s.reason}</p>
                      </div>
                      <Link
                        href={s.href}
                        className="pressable mt-2 -mb-2 inline-flex min-h-11 items-center gap-1.5 text-small font-semibold text-teal-dark"
                      >
                        {s.cta}
                        <ArrowRight size={20} strokeWidth={1.5} />
                      </Link>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
            )}

            {preferences.peopleSuggestions && (
            <section>
              <h2 className="mb-3">Aidants à découvrir</h2>
              <ul className="space-y-3">
                {data.people.map((p) => {
                  const m = getMember(p.memberId);
                  const status = statuses[p.memberId];
                  return (
                    <li key={p.memberId}>
                      <Card>
                        <div className="flex items-center gap-3">
                          <Avatar avatar={m.avatar} tone={m.tone} size="lg" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-body font-semibold">{m.pseudo}</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {p.traits.map((t, i) => (
                                <Badge key={t} tone={i === 0 ? "lavender" : i === 1 ? "rose" : "sage"}>
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-small text-ink-2">{p.reason}</p>
                        <div className="mt-3">
                          {status === "accepted" ? (
                            <Button variant="secondary" href={`/messages/${p.memberId}`}>
                              Écrire à {m.pseudo}
                            </Button>
                          ) : status === "pending-in" ? (
                            <Button variant="secondary" href={`/messages/${p.memberId}`}>
                              Répondre à sa demande
                            </Button>
                          ) : status === "pending-out" ? (
                            <Button variant="secondary" disabled>
                              Demande envoyée
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              onClick={() => {
                                requestContact(p.memberId);
                                showToast("Demande envoyée");
                              }}
                            >
                              Proposer d'échanger
                            </Button>
                          )}
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
            )}

            <section className="space-y-3">
              <h2>Bientôt</h2>
              <Card className="flex items-start gap-3 bg-sky-soft shadow-none">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-sky text-navy">
                  <Users size={22} strokeWidth={1.5} />
                </span>
                <div>
                  <Badge tone="sky">Bientôt</Badge>
                  <h3 className="mt-1.5 text-navy">Un binôme qui vous ressemble</h3>
                  <p className="mt-1 text-small text-ink-2">
                    Un aidant proche de votre situation, pour échanger dans la durée, à votre rythme.
                  </p>
                </div>
              </Card>
              <Card className="flex items-start gap-3 bg-sky-soft shadow-none">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-sky text-navy">
                  <Video size={22} strokeWidth={1.5} />
                </span>
                <div>
                  <Badge tone="sky">Bientôt</Badge>
                  <h3 className="mt-1.5 text-navy">Cafés des aidants en visio</h3>
                  <p className="mt-1 text-small text-ink-2">Des rencontres en ligne, à petite échelle, pour discuter à voix haute.</p>
                </div>
              </Card>
            </section>
          </>
        )}
      </main>
    </>
  );
}
