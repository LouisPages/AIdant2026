"use client";

import { Download, LogOut, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleIcon } from "@/components/circle-icon";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { useAppState } from "@/context/app-state";
import { circles } from "@/data/circles";
import { describePart, questions, SKIP } from "@/data/questionnaire";

type Confirm = null | { kind: "leave"; circleId: string } | { kind: "consent" } | { kind: "delete" };

export default function DataPage() {
  const router = useRouter();
  const { answers, profile, joined, leaveCircle, consent, setConsent, resetAll, showToast } = useAppState();
  const [confirm, setConfirm] = useState<Confirm>(null);

  const mine = circles.filter((c) => joined.includes(c.id));

  const summary = questions.map((q) => {
    const real = q.parts.flatMap((p) => describePart(answers, p.id));
    const skipped = q.parts.some((p) => (answers[p.id] ?? []).includes(SKIP));
    return {
      id: q.id,
      title: q.title,
      text: real.length ? real.join(", ") : skipped ? "Préféré ne pas répondre" : "Pas de réponse",
    };
  });

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      circles: mine.map((c) => c.name),
      answers,
      consent,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mes-donnees-entre-aidants.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Votre export est prêt");
  };

  const close = () => setConfirm(null);

  return (
    <>
      <Header title="Mes données" back="/profile" subtitle="Vous gardez la main sur tout ce qui concerne votre profil communautaire." />
      <main className="space-y-6 px-5">
        {!consent && (
          <div className="rounded-card bg-warn-soft p-4">
            <h3 className="text-warn">Consentement retiré</h3>
            <p className="mt-1 text-small text-ink">Votre profil n'est plus visible des autres. Vous pouvez reprendre quand vous le souhaitez.</p>
            <Button variant="secondary" className="mt-3" onClick={() => setConsent(true)}>
              Reprendre
            </Button>
          </div>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2>Mes réponses</h2>
            <Button variant="tertiary" full={false} className="-mr-3" href="/onboarding/questions/1" icon={<Pencil size={20} strokeWidth={1.5} />}>
              Modifier
            </Button>
          </div>
          <Card>
            <ul className="divide-y divide-line">
              {summary.map((s) => (
                <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-label font-medium text-ink-2">{s.title}</p>
                  <p className="text-body text-ink">{s.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section>
          <h2 className="mb-3">Mes cercles</h2>
          {mine.length === 0 ? (
            <p className="text-small text-ink-2">Vous n'êtes dans aucun cercle pour l'instant.</p>
          ) : (
            <ul className="space-y-3">
              {mine.map((c) => (
                <li key={c.id}>
                  <Card className="flex items-center gap-3">
                    <CircleIcon name={c.icon} family={c.family} />
                    <p className="min-w-0 flex-1 text-body font-semibold leading-snug">{c.name}</p>
                    <Button
                      variant="tertiary"
                      full={false}
                      className="-mr-3 px-3"
                      aria-label={`Quitter ${c.name}`}
                      onClick={() => setConfirm({ kind: "leave", circleId: c.id })}
                    >
                      Quitter
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2>Mes droits</h2>
          <Button variant="secondary" icon={<Download size={20} strokeWidth={1.5} />} onClick={exportData}>
            Exporter mes données
          </Button>
          <Button variant="secondary" icon={<LogOut size={20} strokeWidth={1.5} />} onClick={() => setConfirm({ kind: "consent" })} disabled={!consent}>
            Retirer mon consentement
          </Button>
          <Button variant="danger" icon={<Trash2 size={20} strokeWidth={1.5} />} onClick={() => setConfirm({ kind: "delete" })}>
            Supprimer mon profil communautaire
          </Button>
          <div className="flex items-start gap-2 pt-1">
            <Badge tone="info">Nello</Badge>
            <p className="text-small text-ink-2">Ces actions n'ont aucun effet sur le reste de votre compte Nello.</p>
          </div>
        </section>
      </main>

      <BottomSheet
        open={confirm?.kind === "leave"}
        onClose={close}
        title="Quitter ce cercle ?"
      >
        <p className="text-body text-ink-2">Vous ne verrez plus ce cercle dans vos espaces. Vous pourrez le rejoindre de nouveau.</p>
        <div className="mt-6 space-y-2">
          <Button
            onClick={() => {
              if (confirm?.kind === "leave") leaveCircle(confirm.circleId);
              close();
              showToast("Vous avez quitté ce cercle");
            }}
          >
            Quitter le cercle
          </Button>
          <Button variant="tertiary" onClick={close}>
            Rester
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={confirm?.kind === "consent"} onClose={close} title="Retirer mon consentement ?">
        <p className="text-body text-ink-2">
          Votre profil ne sera plus visible et vous ne recevrez plus de suggestions. Vous pourrez reprendre à tout moment.
        </p>
        <div className="mt-6 space-y-2">
          <Button
            onClick={() => {
              setConsent(false);
              close();
              showToast("Consentement retiré");
            }}
          >
            Retirer mon consentement
          </Button>
          <Button variant="tertiary" onClick={close}>
            Annuler
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={confirm?.kind === "delete"} onClose={close} title="Supprimer mon profil ?">
        <p className="text-body text-ink-2">
          Votre pseudo, vos réponses, vos messages et vos cercles seront supprimés. Votre compte Nello, lui, ne change pas.
        </p>
        <div className="mt-6 space-y-2">
          <Button
            variant="danger"
            onClick={() => {
              resetAll();
              close();
              router.push("/");
            }}
          >
            Oui, supprimer mon profil
          </Button>
          <Button onClick={close}>Garder mon profil</Button>
        </div>
      </BottomSheet>
    </>
  );
}
