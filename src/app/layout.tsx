import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Prono FC RDS — Coupe du Monde 2026",
  description: "Pronostics de la Coupe du Monde 2026 entre collègues RATP",
  applicationName: "Prono FC RDS",
  appleWebApp: { capable: true, title: "Prono FC RDS", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Prono FC RDS — Coupe du Monde 2026",
    description: "Pronostics de la Coupe du Monde 2026 entre collègues RATP",
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="aurora" />
        <div className="pitch" />
        {children}
      </body>
    </html>
  );
}
