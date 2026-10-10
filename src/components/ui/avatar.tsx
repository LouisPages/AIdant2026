import { Feather, Flower2, Leaf, Moon, Mountain, Sprout, Sun, Waves, type LucideIcon } from "lucide-react";
import type { AvatarKey, AvatarTone } from "@/data/types";
import { cn } from "@/lib/cn";

export const avatarIcons: Record<AvatarKey, LucideIcon> = {
  leaf: Leaf,
  sun: Sun,
  feather: Feather,
  moon: Moon,
  waves: Waves,
  mountain: Mountain,
  flower: Flower2,
  sprout: Sprout,
};

const sizes = {
  sm: { box: "size-8", icon: 16 },
  md: { box: "size-10", icon: 20 },
  lg: { box: "size-16", icon: 28 },
  xl: { box: "size-24", icon: 40 },
};

export function Avatar({
  avatar,
  tone = "teal",
  size = "md",
  className,
}: {
  avatar: AvatarKey;
  tone?: AvatarTone;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const Icon = avatarIcons[avatar];
  const s = sizes[size];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        s.box,
        tone === "teal" ? "bg-teal-soft text-teal-dark" : "bg-sky text-navy",
        className,
      )}
    >
      <Icon size={s.icon} strokeWidth={1.5} />
    </span>
  );
}
