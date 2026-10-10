/** Back-office de modération : cas à traiter et décisions tracées. */
import { randomUUID } from "node:crypto";
import type { HelpResource, ModerationCase, ModerationDecision } from "@/lib/types";
import { loadHelpResources } from "./catalog";
import { putItem, queryType, ttl, type Item } from "./client";
import { keys, stripKeys } from "./keys";

export async function loadModeration(): Promise<{
  cases: ModerationCase[];
  decisions: Record<string, ModerationDecision>;
  helpResources: HelpResource[];
}> {
  const [caseItems, decisionItems, helpResources] = await Promise.all([
    queryType("moderation"),
    queryType("moddecision"),
    loadHelpResources(),
  ]);
  const byOrder = (a: Item, b: Item) => (Number(a.order) || 0) - (Number(b.order) || 0);
  // Les cas créés par l'application d'abord (les plus récents en tête), puis le contenu de départ dans son ordre.
  const sorted = [
    ...caseItems.filter((i) => i.live).sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt))),
    ...caseItems.filter((i) => !i.live).sort(byOrder),
  ];
  const cases = sorted.map((i) => stripKeys(i) as unknown as ModerationCase);
  const decisions = Object.fromEntries(
    decisionItems.map((i) => {
      const { caseId, ...decision } = stripKeys(i) as unknown as ModerationDecision & { caseId: string };
      return [caseId, decision];
    }),
  );
  return { cases, decisions, helpResources };
}

export async function saveModerationDecision(caseId: string, decision: Omit<ModerationDecision, "decidedAt">) {
  const decidedAt = new Date().toISOString();
  await putItem({ ...keys.moderationDecision(caseId), caseId, ...decision, decidedAt } as Item);
  return { ...decision, decidedAt } satisfies ModerationDecision;
}

/**
 * Ajoute un cas à la file humaine. Il est rangé dans la partition de l'auteur : il disparaît avec ses données
 * (droit à l'effacement) ou à l'expiration du TTL.
 */
export async function createModerationCase(
  sid: string,
  input: Omit<ModerationCase, "id" | "receivedAt" | "live">,
  author: { pseudo: string; avatar: ModerationCase["authorAvatar"] },
): Promise<ModerationCase> {
  const id = `m-${randomUUID().slice(0, 12)}`;
  const receivedAt = new Date().toISOString();
  const moderationCase: ModerationCase = {
    ...input,
    id,
    receivedAt,
    live: true,
    authorPseudo: author.pseudo,
    authorAvatar: author.avatar,
  };
  await putItem({ ...keys.userModeration(sid, id, receivedAt), ...moderationCase, ttl: ttl() } as Item);
  return moderationCase;
}
