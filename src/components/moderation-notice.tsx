"use client";

import { HeartHandshake } from "lucide-react";
import { useCallback, useState } from "react";
import { contestModerationAction } from "@/app/actions";
import { showSupport } from "@/components/support-card";
import { moderateMessage, type ModerationContext } from "@/lib/services";

type Refusal = { message: string; text: string; severity: "ferme" | "zone_grise" };

export type ModerationScope = {
  circleId?: string;
  /** Fil auquel on répond : le serveur relit le fil pour donner le contexte aux juges. */
  threadId?: string;
  /** Membre d'une conversation privée : le serveur relit les derniers messages. */
  member?: string;
  /** Contexte connu du navigateur pour la vérification préalable (le serveur refait la sienne). */
  context?: ModerationContext;
};

/**
 * Vérification avant publication, invisible quand tout va bien. En cas de refus, le texte reste dans le champ
 * (rien n'est perdu) et l'aidant peut reformuler ou demander une relecture humaine.
 */
export function useModeration(scope: ModerationScope | string = {}) {
  const { circleId, threadId, member, context } = typeof scope === "string" ? { circleId: scope } : scope;
  const [checking, setChecking] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [contested, setContested] = useState(false);

  /** Renvoie vrai si le message peut être publié. Une panne du contrôle ne bloque jamais : le serveur re-vérifie. */
  const check = useCallback(
    async (text: string): Promise<boolean> => {
      setChecking(true);
      setRefusal(null);
      setContested(false);
      try {
        const verdict = await moderateMessage(text, context);
        if (verdict.decision === "block") {
          setRefusal({ message: verdict.message, text, severity: verdict.severity });
          return false;
        }
        // Message difficile : publié sans reproche, avec une aide discrète qui reste visible après la publication.
        if (verdict.support) showSupport(verdict.support);
        return true;
      } catch {
        return true;
      } finally {
        setChecking(false);
      }
    },
    [context],
  );

  const clear = useCallback(() => {
    setRefusal(null);
    setContested(false);
  }, []);

  const contest = useCallback(async () => {
    if (!refusal) return;
    try {
      await contestModerationAction({ text: refusal.text, circleId, threadId, member });
      setContested(true);
    } catch {
      // Sans conséquence : l'aidant peut toujours reformuler.
    }
  }, [refusal, circleId, threadId, member]);

  return { checking, refusal, contested, check, clear, contest };
}

export function ModerationNotice({
  refusal,
  contested,
  onContest,
}: {
  refusal: { message: string; severity?: "ferme" | "zone_grise" } | null;
  contested: boolean;
  onContest: () => void;
}) {
  if (!refusal) return null;
  const gray = refusal.severity === "zone_grise";
  return (
    <div role="alert" className="animate-fade rounded-card bg-warn-soft p-4">
      <div className="flex gap-3">
        <HeartHandshake size={24} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-2" />
        <div className="min-w-0">
          <p className="text-small font-semibold text-ink">
            {gray ? "Votre message est en attente d'une reformulation" : "Votre message n'a pas été publié"}
          </p>
          <p className="mt-1 text-small text-ink-2">{refusal.message}</p>
          {contested ? (
            <p className="mt-2 text-small font-medium text-teal-dark">
              Merci. Une personne de l'équipe va relire votre message.
            </p>
          ) : (
            <button
              type="button"
              onClick={onContest}
              className="mt-1 min-h-11 text-left text-small font-medium text-teal-dark underline-offset-2 hover:underline"
            >
              {gray ? "Je pense qu'il respecte la charte : demander une relecture" : "Je pense que c'est une erreur : demander une relecture"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
