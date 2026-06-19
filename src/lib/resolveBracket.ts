// Résolution des affiches du tableau final en équipes réelles.
//
// Les cases du bracket (`bracket.ts`) sont des PLACES de groupe : "1E" = 1er du
// groupe E, "2A" = 2e du groupe A, "3 A/B/C/D/F" = un des meilleurs 3es. Ce module
// remplace ces places par les vraies équipes dès qu'elles sont connues, à partir
// de DEUX sources cohérentes avec le reste de l'app :
//   1. Le classement des groupes (calculé depuis nos matchs, comme la page Groupes)
//      → résout les "1X" / "2X" au fur et à mesure que chaque groupe se termine.
//   2. Les matchs R32 réels (remplis par le sync football-data) → place chaque
//      meilleur 3e dans la bonne affiche, sans réimplémenter la table officielle
//      d'attribution des 3es : on s'appuie sur l'adversaire (un "1X"/"2X" connu)
//      pour identifier la case.
// Tant qu'une équipe n'est pas déterminée, on garde la place d'origine en repli.

import { MATCH_STATUS, STAGES } from "@/lib/constants";
import { computeGroupStandings } from "@/lib/standings";
import { LEFT_R32, RIGHT_R32, type Slot } from "@/lib/bracket";

type TeamLite = { id: string; name: string; code: string | null };

type MatchInput = {
  stage: string;
  groupName: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: TeamLite | null;
  awayTeam: TeamLite | null;
};

export type ResolvedTeam = {
  name: string;
  code: string | null;
  // true tant que le groupe n'est pas terminé : la position (1er/2e) peut encore
  // changer. false = qualification + position acquises (groupe fini ou match R32).
  provisional: boolean;
};

/** Une place du tableau : le libellé d'origine, et l'équipe réelle si connue. */
export type ResolvedPlace = { label: string; team: ResolvedTeam | null };
export type ResolvedAffiche = { a: ResolvedPlace; b: ResolvedPlace };

const ANCHOR = /^([12])([A-L])$/; // place déterministe : "1E", "2A"…

/**
 * Résout les deux demi-tableaux en équipes réelles. Renvoie, pour chaque affiche,
 * la place d'origine et l'équipe résolue (ou null si pas encore connue).
 */
export function resolveBracket(matches: MatchInput[]): {
  left: ResolvedAffiche[];
  right: ResolvedAffiche[];
} {
  const groupMatches = matches.filter((m) => m.stage === STAGES.GROUP);
  const standings = computeGroupStandings(groupMatches);

  // Un groupe n'est « terminé » que lorsque tous ses matchs sont joués : tant que
  // ce n'est pas le cas, les positions 1/2/3 peuvent encore bouger.
  const tally = new Map<string, { total: number; finished: number }>();
  for (const m of groupMatches) {
    if (!m.groupName) continue;
    const t = tally.get(m.groupName) ?? { total: 0, finished: 0 };
    t.total++;
    if (m.status === MATCH_STATUS.FINISHED) t.finished++;
    tally.set(m.groupName, t);
  }
  const isComplete = (group: string) => {
    const t = tally.get(group);
    return !!t && t.total > 0 && t.finished === t.total;
  };

  // place "1E"/"2A" → équipe (1er/2e du classement). On affiche dès qu'un match a
  // été joué dans le groupe, comme la page Groupes ; tant que le groupe n'est pas
  // fini, l'équipe est marquée « provisoire ».
  const placeToTeam = new Map<string, ResolvedTeam>();
  // id équipe → place, RÉSERVÉ aux groupes terminés : sert à rattacher les matchs
  // R32 (positions définitives uniquement), donc pas de provisoire ici.
  const teamIdToPlace = new Map<string, string>();
  for (const g of standings) {
    const complete = isComplete(g.group);
    g.rows.slice(0, 2).forEach((row, i) => {
      if (row.played === 0) return; // rien joué → pas d'info fiable
      placeToTeam.set(`${i + 1}${g.group}`, {
        name: row.name,
        code: row.code,
        provisional: !complete,
      });
    });
    if (!complete) continue;
    g.rows.slice(0, 3).forEach((row, i) => {
      teamIdToPlace.set(row.teamId, `${i + 1}${g.group}`);
    });
  }

  // Index place déterministe ("1X"/"2X") → référence vers l'affiche concernée.
  const slots = [
    ...LEFT_R32.map((s, i) => ({ s, half: "left" as const, i })),
    ...RIGHT_R32.map((s, i) => ({ s, half: "right" as const, i })),
  ];
  const resolved = {
    left: LEFT_R32.map((s) => blank(s)),
    right: RIGHT_R32.map((s) => blank(s)),
  };
  const anchorToSlot = new Map<string, (typeof slots)[number]>();
  for (const slot of slots) {
    if (ANCHOR.test(slot.s.a)) anchorToSlot.set(slot.s.a, slot);
    if (ANCHOR.test(slot.s.b)) anchorToSlot.set(slot.s.b, slot);
  }

  // 1) Places déterministes : on remplit directement depuis le classement.
  for (const slot of slots) {
    const dst = resolved[slot.half][slot.i];
    dst.a.team = placeToTeam.get(slot.s.a) ?? null;
    dst.b.team = placeToTeam.get(slot.s.b) ?? null;
  }

  // 2) Matchs R32 réels : ils encodent l'attribution officielle des meilleurs 3es.
  //    On identifie l'affiche via l'adversaire « ancre » (1X/2X) puis on place les
  //    deux vraies équipes — ce qui résout au passage la case « 3 … ».
  for (const m of matches) {
    if (m.stage !== STAGES.R32 || !m.homeTeam || !m.awayTeam) continue;
    const homePlace = teamIdToPlace.get(m.homeTeam.id);
    const awayPlace = teamIdToPlace.get(m.awayTeam.id);
    const anchor =
      (homePlace && ANCHOR.test(homePlace) && homePlace) ||
      (awayPlace && ANCHOR.test(awayPlace) && awayPlace) ||
      null;
    if (!anchor) continue;
    const slot = anchorToSlot.get(anchor);
    if (!slot) continue;

    const home: ResolvedTeam = {
      name: m.homeTeam.name,
      code: m.homeTeam.code,
      provisional: false,
    };
    const away: ResolvedTeam = {
      name: m.awayTeam.name,
      code: m.awayTeam.code,
      provisional: false,
    };
    const dst = resolved[slot.half][slot.i];
    // L'ancre occupe le côté correspondant ; l'adversaire prend l'autre.
    if (slot.s.a === anchor) {
      dst.a.team = homePlace === anchor ? home : away;
      dst.b.team = homePlace === anchor ? away : home;
    } else {
      dst.b.team = homePlace === anchor ? home : away;
      dst.a.team = homePlace === anchor ? away : home;
    }
  }

  return resolved;
}

function blank(s: Slot): ResolvedAffiche {
  return { a: { label: s.a, team: null }, b: { label: s.b, team: null } };
}
