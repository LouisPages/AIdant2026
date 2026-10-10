"use client";

import { Check, ChevronDown, Inbox, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { useAppState, useGetMember } from "@/context/app-state";
import { cn } from "@/lib/cn";

type View = "messages" | "requests";

export default function Messages() {
  const { statuses, conversations, preferences } = useAppState();
  const getMember = useGetMember();
  const [view, setView] = useState<View>("messages");
  const [menu, setMenu] = useState(false);

  // Conversations les plus récentes en premier.
  const lastAt = (id: string) => conversations[id]?.messages.at(-1)?.createdAt ?? "";
  const ids = Object.keys(statuses).sort((a, b) => lastAt(b).localeCompare(lastAt(a)));
  const incoming = ids.filter((id) => statuses[id] === "pending-in");
  const active = ids.filter((id) => statuses[id] === "accepted");
  const outgoing = ids.filter((id) => statuses[id] === "pending-out");
  const requests = [...incoming, ...outgoing];

  const lastText = (id: string) => {
    const msgs = conversations[id]?.messages ?? [];
    const last = msgs[msgs.length - 1];
    if (!last) return "Demande de contact envoyée";
    return last.from === "me" ? `Vous : ${last.text}` : last.text;
  };

  const row = (id: string, badge?: React.ReactNode) => {
    const m = getMember(id);
    return (
      <Link href={`/messages/${id}`} className="pressable flex items-center gap-3 px-5 py-3.5 hover:bg-surface/60">
        <Avatar avatar={m.avatar} tone={m.tone} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-body font-semibold">{m.pseudo}</p>
            {badge}
          </div>
          <p className="truncate text-small text-ink-2">{lastText(id)}</p>
        </div>
      </Link>
    );
  };

  const options: { id: View; label: string; count?: number }[] = [
    { id: "messages", label: "Messages" },
    { id: "requests", label: "Demandes", count: incoming.length },
  ];
  const current = options.find((o) => o.id === view)!;

  return (
    <>
      <header className="relative bg-bg px-5 pb-3 pt-6">
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-haspopup="listbox"
          aria-expanded={menu}
          className="pressable -ml-2 flex min-h-11 items-center gap-1 rounded-control px-2"
        >
          <h1 className="text-ink">{current.label}</h1>
          <ChevronDown
            size={24}
            strokeWidth={1.5}
            className={cn("mt-1 text-teal transition-transform duration-200", menu && "rotate-180")}
          />
          {current.id === "messages" && incoming.length > 0 && (
            <span aria-label="Nouvelles demandes" className="mb-4 ml-0.5 size-2.5 rounded-full bg-teal" />
          )}
        </button>

        {menu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
            <ul
              role="listbox"
              aria-label="Type de conversation"
              className="animate-sheet absolute left-5 top-[4.5rem] z-50 w-56 overflow-hidden rounded-card border border-line bg-surface py-1 shadow-raised"
            >
              {options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={view === o.id}
                    onClick={() => {
                      setView(o.id);
                      setMenu(false);
                    }}
                    className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-body hover:bg-teal-soft/60"
                  >
                    <span className="flex-1">{o.label}</span>
                    {!!o.count && <Badge tone="sky">{o.count}</Badge>}
                    {view === o.id && <Check size={20} strokeWidth={1.5} className="text-teal" />}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-1 text-body text-ink-2">
          {view === "messages"
            ? "Des échanges à deux, uniquement si vous le souhaitez."
            : "Vous n'êtes jamais obligé(e) de répondre."}
        </p>
      </header>

      <main>
        {view === "messages" ? (
          active.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="Pas encore de conversation"
              text="Dans un cercle, choisissez « Écrire en privé » sous un message qui vous parle."
            />
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {active.map((id) => (
                <li key={id}>{row(id)}</li>
              ))}
            </ul>
          )
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Aucune demande"
            text={
              preferences.contactRequests
                ? "Les demandes de contact apparaîtront ici."
                : "Vous avez désactivé les demandes de discussion dans votre profil, rubrique Préférences."
            }
            tone="sky"
          />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {incoming.map((id) => (
              <li key={id}>{row(id, <Badge tone="sky">Nouvelle demande</Badge>)}</li>
            ))}
            {outgoing.map((id) => (
              <li key={id}>{row(id, <Badge tone="teal">En attente</Badge>)}</li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
