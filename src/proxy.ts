import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "sid";
const SESSION_MAX_AGE = 90 * 24 * 3600;
const SID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

/**
 * Donne un identifiant de session anonyme à chaque navigateur (cookie httpOnly).
 * Le rendu des Server Components ne peut pas écrire de cookie : on le crée ici, et on le
 * transmet aussi à la requête en cours (en-tête x-sid) pour que la première page le lise.
 */
export function proxy(request: NextRequest) {
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  if (existing && SID_PATTERN.test(existing)) return NextResponse.next();

  const sid = crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-sid", sid);

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    // « Secure » seulement en HTTPS (y compris derrière un répartiteur de charge), pour que le test en HTTP local fonctionne.
    secure: request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
