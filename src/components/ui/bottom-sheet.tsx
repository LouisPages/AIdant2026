"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="animate-fade absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px]">
        <div className="animate-sheet pointer-events-auto max-h-[88dvh] overflow-y-auto rounded-t-card bg-surface px-5 pb-8 pt-3 shadow-raised">
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" />
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2>{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="pressable -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-mute hover:text-ink-2"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
