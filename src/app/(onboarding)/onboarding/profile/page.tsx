"use client";

import { Lock, RefreshCw } from "lucide-react";
import { useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { Avatar, avatarIcons } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useAppState } from "@/context/app-state";
import { questions } from "@/data/questionnaire";
import { suggestedPseudos } from "@/data/members";
import type { AvatarKey } from "@/data/types";
import { cn } from "@/lib/cn";

export default function ProfileStep() {
  const { profile, updateProfile } = useAppState();
  const [pseudoIdx, setPseudoIdx] = useState(0);

  const shuffle = () => {
    const next = (pseudoIdx + 1) % suggestedPseudos.length;
    setPseudoIdx(next);
    updateProfile({ pseudo: suggestedPseudos[next] });
  };

  return (
    <OnboardingShell
      back={`/onboarding/questions/${questions.length}`}
      title="Votre pseudo"
      subtitle="Un pseudo et un avatar suffisent. Vous resterez anonyme."
      footer={<Button href="/onboarding/circles">Voir mes cercles</Button>}
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3 py-2">
          <Avatar avatar={profile.avatar} size="xl" />
          <p className="text-h3 font-semibold">{profile.pseudo || "Votre pseudo"}</p>
        </div>

        <Field label="Pseudo">
          <div className="flex gap-2">
            <Input
              value={profile.pseudo}
              maxLength={24}
              onChange={(e) => updateProfile({ pseudo: e.target.value })}
              placeholder="Votre pseudo"
            />
            <button
              type="button"
              onClick={shuffle}
              aria-label="Proposer un autre pseudo"
              className="pressable flex size-12 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-teal-dark"
            >
              <RefreshCw size={20} strokeWidth={1.5} />
            </button>
          </div>
        </Field>

        <div>
          <span className="mb-2 block text-label font-medium text-ink-2">Avatar</span>
          <div className="grid grid-cols-4 gap-3">
            {(Object.keys(avatarIcons) as AvatarKey[]).map((key) => {
              const on = profile.avatar === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={`Avatar ${key}`}
                  aria-pressed={on}
                  onClick={() => updateProfile({ avatar: key })}
                  className={cn(
                    "pressable flex aspect-square items-center justify-center rounded-card border",
                    on ? "border-teal bg-teal-soft" : "border-line bg-surface",
                  )}
                >
                  <Avatar avatar={key} tone={on ? "teal" : "sky"} size="md" />
                </button>
              );
            })}
          </div>
        </div>

        <Card className="flex items-start gap-3 bg-sky-soft shadow-none">
          <Lock size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-navy" />
          <p className="text-small text-ink">Votre nom et vos données Nello restent privés. Vous pourrez changer de pseudo à tout moment.</p>
        </Card>
      </div>
    </OnboardingShell>
  );
}
