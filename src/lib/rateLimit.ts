import "server-only";

// Limiteur de débit en mémoire (fenêtre fixe). Suffisant ici : chaque instance
// tourne dans UN conteneur Node — pas besoin d'un store partagé type Redis.
// Utilisé pour freiner le bruteforce du code d'invitation sur le login.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function purgeExpired(now: number): void {
  // Nettoyage paresseux pour borner la mémoire (pas de timer à gérer).
  if (buckets.size < 5_000) return;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

/** La clé a-t-elle dépassé `max` enregistrements sur la fenêtre courante ? */
export function isRateLimited(key: string, max: number): boolean {
  const b = buckets.get(key);
  if (!b || b.resetAt <= Date.now()) return false;
  return b.count >= max;
}

/** Enregistre une tentative (échec) pour la clé, sur une fenêtre de `windowMs`. */
export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  purgeExpired(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    b.count++;
  }
}
