import { test } from "node:test";
import assert from "node:assert/strict";
import { finalizationDecision } from "./espn-live";
import { MATCH_STATUS } from "./constants";

const SCHEDULED = MATCH_STATUS.SCHEDULED;
const LIVE = MATCH_STATUS.LIVE;
const FINISHED = MATCH_STATUS.FINISHED;

test("finalizationDecision : score déjà enregistré → finalise tout de suite", () => {
  // Cas normal : les buts ont été vus en direct, le score stocké == score final.
  assert.equal(
    finalizationDecision({
      status: LIVE,
      storedHome: 2,
      storedAway: 1,
      finalHome: 2,
      finalAway: 1,
    }),
    "finalize",
  );
});

test("finalizationDecision : score final inédit → on patiente (hold)", () => {
  // But de dernière seconde jamais vu en direct : on attend une 2ᵉ synchro.
  assert.equal(
    finalizationDecision({
      status: LIVE,
      storedHome: 1,
      storedAway: 1,
      finalHome: 2,
      finalAway: 1,
    }),
    "hold",
  );
  // Idem depuis un match pas encore passé en direct côté base.
  assert.equal(
    finalizationDecision({
      status: SCHEDULED,
      storedHome: null,
      storedAway: null,
      finalHome: 0,
      finalAway: 0,
    }),
    "hold",
  );
});

test("finalizationDecision : but annulé par la VAR au coup de sifflet → hold", () => {
  // ESPN affichait 0-1 en direct (stocké), puis « Full Time » 0-0 (but refusé).
  assert.equal(
    finalizationDecision({
      status: LIVE,
      storedHome: 0,
      storedAway: 1,
      finalHome: 0,
      finalAway: 0,
    }),
    "hold",
  );
});

test("finalizationDecision : déjà terminé, même score → skip", () => {
  assert.equal(
    finalizationDecision({
      status: FINISHED,
      storedHome: 3,
      storedAway: 0,
      finalHome: 3,
      finalAway: 0,
    }),
    "skip",
  );
});

test("finalizationDecision : déjà terminé, score corrigé → finalise (correction immédiate)", () => {
  // Finale erronée de football-data corrigée par ESPN : pas de palier d'attente.
  assert.equal(
    finalizationDecision({
      status: FINISHED,
      storedHome: 1,
      storedAway: 0,
      finalHome: 0,
      finalAway: 0,
    }),
    "finalize",
  );
});
