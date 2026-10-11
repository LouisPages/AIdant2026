"use client";

import { Trash2 } from "lucide-react";

/** Affordance de démonstration : icône à peine visible pour retirer un message. */
export function DemoDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Supprimer (démo)"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="pressable flex size-7 shrink-0 items-center justify-center rounded-full text-mute/20 hover:text-mute/55"
    >
      <Trash2 size={13} strokeWidth={1.25} />
    </button>
  );
}
