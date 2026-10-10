"use client";

import { Check, Eye, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { charter } from "@/data/circles";
import { useAppState } from "@/context/app-state";
import { cn } from "@/lib/cn";

const blocks = [
  {
    icon: Eye,
    title: "Ce que les autres voient",
    text: "Votre pseudo, votre avatar et la courte présentation que vous choisissez d'écrire. Rien d'autre.",
    tone: "bg-teal-soft text-teal-dark",
  },
  {
    icon: Lock,
    title: "Ce qui reste privé",
    text: "Votre nom, vos coordonnées, l'agenda, les documents et les informations sur la personne que vous aidez. Votre profil Nello n'est jamais partagé.",
    tone: "bg-sky-soft text-navy",
  },
  {
    icon: Sparkles,
    title: "Le rôle de l'IA",
    text: "Elle vous suggère des cercles et veille discrètement à un espace respectueux. Elle ne donne aucun conseil médical, et un humain décide pour les cas sensibles.",
    tone: "bg-teal-soft text-teal-dark",
  },
];

export default function Consent() {
  const [accepted, setAccepted] = useState(false);
  const { setConsent, clearAnswers } = useAppState();

  return (
    <OnboardingShell
      back="/"
      title="Avant de commencer"
      subtitle="En quelques mots, ce que vous devez savoir. Prenez votre temps."
      footer={
        <Button href="/onboarding/questions/1" disabled={!accepted} onClick={() => {
            setConsent(true);
            clearAnswers();
          }}>
          J'accepte et je continue
        </Button>
      }
    >
      <div className="space-y-3">
        {blocks.map(({ icon: Icon, title, text, tone }) => (
          <Card key={title} className="flex gap-4">
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-control", tone)}>
              <Icon size={22} strokeWidth={1.5} />
            </span>
            <div>
              <h3>{title}</h3>
              <p className="mt-1 text-small text-ink-2">{text}</p>
            </div>
          </Card>
        ))}

        <Card className="bg-sky-soft shadow-none">
          <h3 className="text-navy">Notre charte de bienveillance</h3>
          <ul className="mt-2 space-y-1.5 text-small text-ink">
            {charter.map((c) => (
              <li key={c} className="flex gap-2">
                <Check size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-navy" />
                {c}
              </li>
            ))}
          </ul>
        </Card>

        <button
          type="button"
          role="checkbox"
          aria-checked={accepted}
          onClick={() => setAccepted((a) => !a)}
          className="pressable flex min-h-11 w-full items-start gap-3 rounded-control px-1 py-2 text-left"
        >
          <span
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-chip border transition-colors duration-200",
              accepted ? "border-teal bg-teal text-white" : "border-line bg-surface",
            )}
          >
            {accepted && <Check size={16} strokeWidth={2} />}
          </span>
          <span className="text-body text-ink">J'ai lu et j'accepte la charte de bienveillance.</span>
        </button>
      </div>
    </OnboardingShell>
  );
}
