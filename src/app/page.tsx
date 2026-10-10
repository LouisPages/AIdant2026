import { Lock, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const points = [
  { icon: Users, title: "Des pairs qui vous comprennent", text: "Des aidants dans une situation proche de la vôtre." },
  { icon: Sparkles, title: "L'IA en coulisses", text: "Elle vous met en relation, sans jamais décider à votre place." },
  { icon: Lock, title: "Vous gardez la main", text: "Pseudonyme, rien d'obligatoire, vos données restent les vôtres." },
];

export default function Welcome() {
  return (
    <div className="animate-screen flex min-h-dvh flex-col px-5 pb-8 pt-10">
      <div className="flex flex-1 flex-col items-center justify-center">
        <Image
          src="/logo.png"
          alt="entr'aidant"
          width={482}
          height={331}
          priority
          className="h-auto w-[78%] max-w-[320px]"
        />

        <ul className="mt-10 w-full space-y-3">
          {points.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 px-1">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-soft text-navy">
                <Icon size={16} strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-small font-semibold leading-snug">{title}</p>
                <p className="text-label text-ink-2">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 space-y-2">
        <Button href="/onboarding/consent">Commencer</Button>
        <Button href="/onboarding/consent" variant="secondary">
          Commencer avec Nello
        </Button>
        <Button href="/circles" variant="tertiary">
          J'ai déjà un profil
        </Button>
      </div>
    </div>
  );
}
