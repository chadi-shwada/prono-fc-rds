import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBracket } from "./resolveBracket";
import { MATCH_STATUS, STAGES } from "./constants";

type TeamLite = { id: string; name: string; code: string | null };
const T = (id: string): TeamLite => ({ id, name: id, code: id });

function group(g: string, home: string, away: string, hs: number, as: number) {
  return {
    stage: STAGES.GROUP,
    groupName: g,
    status: MATCH_STATUS.FINISHED,
    homeScore: hs,
    awayScore: as,
    homeTeam: T(home),
    awayTeam: T(away),
  };
}

test("tableau non joué : tout reste en place de groupe (aucune équipe)", () => {
  const { left, right } = resolveBracket([]);
  assert.equal(left[0].a.team, null);
  assert.equal(left[0].a.label, "1E");
  assert.equal(right[0].a.team, null);
});

test("groupe terminé : le 1er remplit sa case, marqué comme confirmé", () => {
  // Groupe E : E1 bat E2 (seul match) → groupe terminé, E1 = "1E".
  const { left } = resolveBracket([group("E", "E1", "E2", 2, 0)]);
  // LEFT_R32[0] = { a: "1E", b: "3 …" } → la case "1E" devient E1.
  assert.equal(left[0].a.team?.name, "E1");
  assert.equal(left[0].a.team?.provisional, false);
});

test("groupe en cours : le leader s'affiche en provisoire", () => {
  // Un match joué, un match à venir → groupe non terminé : E1 mène mais provisoire.
  const matches = [
    group("E", "E1", "E2", 2, 0),
    {
      stage: STAGES.GROUP,
      groupName: "E",
      status: MATCH_STATUS.SCHEDULED,
      homeScore: null,
      awayScore: null,
      homeTeam: T("E1"),
      awayTeam: T("E3"),
    },
  ];
  const { left } = resolveBracket(matches);
  assert.equal(left[0].a.team?.name, "E1");
  assert.equal(left[0].a.team?.provisional, true);
});

test("le 2e d'un groupe se place dans la bonne affiche", () => {
  // LEFT_R32[2] = { a: "2A", b: "2B" }.
  const matches = [
    group("A", "A1", "A2", 1, 0), // A2 finit 2e
    group("B", "B1", "B2", 1, 0), // B2 finit 2e
  ];
  const { left } = resolveBracket(matches);
  assert.equal(left[2].a.team?.name, "A2");
  assert.equal(left[2].b.team?.name, "B2");
});

test("match R32 réel : le meilleur 3e est placé via son adversaire", () => {
  // Groupe E terminé → E1 = "1E" (ancre de LEFT_R32[0], côté a).
  // Groupe A terminé → A3 finit 3e.
  // Le sync crée le match R32 E1 vs A3 : A3 doit atterrir dans LEFT_R32[0].b
  // (la case "3 A/B/C/D/F"), sans table d'attribution codée en dur.
  const matches = [
    group("E", "E1", "E2", 2, 0),
    group("A", "A1", "A2", 3, 0),
    group("A", "A1", "A3", 3, 0),
    group("A", "A2", "A3", 1, 0),
    {
      stage: STAGES.R32,
      groupName: null,
      status: MATCH_STATUS.SCHEDULED,
      homeScore: null,
      awayScore: null,
      homeTeam: T("E1"),
      awayTeam: T("A3"),
    },
  ];
  const { left } = resolveBracket(matches);
  assert.equal(left[0].a.team?.name, "E1");
  assert.equal(left[0].b.team?.name, "A3");
});
