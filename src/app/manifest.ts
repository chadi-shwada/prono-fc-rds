import type { MetadataRoute } from "next";
import { appName, appTagline } from "@/lib/features";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appName()} — Coupe du Monde 2026`,
    short_name: appName(),
    description: `Pronostics de la Coupe du Monde 2026 ${appTagline()}`,
    lang: "fr",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#060a13",
    theme_color: "#10b981",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
