"use client";

import { Lightbulb, MessageCircle, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/circles", label: "Cercles", icon: Users, match: /^\/circles/ },
  { href: "/solutions", label: "Solutions", icon: Lightbulb, match: /^\/solutions/ },
  { href: "/messages", label: "Messages", icon: MessageCircle, match: /^\/messages/ },
  { href: "/profile", label: "Profil", icon: User, match: /^\/profile/ },
];

/** Pages plein écran avec zone de saisie fixe : pas de barre d'onglets. */
const hideOn = [/^\/messages\/.+/, /^\/circles\/[^/]+\/thread\//];

export function TabBar() {
  const pathname = usePathname();
  if (hideOn.some((r) => r.test(pathname))) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] bg-surface pb-[env(safe-area-inset-bottom)] shadow-tabbar"
    >
      <ul className="grid h-16 grid-cols-4">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match.test(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-label font-medium transition-colors duration-200",
                  active ? "text-teal" : "text-mute",
                )}
              >
                <Icon size={24} strokeWidth={1.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
