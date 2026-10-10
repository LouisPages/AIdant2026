import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/context/app-state";
import { Toast } from "@/components/ui/misc";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={dmSans.variable}>
      <body>
        <AppStateProvider>
          <div className="mobile-frame">{children}</div>
          <Toast />
        </AppStateProvider>
      </body>
    </html>
  );
}
