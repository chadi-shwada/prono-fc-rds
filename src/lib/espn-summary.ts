import "server-only";

// Détails d'un match via l'endpoint "summary" d'ESPN (non-officiel) : buteurs,
// statut détaillé (mi-temps / prolongation / T.A.B.), stats (possession, tirs…) et
// score des tirs au but. 100 % best-effort et LECTURE SEULE : aucune écriture en
// base, aucun impact sur la synchro ni le scoring. Si un champ manque ou si ESPN
// change son format, on renvoie simplement `null`/listes vides → la section ne
// s'affiche pas (aucune régression).

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

// --- Types souples (tous les champs optionnels : on accède via optional chaining) ---
type TeamRef = { id?: string | number; abbreviation?: string; displayName?: string };
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

// Fil du match : buts, cartons et remplacements, dans l'ordre chronologique.
export type EspnEventKind = "goal" | "yellow" | "red" | "sub";
export type EspnTimelineEvent = {
  kind: EspnEventKind;
  minute: string | null;
  sort: number; // clé de tri (minute + temps additionnel)
  teamCode: string | null;
  text: string; // buteur / joueur averti / joueur entrant
  sub: string | null; // but : "pén."/"csc" · remplacement : joueur sortant
};
export type EspnStat = { label: string; home: string; away: string };
export type EspnMatchDetail = {
  statusDetail: string | null;
  timeline: EspnTimelineEvent[];
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

// Nom du joueur précédant la parenthèse de l'équipe, ex. :
// "Lionel Messi (Argentina) is shown the yellow card." → "Lionel Messi".
function playerBeforeTeam(text: string): string | null {
  const m = text.match(/^([^(]+?)\s*\(/);
  return m ? m[1].trim() : null;
}

// Remplacement, ex. "Substitution, Argentina. Joueur A replaces Joueur B."
// → { in: "Joueur A", out: "Joueur B" }.
function parseSub(text: string): { in: string; out: string } | null {
  const m = text.match(/\.\s*([^.]+?)\s+replaces\s+([^.]+?)\s*\.?\s*$/i);
  return m ? { in: m[1].trim(), out: m[2].trim() } : null;
}

// Clé de tri d'une minute ESPN ("45'+2'", "90'+4'") : minute×100 + additionnel.
function clockSort(display: string | undefined | null): number {
  if (!display) return 99999;
  const m = display.match(/(\d+)(?:\s*\+\s*(\d+))?/);
  if (!m) return 99999;
  return Number(m[1]) * 100 + (m[2] ? Number(m[2]) : 0);
}

/**
 * Récupère les détails ESPN d'un match identifié par la paire de codes FIFA.
 * Renvoie `null` si le match n'est pas trouvé côté ESPN (ex. pas dans la journée
 * en cours) ou en cas d'erreur.
 */
export async function getEspnMatchDetail(
  homeCode: string,
  awayCode: string,
  kickoff: Date,
): Promise<EspnMatchDetail | null> {
  const hc = up(homeCode);
  const ac = up(awayCode);
  const key = [hc, ac].sort().join("|");

  const matchesPair = (e: Event) => {
    const codes = (e.competitions?.[0]?.competitors ?? [])
      .map((c) => up(c.team?.abbreviation))
      .filter(Boolean)
      .sort();
    return codes.length === 2 && codes.join("|") === key;
  };

  // ESPN ne renvoie par défaut que la journée en cours : on interroge donc la
  // plage de dates autour du coup d'envoi (±1 j pour absorber les décalages de
  // fuseau), avec repli sur le scoreboard par défaut (matchs du jour / en direct).
  const day = 24 * 60 * 60 * 1000;
  const ymd = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
      d.getUTCDate(),
    ).padStart(2, "0")}`;
  const dated = `${BASE}/scoreboard?dates=${ymd(
    new Date(kickoff.getTime() - day),
  )}-${ymd(new Date(kickoff.getTime() + day))}`;

  let event: Event | undefined;
  for (const url of [dated, `${BASE}/scoreboard`]) {
    const board = (await fetchJson(url)) as { events?: Event[] } | null;
    event = board?.events?.find(matchesPair);
    if (event?.id) break;
  }
  if (!event?.id) return null;

  const summary = (await fetchJson(
    `${BASE}/summary?event=${event.id}`,
  )) as Summary | null;
  if (!summary) return null;

  const headerComp = summary.header?.competitions?.[0];

  // Table de correspondance équipe ESPN → code FIFA, pour situer chaque but du bon
  // côté : les keyEvents n'exposent pas toujours l'abréviation directement.
  const idToCode = new Map<string, string>();
  const nameToCode = new Map<string, string>();
  const indexTeam = (t: TeamRef | undefined) => {
    const code = t?.abbreviation?.toUpperCase();
    if (!code) return;
    if (t?.id != null) idToCode.set(String(t.id), code);
    if (t?.displayName) nameToCode.set(t.displayName.toLowerCase(), code);
  };
  for (const c of event.competitions?.[0]?.competitors ?? []) indexTeam(c.team);
  for (const c of headerComp?.competitors ?? []) indexTeam(c.team);

  // Résout le code de l'équipe d'un but : id ESPN, puis abréviation, puis nom
  // complet, puis nom entre parenthèses du texte ("… Buteur (Team Name) …").
  const resolveTeamCode = (ev: KeyEvent): string | null => {
    const t = ev.team;
    if (t?.id != null) {
      const c = idToCode.get(String(t.id));
      if (c) return c;
    }
    if (t?.abbreviation) return t.abbreviation.toUpperCase();
    if (t?.displayName) {
      const c = nameToCode.get(t.displayName.toLowerCase());
      if (c) return c;
    }
    const m = (ev.text ?? ev.shortText ?? "").match(/\(([^)]+)\)/);
    if (m) {
      const c = nameToCode.get(m[1].trim().toLowerCase());
      if (c) return c;
    }
    return null;
  };

  // Statut détaillé (mi-temps, prolongation, T.A.B., minute…).
  const statusDetail =
    event.status?.type?.detail ??
    headerComp?.status?.type?.detail ??
    headerComp?.status?.type?.shortDetail ??
    null;

  // Fil du match : buts, cartons et remplacements (keyEvents, sinon scoringPlays
  // pour les seuls buts), classés et triés par minute.
  const rawEvents = summary.keyEvents ?? summary.scoringPlays ?? [];
  const timeline: EspnTimelineEvent[] = [];
  for (const ev of rawEvents) {
    const raw = ev.text ?? ev.shortText ?? "";
    const typeText = ev.type?.text ?? "";
    const both = `${typeText} ${raw}`;
    const base = {
      minute: ev.clock?.displayValue ?? null,
      sort: clockSort(ev.clock?.displayValue),
      teamCode: resolveTeamCode(ev),
    };

    const isGoal = ev.scoringPlay === true || /goal/i.test(typeText);
    if (isGoal) {
      const isOwn = /own goal/i.test(both);
      const isPen = /penalt/i.test(both);
      const scorer =
        ev.athletesInvolved?.[0]?.displayName?.trim() ||
        scorerFromText(raw) ||
        "But";
      timeline.push({
        ...base,
        kind: "goal",
        text: scorer,
        sub: isOwn ? "csc" : isPen ? "pén." : null,
      });
      continue;
    }

    if (/substitution/i.test(both)) {
      const players = parseSub(raw);
      const inName =
        players?.in || ev.athletesInvolved?.[0]?.displayName?.trim() || null;
      const outName =
        players?.out || ev.athletesInvolved?.[1]?.displayName?.trim() || null;
      if (!inName && !outName) continue;
      timeline.push({
        ...base,
        kind: "sub",
        text: inName ?? "—",
        sub: outName,
      });
      continue;
    }

    const isRed = /red card/i.test(both) || /yellow[\s-]*red/i.test(both);
    const isYellow = !isRed && /yellow card/i.test(both);
    if (isRed || isYellow) {
      const player =
        ev.athletesInvolved?.[0]?.displayName?.trim() ||
        playerBeforeTeam(raw) ||
        "Carton";
      timeline.push({
        ...base,
        kind: isRed ? "red" : "yellow",
        text: player,
        sub: null,
      });
    }
  }
  timeline.sort((a, b) => a.sort - b.sort);

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

  return { statusDetail, timeline, stats, shootout };
}
