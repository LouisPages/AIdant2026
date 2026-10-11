"use client";

import { Flag, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoDeleteButton } from "@/components/demo-delete";
import { Chip } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useAppState, useGetMember } from "@/context/app-state";

const reasons = ["Ton blessant", "Conseil médical", "Publicité", "Autre"];

/** Actions d'un message : écrire en privé (UC7) et signaler (UC9). */
export function PostActions({ id, authorId, threadId }: { id: string; authorId: string; threadId?: string }) {
  const router = useRouter();
  const { statuses, requestContact, reported, report, deletePost, showToast } = useAppState();
  const getMember = useGetMember();
  const author = getMember(authorId);
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  const isMe = authorId === "me";
  const isReported = reported.includes(id);
  const status = statuses[authorId];

  const onContact = () => {
    if (status === "accepted") router.push(`/messages/${authorId}`);
    else if (status) showToast(status === "pending-in" ? "Cette personne attend votre réponse" : "Demande déjà envoyée");
    else setContactOpen(true);
  };

  return (
    <>
      <div className="mt-3 flex items-center gap-1 text-small">
        {!isMe && (
          <button
            type="button"
            onClick={onContact}
            className="pressable -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 font-medium text-teal-dark"
          >
            <Mail size={20} strokeWidth={1.5} />
            Écrire en privé
          </button>
        )}
        {!isMe && (
          <button
            type="button"
            onClick={() => !isReported && setReportOpen(true)}
            disabled={isReported}
            className="pressable ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 font-medium text-mute hover:text-ink-2"
          >
            <Flag size={20} strokeWidth={1.5} />
            {isReported ? "Signalé" : "Signaler"}
          </button>
        )}
        <span className={isMe ? "ml-auto" : undefined}>
          <DemoDeleteButton
            onClick={() => {
              deletePost(id, threadId);
              showToast("Message supprimé");
            }}
          />
        </span>
      </div>

      <BottomSheet open={contactOpen} onClose={() => setContactOpen(false)} title={`Échanger avec ${author.pseudo} ?`}>
        <p className="text-body text-ink-2">
          {author.pseudo} recevra une demande de contact. Elle ou il pourra accepter, ou non. Vous n'avez rien d'autre à faire.
        </p>
        <div className="mt-6 space-y-2">
          <Button
            onClick={() => {
              requestContact(authorId);
              setContactOpen(false);
              showToast("Demande envoyée");
            }}
          >
            Envoyer la demande
          </Button>
          <Button variant="tertiary" onClick={() => setContactOpen(false)}>
            Pas maintenant
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={reportOpen} onClose={() => setReportOpen(false)} title="Signaler ce message">
        <p className="text-body text-ink-2">Dites-nous en un mot ce qui vous gêne. Une personne le lira avec attention.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {reasons.map((r) => (
            <Chip key={r} selected={reason === r} onClick={() => setReason(r)}>
              {r}
            </Chip>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          <Button
            disabled={!reason}
            onClick={() => {
              report(id, reason ?? "Autre");
              setReportOpen(false);
              setReason(null);
              showToast("Merci. Un humain va regarder ce contenu.");
            }}
          >
            Envoyer le signalement
          </Button>
          <Button variant="tertiary" onClick={() => setReportOpen(false)}>
            Annuler
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
