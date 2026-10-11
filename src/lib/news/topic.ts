/**
 * Sujet de la lettre épinglée : une clé de cache partagée, un libellé et des mots
 * pour écarter les articles hors sujet des flux généralistes.
 *
 * « Tous » suit la précision du questionnaire, sinon la situation large, sinon l'aidance.
 * Une puce de maladie réutilise la même lettre que cette précision.
 */
import { detailCircleId, detailKey, realValues, slug, type Answers } from "@/lib/questionnaire";

export type NewsTopic = {
  /** Clé stable, identique pour tous les aidants du même sujet. */
  id: string;
  /** Titre de la carte. */
  label: string;
  /** Mots du sujet, sans accents, pour filtrer les flux qui ne sont pas déjà dédiés. */
  keywords: string[];
};

export type CircleRef = { id: string; name: string; detail?: boolean };

const SITUATIONS = ["age", "handicap", "chronique", "accident"] as const;
type SituationId = (typeof SITUATIONS)[number];

const SITUATION_LABEL: Record<SituationId, string> = {
  age: "Perte d'autonomie liée à l'âge",
  handicap: "Handicap",
  chronique: "Maladie chronique ou neurodégénérative",
  accident: "Après un accident",
};

const SITUATION_KEYWORDS: Record<SituationId, string[]> = {
  age: ["autonomie", "personne agee", "grand age", "ehpad", "chute", "aidant"],
  handicap: ["handicap", "compensation", "pch"],
  chronique: ["maladie chronique", "neurodegener", "aidant"],
  accident: ["accident", "traumatisme", "readaptation"],
};

/** Mots ajoutés au nom, pour les précisions dont le flux institutionnel emploie un autre terme. */
const DETAIL_ALIASES: Record<string, string[]> = {
  "maladie-d-alzheimer": ["alzheimer"],
  "maladie-d-alzheimer-et-apparentees": ["alzheimer"],
  "maladie-a-corps-de-lewy": ["lewy"],
  "demence-vasculaire": ["demence", "vasculaire"],
  "maladie-de-parkinson": ["parkinson"],
  "troubles-de-la-memoire": ["memoire", "troubles cognitifs"],
  "perte-de-mobilite": ["mobilite"],
  "chutes-a-repetition": ["chute"],
  "deficience-visuelle": ["visuel", "malvoyant", "cecite"],
  "deficience-auditive": ["auditif", "surdite"],
  "denutrition": ["denutrition", "nutrition"],
  "fin-de-vie-soins-palliatifs": ["palliatif", "fin de vie"],
  "trisomie-21": ["trisomie"],
  "autisme-tsa": ["autisme", "tsa"],
  "troubles-dys": ["dyslexie", "dyspraxie", "troubles dys"],
  "deficience-intellectuelle": ["deficience intellectuelle"],
  "paralysie-cerebrale": ["paralysie cerebrale"],
  "handicap-moteur": ["handicap moteur"],
  "handicap-visuel": ["handicap visuel", "cecite"],
  "handicap-auditif": ["handicap auditif", "surdite"],
  polyhandicap: ["polyhandicap"],
  "troubles-psychiques": ["psychique", "psychiatrie"],
  "maladie-rare": ["maladie rare"],
  "sclerose-en-plaques": ["sclerose en plaques", "sep"],
  "sclerose-laterale-amyotrophique-sla": ["amyotroph", "charcot"],
  "maladie-de-huntington": ["huntington"],
  cancer: ["cancer"],
  diabete: ["diabete"],
  "insuffisance-renale-dialyse": ["renale", "dialyse"],
  "insuffisance-respiratoire-bpco": ["bpco", "respiratoire", "poumon"],
  "insuffisance-cardiaque": ["cardiaque", "insuffisance cardiaque", "coeur"],
  "sequelles-d-avc": ["avc"],
  epilepsie: ["epilepsie"],
  "maladie-de-crohn": ["crohn"],
  "polyarthrite-rhumatoide": ["polyarthrite", "rhumatoide"],
  "maladie-psychique": ["psychique", "psychiatrie"],
  fibromyalgie: ["fibromyalgie"],
  "traumatisme-cranien": ["traumatisme cranien", "traumatisme crânien"],
  "lesion-de-la-moelle-epiniere": ["moelle epiniere", "lesion medullaire"],
  amputation: ["amputation"],
  "brulures-graves": ["brulure"],
  "fractures-complexes": ["fracture"],
  "accident-du-travail": ["accident du travail"],
};

