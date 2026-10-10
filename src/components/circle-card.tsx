import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { CircleIcon } from "@/components/circle-icon";
import { Badge } from "@/components/ui/badge";
import { familyLabels } from "@/data/circles";
import type { Circle } from "@/data/types";
import { familyTone } from "@/lib/tones";

export const formatMembers = (n: number) => `${n.toLocaleString("fr-FR")} aidants`;

export function CircleTag({ circle, className }: { circle: Circle; className?: string }) {
  return (
    <Badge tone={familyTone[circle.family]} className={className}>
      {circle.name}
    </Badge>
  );
}

export function CircleCard({
  circle,
  meta,
  badge,
  showMembers = true,
}: {
  circle: Circle;
  meta?: string;
  badge?: React.ReactNode;
  showMembers?: boolean;
}) {
  return (
    <Link
      href={`/circles/${circle.id}`}
      className="pressable flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <CircleIcon name={circle.icon} family={circle.family} />
      <div className="min-w-0 flex-1">
        <h3 className="leading-snug">{circle.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-small text-ink-2">{meta ?? circle.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge tone={familyTone[circle.family]}>{familyLabels[circle.family]}</Badge>
          {showMembers && (
            <span className="inline-flex items-center gap-1 text-label text-ink-2">
              <Users size={14} strokeWidth={1.5} />
              {formatMembers(circle.memberCount)}
            </span>
          )}
          {badge}
        </div>
      </div>
      <ChevronRight size={20} strokeWidth={1.5} className="shrink-0 text-mute" />
    </Link>
  );
}
