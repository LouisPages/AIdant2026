"use client";

import { formatChat, formatRelative } from "@/lib/format";

/**
 * Date lisible calculée à partir d'une date ISO. Le rendu serveur et le rendu navigateur peuvent différer
 * (fuseau horaire, quelques secondes d'écart) : l'avertissement d'hydratation est donc désactivé ici.
 */
export function TimeText({
  value,
  variant = "relative",
  className,
}: {
  value: string;
  variant?: "relative" | "chat";
  className?: string;
}) {
  return (
    <span className={className} suppressHydrationWarning>
      {variant === "chat" ? formatChat(value) : formatRelative(value)}
    </span>
  );
}
