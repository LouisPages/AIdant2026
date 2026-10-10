"use client";

import { Check, ChevronDown } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppState } from "@/context/app-state";
import {
  detailKey,
  otherKey,
  realValues,
  SKIP,
  type Answers,
  type Question,
} from "@/lib/questionnaire";
import { cn } from "@/lib/cn";

export default function QuestionStep() {
  const params = useParams<{ step: string }>();
  const router = useRouter();
  const { answers, setPart, catalog } = useAppState();
  const { questions } = catalog;

  const step = Math.min(Math.max(parseInt(params.step, 10) || 1, 1), questions.length);
  const question = questions[step - 1];
  const isLast = step === questions.length;
  const next = isLast ? "/onboarding/profile" : `/onboarding/questions/${step + 1}`;
  const back = step === 1 ? "/onboarding/consent" : `/onboarding/questions/${step - 1}`;

  const skip = () => {
    question.parts.forEach((p) => {
      setPart(p.id, [SKIP]);
      setPart(detailKey(p.id), []);
      setPart(otherKey(p.id), []);
    });
    router.push(next);
  };

  return (
    <OnboardingShell
      key={step}
      back={back}
      progress={{ value: step, max: questions.length }}
      title={question.title}
      subtitle={question.hint}
      footer={
        <>
          <Button href={next}>Continuer</Button>
          <Button variant="tertiary" onClick={skip}>
            Je préfère ne pas répondre
          </Button>
        </>
      }
    >
      {question.kind === "topics" ? (
        <TopicsPicker question={question} answers={answers} setPart={setPart} />
      ) : (
        <ChoiceParts question={question} answers={answers} setPart={setPart} />
      )}
    </OnboardingShell>
  );
}

type PickerProps = {
  question: Question;
  answers: Answers;
  setPart: (partId: string, values: string[]) => void;
};

