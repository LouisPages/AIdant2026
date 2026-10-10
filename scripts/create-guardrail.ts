/**
 * Crée (ou supprime) le garde-fou Amazon Bedrock Guardrails de la modération.
 *
 *   npm run ai:guardrail                 crée le garde-fou, publie une version, mémorise son identifiant
 *   npm run ai:guardrail -- --recreate   supprime puis recrée (après modification des règles ci-dessous)
 *   npm run ai:guardrail -- --delete     supprime le garde-fou (à faire à la fin du game day)
 *
 * L'identifiant n'est pas secret : il est mémorisé dans DynamoDB (CONTENT#guardrail), l'application le lit
 * de là, sauf si BEDROCK_GUARDRAIL_ID / BEDROCK_GUARDRAIL_VERSION sont définis.
 *
 * Règles : uniquement ce qu'un espace d'entraide doit refuser (insultes, haine, contenu sexuel, injonctions
 * médicales, coordonnées personnelles). La détresse n'est PAS bloquée : elle est signalée à l'équipe humaine.
 */
import {
  BedrockClient,
  CreateGuardrailCommand,
  CreateGuardrailVersionCommand,
  DeleteGuardrailCommand,
  ListGuardrailsCommand,
  type CreateGuardrailCommandInput,
} from "@aws-sdk/client-bedrock";
import { REGION, deleteItem, explainAwsError, putItem } from "../src/lib/db/client";
import { keys } from "../src/lib/db/keys";

const NAME = "aidants-moderation";
const control = new BedrockClient({ region: REGION });

const args = new Set(process.argv.slice(2));

async function findExisting() {
  const res = await control.send(new ListGuardrailsCommand({}));
  return res.guardrails?.find((g) => g.name === NAME);
}

function config(tier: "STANDARD" | "CLASSIC"): CreateGuardrailCommandInput {
  const message = "Ce message ne peut pas être publié tel quel.";
  return {
    name: NAME,
    description: "Modération des messages de l'espace d'entraide entre aidants.",
    blockedInputMessaging: message,
    blockedOutputsMessaging: message,
    contentPolicyConfig: {
      filtersConfig: [
        { type: "INSULTS", inputStrength: "MEDIUM", outputStrength: "NONE" },
        { type: "HATE", inputStrength: "MEDIUM", outputStrength: "NONE" },
        { type: "SEXUAL", inputStrength: "MEDIUM", outputStrength: "NONE" },
        // Seuil bas : l'épuisement fait dire « j'ai envie de tout casser », ce qui n'est pas une menace.
        { type: "VIOLENCE", inputStrength: "LOW", outputStrength: "NONE" },
      ],
      tierConfig: { tierName: tier },
    },
    wordPolicyConfig: { managedWordListsConfig: [{ type: "PROFANITY" }] },
    topicPolicyConfig: {
      topicsConfig: [
        {
          name: "conseil-medical-dose",
          definition:
            "Recommandation à une autre personne de prendre, d'augmenter, de diminuer ou d'arrêter un médicament, avec une dose ou un schéma précis.",
          examples: [
            "Vous pouvez donner 10 mg de plus le soir.",
            "Arrêtez son traitement, ça ira mieux.",
            "Moi je double la dose quand elle est agitée, faites pareil.",
          ],
          type: "DENY",
        },
      ],
      tierConfig: { tierName: tier },
    },
    sensitiveInformationPolicyConfig: {
      piiEntitiesConfig: [
        { type: "EMAIL", action: "BLOCK", inputEnabled: true, outputEnabled: false },
        { type: "PHONE", action: "BLOCK", inputEnabled: true, outputEnabled: false },
      ],
    },
    ...(tier === "STANDARD" ? { crossRegionConfig: { guardrailProfileIdentifier: "us.guardrail.v1:0" } } : {}),
  };
}

async function create() {
  let tier: "STANDARD" | "CLASSIC" = "STANDARD";
  let created;
  try {
    created = await control.send(new CreateGuardrailCommand(config("STANDARD")));
  } catch (e) {
    console.warn(`Niveau Standard indisponible (${(e as Error).name}) : repli sur le niveau Classic.`);
    tier = "CLASSIC";
    created = await control.send(new CreateGuardrailCommand(config("CLASSIC")));
  }
  const id = created.guardrailId!;
  const version = await control.send(new CreateGuardrailVersionCommand({ guardrailIdentifier: id, description: "v1" }));
  await putItem({ ...keys.content("guardrail"), value: { id, version: version.version, tier } });
  console.log(`Garde-fou créé : ${id}, version ${version.version}, niveau ${tier}, région ${REGION}.`);
  console.log("Mémorisé dans DynamoDB : rien à ajouter dans .env.local.");
}

async function remove() {
  const existing = await findExisting();
  if (existing?.id) {
    await control.send(new DeleteGuardrailCommand({ guardrailIdentifier: existing.id }));
    console.log(`Garde-fou ${existing.id} supprimé.`);
  } else {
    console.log("Aucun garde-fou à supprimer.");
  }
  const k = keys.content("guardrail");
  await deleteItem(k.PK, k.SK);
}

async function main() {
  if (args.has("--delete")) return remove();
  const existing = await findExisting();
  if (existing && !args.has("--recreate")) {
    console.log(`Le garde-fou « ${NAME} » existe déjà (${existing.id}). Utilisez --recreate pour le remplacer.`);
    return;
  }
  if (existing) await remove();
  await create();
}

main().catch((e) => {
  console.error(explainAwsError(e));
  process.exit(1);
});
