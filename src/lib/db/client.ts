/**
 * Accès DynamoDB (serveur uniquement : ne jamais importer depuis un composant client).
 *
 * Les identifiants viennent de la chaîne de résolution standard du SDK AWS
 * (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN dans .env.local,
 * ou profil local). Ils ne sont jamais exposés au navigateur.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

export const TABLE = process.env.DYNAMODB_TABLE || "aidants";
export const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

/** Les éléments d'un utilisateur anonyme expirent seuls (TTL DynamoDB) : minimisation des données. */
export const USER_TTL_SECONDS = 90 * 24 * 3600;

const globalForDb = globalThis as unknown as { __ddb?: DynamoDBDocumentClient };

export const db: DynamoDBDocumentClient =
  globalForDb.__ddb ??
  (globalForDb.__ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    marshallOptions: { removeUndefinedValues: true },
  }));

export type Item = Record<string, unknown> & { PK: string; SK: string };

/** Renvoie un message clair quand AWS refuse l'accès (jetons Workshop Studio expirés, table absente...). */
export function explainAwsError(error: unknown): string {
  const e = error as { name?: string; message?: string };
  switch (e?.name) {
    case "ExpiredTokenException":
    case "ExpiredToken":
      return "Les identifiants AWS temporaires du Workshop Studio ont expiré. Mettez à jour .env.local puis redémarrez le serveur.";
    case "UnrecognizedClientException":
    case "InvalidSignatureException":
    case "CredentialsProviderError":
      return "Identifiants AWS absents ou invalides. Renseignez AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY et AWS_SESSION_TOKEN dans .env.local.";
    case "ResourceNotFoundException":
      return `La table DynamoDB « ${TABLE} » est introuvable. Lancez « npm run db:create » puis « npm run db:seed ».`;
    case "AccessDeniedException":
      return "Accès refusé par AWS : le rôle du Workshop Studio n'a pas les droits DynamoDB nécessaires.";
    default:
      return e?.message ?? "Erreur inconnue lors de l'accès à la base de données.";
  }
}

/** Lit tous les éléments d'une partition (pagination comprise), éventuellement filtrés par préfixe de SK. */
export async function queryPartition(pk: string, skPrefix?: string): Promise<Item[]> {
  const out: Item[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: skPrefix ? "PK = :pk AND begins_with(SK, :sk)" : "PK = :pk",
        ExpressionAttributeValues: skPrefix ? { ":pk": pk, ":sk": skPrefix } : { ":pk": pk },
        ExclusiveStartKey,
      }),
    );
    out.push(...((res.Items ?? []) as Item[]));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return out;
}

/** Liste tous les éléments d'un type (index GSI1, clé GSI1PK = TYPE#<type>). */
export async function queryType(type: string): Promise<Item[]> {
  const out: Item[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :t",
        ExpressionAttributeValues: { ":t": `TYPE#${type}` },
        ExclusiveStartKey,
      }),
    );
    out.push(...((res.Items ?? []) as Item[]));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return out;
}

export async function getItem(PK: string, SK: string): Promise<Item | undefined> {
  const res = await db.send(new GetCommand({ TableName: TABLE, Key: { PK, SK } }));
  return res.Item as Item | undefined;
}

export async function putItem(item: Item, options?: { ifNotExists?: boolean }) {
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: options?.ifNotExists ? "attribute_not_exists(PK)" : undefined,
    }),
  );
}

export async function deleteItem(PK: string, SK: string) {
  await db.send(new DeleteCommand({ TableName: TABLE, Key: { PK, SK } }));
}

export async function updateItem(
  PK: string,
  SK: string,
  set: Record<string, unknown>,
): Promise<void> {
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const parts = Object.entries(set).map(([k, v], i) => {
    names[`#k${i}`] = k;
    values[`:v${i}`] = v;
    return `#k${i} = :v${i}`;
  });
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK, SK },
      UpdateExpression: `SET ${parts.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }),
  );
}

const chunk = <T>(list: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** Écritures par lots de 25 avec reprise des éléments non traités. */
export async function batchPut(items: Item[]) {
  for (const group of chunk(items, 25)) {
    let pending: Record<string, unknown>[] = group.map((Item) => ({ PutRequest: { Item } }));
    for (let attempt = 0; pending.length && attempt < 6; attempt++) {
      const res = await db.send(new BatchWriteCommand({ RequestItems: { [TABLE]: pending as never } }));
      pending = (res.UnprocessedItems?.[TABLE] as Record<string, unknown>[] | undefined) ?? [];
      if (pending.length) await new Promise((r) => setTimeout(r, 150 * 2 ** attempt));
    }
    if (pending.length) throw new Error("Écriture DynamoDB incomplète après plusieurs tentatives.");
  }
}

export async function batchDelete(keys: { PK: string; SK: string }[]) {
  for (const group of chunk(keys, 25)) {
    let pending: Record<string, unknown>[] = group.map((Key) => ({ DeleteRequest: { Key } }));
    for (let attempt = 0; pending.length && attempt < 6; attempt++) {
      const res = await db.send(new BatchWriteCommand({ RequestItems: { [TABLE]: pending as never } }));
      pending = (res.UnprocessedItems?.[TABLE] as Record<string, unknown>[] | undefined) ?? [];
      if (pending.length) await new Promise((r) => setTimeout(r, 150 * 2 ** attempt));
    }
    if (pending.length) throw new Error("Suppression DynamoDB incomplète après plusieurs tentatives.");
  }
}

export const ttl = () => Math.floor(Date.now() / 1000) + USER_TTL_SECONDS;
