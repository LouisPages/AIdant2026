"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useAppState } from "@/context/app-state";

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  tone = "teal",
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
  tone?: "teal" | "sky";
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span
        className={cn(
          "mb-4 flex size-16 items-center justify-center rounded-full",
          tone === "teal" ? "bg-teal-soft text-teal-dark" : "bg-sky-soft text-navy",
        )}
      >
        <Icon size={28} strokeWidth={1.5} />
      </span>
      <h3>{title}</h3>
      <p className="mt-2 max-w-[28ch] text-small text-ink-2">{text}</p>
      {action && <div className="mt-5 w-full">{action}</div>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <div>
        <p className="text-body text-ink">{label}</p>
        {description && <p className="text-small text-ink-2">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-teal" : "bg-line",
          disabled && "opacity-70",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow-card transition-transform duration-200",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-teal-soft"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <div
        className="h-full rounded-full bg-teal transition-[width] duration-300 ease-soft"
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
}

export function Toast() {
  const { toast } = useAppState();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] mx-auto flex w-full max-w-[430px] justify-center px-5">
      <div className="animate-sheet rounded-control bg-ink px-4 py-3 text-small font-medium text-white shadow-raised">
        {toast}
      </div>
    </div>
  );
}
