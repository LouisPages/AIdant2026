"use client";

import { HeartHandshake, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { HelpResource } from "@/lib/types";

/**
 * Soutien discret après un message difficile (dévalorisation de soi, détresse). Le message est publié normalement,
 * sans reproche ni refus ; cette carte propose seulement une écoute, et se ferme d'un geste.
 *
 * L'état vit hors de React pour survivre à la fermeture de la feuille de rédaction qui l'a déclenchée.
 */
let current: HelpResource[] | null = null;
const listeners = new Set<() => void>();

export function showSupport(resources: HelpResource[]) {
  current = resources.length > 0 ? resources : null;
  listeners.forEach((l) => l());
}

function hideSupport() {
  current = null;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function SupportCard() {
  const resources = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  if (!resources) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[55] mx-auto flex w-full max-w-[430px] justify-center px-5">
      <section
        role="status"
        aria-label="Un soutien est disponible"
        className="pointer-events-auto animate-sheet w-full rounded-card bg-surface p-4 shadow-raised"
      >
        <div className="flex gap-3">
          <HeartHandshake size={24} strokeWidth={1.5} className="mt-0.5 shrink-0 text-teal" />
          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold text-ink">Merci d'avoir écrit. Vous n'êtes pas seul·e.</p>
            <p className="mt-1 text-small text-ink-2">
              Si c'est lourd à porter en ce moment, des personnes sont là pour vous écouter :
            </p>
            <ul className="mt-2 space-y-1">
              {resources.map((r) => (
                <li key={r.name} className="text-small text-ink-2">
                  {/^\d+$/.test(r.name) ? (
                    <a href={`tel:${r.name}`} className="font-semibold text-teal-dark underline-offset-2 hover:underline">
                      {r.name}
                    </a>
                  ) : (
                    <span className="font-semibold text-ink">{r.name}</span>
                  )}{" "}
                  : {r.detail}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={hideSupport}
            aria-label="Fermer"
            className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-mute hover:text-ink"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      </section>
    </div>
  );
}
