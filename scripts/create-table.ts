/**
 * Crée la table DynamoDB (idempotent) : `npm run db:create`.
 * Clés : PK / SK. Index GSI1 (GSI1PK / GSI1SK) pour lister les éléments par type.
 * Facturation à la demande, TTL activé sur l'attribut `ttl` (données des utilisateurs anonymes).
 */
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

const REGION = process.env.AWS_REGION || "eu-west-3";
const TABLE = process.env.DYNAMODB_TABLE || "aidants";

const client = new DynamoDBClient({ region: REGION });

async function exists() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE }));
    return true;
  } catch (e) {
    if ((e as { name?: string }).name === "ResourceNotFoundException") return false;
    throw e;
  }
}

async function main() {
  if (await exists()) {
    console.log(`La table « ${TABLE} » existe déjà (${REGION}).`);
  } else {
    await client.send(
      new CreateTableCommand({
        TableName: TABLE,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" },
          { AttributeName: "SK", AttributeType: "S" },
          { AttributeName: "GSI1PK", AttributeType: "S" },
          { AttributeName: "GSI1SK", AttributeType: "S" },
        ],
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "GSI1",
            KeySchema: [
              { AttributeName: "GSI1PK", KeyType: "HASH" },
              { AttributeName: "GSI1SK", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
        ],
      }),
    );
    console.log(`Création de la table « ${TABLE} »…`);
    await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: TABLE });
    console.log("Table créée.");
  }

  try {
    await client.send(
      new UpdateTimeToLiveCommand({
        TableName: TABLE,
        TimeToLiveSpecification: { AttributeName: "ttl", Enabled: true },
      }),
    );
    console.log("TTL activé sur l'attribut « ttl ».");
  } catch (e) {
    const msg = (e as { message?: string }).message ?? "";
    if (/already enabled|TimeToLive is already/i.test(msg)) console.log("TTL déjà activé.");
    else console.warn(`TTL non activé (non bloquant) : ${msg}`);
  }
}

main().catch((e) => {
  console.error(`Échec : ${(e as { name?: string }).name ?? ""} ${(e as { message?: string }).message ?? e}`);
  process.exit(1);
});
