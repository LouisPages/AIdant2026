"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/app-state";

/** Passerelle vers une ressource Nello (UC8). */
export function ResourceCard({ resourceId }: { resourceId: string }) {
  const { catalog, showToast } = useAppState();
  const resource = catalog.resources[resourceId];
  const [open, setOpen] = useState(false);
  if (!resource) return null;

  return (
    <>
      <div className="rounded-card bg-sky-soft p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-sky text-navy">
            <BookOpen size={16} strokeWidth={1.5} />
          </span>
          <Badge tone="sky">
            {resource.kind}
            {resource.minutes ? ` · ${resource.minutes} min` : ""}
          </Badge>
        </div>
        <h3 className="mt-2 text-navy">{resource.title}</h3>
        <p className="mt-1 text-small text-ink-2">{resource.description}</p>
        <Button variant="secondary" className="mt-3 border-navy text-navy" onClick={() => setOpen(true)}>
          Voir la ressource
        </Button>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={resource.title}>
        <Badge tone="sky">{resource.kind}</Badge>
        <p className="mt-3 text-body text-ink-2">{resource.description}</p>
        <ol className="mt-4 space-y-3">
          {resource.steps.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-soft text-small font-semibold text-teal-dark">
                {i + 1}
              </span>
              <span className="text-body text-ink">{s}</span>
            </li>
          ))}
        </ol>
        <Button
          className="mt-6"
          icon={<ExternalLink size={20} strokeWidth={1.5} />}
          onClick={() => {
            setOpen(false);
            showToast("Ouverture dans Nello (démo)");
          }}
        >
          Ouvrir dans Nello
        </Button>
      </BottomSheet>
    </>
  );
}
