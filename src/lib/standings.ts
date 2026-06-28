// Import relatif (pas d'alias @/) pour rester testable via tsx, comme scoring-core.
import { MATCH_STATUS, STAGES } from "./constants";

// Classement des groupes calculé À PARTIR DE NOS MATCHS (base SQLite), sans appel
// API supplémentaire : toujours cohérent avec les scores qu'on affiche, et marche
// même si football-data/ESPN sont indisponibles. Seuls les matchs « terminés »
// comptent ; les équipes du groupe apparaissent dès le départ (0 partout).

export type StandingRow = {
  teamId: string;
  name: string;
  code: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // buts pour
  ga: number; // buts contre
  gd: number; // différence de buts
  points: number;
};

export type GroupStanding = { group: string; rows: StandingRow[] };

type TeamLite = { id: string; name: string; code: string | null };
type MatchForStanding = {
  stage: string;
  groupName: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: TeamLite | null;
  awayTeam: TeamLite | null;
};

function newRow(t: TeamLite): StandingRow {
  return {
    teamId: t.id,
    name: t.name,
    code: t.code,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  };
}

/**
 * Tableaux des groupes (un par groupe), équipes triées par points, puis
 * différence de buts, puis buts marqués, puis nom. Renvoie les groupes par
 * ordre alphabétique (A, B, …).
 */
export function computeGroupStandings(
  matches: MatchForStanding[],
): GroupStanding[] {
  const groups = new Map<string, Map<string, StandingRow>>();

  const ensureRow = (group: string, t: TeamLite): StandingRow => {
    let table = groups.get(group);
    if (!table) {
      table = new Map();
      groups.set(group, table);
    }
    let row = table.get(t.id);
    if (!row) {
      row = newRow(t);
      table.set(t.id, row);
    }
    return row;
  };

  for (const m of matches) {
    if (m.stage !== STAGES.GROUP || !m.groupName) continue;
    if (!m.homeTeam || !m.awayTeam) continue;

    // Les deux équipes apparaissent dans le tableau même avant d'avoir joué.
    const home = ensureRow(m.groupName, m.homeTeam);
    const away = ensureRow(m.groupName, m.awayTeam);

    const played =
      m.status === MATCH_STATUS.FINISHED &&
      m.homeScore !== null &&
      m.awayScore !== null;
    if (!played) continue;

    const hs = m.homeScore!;
    const as = m.awayScore!;
    home.played++;
    away.played++;
    home.gf += hs;
    home.ga += as;
    away.gf += as;
    away.ga += hs;
    if (hs > as) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (hs < as) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  const result: GroupStanding[] = [];
  for (const [group, table] of groups) {
    const rows = [...table.values()];
    for (const r of rows) r.gd = r.gf - r.ga;
    rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.name.localeCompare(b.name),
    );
    result.push({ group, rows });
  }
  result.sort((a, b) => a.group.localeCompare(b.group));
  return result;
}

export type ThirdPlaceRow = StandingRow & { group: string };

/**
 * Classement des troisièmes de chaque groupe (format à 48 équipes : les 8
 * meilleurs 3es se qualifient). Mêmes départages que les groupes : points,
 * différence de buts, buts marqués, puis nom.
 */
export function rankThirdPlaced(standings: GroupStanding[]): ThirdPlaceRow[] {
  const thirds = standings
    .filter((g) => g.rows.length >= 3)
    .map((g) => ({ ...g.rows[2], group: g.group }));
  thirds.sort(
    (a, b) =>
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.name.localeCompare(b.name),
  );
  return thirds;
}

/** Nombre de meilleurs troisièmes qualifiés (format à 48 équipes). */
export const BEST_THIRDS_QUALIFY = 8;
