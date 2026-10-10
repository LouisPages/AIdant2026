import { connection } from "next/server";
import { ModerationView } from "@/components/moderation-view";
import { loadModeration } from "@/lib/db/moderation";

export default async function Moderation() {
  // Données lues en base à chaque requête (jamais prérendues au build).
  await connection();
  const { cases, decisions, helpResources } = await loadModeration();
  return <ModerationView cases={cases} initialDecisions={decisions} helpResources={helpResources} />;
}
