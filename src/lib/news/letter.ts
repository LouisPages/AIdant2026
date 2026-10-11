/**
 * Rédaction de la lettre. Le modèle ne reçoit pas les URL : il ne choisit que des numéros,
 * et le serveur reconstruit les liens à partir des articles réellement lus.
 */
import { ConverseCommand, type ConverseCommandInput } from "@aws-sdk/client-bedrock-runtime";
import { reportBedrock, runtimeClient } from "@/lib/ai/bedrock";
import { judgeEnabled, judgeModel } from "@/lib/moderation/judge";
import { collectItems } from "./fetch";
import type { NewsTopic } from "./topic";
import type { CircleLetter, NewsItem, NewsLink } from "./types";

const SYSTEM = `Tu rédiges une courte lettre d'information pour des aidants familiaux, en français, avec le vouvoiement.
Tu ne donnes aucun conseil médical, aucun traitement, aucune posologie, aucune conduite à tenir.
Tu n'inventes aucun chiffre, aucune date, aucun lieu, aucun nom de dispositif. Chaque détail que tu cites doit être écrit dans un titre ou un chapô. Si le chapô est « (aucun) », tu ne racontes pas l'article : tu dis seulement que la source publie un texte sur ce sujet.
Le paragraphe fait trois à cinq phrases, sans liste et sans lien. Tu retiens ensuite les numéros de 2 à 4 articles, les plus utiles pour un aidant sur ce sujet.`;

const TOOL: NonNullable<ConverseCommandInput["toolConfig"]> = {
  tools: [
    {
      toolSpec: {
        name: "rediger",
        description: "Enregistre le paragraphe et les numéros d'articles retenus.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Paragraphe de trois à cinq phrases." },
              picks: {
                type: "array",
                description: "Numéros des articles cités, entre 1 et le nombre d'articles fournis.",
                items: { type: "integer" },
              },
            },
            required: ["summary", "picks"],
          },
        },
      },
    },
  ],
  toolChoice: { tool: { name: "rediger" } },
};

const ADVICE = /\b(\d+\s*mg|posologie|augmentez|diminuez|arrêtez le traitement|arretez le traitement|il faut prendre)\b/i;

function formatDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(date);
}

/** Écarte un paragraphe qui donne une conduite à tenir ou qui ne dit presque rien. */
export function acceptSummary(raw: string): string | null {
  let text = raw.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  if (text.length > 700) {
    const cut = text.slice(0, 700);
    const end = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("?"), cut.lastIndexOf("!"));
    text = end > 200 ? cut.slice(0, end + 1) : "";
  }
  if (text.length < 40 || ADVICE.test(text)) return null;
  return text;
}

function picksOf(raw: unknown, count: number): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const value of raw) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(n) || n < 1 || n > count || out.includes(n)) continue;
    out.push(n);
    if (out.length === 4) break;
  }
  return out;
}

function toLink(item: NewsItem): NewsLink {
  const date = formatDate(item.date);
  return { title: item.title, url: item.url, source: item.source, ...(date ? { date } : {}) };
}

async function draft(topic: NewsTopic, items: NewsItem[]): Promise<{ text: string | null; picks: number[] } | null> {
  if (!judgeEnabled()) return null;
  const body = items
    .map((item, index) => {
      const when = formatDate(item.date) ?? "date inconnue";
      const chapo = item.excerpt ? item.excerpt.slice(0, 320) : "(aucun)";
      return `${index + 1}. [${item.source}, ${when}] ${item.title}\nChapô : ${chapo}`;
    })
    .join("\n\n");
  try {
    const res = await runtimeClient().send(
      new ConverseCommand({
        modelId: judgeModel(),
        system: [{ text: SYSTEM }],
        messages: [{ role: "user", content: [{ text: `Sujet de la lettre : ${topic.label}\n\nArticles :\n${body}` }] }],
        toolConfig: TOOL,
        inferenceConfig: { maxTokens: 600, temperature: 0 },
      }),
      { abortSignal: AbortSignal.timeout(12_000) },
    );
    reportBedrock(true);
    const raw = res.output?.message?.content?.find((part) => part.toolUse)?.toolUse?.input as
      | { summary?: unknown; picks?: unknown }
      | undefined;
    if (!raw) return null;
    const text = typeof raw.summary === "string" ? acceptSummary(raw.summary) : null;
    return { text, picks: picksOf(raw.picks, items.length) };
  } catch (error) {
    reportBedrock(false, error);
    return null;
  }
}

/** Produit une lettre à partir des flux du sujet. `null` s'il n'y a aucun article fiable. */
export async function composeLetter(topic: NewsTopic): Promise<CircleLetter | null> {
  const items = await collectItems(topic);
  if (items.length === 0) return null;
  const written = await draft(topic, items);
  const picks = written && written.picks.length > 0 ? written.picks : items.slice(0, Math.min(3, items.length)).map((_, index) => index + 1);
  const links = picks.map((n) => items[n - 1]).filter((item): item is NewsItem => item !== undefined).map(toLink);
  if (links.length === 0) return null;
  return {
    topicId: topic.id,
    label: topic.label,
    summary: written?.text ?? null,
    links,
    generatedAt: new Date().toISOString(),
  };
}
