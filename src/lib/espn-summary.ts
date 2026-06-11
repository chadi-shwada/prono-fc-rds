import "server-only";

// Détails d'un match via l'endpoint "summary" d'ESPN (non-officiel) : buteurs,
// statut détaillé (mi-temps / prolongation / T.A.B.), stats (possession, tirs…) et
// score des tirs au but. 100 % best-effort et LECTURE SEULE : aucune écriture en
// base, aucun impact sur la synchro ni le scoring. Si un champ manque ou si ESPN
// change son format, on renvoie simplement `null`/listes vides → la section ne
// s'affiche pas (aucune régression).

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

// --- Types souples (tous les champs optionnels : on accède via optional chaining) ---
type TeamRef = { abbreviation?: string; displayName?: string };
type StatusType = {
  state?: string;
  detail?: string;
  shortDetail?: string;
  description?: string;
};
type Competitor = {
  team?: TeamRef;
  shootoutScore?: number;
};
type Event = {
  id?: string;
  status?: { type?: StatusType };
  competitions?: { competitors?: Competitor[] }[];
};
type KeyEvent = {
  type?: { text?: string };
  text?: string;
  shortText?: string;
  scoringPlay?: boolean;
  clock?: { displayValue?: string };
  team?: TeamRef;
  athletesInvolved?: { displayName?: string }[];
};
type StatItem = { name?: string; displayValue?: string };
type BoxTeam = { team?: TeamRef; statistics?: StatItem[] };
type Summary = {
  header?: {
    competitions?: { status?: { type?: StatusType }; competitors?: Competitor[] }[];
  };
  keyEvents?: KeyEvent[];
  scoringPlays?: KeyEvent[];
  boxscore?: { teams?: BoxTeam[] };
};

export type EspnGoal = {
  minute: string | null;
  teamCode: string | null;
  scorer: string;
  note: string | null; // "pén." | "csc" | null
};
export type EspnStat = { label: string; home: string; away: string };
export type EspnMatchDetail = {
  statusDetail: string | null;
  goals: EspnGoal[];
  stats: EspnStat[];
  shootout: { home: number; away: number } | null;
};

// Stats à afficher (nom ESPN → libellé FR), dans l'ordre.
const STAT_LABELS: [string, string][] = [
  ["possessionPct", "Possession"],
  ["totalShots", "Tirs"],
  ["shotsOnTarget", "Tirs cadrés"],
  ["wonCorners", "Corners"],
  ["foulsCommitted", "Fautes"],
  ["offsides", "Hors-jeu"],
  ["saves", "Arrêts"],
];

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const up = (s: string | undefined) => (s ?? "").toUpperCase();

// Extrait le nom du buteur depuis le texte anglais d'ESPN, ex. :
// "Goal! Mexico 1, South Africa 0. Julián Quiñones (Mexico) right footed shot…"
// → "Julián Quiñones". Sert de repli si athletesInvolved est absent.
function scorerFromText(text: string): string | null {
  const afterScore = text.split(/\.\s+/).slice(1).join(". ");
  const m = afterScore.match(/^([^(]+?)\s*\(/);
  return m ? m[1].trim() : null;
}

/**
 * Récupère les détails ESPN d'un match identifié par la paire de codes FIFA.
 * Renvoie `null` si le match n'est pas trouvé côté ESPN (ex. pas dans la journée
 * en cours) ou en cas d'erreur.
 */
export async function getEspnMatchDetail(
  homeCode: string,
  awayCode: string,
): Promise<EspnMatchDetail | null> {
  const hc = up(homeCode);
  const ac = up(awayCode);
  const key = [hc, ac].sort().join("|");

  const board = (await fetchJson(`${BASE}/scoreboard`)) as
    | { events?: Event[] }
    | null;
  if (!board) return null;

  const event = (board.events ?? []).find((e) => {
    const comps = e.competitions?.[0]?.competitors ?? [];
    const codes = comps
      .map((c) => up(c.team?.abbreviation))
      .filter(Boolean)
      .sort();
    return codes.length === 2 && codes.join("|") === key;
  });
  if (!event?.id) return null;

  const summary = (await fetchJson(
    `${BASE}/summary?event=${event.id}`,
  )) as Summary | null;
  if (!summary) return null;

  const headerComp = summary.header?.competitions?.[0];

  // Statut détaillé (mi-temps, prolongation, T.A.B., minute…).
  const statusDetail =
    event.status?.type?.detail ??
    headerComp?.status?.type?.detail ??
    headerComp?.status?.type?.shortDetail ??
    null;

  // Buts : on prend keyEvents (sinon scoringPlays) et on garde les actions de but.
  const rawEvents = summary.keyEvents ?? summary.scoringPlays ?? [];
  const goals: EspnGoal[] = rawEvents
    .filter(
      (ev) => ev.scoringPlay === true || /goal/i.test(ev.type?.text ?? ""),
    )
    .map((ev) => {
      const raw = ev.text ?? ev.shortText ?? "";
      const typeText = ev.type?.text ?? "";
      const isOwn = /own goal/i.test(typeText) || /own goal/i.test(raw);
      const isPen = /penalt/i.test(typeText) || /penalt/i.test(raw);
      const scorer =
        ev.athletesInvolved?.[0]?.displayName?.trim() ||
        scorerFromText(raw) ||
        "But";
      return {
        minute: ev.clock?.displayValue ?? null,
        teamCode: ev.team?.abbreviation?.toUpperCase() ?? null,
        scorer,
        note: isOwn ? "csc" : isPen ? "pén." : null,
      };
    });

  // Stats : on relie chaque équipe du boxscore à domicile/extérieur par son code.
  const teams = summary.boxscore?.teams ?? [];
  const homeBox = teams.find((t) => up(t.team?.abbreviation) === hc);
  const awayBox = teams.find((t) => up(t.team?.abbreviation) === ac);
  const statVal = (t: BoxTeam | undefined, name: string) =>
    t?.statistics?.find((s) => s.name === name)?.displayValue ?? null;
  const stats: EspnStat[] = STAT_LABELS.map(([name, label]) => {
    const home = statVal(homeBox, name);
    const away = statVal(awayBox, name);
    return home != null && away != null ? { label, home, away } : null;
  }).filter((s): s is EspnStat => s !== null);

  // Tirs au but (phase finale).
  const comps = headerComp?.competitors ?? [];
  const sHome = comps.find((c) => up(c.team?.abbreviation) === hc)?.shootoutScore;
  const sAway = comps.find((c) => up(c.team?.abbreviation) === ac)?.shootoutScore;
  const shootout =
    typeof sHome === "number" && typeof sAway === "number"
      ? { home: sHome, away: sAway }
      : null;

  return { statusDetail, goals, stats, shootout };
}
