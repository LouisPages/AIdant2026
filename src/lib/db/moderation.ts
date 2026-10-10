/** Back-office de modération : cas à traiter et décisions tracées. */
import type { HelpResource, ModerationCase, ModerationDecision } from "@/lib/types";
import { loadHelpResources } from "./catalog";
import { putItem, queryType, type Item } from "./client";
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
  const cases = caseItems.sort(byOrder).map((i) => stripKeys(i) as unknown as ModerationCase);
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
