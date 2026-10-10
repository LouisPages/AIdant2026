"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function Header({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string | true;
  right?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="bg-bg px-5 pb-4 pt-6">
      {(back || (right && back)) && (
        <div className="-ml-2 mb-1 flex h-11 items-center justify-between">
          {typeof back === "string" ? (
            <Link
              href={back}
              aria-label="Retour"
              className="pressable flex size-11 items-center justify-center rounded-full text-ink-2"
            >
              <ChevronLeft size={24} strokeWidth={1.5} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Retour"
              className="pressable flex size-11 items-center justify-center rounded-full text-ink-2"
            >
              <ChevronLeft size={24} strokeWidth={1.5} />
            </button>
          )}
          {right && <div className="pr-2">{right}</div>}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-ink">{title}</h1>
        {!back && right}
      </div>
      {subtitle && <p className="mt-2 text-body text-ink-2">{subtitle}</p>}
    </header>
  );
}
