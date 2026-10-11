"use client";

import { MessageCircle, Pin } from "lucide-react";
import { useEffect, useState } from "react";
import { CircleTag } from "@/components/circle-card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { CircleLetter, NewsLink } from "@/lib/news/types";
import type { Circle, CircleFamily } from "@/lib/types";

/** Encre de la puce : le pastel de fond se confondrait avec le beige de la carte. */
const CHIP_INK: Record<CircleFamily, string> = {
  lien: "var(--color-fam-rose-ink)",
  situation: "var(--color-fam-lavender-ink)",
  contexte: "var(--color-fam-sage-ink)",
  parcours: "var(--color-fam-sand-ink)",
  besoin: "var(--color-fam-peach-ink)",
};

/** Un domaine par site cité, dans l'ordre des liens. */
function sourceHosts(links: NewsLink[]): string[] {
  const seen = new Set<string>();
  const hosts: string[] = [];
  for (const link of links) {
    let host: string;
    try {
      host = new URL(link.url).hostname;
    } catch {
      continue;
    }
    if (seen.has(host)) continue;
    seen.add(host);
    hosts.push(host);
  }
  return hosts;
}

function SourceMark({ host }: { host: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="-ml-2 flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#f6f3ee] bg-white first:ml-0">
      {!failed && (
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
          alt=""
          width={16}
          height={16}
          className="size-4"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

const SITUATION_CIRCLE: Record<string, string> = {
  "sit:age": "c-autonomie",
  "sit:handicap": "c-handicap",
  "sit:chronique": "c-neuro",
  "sit:accident": "c-accident",
};

/** Cercle dont le tag accompagne la lettre, d'après l'identifiant de sujet. */
export function circleIdForTopic(topicId: string): string | undefined {
  if (topicId.startsWith("det:")) return `c-d-${topicId.slice(4)}`;
  if (topicId.startsWith("circle:")) return topicId.slice("circle:".length);
  return SITUATION_CIRCLE[topicId];
}

/** Lettre pliée : tag, titre, trois lignes, puis les articles au dépliage. */
export function CircleNewsletter({
  letter,
  circle,
  onHide,
}: {
  letter: CircleLetter;
  circle?: Circle;
  onHide: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hosts = sourceHosts(letter.links);

  useEffect(() => {
    setOpen(false);
  }, [letter.topicId]);

  return (
    <Card
      className="relative space-y-2"
      style={{
        backgroundColor: "#f6f3ee",
        ...(circle ? { borderColor: CHIP_INK[circle.family] } : {}),
      }}
      aria-label="Newsletter"
    >
      <button
        type="button"
        onClick={onHide}
        aria-label="Masquer la newsletter"
        className="pressable absolute -right-1.5 -top-1.5 z-10 flex size-11 items-start justify-end text-[#c23b3b]"
      >
        <Pin size={22} strokeWidth={1.5} fill="currentColor" className="rotate-45" aria-hidden />
      </button>

      <div className="flex items-start justify-between gap-2 pr-8">
        <div className="min-w-0">
          {circle && <CircleTag circle={circle} className="mb-2" />}
          <p className="text-h3 font-semibold text-ink">Newsletter positive du jour</p>
        </div>
        {hosts.length > 0 && (
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <div className="flex" aria-hidden>
              {hosts.map((host) => (
                <SourceMark key={host} host={host} />
              ))}
            </div>
            <span className="text-label text-mute">
              +{hosts.length} {hosts.length > 1 ? "sources" : "source"}
            </span>
          </div>
        )}
      </div>

      {letter.summary && (
        <p className={cn("text-small leading-relaxed text-ink-2", !open && "line-clamp-3")}>{letter.summary}</p>
      )}

      {open && (
        <>
          <ul className="space-y-1">
            {letter.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable block min-h-11 rounded-control py-1.5"
                >
                  <span className="text-small font-semibold text-ink">{link.title}</span>
                  <span className="mt-0.5 block text-label text-ink-2">
                    {link.source}
                    {link.date ? ` · ${link.date}` : ""}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-label text-ink-2">
            Ces informations viennent d&apos;associations et d&apos;institutions. Elles ne remplacent pas un avis médical.
          </p>
        </>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="pressable flex min-h-11 items-center text-small font-semibold text-teal-dark"
        >
          {open ? "Réduire" : "Lire plus"}
        </button>
        <span className="inline-flex items-center gap-1 text-small text-mute" aria-label="0 commentaire">
          <MessageCircle size={20} strokeWidth={1.5} aria-hidden />
          0
        </span>
      </div>
    </Card>
  );
}
