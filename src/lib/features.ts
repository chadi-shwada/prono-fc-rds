import "server-only";

// Activations par instance (lues au runtime).

/** Easter egg du lion 🦁 actif ? (désactivé si EASTER_EGG_DISABLED=1) */
export function isEasterEggEnabled(): boolean {
  return process.env.EASTER_EGG_DISABLED !== "1";
}
