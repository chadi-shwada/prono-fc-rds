import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveKnockoutTeamIds, type ResolvableMatch } from "./resolveKnockout";
import { MATCH_STATUS, STAGES } from "./constants";

const team = (id: string) => ({ id, name: id, code: id.toUpperCase() });

/** Match de groupe terminé : `home` bat `away` 1-0. */
function groupWin(group: string, home: string, away: string): ResolvableMatch {
  return {
    scheduleNum: null,
    stage: STAGES.GROUP,
    groupName: group,
    status: MATCH_STATUS.FINISHED,
    homeScore: 1,
    awayScore: 0,
    winnerTeamId: home,
    homeTeam: team(home),
    awayTeam: team(away),
  };
}

// Groupe A complet : a1 > a2 > a3 > a4.
const GROUP_A: ResolvableMatch[] = [
  groupWin("A", "a1", "a2"),
  groupWin("A", "a1", "a3"),
  groupWin("A", "a1", "a4"),
  groupWin("A", "a2", "a3"),
  groupWin("A", "a2", "a4"),
  groupWin("A", "a3", "a4"),
];

test("résolution : 1er/2e d'un groupe terminé → affiches R32 (1A, 2A)", () => {
  const r = resolveKnockoutTeamIds(GROUP_A);
  // Match 73 = "2A vs 2B" → home = 2e de A ; 2B inconnu (pas de groupe B).
  assert.equal(r.get(73)!.homeId, "a2");
  assert.equal(r.get(73)!.awayId, null);
  // Match 79 = "1A vs 3C/E/F/H/I" → home = 1er de A ; meilleur 3e différé → null.
  assert.equal(r.get(79)!.homeId, "a1");
  assert.equal(r.get(79)!.awayId, null);
});

test("résolution : groupe non terminé → positions non résolues (jamais provisoire)", () => {
  const partial = GROUP_A.slice(0, 5).concat({
    ...groupWin("A", "a3", "a4"),
    status: MATCH_STATUS.SCHEDULED,
    homeScore: null,
    awayScore: null,
    winnerTeamId: null,
  });
  const r = resolveKnockoutTeamIds(partial);
  assert.equal(r.get(73)!.homeId, null);
  assert.equal(r.get(79)!.homeId, null);
});

test("progression : vainqueurs/perdants des demies → finale et petite finale", () => {
  const sf101: ResolvableMatch = {
    scheduleNum: 101,
    stage: STAGES.SF,
    groupName: null,
    status: MATCH_STATUS.FINISHED,
    homeScore: 2,
    awayScore: 1,
    winnerTeamId: "x1",
    homeTeam: team("x1"),
    awayTeam: team("y1"),
  };
  const sf102: ResolvableMatch = {
    scheduleNum: 102,
    stage: STAGES.SF,
    groupName: null,
    status: MATCH_STATUS.FINISHED,
    homeScore: 0,
    awayScore: 3,
    winnerTeamId: "y2",
    homeTeam: team("x2"),
    awayTeam: team("y2"),
  };
  const r = resolveKnockoutTeamIds([sf101, sf102]);
  // 104 = "W101 vs W102" → vainqueurs.
  assert.deepEqual(r.get(104), { homeId: "x1", awayId: "y2" });
  // 103 = "L101 vs L102" → perdants.
  assert.deepEqual(r.get(103), { homeId: "y1", awayId: "x2" });
});

test("progression : demie non terminée → finale non résolue", () => {
  const sf101: ResolvableMatch = {
    scheduleNum: 101,
    stage: STAGES.SF,
    groupName: null,
    status: MATCH_STATUS.LIVE,
    homeScore: 1,
    awayScore: 1,
    winnerTeamId: null,
    homeTeam: team("x1"),
    awayTeam: team("y1"),
  };
  const r = resolveKnockoutTeamIds([sf101]);
  assert.equal(r.get(104)!.homeId, null);
  assert.equal(r.get(103)!.homeId, null);
});

test("résolution : couvre les 32 affiches à élimination directe", () => {
  const r = resolveKnockoutTeamIds([]);
  assert.equal(r.size, 32);
});
