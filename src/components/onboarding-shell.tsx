"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProgressBar } from "@/components/ui/misc";

export function OnboardingShell({
  back,
  progress,
  title,
  subtitle,
  children,
  footer,
}: {
  back?: string;
  progress?: { value: number; max: number };
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <>
      <div className="px-5 pt-6">
        <div className="-ml-2 flex h-11 items-center gap-3">
          {back ? (
            <Link
              href={back}
              aria-label="Retour"
              className="pressable flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2"
            >
              <ChevronLeft size={24} strokeWidth={1.5} />
            </Link>
          ) : (
            <span className="size-11 shrink-0" />
          )}
          {progress && (
            <div className="flex-1 pr-3">
              <ProgressBar {...progress} />
            </div>
          )}
        </div>
        <h1 className="mt-4 text-ink">{title}</h1>
        {subtitle && <p className="mt-2 text-body text-ink-2">{subtitle}</p>}
      </div>
      <main className="flex-1 px-5 pb-6 pt-6">{children}</main>
      <div className="sticky bottom-0 space-y-2 bg-bg px-5 pb-6 pt-3">{footer}</div>
    </>
  );
}