function ChoiceParts({ question, answers, setPart }: PickerProps) {
  // Liste de précisions ouverte (partId:optionId), directement sous le bouton de choix.
  const [openKey, setOpenKey] = useState<string | null>(null);

  const select = (partId: string, optionId: string) => {
    const current = realValues(answers, partId);
    const turnOff = current[0] === optionId;
    setPart(partId, turnOff ? [] : [optionId]);
    // Les précisions dépendent du choix : on repart de zéro quand il change.
    setPart(detailKey(partId), []);
    setPart(otherKey(partId), []);
  };

  return (
    <div className="space-y-6">
      {question.parts.map((part) => {
        const selected = realValues(answers, part.id);
        return (
          <section key={part.id}>
            {part.label && <h3 className="mb-3 text-small text-ink-2">{part.label}</h3>}
            <div className="space-y-2" role="radiogroup" aria-label={part.label ?? question.title}>
              {part.options.map((o) => {
                const on = selected.includes(o.id);
                const key = `${part.id}:${o.id}`;
                const open = on && openKey === key;
                const chosenDetail = on ? answers[detailKey(part.id)]?.[0] : undefined;

                const onPick = () => {
                  if (!o.details) {
                    select(part.id, o.id);
                    setOpenKey(null);
                  } else if (!on) {
                    select(part.id, o.id);
                    setOpenKey(key);
                  } else {
                    setOpenKey(open ? null : key);
                  }
                };

                return (
                  <div key={o.id}>
                    <div
                      className={cn(
                        "overflow-hidden rounded-control border transition-colors duration-200",
                        on ? "border-teal bg-teal-soft text-teal-dark" : "border-line bg-surface text-ink",
                      )}
                    >
                      <button
                        type="button"
                        {...(o.details
                          ? { "aria-haspopup": "listbox" as const, "aria-expanded": open, "aria-pressed": on }
                          : { role: "radio", "aria-checked": on })}
                        onClick={onPick}
                        className="pressable flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-body"
                      >
                        <span className="min-w-0">
                          {o.label}
                          {chosenDetail && <span className="mt-0.5 block text-small text-ink-2">{chosenDetail}</span>}
                        </span>
                        {o.details ? (
                          <ChevronDown
                            size={20}
                            strokeWidth={1.5}
                            className={cn("shrink-0 transition-transform duration-200", on ? "text-teal" : "text-mute", open && "rotate-180")}
                          />
                        ) : (
                          on && <Check size={20} strokeWidth={1.5} className="shrink-0 text-teal" />
                        )}
                      </button>

                      {open && o.details && (
                        <ul
                          role="listbox"
                          aria-label={`Précisions : ${o.label}`}
                          className="animate-fade max-h-64 overflow-y-auto border-t border-teal/30 bg-surface py-1 text-ink"
                        >
                          <li>
                            <button
                              type="button"
                              role="option"
                              aria-selected={!chosenDetail}
                              onClick={() => {
                                setPart(detailKey(part.id), []);
                                setOpenKey(null);
                              }}
                              className="flex min-h-11 w-full items-center justify-between gap-2 px-4 text-left text-small text-ink-2 hover:bg-teal-soft/60"
                            >
                              Je ne préfère pas préciser
                              {!chosenDetail && <Check size={18} strokeWidth={1.5} className="shrink-0 text-teal" />}
                            </button>
                          </li>
                          {o.details.map((d) => (
                            <li key={d}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={chosenDetail === d}
                                onClick={() => {
                                  setPart(detailKey(part.id), [d]);
                                  setOpenKey(null);
                                }}
                                className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-2 text-left text-small hover:bg-teal-soft/60"
                              >
                                {d}
                                {chosenDetail === d && <Check size={18} strokeWidth={1.5} className="shrink-0 text-teal" />}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {on && o.other && (
                      <div className="animate-fade mt-2">
                        <Input
                          aria-label="Précisez"
                          maxLength={60}
                          value={answers[otherKey(part.id)]?.[0] ?? ""}
                          onChange={(e) => setPart(otherKey(part.id), e.target.value ? [e.target.value] : [])}
                          placeholder="Écrivez-le avec vos mots (ex. un voisin, une amie)"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Choix d'idées en cascade : chaque choix en propose de nouvelles, comme le choix d'artistes sur Spotify. */
function TopicsPicker({ question, answers, setPart }: PickerProps) {
  const { seedTopics, relatedTopics } = useAppState().catalog;
  const partOf = (topicId: string) => question.parts.find((p) => p.options.some((o) => o.id === topicId));
  const labelOf = (topicId: string) => partOf(topicId)?.options.find((o) => o.id === topicId)?.label ?? topicId;

  const selectedIds = question.parts.flatMap((p) => realValues(answers, p.id));

  const [shown, setShown] = useState<string[]>(() => {
    const ids = [...seedTopics];
    selectedIds.forEach((id) => {
      if (!ids.includes(id)) ids.push(id);
      (relatedTopics[id] ?? []).forEach((r) => !ids.includes(r) && ids.push(r));
    });
    return ids;
  });
  const [fresh, setFresh] = useState<string[]>([]);

  const toggle = (topicId: string) => {
    const part = partOf(topicId);
    if (!part) return;
    const current = realValues(answers, part.id);
    const on = current.includes(topicId);
    setPart(part.id, on ? current.filter((v) => v !== topicId) : [...current, topicId]);
    if (!on) {
      const additions = (relatedTopics[topicId] ?? []).filter((r) => !shown.includes(r));
      if (additions.length) {
        setShown((s) => [...s, ...additions]);
        setFresh(additions);
      }
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2" aria-live="polite">
        {shown.map((id) => {
          const isFresh = fresh.includes(id);
          return (
            <span
              key={id}
              className={isFresh ? "animate-screen" : undefined}
              style={isFresh ? { animationDelay: `${fresh.indexOf(id) * 80}ms` } : undefined}
            >
              <Chip selected={selectedIds.includes(id)} onClick={() => toggle(id)}>
                {labelOf(id)}
              </Chip>
            </span>
          );
        })}
      </div>
      <p className="mt-6 text-small text-ink-2">
        {selectedIds.length === 0
          ? "Touchez une idée pour commencer."
          : `${selectedIds.length} choisie${selectedIds.length > 1 ? "s" : ""}. Continuez à explorer, ou passez à la suite quand vous voulez.`}
      </p>
    </div>
  );
}
