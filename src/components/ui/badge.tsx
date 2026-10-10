import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { toneStyles, type FamilyTone } from "@/lib/tones";

type Tone = "sky" | "teal" | "warn" | "danger" | "info" | FamilyTone;

const tones: Record<Tone, string> = {
  sky: "bg-sky text-navy",
  teal: "bg-teal-soft text-teal-dark",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-sky-soft text-navy",
  rose: toneStyles.rose.soft,
  lavender: toneStyles.lavender.soft,
  sage: toneStyles.sage.soft,
  sand: toneStyles.sand.soft,
  peach: toneStyles.peach.soft,
};

export function Badge({ tone = "teal", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-chip px-2.5 py-[3px] text-label font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Chip({
  selected,
  children,
  onClick,
  className,
  dotClass,
}: {
  selected?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  /** Pastille colorée devant le libellé (couleur de la famille du cercle). */
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "pressable inline-flex min-h-11 items-center gap-1.5 rounded-chip border px-4 text-small font-medium",
        selected
          ? "border-teal bg-teal text-white"
          : "border-line bg-surface text-ink-2 hover:border-teal",
        className,
      )}
    >
      {dotClass && <span className={cn("size-2 shrink-0 rounded-full", selected ? "bg-white" : dotClass)} />}
      {children}
    </button>
  );
}
