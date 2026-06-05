// Sons courts générés via Web Audio (aucun fichier requis).
// Déclenchés sur action utilisateur (clic) → autorisés par les navigateurs.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.15,
) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.connect(g);
  g.connect(c.destination);
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.start(start);
  o.stop(start + dur);
}

/** Petit blip de confirmation (prono enregistré). */
export function playSuccess() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 660, t, 0.18, "sine", 0.12);
  tone(c, 880, t + 0.08, 0.2, "sine", 0.12);
}

/** Petite fanfare (choix du champion). */
export function playChampion() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 1047].forEach((f, i) =>
    tone(c, f, t + i * 0.11, 0.35, "triangle", 0.14),
  );
}
