// Badges (hauts faits) calculés à partir des stats d'un joueur.

export type Badge = {
  key: string;
  emoji: string;
  label: string;
  desc: string;
};

export type BadgeInput = {
  points: number;
  exact: number; // nombre de scores exacts
  correct: number; // bons résultats
  finished: number; // matchs terminés pronostiqués
  bestStreak: number; // meilleure série de bons pronos d'affilée
  rank: number; // position au classement général
  isPlayerOfDay: boolean;
  foundEasterEgg: boolean; // a réveillé le lion 🦁
};

/** Liste des badges débloqués, du plus prestigieux au plus commun. */
export function computeBadges(s: BadgeInput): Badge[] {
  const out: Badge[] = [];

  if (s.isPlayerOfDay) {
    out.push({
      key: "potd",
      emoji: "👑",
      label: "Joueur du jour",
      desc: "Meilleur scoreur de la dernière journée",
    });
  }
  if (s.rank === 1 && s.finished > 0) {
    out.push({
      key: "leader",
      emoji: "🥇",
      label: "Leader",
      desc: "1er au classement général",
    });
  }
  if (s.foundEasterEgg) {
    out.push({
      key: "lion",
      emoji: "🦁",
      label: "Dompteur de lion",
      desc: "A réveillé le lion 🦁 (+5 pts)",
    });
  }
  if (s.exact >= 5) {
    out.push({
      key: "sniper3",
      emoji: "🎯",
      label: "Franc-tireur",
      desc: "5 scores exacts ou plus",
    });
  } else if (s.exact >= 1) {
    out.push({
      key: "sniper",
      emoji: "🎯",
      label: "Sniper",
      desc: "Au moins un score exact trouvé",
    });
  }
  if (s.bestStreak >= 3) {
    out.push({
      key: "fire",
      emoji: "🔥",
      label: "En feu",
      desc: `Série de ${s.bestStreak} bons pronos d'affilée`,
    });
  }
  if (s.finished >= 3 && s.correct === s.finished) {
    out.push({
      key: "perfect",
      emoji: "💯",
      label: "Sans faute",
      desc: "100 % de bons résultats",
    });
  }
  if (s.finished >= 10) {
    out.push({
      key: "regular",
      emoji: "📊",
      label: "Assidu",
      desc: "10 matchs pronostiqués ou plus",
    });
  }
  if (s.points >= 1) {
    out.push({
      key: "first",
      emoji: "🏅",
      label: "Sur le tableau",
      desc: "Tes premiers points marqués",
    });
  }

  return out;
}

/** Meilleure série de bons résultats consécutifs (prédictions triées par date). */
export function bestStreak(
  ordered: { correct: boolean }[],
): number {
  let best = 0;
  let cur = 0;
  for (const p of ordered) {
    if (p.correct) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}
