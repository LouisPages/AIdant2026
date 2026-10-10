/**
 * Couche de services IA.
 *
 * L'interface utilisateur n'appelle QUE ces fonctions. Aujourd'hui elles
 * renvoient des données hardcodées (voir src/data). Pour brancher AWS
 * (Bedrock, etc.), remplacer le corps des fonctions par un appel serveur
 * (Route Handler ou Server Action) qui utilise `@aws-sdk/client-bedrock-runtime`
 * avec les variables définies dans `.env.example`. Les signatures ne changent pas.
 */
import { getCircle } from "@/data/circles";
import { optionLabel, detailKey, otherKey, realValues, type Answers } from "@/data/questionnaire";
import { resources } from "@/data/resources";
import { aiSuggestions, articleIds, articleTopics, peopleRecommendations } from "@/data/solutions";
import { threads } from "@/data/threads";
import type { Circle, Resource, Thread } from "@/data/types";

export type Recommendation = {
  rank: number;
  circle: Circle;
  reason: string;
};

const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const first = (answers: Answers, id: string) => {
  const v = answers[id]?.[0];
  return v && v !== "skip" ? v : undefined;
};

/** Classe 5 cercles selon le profil et explique chaque suggestion. */
export async function recommendCircles(answers: Answers): Promise<Recommendation[]> {
  await wait();
  const picks: { id: string; reason: string }[] = [];

  const relation = first(answers, "relation");
  const situation = first(answers, "situation");
  const poids = (answers.poids ?? []).filter((p) => p !== "skip");

  const relationCircle: Record<string, string> = {
    conjoint: "c-conjoints",
    parent: "c-parent",
    enfant: "c-handicap-enfant",
    autre: "c-debut",
  };
  const relationReason: Record<string, string> = {
    conjoint: "Vous accompagnez tous votre conjoint ou votre conjointe : ici, on se comprend sans longues explications.",
    parent: "Vous aidez tous un père ou une mère : ici, on se comprend sans longues explications.",
    enfant: "Vous êtes tous parents d'un enfant qui a besoin de soutien : ici, on se comprend sans longues explications.",
    autre: "Vous accompagnez tous un proche : un bon endroit pour poser vos premières questions.",
  };
  if (relation) {
    picks.push({ id: relationCircle[relation], reason: relationReason[relation] });
  }

  const situationCircle: Record<string, string> = {
    age: "c-autonomie",
    handicap: "c-handicap",
    chronique: "c-neuro",
    accident: "c-accident",
  };
  if (situation) {
    const detail = answers[detailKey("situation")]?.[0];
    picks.push({
      id: situationCircle[situation],
      reason: detail
        ? `Vous accompagnez une personne concernée par ${lowerFirst(detail)} : les membres vivent des situations très proches.`
        : `La situation de la personne que vous aidez est proche de celle des membres : ${optionLabel("situation", situation)?.toLowerCase()}.`,
    });
  }

  if (first(answers, "entourage") === "seul" || poids.includes("solitude")) {
    picks.push({
      id: "c-solos",
      reason: "Vous aidez sans beaucoup d'appui autour de vous, comme beaucoup de membres ici.",
    });
  }

  const poidsCircle: Record<string, string> = {
    fatigue: "c-sommeil",
    sommeil: "c-sommeil",
    demarches: "c-demarches",
    finances: "c-demarches",
    travail: "c-salaries",
    culpabilite: "c-culpabilite",
    temps: "c-repit",
  };
  for (const p of poids) {
    if (poidsCircle[p]) {
      picks.push({
        id: poidsCircle[p],
        reason: `Vous nous avez dit que ${optionLabel("poids", p)?.toLowerCase()} pèse en ce moment : des pairs en parlent ici avec douceur.`,
      });
    }
  }

  if (first(answers, "pro") === "salarie" && !picks.some((p) => p.id === "c-salaries")) {
    picks.push({
      id: "c-salaries",
      reason: "Vous travaillez en aidant : un espace pour concilier les deux, invisible de votre employeur.",
    });
  }

  // Compléments par défaut
  picks.push(
    { id: "c-repit", reason: "Un espace pour souffler, apprécié par les aidants au profil proche du vôtre." },
    { id: "c-demarches", reason: "Les démarches pèsent presque toujours : mieux vaut s'y retrouver à plusieurs." },
    { id: "c-debut", reason: "Un bon point de départ pour poser ses repères." },
  );

  const seen = new Set<string>();
  const result: Recommendation[] = [];
  for (const p of picks) {
    const circle = getCircle(p.id);
    if (!circle || seen.has(p.id)) continue;
    seen.add(p.id);
    result.push({ rank: result.length + 1, circle, reason: p.reason });
    if (result.length === 5) break;
  }
  return result;
}

export type ModerationVerdict = { decision: "publish" };

/**
 * La modération est invisible côté utilisateur : le message est publié sans
 * écran intermédiaire. Plus tard, cet appel enverra le texte à Bedrock et
 * placera les cas douteux dans la file du back-office.
 */
export async function moderateMessage(text: string): Promise<ModerationVerdict> {
  void text;
  return { decision: "publish" };
}

