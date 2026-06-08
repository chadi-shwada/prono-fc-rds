import "server-only";

// Activations par instance (lues au runtime).

/** Easter egg du lion 🦁 actif ? (désactivé si EASTER_EGG_DISABLED=1) */
export function isEasterEggEnabled(): boolean {
  return process.env.EASTER_EGG_DISABLED !== "1";
}

/** Nom de l'app (personnalisable par instance via APP_NAME). */
export function appName(): string {
  return process.env.APP_NAME || "Prono FC RDS";
}

/** Petite phrase d'accroche (personnalisable par instance via APP_TAGLINE). */
export function appTagline(): string {
  return process.env.APP_TAGLINE || "entre collègues RATP";
}

/** Noms d'exemple affichés dans l'aperçu de la landing (PREVIEW_NAMES="a,b,c"). */
export function previewNames(): [string, string, string] {
  const parts = (process.env.PREVIEW_NAMES || "Chadi,Moussa,Xavier")
    .split(",")
    .map((s) => s.trim());
  return [parts[0] || "Chadi", parts[1] || "Moussa", parts[2] || "Xavier"];
}
