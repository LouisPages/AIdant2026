import { detailKey, otherKey, realValues, type Answers } from "@/lib/questionnaire";

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * Présentation publique composée automatiquement (sans IA) à partir des réponses du questionnaire.
 * L'utilisateur la relit et la modifie.
 */
export function composeIntro(answers: Answers): string {
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
  if (detail && detail !== "Autre") first += ` (${lowerFirst(detail)})`;
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
