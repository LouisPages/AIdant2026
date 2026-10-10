import {
  Briefcase,
  Compass,
  Feather,
  File,
  Flower2,
  Heart,
  HeartHandshake,
  House,
  LifeBuoy,
  Map,
  Moon,
  Mountain,
  Sprout,
  Sun,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { CircleFamily } from "@/lib/types";
import { cn } from "@/lib/cn";
import { toneFor } from "@/lib/tones";

const icons: Record<string, LucideIcon> = {
  heart: Heart,
  home: House,
  sprout: Sprout,
  feather: Feather,
  sun: Sun,
  compass: Compass,
  "life-buoy": LifeBuoy,
  moon: Moon,
  briefcase: Briefcase,
  map: Map,
  mountain: Mountain,
  flower: Flower2,
  waves: Waves,
  file: File,
  "heart-handshake": HeartHandshake,
};

/** Icône d'un cercle, teintée selon sa famille. */
export function CircleIcon({
  name,
  family,
  className,
  size = "md",
}: {
  name: string;
  family?: CircleFamily;
  className?: string;
  size?: "sm" | "md";
}) {
  const Icon = icons[name] ?? Heart;
  const tint = family ? toneFor(family).soft : "bg-teal-soft text-teal-dark";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        size === "md" ? "size-11 rounded-control" : "size-8 rounded-chip",
        tint,
        className,
      )}
    >
      <Icon size={size === "md" ? 22 : 18} strokeWidth={1.5} />
    </span>
  );
}
