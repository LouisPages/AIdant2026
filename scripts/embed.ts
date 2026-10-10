/**
 * Calcule les vecteurs (Amazon Titan Text Embeddings V2, 512 dimensions) des cercles, fils, ressources et
 * suggestions, et les enregistre dans DynamoDB. Incrémental : seuls les textes modifiés sont recalculés.
 *
 *   npm run db:embed            calcule ce qui manque ou a changé
 *   npm run db:embed -- --all   recalcule tout
 */
import { EMBED_DIMENSIONS, EMBED_MODEL_ID, embedText } from "../src/lib/ai/bedrock";
import {
  circleDocument,
  resourceDocument,
  suggestionDocument,
  threadDocument,
  type EmbedKind,
} from "../src/lib/ai/documents";
import { hashText, packVector } from "../src/lib/ai/vector";
import { batchDelete, batchPut, explainAwsError, queryType, type Item } from "../src/lib/db/client";
import { loadCatalog, loadSolutionData } from "../src/lib/db/catalog";
import { keys } from "../src/lib/db/keys";

const all = process.argv.includes("--all");

type Doc = { kind: EmbedKind; id: string; text: string };

async function main() {
  const [catalog, { suggestions }, existingItems] = await Promise.all([loadCatalog(), loadSolutionData(), queryType("emb")]);

  const docs: Doc[] = [
    ...catalog.circles.map((c) => ({ kind: "circle" as const, id: c.id, text: circleDocument(c, catalog.threads) })),
    ...catalog.threads.map((t) => ({ kind: "thread" as const, id: t.id, text: threadDocument(t) })),
    ...Object.values(catalog.resources).map((r) => ({ kind: "resource" as const, id: r.id, text: resourceDocument(r) })),
    ...suggestions.map((s) => ({ kind: "suggestion" as const, id: s.id, text: suggestionDocument(s) })),
  ];

  const known = new Map(existingItems.map((i) => [`${i.kind}#${i.refId}`, i]));
  const todo = docs.filter((d) => {
    const old = known.get(`${d.kind}#${d.id}`);
    return all || !old || old.hash !== hashText(d.text) || old.model !== EMBED_MODEL_ID || old.dim !== EMBED_DIMENSIONS;
  });
  console.log(`${docs.length} textes, ${todo.length} à calculer (${docs.length - todo.length} déjà à jour). Modèle : ${EMBED_MODEL_ID}.`);

  const fresh: Item[] = [];
  let failures = 0;
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const d = todo[next++];
      for (let attempt = 0; ; attempt++) {
        try {
          const vec = await embedText(d.text, 15_000);
          fresh.push({
            ...keys.embedding(d.kind, d.id),
            kind: d.kind,
            refId: d.id,
            model: EMBED_MODEL_ID,
            dim: EMBED_DIMENSIONS,
            hash: hashText(d.text),
            vec: packVector(vec),
            updatedAt: new Date().toISOString(),
          });
          break;
        } catch (e) {
          const throttled = (e as Error).name === "ThrottlingException" || (e as Error).name === "TimeoutError";
          if (throttled && attempt < 5) {
            await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
            continue;
          }
          failures++;
          console.error(`  échec ${d.kind}#${d.id} : ${(e as Error).name} ${(e as Error).message.slice(0, 120)}`);
          break;
        }
      }
      if (next % 25 === 0) console.log(`  ${Math.min(next, todo.length)}/${todo.length}…`);
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));

  if (fresh.length) await batchPut(fresh);

  // Nettoyage : vecteurs dont l'élément n'existe plus.
  const valid = new Set(docs.map((d) => `${d.kind}#${d.id}`));
  const orphans = existingItems.filter((i) => !valid.has(`${i.kind}#${i.refId}`));
  if (orphans.length) await batchDelete(orphans.map((i) => ({ PK: i.PK, SK: i.SK })));

  console.log(
    `Terminé : ${fresh.length} vecteurs écrits, ${orphans.length} obsolètes supprimés${failures ? `, ${failures} échec(s)` : ""}.`,
  );
  if (failures) process.exitCode = 1;
}

main().catch((e) => {
  console.error(explainAwsError(e));
  process.exit(1);
});
