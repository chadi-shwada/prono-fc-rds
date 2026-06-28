import { test } from "node:test";
import assert from "node:assert/strict";
import { SCHEDULE, findKoScheduleNum } from "./schedule";
import { STAGES } from "./constants";

test("SCHEDULE : 104 matchs, répartition officielle des phases", () => {
  assert.equal(SCHEDULE.length, 104);
  const byStage: Record<string, number> = {};
  for (const e of SCHEDULE) byStage[e.stage] = (byStage[e.stage] ?? 0) + 1;
  assert.deepEqual(byStage, {
    [STAGES.GROUP]: 72,
    [STAGES.R32]: 16,
    [STAGES.R16]: 8,
    [STAGES.QF]: 4,
    [STAGES.SF]: 2,
    [STAGES.THIRD]: 1,
    [STAGES.FINAL]: 1,
  });
});

test("SCHEDULE : numéros 1..104 uniques et coups d'envoi valides", () => {
  const nums = SCHEDULE.map((e) => e.num);
  assert.equal(new Set(nums).size, 104);
  assert.equal(Math.min(...nums), 1);
  assert.equal(Math.max(...nums), 104);
  assert.ok(SCHEDULE.every((e) => !Number.isNaN(e.kickoff.getTime())));
});

test("SCHEDULE : phases finales sans groupe, groupes nommés", () => {
  for (const e of SCHEDULE) {
    if (e.isGroup) {
      assert.equal(e.stage, STAGES.GROUP);
      assert.ok(e.groupName, `groupe attendu pour le match ${e.num}`);
    } else {
      assert.notEqual(e.stage, STAGES.GROUP);
      assert.equal(e.groupName, null);
    }
  }
});

test("findKoScheduleNum : chaque match KO se rattache à son propre numéro (1-1)", () => {
  const ko = SCHEDULE.filter((e) => !e.isGroup);
  const mapped = new Set<number>();
  for (const e of ko) {
    const num = findKoScheduleNum(e.stage, e.kickoff);
    assert.equal(num, e.num, `mauvais rattachement pour le match ${e.num}`);
    mapped.add(num!);
  }
  // aucune collision : 32 matchs KO -> 32 numéros distincts
  assert.equal(mapped.size, ko.length);
});

test("findKoScheduleNum : null pour la phase de groupes et hors fenêtre", () => {
  const final = SCHEDULE.find((e) => e.stage === STAGES.FINAL)!;
  assert.equal(findKoScheduleNum(STAGES.GROUP, final.kickoff), null);
  // une date très éloignée (> 2 jours du créneau le plus proche) -> null
  const farOff = new Date("2030-01-01T00:00:00Z");
  assert.equal(findKoScheduleNum(STAGES.FINAL, farOff), null);
});
