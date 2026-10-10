/** Cas envoyés à la file humaine : détresse repérée, ou relecture demandée par l'auteur d'un message refusé. */
import type { ModerationCase } from "@/lib/types";
import type { BlockCategory, Severity, Signal } from "./types";

type NewCase = Omit<ModerationCase, "id" | "receivedAt" | "live">;

export function signalCase(input: { circleId: string; message: string; signal: Signal }): NewCase {
  const severe = input.signal === "detresse";
  return {
    type: "detresse",
    circleId: input.circleId,
    authorId: "me",
    message: input.message,
    aiLabel: severe ? "Détresse détectée" : "Dévalorisation de soi",
    aiReason: severe
      ? "Le message révèle un épuisement profond. Il est conservé et publié, avec les ressources d'aide proposées à l'auteur."
      : "L'auteur se dévalorise fortement. Le message est publié (le refuser l'isolerait) et une aide discrète lui est proposée. Un mot bienveillant de l'équipe peut aider.",
    actions: [
      { id: "contact", label: "Contacter la personne", recommended: true },
      { id: "keep", label: "Garder en suivi" },
    ],
  };
}
const CONTEST_LABEL: Record<BlockCategory, { type: ModerationCase["type"]; label: string }> = {
  ton: { type: "ton", label: "Propos refusés, relecture demandée" },
  contenu: { type: "ton", label: "Contenu refusé, relecture demandée" },
  violence: { type: "ton", label: "Propos violents, relecture demandée" },
  irrespect: { type: "ton", label: "Propos sur la fin de vie, relecture demandée" },
  coordonnees: { type: "ton", label: "Coordonnées, relecture demandée" },
  medical: { type: "medical", label: "Dose ou traitement, relecture demandée" },
};

export function contestCase(input: {
  circleId: string;
  message: string;
  category: BlockCategory;
  severity?: Severity;
  rationale?: string;
}): NewCase {
  const { type, label } = CONTEST_LABEL[input.category];
  const how =
    input.severity === "zone_grise"
      ? "Le message a été refusé par prudence (zone grise : un seul indice, modéré) avant publication."
      : "Le message a été refusé automatiquement avant publication.";
  return {
    type,
    circleId: input.circleId,
    authorId: "me",
    message: input.message,
    aiLabel: input.severity === "zone_grise" ? `${label} (zone grise)` : label,
    aiReason: `${how} L'auteur pense à une erreur et demande une relecture humaine. Il n'est pas publié tant qu'aucune décision n'est prise.${
      input.rationale ? ` Ce qu'a vu la modération : ${input.rationale}` : ""
    }`,
    actions: [
      { id: "invite", label: "Inviter l'auteur à reformuler", recommended: true },
      { id: "publish", label: "Publier tel quel" },
      { id: "remove", label: "Retirer" },
    ],
  };
}
