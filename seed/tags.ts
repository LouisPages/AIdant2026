/**
 * Tags de départ (voir src/lib/tags.ts) : cercles, membres, et détection des thèmes dans les fils.
 */
import { detectNeedTags, detectThemeTags, isKnownTag, needTag, topicsToTags } from "@/lib/tags";
import type { Circle } from "@/lib/types";
import type { SeedThread } from "./seed-types";

/** Tags des cercles principaux. Les cercles de situations précises sont étiquetés dans circles.ts. */
export const baseCircleTags: Record<string, string[]> = {
  "c-conjoints": ["rel:conjoint", "theme:couple", "need:ecoute"],
  "c-parent": ["rel:parent"],
  "c-handicap-enfant": ["rel:enfant", "sit:handicap"],
  "c-neuro": ["sit:chronique", "theme:peur"],
  "c-autonomie": ["sit:age"],
  "c-handicap": ["sit:handicap"],
  "c-accident": ["sit:accident"],
  "c-solos": ["ent:seul", "theme:solitude", "need:rencontrer"],
  "c-salaries": ["pro:salarie", "theme:travail", "theme:temps"],
  "c-debut": ["stage:moins-1", "theme:demarches", "need:ecoute"],
  "c-longue": ["stage:plus-3", "theme:fatigue", "theme:sante"],
  "c-apres": ["stage:apres", "need:temoignages", "need:ecoute"],
  "c-repit": ["need:repit", "theme:temps", "theme:fatigue"],
  "c-demarches": ["theme:demarches", "theme:finances", "need:aides"],
  "c-sommeil": ["theme:sommeil", "theme:fatigue", "theme:sante"],
  "c-culpabilite": ["theme:culpabilite", "theme:peur", "need:ecoute", "need:partager"],
};

/** Tags des membres fictifs, déduits de leur présentation. */
export const memberTags: Record<string, string[]> = {
  tilleul: ["rel:conjoint", "stage:plus-3"],
  marguerite: ["rel:parent", "sit:age"],
  cedre: ["rel:parent", "pro:salarie"],
  brise: ["rel:enfant", "sit:handicap"],
  plume: ["rel:conjoint", "stage:apres"],
  soleil: ["ent:seul", "need:repit"],
  aubepine: ["rel:autre"],
  glycine: ["stage:plus-3", "need:partager"],
  nenuphar: ["rel:conjoint", "sit:chronique", "det:maladie-de-parkinson", "stage:1-3"],
  lavande: ["rel:parent", "sit:accident", "det:sequelles-d-avc"],
  genet: ["rel:autre", "sit:handicap", "det:autisme-tsa"],
  mimosa: ["rel:conjoint", "sit:age", "det:maladie-d-alzheimer", "pro:retraite", "stage:1-3"],
  bleuet: ["rel:enfant", "sit:handicap", "det:polyhandicap"],
  coquelicot: ["rel:parent", "pro:salarie", "theme:travail"],
  fougere: ["rel:autre", "sit:chronique", "det:cancer"],
  ajonc: ["rel:conjoint", "stage:apres", "det:fin-de-vie-soins-palliatifs"],
  pervenche: ["rel:parent", "sit:age", "det:troubles-de-la-memoire", "vie:sans"],
  jasmin: ["rel:enfant", "sit:handicap", "ent:seul"],
  myosotis: ["stage:plus-3", "need:astuces"],
  lilas: ["rel:conjoint", "sit:accident"],
  romarin: ["pro:salarie", "stage:plus-3"],
  thym: ["rel:parent", "sit:chronique", "det:maladie-de-parkinson"],
  erable: ["rel:parent", "sit:age"],
  saule: ["rel:enfant", "det:troubles-psychiques"],
  olivier: ["rel:parent", "stage:moins-1"],
  hetre: ["stage:plus-3"],
  camelia: ["rel:parent", "stage:apres"],
  iris: ["rel:autre", "ent:seul"],
  orchidee: ["rel:enfant", "sit:handicap", "det:trisomie-21"],
  noisetier: ["rel:autre", "sit:age", "stage:moins-1"],
  capucine: ["pro:salarie", "theme:travail"],
};

/**
 * Tags d'un fil : tags du cercle, besoin selon le genre du fil, thèmes détectés dans le titre ou le corps
 * (les réponses seules ne suffisent pas), besoins détectés dans tout le fil, et thèmes de la ressource liée.
 */
export function deriveThreadTags(thread: SeedThread, circle: Circle, resourceTopics: string[] = []): string[] {
  const own = `${thread.title} ${thread.body}`;
  const all = [own, ...thread.replies.map((r) => r.body)].join(" ");
  const tags = new Set<string>(circle.tags ?? []);

  tags.add(needTag(thread.kind === "astuce" ? "astuces" : thread.kind === "partage" ? "temoignages" : "ecoute"));
  for (const t of detectThemeTags(own)) tags.add(t);
  for (const t of detectNeedTags(all)) tags.add(t);
  for (const t of topicsToTags(resourceTopics)) tags.add(t);

  return [...tags].filter(isKnownTag);
}