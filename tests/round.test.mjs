import { test } from "node:test";
import assert from "node:assert/strict";
import { DAY, emptyState, recalledWord, typedWord } from "../src/lib/record.ts";
import { AGAIN_AFTER, againIn, dueWords, freshWords, inOrder, MAX_DUE, planRound, recallOrder } from "../src/lib/round.ts";

const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const word = (en, exams, level, rank) => ({ en, pos: "名", ja: "語", ex: `We saw the ${en} there yesterday.`, exJa: "見た。", exams, level, rank });
const WORDS = [
  word("ic1a", ["toeic"], 1, 0),
  word("ic1b", ["toeic"], 1, 1),
  word("fl1a", ["toefl"], 1, 0),
  word("fl1b", ["toefl"], 1, 1),
  word("ic2a", ["toeic"], 2, 0),
  word("fl2a", ["toefl"], 2, 0),
  word("both2", ["toeic", "toefl"], 2, 1),
  word("ic3a", ["toeic"], 3, 0),
];
const T0 = Date.UTC(2026, 9, 29, 1);

test("new words: from the chosen level up, the lists taking turns, the levels below last", () => {
  const both = inOrder({ exams: ["toeic", "toefl"], from: 1 }, WORDS).map((w) => w.en);
  assert.deepEqual(both, ["ic1a", "fl1a", "ic1b", "fl1b", "ic2a", "fl2a", "both2", "ic3a"]);
  const toeicFrom2 = inOrder({ exams: ["toeic"], from: 2 }, WORDS).map((w) => w.en);
  assert.deepEqual(toeicFrom2, ["ic2a", "both2", "ic3a", "ic1a", "ic1b"]);
});

test("new words are those not met yet", () => {
  const s = typedWord(emptyState(), "ic1a", T0);
  assert.deepEqual(
    freshWords(s, { exams: ["toeic"], from: 1 }, 2, new Set(), WORDS).map((w) => w.en),
    ["ic1b", "ic2a"],
  );
  assert.deepEqual(
    freshWords(s, { exams: ["toeic"], from: 1 }, 2, new Set(["ic1b"]), WORDS).map((w) => w.en),
    ["ic2a", "both2"],
  );
});

test("words come back most overdue first, whatever the exam chosen now, at most MAX_DUE in a round", () => {
  let s = emptyState();
  s = typedWord(s, "fl1a", T0);
  s = typedWord(s, "ic1a", T0 + 3600_000);
  s = recalledWord(typedWord(s, "ic2a", T0), "ic2a", T0 + 1, true);
  s = recalledWord(s, "ic2a", T0 + 2 * DAY, true);
  assert.deepEqual(dueWords(s, T0 + 2 * DAY, WORDS).map((w) => w.en), ["fl1a", "ic1a"]);
  const plan = planRound(s, T0 + 2 * DAY, { exams: ["toeic"], from: 1 }, 2, WORDS);
  assert.deepEqual(plan.due.map((w) => w.en), ["fl1a", "ic1a"]);
  assert.deepEqual(plan.fresh.map((w) => w.en), ["ic1b", "both2"]);
  assert.ok(MAX_DUE >= 5);
});

test("思い出す's order: shuffled, the word met last never first", () => {
  const words = ["a", "b", "c", "d", "e"];
  for (let seed = 1; seed < 40; seed++) {
    const order = recallOrder(words, "e", seeded(seed));
    assert.deepEqual([...order].sort(), words);
    assert.notEqual(order[0], "e");
  }
});

test("a word recalled only with help goes again a few words later, or last", () => {
  assert.deepEqual(againIn(["a", "b", "c", "d", "e", "f", "g"], 1, "x"), ["a", "b", "c", "d", "e", "x", "f", "g"]);
  assert.deepEqual(againIn(["a", "b", "c"], 1, "x"), ["a", "b", "c", "x"]);
  assert.equal(AGAIN_AFTER, 3);
});
