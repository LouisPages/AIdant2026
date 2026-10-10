"use server";

/**
 * Couche « IA » : l'interface n'appelle que ces fonctions (Server Functions).
 * Elles lisent le contenu dans DynamoDB. Aujourd'hui le classement reste à base de règles ;
 * l'appel à Amazon Bedrock (`@aws-sdk/client-bedrock-runtime`, variables de `.env.example`)
 * s'ajoutera ici sans changer les signatures.
 */
import { loadCatalog, loadSolutionData } from "@/lib/db/catalog";
import { detailCircleId, detailKey, optionLabel, realValues, type Answers } from "@/lib/questionnaire";
import type { AiSuggestion, Circle, PersonRecommendation, Resource, Thread } from "@/lib/types";

export type Recommendation = {
  rank: number;
  circle: Circle;
  reason: string;
};

const first = (answers: Answers, id: string) => {
  const v = answers[id]?.[0];
  return v && v !== "skip" ? v : undefined;
};

/** Classe 5 cercles selon le profil et explique chaque suggestion. */
export async function recommendCircles(answers: Answers): Promise<Recommendation[]> {
  const { circles, questions } = await loadCatalog();
  const getCircle = (id: string) => circles.find((c) => c.id === id);
  const label = (partId: string, optionId: string) => optionLabel(questions, partId, optionId);

  const picks: { id: string; reason: string }[] = [];

  const relation = first(answers, "relation");
  const situation = first(answers, "situation");
  const poids = (answers.poids ?? []).filter((p) => p !== "skip");
  const detail = situation ? answers[detailKey("situation")]?.[0] : undefined;

  // Personnalisation maximale : le premier cercle reprend la maladie ou le handicap précisé.
  if (detail && detail !== "Autre") {
    const own = getCircle(detailCircleId(detail));
    if (own) {
      picks.push({
        id: own.id,
        reason: `Vous accompagnez un proche dont la situation est « ${detail} » : ${own.memberCount.toLocaleString("fr-FR")} aidants vivent la même chose au quotidien, et en parlent ici avec franchise.`,
      });
    }
  }

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
  if (relation && relationCircle[relation]) {
    picks.push({ id: relationCircle[relation], reason: relationReason[relation] });
  }

  const situationCircle: Record<string, string> = {
    age: "c-autonomie",
    handicap: "c-handicap",
    chronique: "c-neuro",
    accident: "c-accident",
  };
  if (situation && situationCircle[situation]) {
    picks.push({
      id: situationCircle[situation],
      reason: detail
        ? "Un cercle plus large pour toutes les situations proches de celle de la personne que vous aidez."
        : `La situation de la personne que vous aidez est proche de celle des membres : ${label("situation", situation)?.toLowerCase()}.`,
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
        reason: `Vous nous avez dit que ${label("poids", p)?.toLowerCase()} pèse en ce moment : des pairs en parlent ici avec douceur.`,
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
 * La modération est invisible côté utilisateur : le message est publié sans écran intermédiaire.
 * Plus tard, cet appel enverra le texte à Bedrock et placera les cas douteux dans la file du back-office.
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
  const { threads } = await loadCatalog();
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

/** Messages les plus pertinents, tous cercles confondus. Les cercles du membre passent en premier. */
export async function getRelevantThreads(joined: string[], answers: Answers): Promise<Thread[]> {
  const { threads } = await loadCatalog();
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
  suggestions: AiSuggestion[];
  people: PersonRecommendation[];
};

/** Articles Nello, suggestions IA et aidants à découvrir, triés selon les thèmes choisis. */
export async function recommendSolutions(answers: Answers): Promise<Solutions> {
  const [{ resources }, { suggestions, people }] = await Promise.all([loadCatalog(), loadSolutionData()]);
  const interests = [...realValues(answers, "poids"), ...realValues(answers, "recherche")];
  const rank = (topics: string[]) => topics.filter((t) => interests.includes(t)).length;
  const articles = Object.values(resources)
    .filter((r) => r.articleOrder !== undefined)
    .sort((a, b) => (a.articleOrder ?? 0) - (b.articleOrder ?? 0))
    .map((r) => ({ r, s: rank(r.topics ?? []) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.r);
  const ranked = [...suggestions].sort((a, b) => rank(b.topics) - rank(a.topics));
  return { articles, suggestions: ranked, people };
}
