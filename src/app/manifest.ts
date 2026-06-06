import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prono FC RDS — Coupe du Monde 2026",
    short_name: "Prono FC RDS",
    description: "Pronostics de la Coupe du Monde 2026 entre collègues RATP",
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
