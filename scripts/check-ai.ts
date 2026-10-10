/**
 * Vérification de bout en bout du socle IA : `npm run ai:check`.
 * Rejoue le profil de test (profil-test.json) et des messages types, et montre la contribution de chaque niveau.
 * Compare le classement complet (tags + caractéristiques + sémantique) au classement sans sémantique.
 */
import { readFileSync } from "node:fs";
import { bedrockAvailable } from "../src/lib/ai/bedrock";
import { embedQuery, loadIndex, vectorKey } from "../src/lib/ai/index-store";
import { rankCircles, rankSolutions, rankThreads, similarThreads } from "../src/lib/ai/recommend";
import { cosine } from "../src/lib/ai/vector";
import { SIMILAR_THREAD_MIN_COSINE } from "../src/lib/ai/weights";
import { loadCatalog } from "../src/lib/db/catalog";
import { moderate } from "../src/lib/moderation/moderate";
import { profileTags } from "../src/lib/tags";

const answers = JSON.parse(readFileSync("profil-test.json", "utf8")) as Record<string, string[]>;
const n = (x: number) => x.toFixed(2);
let problems = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "OK    " : "ÉCHEC "} ${label}`);
  if (!ok) problems++;
};

async function main() {
  console.log(`Profil de test : ${profileTags(answers).join(" ")}\n`);

  const index = await loadIndex();
  console.log(`Index vectoriel : ${index.vectors.size} vecteurs. Bedrock : ${bedrockAvailable() ? "actif" : "inactif"}.\n`);

  // 1. Cercles
  const full = await rankCircles(answers, 5);
  console.log("Cercles recommandés (niveaux : tags / caractéristiques / sémantique / précision)");
  for (const r of full) {
    const p = r.why.parts;
    console.log(
      `  ${r.rank}. ${r.circle.name.padEnd(46)} ${n(r.why.total)}  [${n(p.tags)} / ${n(p.profile)} / ${n(p.semantic)} / ${n(p.anchor)}]`,
    );
    console.log(`     ${r.reason}`);
  }
  check(full[0]?.circle.id === "c-d-maladie-d-alzheimer", "le premier cercle est celui de la précision exacte (maladie d'Alzheimer)");
  check(!full.some((r) => r.circle.detail && r.circle.id !== "c-d-maladie-d-alzheimer"), "aucun cercle d'une autre maladie");
  check(full.every((r) => r.why.matched), "chaque cercle proposé a au moins un tag ou une caractéristique en commun");

  // 2. Fils
  const threads = await rankThreads(["c-conjoints"], answers);
  console.log("\nFils les mieux classés (cercle « conjoints » rejoint)");
  for (const r of threads.slice(0, 6)) {
    console.log(`  ${n(r.why.total)}  ${r.thread.circleId.padEnd(18)} ${r.thread.title.slice(0, 64)}  ${r.why.matchedTags.join(" ")}`);
  }
  check(threads.slice(0, 10).every((r) => r.why.matched), "les 10 premiers fils ont un point commun explicite");

  // 3. Solutions
  const sol = await rankSolutions(answers);
  console.log("\nSolutions");
  console.log(`  Articles    : ${sol.articles.slice(0, 3).map((a) => a.title).join(" | ")}`);
  console.log(`  Suggestions : ${sol.suggestions.slice(0, 3).map((s) => s.title).join(" | ")}`);
  console.log(`  Aidants     : ${sol.people.map((p) => `${p.memberId} (${p.traits.join(", ")})`).join(" | ")}`);

  // 4. Sans sémantique : le classement doit rester cohérent
  const before = process.env.AI_MODE;
  process.env.AI_MODE = "rules";
  const rules = await rankCircles(answers, 5);
  process.env.AI_MODE = before;
  console.log(`\nSans Bedrock (tags + caractéristiques) : ${rules.map((r) => r.circle.name).join(" | ")}`);
  check(rules[0]?.circle.id === "c-d-maladie-d-alzheimer", "repli local : même premier cercle");
  const shared = rules.filter((r) => full.some((f) => f.circle.id === r.circle.id)).length;
  check(shared >= 3, `repli local : ${shared}/5 cercles en commun avec le classement complet`);

  // 5. Fils proches d'un brouillon (calibrage du seuil)
  console.log(`\nFils proches d'un brouillon (seuil cosinus ${SIMILAR_THREAD_MIN_COSINE})`);
  const { threads: all } = await loadCatalog();
  const drafts: [string, boolean][] = [
    ["Ma mère ne dort plus la nuit et je suis épuisée, comment tenir ?", true],
    ["Comment obtenir l'allocation APA pour mon père ? Je ne comprends pas les dossiers.", true],
    ["Je me sens coupable quand je confie mon mari à l'accueil de jour.", true],
    ["Quelle est la meilleure recette de gâteau au chocolat pour ce week-end ?", false],
  ];
  for (const [text, shouldMatch] of drafts) {
    const vec = await embedQuery(text);
    const best = vec
      ? all
          .filter((t) => t.kind === "question" && t.replies.length > 0)
          .map((t) => ({ t, c: cosine(vec, index.vectors.get(vectorKey("thread", t.id)) ?? new Float32Array(0)) }))
          .sort((a, b) => b.c - a.c)[0]
      : undefined;
    const found = await similarThreads(text, "c-conjoints");
    console.log(`  « ${text.slice(0, 60)}… » meilleur cosinus ${best ? n(best.c) : "n/a"} → ${found.length} fil(s)`);
    if (vec) check(shouldMatch ? found.length > 0 : found.length === 0, shouldMatch ? "propose un fil proche" : "ne propose rien (hors sujet)");
  }

  // 6. Modération : règles locales + Guardrails (scores) + jury de juges (en parallèle)
  console.log("\nModération (publier / refuser ; détresse et dévalorisation : publiées, signalées aux humains, aide à l'auteur)");
  type Expect = "publish" | "ton" | "contenu" | "medical" | "coordonnees" | "violence" | "irrespect";
  const samples: { text: string; expect: Expect; signal?: "detresse" | "autodenigrement" }[] = [
    { text: "Merci pour vos conseils, la lampe de chevet a bien aidé cette nuit.", expect: "publish" },
    { text: "Je suis épuisée, j'ai pleuré dans la voiture hier soir. Vous tenez comment ?", expect: "publish" },
    { text: "J'ai peur qu'il meure cette nuit, je n'arrive pas à fermer l'œil.", expect: "publish" },
    { text: "Je crève de fatigue, elle me saoule et j'en ai marre de cette paperasse.", expect: "publish" },
    { text: "Je n'en peux plus, je me dis que ce serait mieux sans moi.", expect: "publish", signal: "detresse" },
    { text: "Je suis une merde, je n'arrive à rien avec elle.", expect: "publish", signal: "autodenigrement" },
    { text: "Vous êtes tous des connards, foutez-moi la paix.", expect: "ton" },
    { text: "Il va clamser le frérot, vivement que ça se termine.", expect: "irrespect" },
    { text: "Quel boulet ce vieux, vivement qu'il passe l'arme à gauche.", expect: "irrespect" },
    { text: "Ma mère dort mal, donnez-lui 10 mg de plus le soir, ça marche très bien.", expect: "medical" },
    { text: "Écrivez-moi sur marie.dupont@example.com ou au 06 12 34 56 78.", expect: "coordonnees" },
  ];
  for (const mode of ["bedrock", "rules"] as const) {
    process.env.AI_MODE = mode;
    for (const s of samples) {
      const t0 = Date.now();
      // En mode « rules », on change le texte pour ne pas retomber sur le verdict mis en cache.
      const r = await moderate(mode === "bedrock" ? s.text : `Bonjour. ${s.text}`);
      const got = r.verdict.decision === "publish" ? "publish" : r.verdict.category;
      // Les règles seules ne voient pas tout (par exemple une dévalorisation de soi sans mot-clé) : on n'exige que l'essentiel.
      const mustSignal = mode === "bedrock" || s.signal === "detresse";
      const okSignal = mustSignal ? (r.signal !== null) === (s.signal !== undefined) : s.signal === undefined ? r.signal === null : true;
      check(got === s.expect && okSignal, `${mode.padEnd(7)} ${got.padEnd(11)} ${String(r.signal ?? "-").padEnd(15)} via ${r.source.padEnd(9)} ${Date.now() - t0} ms  « ${s.text.slice(0, 45)}… »`);
    }
  }
  process.env.AI_MODE = before;

  // Cas que seul un niveau distant attrape. Un cas bénin refusé est un échec ; un cas nuancé non repéré est signalé.
  console.log("\nCas nuancés (Guardrails + jury de juges, avec le fil en contexte)");
  const parent = "Comment obtenir l'APA ? Je suis perdue dans les démarches, ça fait trois ans que j'aide ma mère.";
  const nuanced: { text: string; expect: "publish" | "ton" | "irrespect" | "medical" | "coordonnees"; context?: string }[] = [
    { text: "Sale vieille folle, tu ne mérites que ça.", expect: "ton" },
    { text: "Franchement, ceux qui placent leurs parents en maison de retraite ne méritent pas qu'on les écoute. C'est de l'abandon, point.", expect: "ton" },
    { text: "Bravo, trois ans pour comprendre qu'il faut demander l'APA. Vous êtes rapide.", expect: "ton", context: parent },
    { text: "Papa, c'est Tamagotchi niveau expert : tu nourris, tu nettoies, et ça finit par mourir quand même mdr", expect: "irrespect" },
    { text: "Moi je lui donne un demi-comprimé de somnifère en plus chaque soir, essayez aussi, ça marche.", expect: "medical" },
    { text: "Je déteste cette situation, j'en ai assez de tout, je pleure en cachette dans la salle de bain.", expect: "publish" },
    { text: "J'ai placé ma mère en établissement la semaine dernière, je me sens coupable mais je n'avais plus le choix.", expect: "publish" },
    { text: "Notre médecin a ajusté son traitement, on en a parlé longuement avec lui.", expect: "publish" },
    { text: "Je comprends tellement. Les premières années on ne sait même pas que ça existe, personne ne nous le dit.", expect: "publish", context: parent },
  ];
  for (const s of nuanced) {
    const t0 = Date.now();
    const r = await moderate(`${s.text} `, s.context ? { parent: s.context } : undefined);
    const got = r.verdict.decision === "publish" ? "publish" : `${r.verdict.category}${r.verdict.severity === "zone_grise" ? " (gris)" : ""}`;
    const detail = `${got.padEnd(16)} via ${r.source.padEnd(9)} ${Date.now() - t0} ms  « ${s.text.slice(0, 55)}… »`;
    if (s.expect === "publish") check(got === "publish", detail);
    else console.log(`  ${got.startsWith(s.expect) ? "repéré    " : "non repéré"} ${detail}`);
  }
  console.log(problems ? `\n${problems} vérification(s) en échec.` : "\nToutes les vérifications passent.");
  process.exitCode = problems ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
