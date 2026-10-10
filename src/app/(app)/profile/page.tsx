"use client";

import { ChevronRight, Lock, Pencil, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CircleIcon } from "@/components/circle-icon";
import { formatMembers } from "@/components/circle-card";
import { Avatar, avatarIcons } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/misc";
import { useAppState } from "@/context/app-state";
import { describePart, optionLabel, realValues } from "@/lib/questionnaire";
import type { AvatarKey } from "@/lib/types";
import { cn } from "@/lib/cn";

const traits: { label: string; parts: string[] }[] = [
  { label: "J'accompagne", parts: ["relation"] },
  { label: "Situation de la personne aidée", parts: ["situation"] },
  { label: "Aidant depuis", parts: ["depuis"] },
  { label: "Rythme", parts: ["rythme"] },
  { label: "Quotidien", parts: ["cohabitation", "entourage"] },
  { label: "Ma situation", parts: ["pro"] },
];

export default function Profile() {
  const { catalog, profile, updateProfile, answers, joined, preferences, updatePreferences, showToast } = useAppState();
  const { circles: allCircles, questions } = catalog;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [replies, setReplies] = useState(true);
  const [suggestions, setSuggestions] = useState(false);

  const open = () => {
    setDraft(profile);
    setEditing(true);
  };

  const mine = allCircles.filter((c) => joined.includes(c.id));
  const topics = [...realValues(answers, "poids"), ...realValues(answers, "recherche")].map((id) => ({
    id,
    label: optionLabel(questions, "poids", id) ?? optionLabel(questions, "recherche", id) ?? id,
  }));

  return (
    <>
      <Header title="Profil" />
      <main className="space-y-6 px-5">
        <section className="space-y-3">
          <Card className="flex flex-col items-center text-center">
            <Avatar avatar={profile.avatar} size="xl" />
            <h2 className="mt-3">{profile.pseudo}</h2>
            <Badge tone="teal" className="mt-2">
              Visible uniquement sous pseudonyme
            </Badge>
            <div className="mt-4 w-full rounded-control bg-bg p-3 text-left">
              <p className="text-label font-medium text-ink-2">Description publique</p>
              <p className="mt-1 text-small text-ink">{profile.bio || "Pas de présentation pour l'instant."}</p>
            </div>
            <Button variant="secondary" className="mt-4" icon={<Pencil size={20} strokeWidth={1.5} />} onClick={open}>
              Modifier mon profil
            </Button>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3>Caractéristiques générales</h3>
              <Link href="/onboarding/questions/1" className="pressable -mr-2 inline-flex min-h-11 items-center px-2 text-small font-semibold text-teal-dark">
                Modifier
              </Link>
            </div>
            <dl className="divide-y divide-line">
              {traits.map((t) => {
                const values = t.parts.flatMap((p) => describePart(questions, answers, p));
                return (
                  <div key={t.label} className="py-2.5 first:pt-0">
                    <dt className="text-label font-medium text-ink-2">{t.label}</dt>
                    <dd className="text-body text-ink">{values.length ? values.join(", ") : "Non renseigné"}</dd>
                  </div>
                );
              })}
              <div className="pt-2.5">
                <dt className="text-label font-medium text-ink-2">Ce qui m'amène</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {topics.length ? (
                    topics.map((t) => (
                      <Badge key={t.id} tone="info">
                        {t.label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-body text-ink">Non renseigné</span>
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-3 flex items-start gap-2 rounded-control bg-sky-soft p-3 text-small text-ink">
              <Lock size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-navy" />
              Ces informations restent privées. Elles servent seulement à vous suggérer des cercles et des solutions.
            </p>
          </Card>
        </section>

        <section>
          <h2 className="mb-1">Préférences</h2>
          <p className="mb-3 text-small text-ink-2">Choisissez ce que vous acceptez de recevoir. Vous pouvez changer d'avis à tout moment.</p>
          <Card className="space-y-3">
            <Switch
              checked={preferences.contactRequests}
              onChange={(v) => {
                updatePreferences({ contactRequests: v });
                showToast(v ? "Les demandes de discussion sont activées" : "Vous ne recevrez plus de demandes de discussion");
              }}
              label="Demandes de discussion"
              description="Autoriser les autres aidants à vous proposer d'échanger en privé. Désactivé, les demandes reçues sont masquées."
            />
            <div className="h-px bg-line" />
            <Switch
              checked={preferences.peopleSuggestions}
              onChange={(v) => updatePreferences({ peopleSuggestions: v })}
              label="Aidants à découvrir"
              description="Voir, dans Solutions, des aidants proches de votre situation."
            />
            <div className="h-px bg-line" />
            <Switch
              checked={preferences.aiSuggestions}
              onChange={(v) => updatePreferences({ aiSuggestions: v })}
              label="Suggestions de KatIA"
              description="Voir, dans Solutions, des pistes proposées d'après votre profil."
            />
            <div className="h-px bg-line" />
            <Switch
              checked={preferences.onlyMyCircles}
              onChange={(v) => updatePreferences({ onlyMyCircles: v })}
              label="Fil limité à mes cercles"
              description="Ne voir dans Cercles que les échanges des cercles que vous avez rejoints."
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3">Mes cercles</h2>
          {mine.length === 0 ? (
            <Card className="text-small text-ink-2">Vous n'êtes dans aucun cercle pour l'instant.</Card>
          ) : (
            <ul className="space-y-3">
              {mine.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/circles/${c.id}`}
                    className="pressable flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
                  >
                    <CircleIcon name={c.icon} family={c.family} />
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-semibold leading-snug">{c.name}</p>
                      <p className="text-label text-ink-2">{formatMembers(c.memberCount)}</p>
                    </div>
                    <ChevronRight size={20} strokeWidth={1.5} className="shrink-0 text-mute" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3">Notifications</h2>
          <Card className="space-y-3">
            <Switch checked={replies} onChange={setReplies} label="Réponses à mes questions" />
            <div className="h-px bg-line" />
            <Switch checked={suggestions} onChange={setSuggestions} label="Nouveaux cercles suggérés" />
            <div className="h-px bg-line" />
            <Switch
              checked
              disabled
              onChange={() => {}}
              label="Jamais la nuit"
              description="Aucune notification entre 22 h et 8 h."
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3">Mes données</h2>
          <Link
            href="/profile/data"
            className="pressable flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-sky-soft text-navy">
              <ShieldCheck size={22} strokeWidth={1.5} />
            </span>
            <div className="flex-1">
              <h3>Données et consentement</h3>
              <p className="text-small text-ink-2">Consulter, exporter, quitter ou supprimer.</p>
            </div>
            <ChevronRight size={20} strokeWidth={1.5} className="text-mute" />
          </Link>
        </section>
      </main>

      <BottomSheet open={editing} onClose={() => setEditing(false)} title="Modifier mon profil">
        <div className="space-y-4">
          <Field label="Pseudo">
            <Input value={draft.pseudo} maxLength={24} onChange={(e) => setDraft({ ...draft, pseudo: e.target.value })} />
          </Field>
          <div>
            <span className="mb-2 block text-label font-medium text-ink-2">Avatar</span>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(avatarIcons) as AvatarKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-label={`Avatar ${k}`}
                  aria-pressed={draft.avatar === k}
                  onClick={() => setDraft({ ...draft, avatar: k })}
                  className={cn(
                    "pressable flex aspect-square items-center justify-center rounded-card border",
                    draft.avatar === k ? "border-teal bg-teal-soft" : "border-line bg-surface",
                  )}
                >
                  <Avatar avatar={k} tone={draft.avatar === k ? "teal" : "sky"} />
                </button>
              ))}
            </div>
          </div>
          <Field label="Description publique" hint="Visible par les autres membres, sous votre pseudo.">
            <Textarea value={draft.bio} maxLength={280} className="min-h-32" onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
          </Field>
          <Button
            disabled={!draft.pseudo.trim()}
            onClick={() => {
              updateProfile({ ...draft, pseudo: draft.pseudo.trim(), bio: draft.bio.trim() });
              setEditing(false);
              showToast("Profil mis à jour");
            }}
          >
            Enregistrer
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}

