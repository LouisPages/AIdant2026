import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { unstable_rethrow } from "next/navigation";
import "./globals.css";
import { AppStateProvider } from "@/context/app-state";
import { SupportCard } from "@/components/support-card";
import { Toast } from "@/components/ui/misc";
import { loadCatalog } from "@/lib/db/catalog";
import { explainAwsError } from "@/lib/db/client";
import { loadUser } from "@/lib/db/user";
import { getSessionId } from "@/lib/session";
import type { Bootstrap } from "@/lib/types";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Entre aidants",
  description: "Un espace de soutien entre pairs pour les aidants, personnalisé par l'IA.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F5F5",
};

/** Charge le contenu partagé et les données de la session depuis DynamoDB. */
async function loadBootstrap(): Promise<{ data: Bootstrap } | { error: string }> {
  try {
    const sid = await getSessionId();
    const [catalog, user] = await Promise.all([loadCatalog(), loadUser(sid)]);
    return { data: { catalog, user } };
  } catch (e) {
    // Les signaux internes de Next.js (rendu dynamique, redirection…) ne sont pas des erreurs.
    unstable_rethrow(e);
    console.error("[db] chargement impossible :", e);
    return { error: explainAwsError(e) };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const result = await loadBootstrap();

  return (
    <html lang="fr" className={dmSans.variable}>
      <body>
        {"data" in result ? (
          <AppStateProvider initial={result.data}>
            <div className="mobile-frame">{children}</div>
            <SupportCard />
            <Toast />
          </AppStateProvider>
        ) : (
          <div className="mobile-frame">
            <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
              <h1 className="text-h2">Base de données inaccessible</h1>
              <p className="mt-3 text-body text-ink-2">{result.error}</p>
              <p className="mt-6 text-small text-ink-2">Rechargez la page une fois le problème corrigé.</p>
            </main>
          </div>
        )}
      </body>
    </html>
  );
}
