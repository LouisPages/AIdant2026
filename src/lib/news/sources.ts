/**
 * Origines autorisées de la lettre. Chaque adresse a été vérifiée : elle renvoie un flux RSS.
 * Un flux « centré » ne parle que de son sujet. Un flux généraliste est filtré par les mots du sujet.
 */
import type { NewsTopic } from "./topic";

export type Origin = {
  name: string;
  url: string;
  kind: "feed" | "page";
  /** Vrai quand le flux est déjà limité au sujet (association) : pas de filtre par mots. */
  focused: boolean;
};

const feed = (name: string, url: string, focused = false): Origin => ({ name, url, kind: "feed", focused });

const INSERM = feed("Inserm", "https://presse.inserm.fr/feed/");
const SANTE_PUBLIQUE = feed("Santé publique France", "https://www.santepubliquefrance.fr/rss/actualites.xml");
const AIDANTS = feed("Aidants.fr", "https://www.aidants.fr/feed/", true);
const CNSA = feed("CNSA", "https://www.cnsa.fr/flux-rss.xml/article", true);
const AVEC_NOS_PROCHES = feed("Avec nos proches", "https://www.avecnosproches.com/feed/", true);

const SCIENCE = [INSERM, SANTE_PUBLIQUE];
const CAREGIVERS = [AIDANTS, CNSA, AVEC_NOS_PROCHES];

const FONDATION_ALZHEIMER = feed("Fondation Alzheimer", "https://www.fondation-alzheimer.org/feed/", true);
const RECHERCHE_ALZHEIMER = feed("Fondation Recherche Alzheimer", "https://alzheimer-recherche.org/feed/", true);
const FRANCE_PARKINSON = feed("France Parkinson", "https://www.franceparkinson.fr/feed/", true);
const AFSEP = feed("AFSEP", "https://afsep.fr/feed/", true);
const ARSLA = feed("ARSLA", "https://www.arsla.org/feed/", true);
const HUNTINGTON = feed("Huntington France", "https://huntington.fr/feed/", true);
const LIGUE_CANCER = feed("Ligue contre le cancer", "https://www.ligue-cancer.net/rss.xml", true);
const FONDATION_ARC = feed("Fondation ARC", "https://www.fondation-arc.org/feed/", true);
const AJD = feed("Aide aux jeunes diabétiques", "https://www.ajd-diabete.fr/feed/", true);
const AFA = feed("AFA Crohn RCH", "https://www.afa.asso.fr/feed/", true);
const EPILEPSIE = feed("Épilepsie-France", "https://www.epilepsie-france.com/feed/", true);
const FRANCE_REIN = feed("France Rein", "https://www.francerein.org/feed/", true);
const ANDAR = feed("ANDAR", "https://www.polyarthrite.org/feed/", true);
const TRISOMIE = feed("Trisomie 21 France", "https://trisomie21-france.org/feed/", true);
const PARALYSIE = feed("Fondation Paralysie Cérébrale", "https://fondationparalysiecerebrale.org/feed/", true);
const FFDYS = feed("FFDys", "https://www.ffdys.com/feed/", true);
const UNAPEI = feed("UNAPEI", "https://www.unapei.org/feed/", true);
const ALLIANCE_RARES = feed("Alliance maladies rares", "https://alliance-maladies-rares.org/feed/", true);
const FEDECARDIO = feed("Fédération française de cardiologie", "https://www.fedecardio.org/feed/");
const AVEUGLES = feed("Fédération des Aveugles de France", "https://aveuglesdefrance.org/feed/", true);
const SURDI = feed("SurdiFrance", "https://www.surdifrance.org/feed/", true);
const SPLF = feed("Société de pneumologie de langue française", "https://splf.fr/feed/");

/** Associations déjà centrées sur la précision, en plus des flux scientifiques filtrés. */
const DETAIL_ORIGINS: Record<string, Origin[]> = {
  "maladie-d-alzheimer": [FONDATION_ALZHEIMER, RECHERCHE_ALZHEIMER],
  "maladie-d-alzheimer-et-apparentees": [FONDATION_ALZHEIMER, RECHERCHE_ALZHEIMER],
  "demence-vasculaire": [RECHERCHE_ALZHEIMER],
  "maladie-de-parkinson": [FRANCE_PARKINSON],
  "sclerose-en-plaques": [AFSEP],
  "sclerose-laterale-amyotrophique-sla": [ARSLA],
  "maladie-de-huntington": [HUNTINGTON],
  cancer: [LIGUE_CANCER, FONDATION_ARC],
  diabete: [AJD],
  "maladie-de-crohn": [AFA],
  epilepsie: [EPILEPSIE],
  "insuffisance-renale-dialyse": [FRANCE_REIN],
  "polyarthrite-rhumatoide": [ANDAR],
  "trisomie-21": [TRISOMIE],
  "paralysie-cerebrale": [PARALYSIE],
  "troubles-dys": [FFDYS],
  "deficience-intellectuelle": [UNAPEI],
  "autisme-tsa": [UNAPEI],
  polyhandicap: [UNAPEI],
  "maladie-rare": [ALLIANCE_RARES],
  "insuffisance-cardiaque": [FEDECARDIO],
  "deficience-visuelle": [AVEUGLES],
  "handicap-visuel": [AVEUGLES],
  "deficience-auditive": [SURDI],
  "handicap-auditif": [SURDI],
  "insuffisance-respiratoire-bpco": [SPLF],
};

const CIRCLE_ORIGINS: Record<string, Origin[]> = {
  "c-handicap-enfant": [UNAPEI, ...CAREGIVERS],
  "c-neuro": [...SCIENCE, ...CAREGIVERS],
  "c-autonomie": [...SCIENCE, ...CAREGIVERS],
  "c-handicap": [UNAPEI, ...SCIENCE, ...CAREGIVERS],
  "c-accident": [...SCIENCE, ...CAREGIVERS],
  "c-sommeil": [SANTE_PUBLIQUE, INSERM, ...CAREGIVERS],
};

const SITUATION_ORIGINS: Record<string, Origin[]> = {
  "sit:age": [...SCIENCE, ...CAREGIVERS],
  "sit:handicap": [UNAPEI, ...SCIENCE, ...CAREGIVERS],
  "sit:chronique": [...SCIENCE, ...CAREGIVERS],
  "sit:accident": [...SCIENCE, ...CAREGIVERS],
};

const cap = (list: Origin[]): Origin[] => {
  const seen = new Set<string>();
  const out: Origin[] = [];
  for (const origin of list) {
    if (seen.has(origin.url)) continue;
    seen.add(origin.url);
    out.push(origin);
    if (out.length === 4) break;
  }
  return out;
};

/** Deux à quatre origines pour le sujet, associations d'abord, institutions ensuite. */
export function originsFor(topic: NewsTopic): Origin[] {
  if (topic.id.startsWith("det:")) {
    const specific = DETAIL_ORIGINS[topic.id.slice(4)] ?? [];
    return cap([...specific, ...SCIENCE]);
  }
  if (topic.id.startsWith("sit:")) return cap(SITUATION_ORIGINS[topic.id] ?? [...SCIENCE, ...CAREGIVERS]);
  if (topic.id.startsWith("circle:")) return cap(CIRCLE_ORIGINS[topic.id.slice(7)] ?? CAREGIVERS);
  return CAREGIVERS;
}
