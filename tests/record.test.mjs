import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DAY,
  dueAt,
  emptyState,
  finishDrill,
  finishRound,
  isDue,
  isMet,
  KNOWN_STEP,
  knewWord,
  mergeStates,
  recalledWord,
  REST,
  revive,
  stageOf,
  strengthOf,
  typedWord,
} from "../src/lib/record.ts";

const T0 = Date.UTC(2026, 9, 29, 1);
const log = (s) => s.words.allocate;

test("a word met comes back the next day", () => {
  const s = typedWord(emptyState(), "allocate", T0);
  assert.equal(stageOf(log(s)), "met");
  assert.equal(dueAt(log(s)), T0 + DAY);
  assert.equal(isDue(log(s), T0 + DAY - 1), false);
  assert.equal(isDue(log(s), T0 + DAY), true);
});

test("recalled in the round it was met: 思い出せた, back the next day", () => {
  let s = typedWord(emptyState(), "allocate", T0);
  s = recalledWord(s, "allocate", T0 + 60_000, true);
  assert.equal(stageOf(log(s)), "recalled");
  assert.deepEqual(strengthOf(log(s)), { step: 1, since: T0 + 60_000 });
  assert.equal(dueAt(log(s)), T0 + 60_000 + DAY);
});

test("recalled once rested, a step on each time (3, 7, 16 days …); recalled early, no step", () => {
  let s = typedWord(emptyState(), "allocate", T0);
  let t = T0 + 1;
  s = recalledWord(s, "allocate", t, true);
  for (const step of [2, 3, 4]) {
    t += REST[step - 1] * DAY;
    s = recalledWord(s, "allocate", t, true);
    assert.equal(strengthOf(log(s)).step, step);
  }
  assert.equal(stageOf(log(s)), "settled");
  s = recalledWord(s, "allocate", t + DAY, true);
  assert.equal(strengthOf(log(s)).step, 4);
  assert.equal(dueAt(log(s)), t + REST[4] * DAY);
});

test("recalled only with help: back to the first step, back the next day", () => {
  let s = typedWord(emptyState(), "allocate", T0);
  s = recalledWord(s, "allocate", T0 + 1, true);
  s = recalledWord(s, "allocate", T0 + 2 * DAY, true);
  s = recalledWord(s, "allocate", T0 + 6 * DAY, false);
  assert.equal(strengthOf(log(s)).step, 0);
  assert.equal(stageOf(log(s)), "met");
  assert.equal(dueAt(log(s)), T0 + 7 * DAY);
});

test("passed over as known: 知っていた, asked once after a week", () => {
  const s = knewWord(emptyState(), "allocate", T0);
  assert.equal(isMet(log(s)), true);
  assert.equal(stageOf(log(s)), "known");
  assert.equal(dueAt(log(s)), T0 + REST[KNOWN_STEP] * DAY);
  const asked = recalledWord(s, "allocate", T0 + 7 * DAY, true);
  assert.equal(strengthOf(log(asked)).step, KNOWN_STEP + 1);
  assert.equal(stageOf(log(asked)), "settled");
});

test("a word not met never comes back", () => {
  assert.equal(isDue(undefined, T0), false);
  assert.equal(isMet(undefined), false);
});

test("a round is kept once; a record of another shape is left behind", () => {
  const entry = { at: T0, fresh: ["allocate"], due: [], missed: [] };
  const s = finishRound(finishRound(emptyState(), entry), entry);
  assert.equal(s.rounds.length, 1);
  assert.equal(revive({ v: 2, words: {} }), null);
  assert.deepEqual(revive(JSON.parse(JSON.stringify(s))), s);
});

test("two copies of the record are made one, nothing either has lost", () => {
  let a = typedWord(emptyState(), "allocate", T0);
  a = recalledWord(a, "allocate", T0 + DAY, true);
  a = finishRound(a, { at: T0, fresh: ["allocate"], due: [], missed: [] });
  let b = typedWord(emptyState(), "allocate", T0 + 5);
  b = knewWord(recalledWord(b, "allocate", T0 + 2 * DAY, false), "revenue", T0 + 7);
  b = finishRound(finishRound(b, { at: T0, fresh: ["allocate"], due: [], missed: [] }), { at: T0 + 9, fresh: [], due: [], missed: [] });
  a = finishDrill(a, "home", T0 + 1);
  b = finishDrill(finishDrill(b, "home", T0 + 1), "top", T0 + 3);
  const m = mergeStates(a, b);
  assert.deepEqual(m.drills, { home: [T0 + 1], top: [T0 + 3] });
  assert.deepEqual(m.words.allocate.typed, [T0, T0 + 5]);
  assert.deepEqual(m.words.allocate.recalled, [T0 + DAY]);
  assert.deepEqual(m.words.allocate.missed, [T0 + 2 * DAY]);
  assert.equal(stageOf(m.words.allocate), "met", "recalled only with help after, so back to the first step");
  assert.equal(m.words.revenue.known, T0 + 7);
  assert.deepEqual(m.rounds.map((r) => r.at), [T0, T0 + 9]);
  assert.deepEqual(mergeStates(m, m), m);
  assert.deepEqual(mergeStates(b, a), m);
  assert.equal(m.words.allocate.known, undefined);
});
