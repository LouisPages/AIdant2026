import { HeartHandshake, Lock, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const points = [
  { icon: Users, title: "Des pairs qui vous comprennent", text: "Des aidants dans une situation proche de la vôtre." },
  { icon: Sparkles, title: "L'IA en coulisses", text: "Elle vous met en relation avec les bonnes personnes, sans jamais décider à votre place." },
  { icon: Lock, title: "Vous gardez la main", text: "Pseudonyme, rien d'obligatoire, vos données restent les vôtres." },
];

export default function Welcome() {
  return (
    <div className="animate-screen flex min-h-dvh flex-col px-5 pb-8 pt-12">
      <div className="flex-1">
        <span className="flex size-16 items-center justify-center rounded-full bg-teal-soft text-teal-dark">
          <HeartHandshake size={32} strokeWidth={1.5} />
        </span>
        <div className="mt-6">
          <Badge tone="sky">Un espace Nello</Badge>
        </div>
        <h1 className="mt-4">Entre aidants</h1>
        <p className="mt-3 text-body text-ink-2">
          Un espace de soutien entre pairs, pour ne plus porter seul(e) ce que vous vivez.
        </p>

        <ul className="mt-8 space-y-3">
          {points.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-sky-soft text-navy">
                <Icon size={22} strokeWidth={1.5} />
              </span>
              <div>
                <h3>{title}</h3>
                <p className="mt-1 text-small text-ink-2">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 space-y-2">
        <Button href="/onboarding/consent">Commencer</Button>
        <Button href="/circles" variant="tertiary">
          J'ai déjà un profil
        </Button>
      </div>
    </div>
  );
}
