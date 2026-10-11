/**
 * Prépare les lettres d'actualités : `npm run news:refresh`.
 * Des arguments limitent la préparation à ces sujets
 * (`det:maladie-de-parkinson`, `circle:c-demarches`, `sit:age`, `aidance`).
 */
import { circles } from "../seed/circles";
import { situationDetails } from "../seed/questionnaire";
import { refreshTopic } from "../src/lib/news/deliver";
import {
  AIDANCE_TOPIC,
  SITUATION_IDS,
  circleTopic,
  detailTopic,
  situationTopic,
  type NewsTopic,
} from "../src/lib/news/topic";

function allTopics(): NewsTopic[] {
  const seen = new Set<string>();
  const out: NewsTopic[] = [];
  const add = (topic: NewsTopic) => {
    if (seen.has(topic.id)) return;
    seen.add(topic.id);
    out.push(topic);
  };
  add(AIDANCE_TOPIC);
  for (const id of SITUATION_IDS) add(situationTopic(id));
  for (const circle of circles) add(circleTopic(circle));
  for (const detail of Object.values(situationDetails).flat()) {
    if (detail !== "Autre") add(detailTopic(detail));
  }
  return out;
}

async function pool<T>(items: T[], width: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: width }, async () => {
      for (;;) {
        const item = queue.shift();
        if (!item) return;
        await fn(item);
      }
    }),
  );
}

async function main() {
  const wanted = new Set(process.argv.slice(2));
  const topics = allTopics().filter((topic) => wanted.size === 0 || wanted.has(topic.id));
  if (topics.length === 0) {
    console.error("Aucun sujet correspondant.");
    process.exitCode = 1;
    return;
  }
  console.log(`${topics.length} sujet(s).`);
  let ready = 0;
  let empty = 0;
  await pool(topics, 2, async (topic) => {
    try {
      const letter = await refreshTopic(topic);
      if (!letter) {
        empty += 1;
        console.log(`vide  ${topic.id}`);
        return;
      }
      ready += 1;
      console.log(`ok    ${topic.id} · ${letter.links.length} lien(s)${letter.summary ? "" : " · sans paragraphe"}`);
    } catch (error) {
      empty += 1;
      console.log(`échec ${topic.id} · ${(error as Error).message}`);
    }
  });
  console.log(`\n${ready} lettre(s), ${empty} sans contenu.`);
}

main();
