import { cookies, headers } from "next/headers";

const SID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

/** Identifiant de session anonyme (cookie `sid`, créé par proxy.ts). Serveur uniquement. */
export async function getSessionId(): Promise<string> {
  const fromCookie = (await cookies()).get("sid")?.value;
  if (fromCookie && SID_PATTERN.test(fromCookie)) return fromCookie;

  // Première requête : le cookie vient d'être créé par le proxy et n'est pas encore revenu du navigateur.
  const fromHeader = (await headers()).get("x-sid");
  if (fromHeader && SID_PATTERN.test(fromHeader)) return fromHeader;

  throw new Error("Session introuvable : le cookie de session n'a pas pu être créé.");
}