const CIRCLE_KEYWORDS: Record<string, string[]> = {
  "c-conjoints": ["conjoint", "couple", "aidant"],
  "c-parent": ["parent", "aidant"],
  "c-handicap-enfant": ["enfant", "handicap", "parent"],
  "c-neuro": ["neurodegener", "alzheimer", "parkinson", "maladie chronique"],
  "c-autonomie": ["autonomie", "personne agee", "grand age"],
  "c-handicap": ["handicap"],
  "c-accident": ["accident", "traumatisme"],
  "c-solos": ["aidant", "isolement"],
  "c-salaries": ["proche aidant", "conge", "travail", "salarie"],
  "c-debut": ["devenir aidant", "aidant"],
  "c-longue": ["aidant", "epuisement"],
  "c-apres": ["deuil", "aidant"],
  "c-repit": ["repit", "relayage", "accueil temporaire"],
  "c-demarches": ["allocation", "apa", "pch", "proche aidant", "demarche", "droit"],
  "c-sommeil": ["sommeil", "fatigue", "aidant"],
  "c-culpabilite": ["aidant", "culpabil", "fardeau"],
};

export const SITUATION_IDS = SITUATIONS;

export const AIDANCE_TOPIC: NewsTopic = {
  id: "aidance",
  label: "L'aidance au quotidien",
  keywords: ["aidant", "aidance", "proche aidant", "repit"],
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** « Maladie de Parkinson » → « Autour de la maladie de Parkinson ». */
export function autourDe(name: string): string {
  const lower = lowerFirst(name.trim());
  const n = norm(lower);
  if (/^(troubles|chutes|sequelles|brulures|fractures)\b/.test(n)) return `Autour des ${lower}`;
  if (/^(handicap|cancer|diabete|traumatisme|polyhandicap)\b/.test(n)) return `Autour du ${lower}`;
  if (/^(insuffisance|epilepsie|amputation|autisme|accident)\b/.test(n)) return `Autour de l'${lower}`;
  if (n.startsWith("fin de vie")) return "Autour de la fin de vie et des soins palliatifs";
  return `Autour de la ${lower}`;
}

const tokensOf = (name: string) =>
  norm(name)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !["maladie", "troubles", "apres", "suite", "autre", "liee", "lies"].includes(w));

export function detailTopic(detail: string): NewsTopic {
  const id = slug(detail);
  const keywords = [...new Set([...tokensOf(detail), ...(DETAIL_ALIASES[id] ?? [])])];
  return { id: `det:${id}`, label: autourDe(detail), keywords };
}

export function situationTopic(situation: SituationId): NewsTopic {
  return {
    id: `sit:${situation}`,
    label: SITUATION_LABEL[situation],
    keywords: SITUATION_KEYWORDS[situation],
  };
}

export function circleTopic(circle: CircleRef): NewsTopic {
  return {
    id: `circle:${circle.id}`,
    label: circle.name,
    keywords: CIRCLE_KEYWORDS[circle.id] ?? ["aidant"],
  };
}

const detailNameOf = (circle: CircleRef) => circle.name.replace(/^Aidants\s*·\s*/, "").trim();

function caregiverDetail(answers: Answers): string | undefined {
  if (realValues(answers, "situation").length === 0) return undefined;
  const detail = answers[detailKey("situation")]?.[0]?.trim();
  if (!detail || detail === "Autre") return undefined;
  return detail;
}

function caregiverSituation(answers: Answers): SituationId | undefined {
  const value = realValues(answers, "situation")[0];
  return (SITUATIONS as readonly string[]).includes(value ?? "") ? (value as SituationId) : undefined;
}

function fromCircle(circle: CircleRef): NewsTopic {
  if (!circle.detail) return circleTopic(circle);
  const name = detailNameOf(circle);
  return name ? detailTopic(name) : circleTopic(circle);
}

/**
 * Sujet de la lettre selon les puces cochées.
 * Plusieurs cercles de précision : celui de l'aidant s'il est dans la sélection, sinon le premier.
 * Plusieurs cercles ordinaires : le premier de la sélection.
 */
export function resolveNewsTopic(selected: string[], answers: Answers, circles: CircleRef[]): NewsTopic {
  const byId = new Map(circles.map((c) => [c.id, c]));
  const picked = selected.map((id) => byId.get(id)).filter((c): c is CircleRef => c !== undefined);

  if (picked.length === 1) return fromCircle(picked[0]);

  if (picked.length > 1) {
    const details = picked.filter((c) => c.detail);
    if (details.length === 1) return fromCircle(details[0]);
    if (details.length > 1) {
      const mine = caregiverDetail(answers);
      const ownId = mine ? detailCircleId(mine) : undefined;
      return fromCircle(details.find((c) => c.id === ownId) ?? details[0]);
    }
    return fromCircle(picked[0]);
  }

  const detail = caregiverDetail(answers);
  if (detail) return detailTopic(detail);
  const situation = caregiverSituation(answers);
  if (situation) return situationTopic(situation);
  return AIDANCE_TOPIC;
}

/** Vrai si le texte contient un mot du sujet. Les mots courts exigent une frontière (évite « sep » dans « séparation »). */
export function matchesTopic(text: string, keywords: string[]): boolean {
  const n = norm(text);
  return keywords.some((keyword) => {
    const key = norm(keyword);
    if (!key) return false;
    if (key.length <= 4) {
      const safe = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|[^a-z0-9])${safe}(?:[^a-z0-9]|$)`).test(n);
    }
    return n.includes(key);
  });
}