/** Repère un message de détresse (traité côté back-office uniquement pour l'instant). */
export async function detectDistress(text: string): Promise<{ distress: boolean }> {
  return { distress: /n'en peux plus|mieux sans moi|plus la force/i.test(text) };
}

/** Suggère des fils déjà traités avant de publier une question. */
export async function findSimilarThreads(text: string, circleId: string): Promise<Thread[]> {
  const t = text.toLowerCase();
  if (t.trim().length < 15) return [];
  await wait(250);
  const words = t.split(/\W+/).filter((w) => w.length > 4);
  const scored = threads
    .filter((th) => th.kind === "question" && th.replies.length > 0)
    .map((th) => {
      const hay = `${th.title} ${th.body}`.toLowerCase();
      const score = words.filter((w) => hay.includes(w)).length + (th.circleId === circleId ? 0.5 : 0);
      return { th, score };
    })
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((x) => x.th);
}

/** Résumé d'un fil. */
export async function summarizeThread(thread: Thread): Promise<string> {
  await wait(600);
  return (
    thread.summary ??
    "Les pairs partagent leur expérience et se rejoignent sur l'importance de prendre le temps, par petites étapes."
  );
}

/**
 * Présentation publique pré-écrite à partir des réponses du questionnaire.
 * Plus tard : appel à un petit modèle (Bedrock). L'utilisateur la relit et la modifie.
 */
export async function generateIntro(answers: Answers): Promise<string> {
  await wait(1100);
  const relation = realValues(answers, "relation")[0];
  const other = answers[otherKey("relation")]?.[0];
  const detail = answers[detailKey("situation")]?.[0];
  const depuis = realValues(answers, "depuis")[0];
  const poids = realValues(answers, "poids");
  const recherche = realValues(answers, "recherche");

  const who: Record<string, string> = {
    conjoint: "J'accompagne mon conjoint",
    parent: "J'aide l'un de mes parents",
    enfant: "Je suis le parent d'un enfant qui a besoin de soutien",
    autre: other ? `J'accompagne un proche (${other})` : "J'accompagne un proche",
  };
  const since: Record<string, string> = {
    "moins-1": " depuis moins d'un an",
    "1-3": " depuis quelques années",
    "plus-3": " depuis plus de trois ans",
  };

  let first = `${who[relation] ?? "J'accompagne un proche"}${since[depuis] ?? ""}`;
  if (detail && detail !== "Autre") first += `, concerné par ${lowerFirst(detail)}`;
  first += ".";

  const seeks: string[] = [];
  if (recherche.includes("ecoute")) seeks.push("un peu d'écoute");
  if (recherche.includes("astuces")) seeks.push("des astuces du quotidien");
  if (recherche.includes("partager")) seeks.push("partager mon expérience");
  if (recherche.includes("lire")) seeks.push("lire et apprendre des autres");
  let second = seeks.length ? `Je viens ici chercher ${seeks.join(" et ")}.` : "Je viens ici pour échanger avec des personnes qui me comprennent.";
  if (poids.includes("fatigue")) second = `La fatigue pèse en ce moment. ${second}`;

  return `${first} ${second}`;
}

/** Messages les plus pertinents, tous cercles confondus. Les cercles du membre passent en premier. */
export async function getRelevantThreads(joined: string[], answers: Answers): Promise<Thread[]> {
  await wait(150);
  const keywords: Record<string, string[]> = {
    fatigue: ["fatigue", "nuit", "sommeil"],
    sommeil: ["nuit", "sommeil"],
    solitude: ["seul", "solo", "demander de l'aide"],
    demarches: ["allocation", "dossier", "papier", "démarche"],
    finances: ["allocation", "aide"],
    travail: ["employeur", "travail"],
    culpabilite: ["coupable", "culpabil", "agace"],
    repit: ["répit", "accueil de jour", "week-end"],
    temps: ["répit", "temps"],
    ecoute: ["écoute"],
    astuces: ["astuce", "carnet", "rituel"],
  };
  const interests = [...realValues(answers, "poids"), ...realValues(answers, "recherche")];
  const score = (t: Thread, index: number) => {
    const hay = `${t.title} ${t.body}`.toLowerCase();
    const hits = interests.reduce((n, i) => n + (keywords[i]?.some((k) => hay.includes(k)) ? 1 : 0), 0);
    return (
      (joined.includes(t.circleId) ? 100 : 0) +
      hits * 10 +
      (t.replies.length > 0 ? 3 : 0) +
      (t.relevance ?? 0) -
      index * 0.1
    );
  };
  return threads
    .filter((t) => !t.older)
    .map((t, i) => ({ t, s: score(t, i) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.t);
}

export type Solutions = {
  articles: Resource[];
  suggestions: typeof aiSuggestions;
  people: typeof peopleRecommendations;
};

/** Articles Nello, suggestions IA et aidants à découvrir, triés selon les thèmes choisis. */
export async function recommendSolutions(answers: Answers): Promise<Solutions> {
  await wait(250);
  const interests = [...realValues(answers, "poids"), ...realValues(answers, "recherche")];
  const rank = (topics: string[]) => topics.filter((t) => interests.includes(t)).length;
  const articles = articleIds
    .map((id) => ({ id, s: rank(articleTopics[id] ?? []) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => resources[x.id])
    .filter(Boolean);
  const suggestions = [...aiSuggestions].sort((a, b) => rank(b.topics) - rank(a.topics));
  return { articles, suggestions, people: peopleRecommendations };
}
