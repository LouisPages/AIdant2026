"use client";

import { Eye, Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CircleIcon } from "@/components/circle-icon";
import { OnboardingShell } from "@/components/onboarding-shell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useAppState } from "@/context/app-state";
import { getCircle } from "@/data/circles";
import { generateIntro, moderateMessage } from "@/lib/services";

export default function Presentation() {
  const router = useRouter();
  const { answers, joined, profile, updateProfile, addThread, showToast } = useAppState();
  const circleId = joined[0] ?? "c-conjoints";
  const circle = getCircle(circleId)!;
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    generateIntro(answers).then((t) => alive && setText(t));
    return () => {
      alive = false;
    };
    // La présentation est rédigée une seule fois, à l'arrivée sur l'écran.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => updateProfile({ bio: (text ?? "").trim() });

  const publish = async () => {
    const body = (text ?? "").trim();
    await moderateMessage(body);
    save();
    addThread(circleId, { kind: "partage", title: "Je me présente", body });
    showToast("Bienvenue dans le cercle");
    router.push(`/circles/${circleId}`);
  };

  const readOnly = () => {
    save();
    router.push(`/circles/${circleId}`);
  };

  const ready = text !== null;

  return (
    <OnboardingShell
      back="/onboarding/circles"
      title="Votre présentation"
      subtitle="Voici ce que les autres verront sur votre profil. Relisez-la, modifiez-la comme vous le souhaitez."
      footer={
        <>
          <Button onClick={publish} disabled={!ready || (text ?? "").trim().length < 3}>
            Me présenter dans le cercle
          </Button>
          <Button variant="tertiary" onClick={readOnly} disabled={!ready}>
            Juste lire pour l'instant
          </Button>
        </>
      }
    >
      {!ready ? (
        <div className="flex flex-col items-center py-16 text-center" aria-live="polite">
          <span className="mb-4 flex size-16 animate-pulse items-center justify-center rounded-full bg-teal-soft text-teal-dark">
            <Sparkles size={28} strokeWidth={1.5} />
          </span>
          <p className="text-body text-ink-2">Nous rédigeons une première version pour vous…</p>
        </div>
      ) : (
        <div className="animate-fade space-y-4">
          <Card>
            <div className="mb-3 flex items-center gap-3">
              <Avatar avatar={profile.avatar} />
              <div>
                <p className="text-body font-semibold">{profile.pseudo}</p>
                <p className="flex items-center gap-1 text-label text-ink-2">
                  <Sparkles size={14} strokeWidth={1.5} />
                  Rédigée avec l'aide de l'IA, relisez-la
                </p>
              </div>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={280}
              className="min-h-36"
              aria-label="Votre présentation"
            />
            <p className="mt-2 text-label text-ink-2">Elle sera aussi affichée sur votre profil. Vous pourrez la modifier à tout moment.</p>
          </Card>

          <Card className="bg-sky-soft shadow-none">
            <div className="mb-3 flex items-center gap-2 text-navy">
              <Eye size={20} strokeWidth={1.5} />
              <h3>Ce que les autres verront</h3>
            </div>
            <div className="flex items-center gap-3 rounded-control bg-surface p-3">
              <Avatar avatar={profile.avatar} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-body font-semibold text-ink">{profile.pseudo}</p>
                <p className="line-clamp-3 text-small text-ink-2">{text || "Pas de présentation pour l'instant."}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-small text-ink-2">
              <Lock size={16} strokeWidth={1.5} className="shrink-0" />
              Votre nom et vos données Nello restent privés.
            </div>
          </Card>

          <Card className="flex items-center gap-3">
            <CircleIcon name={circle.icon} family={circle.family} />
            <div>
              <p className="text-label font-medium text-ink-2">Votre premier cercle</p>
              <h3>{circle.name}</h3>
            </div>
          </Card>
        </div>
      )}
    </OnboardingShell>
  );
}
