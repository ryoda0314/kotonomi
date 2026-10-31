import { test } from "node:test";
import assert from "node:assert/strict";
import { DRILLS, LAYOUTS, ROWS, strokeFor } from "../src/lib/keys.ts";

const SENTENCE_KEYS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,'?$%-";

test("letters, digits, the space and the sentences' marks are on both keyboards", () => {
  for (const layout of LAYOUTS) for (const ch of SENTENCE_KEYS) assert.ok(strokeFor(ch, layout), `${layout}: ${ch}`);
});

test("a capital is its letter's key with Shift, pressed by the same finger", () => {
  const t = strokeFor("t", "jis");
  const T = strokeFor("T", "jis");
  assert.equal(T.key.code, "KeyT");
  assert.equal(T.shift, true);
  assert.equal(t.shift, false);
  assert.equal(T.key.finger, "li");
});

test("' is Shift + 7 on a Japanese keyboard and a key of its own on an English one; ? is Shift + / on both", () => {
  assert.deepEqual([strokeFor("'", "jis").key.code, strokeFor("'", "jis").shift], ["Digit7", true]);
  assert.deepEqual([strokeFor("'", "us").key.code, strokeFor("'", "us").shift], ["Quote", false]);
  for (const layout of LAYOUTS) assert.deepEqual([strokeFor("?", layout).key.code, strokeFor("?", layout).shift], ["Slash", true]);
});

test("the home position: the little fingers on a and ;, the index fingers on f and j, the thumbs on the space bar", () => {
  assert.equal(strokeFor("a", "us").key.finger, "lp");
  assert.equal(strokeFor(";", "us").key.finger, "rp");
  assert.equal(strokeFor("f", "jis").key.finger, "li");
  assert.equal(strokeFor("j", "jis").key.finger, "ri");
  assert.equal(strokeFor(" ", "jis").key.finger, "th");
});

test("the rows are the keyboards': 13 keys across the top of a Japanese one, 12 of an English one", () => {
  assert.equal(ROWS.jis[0].length, 13);
  assert.equal(ROWS.us[0].length, 12);
  assert.equal(ROWS.jis[3].length, 11);
  assert.equal(ROWS.us[3].length, 10);
});

test("every key of every drill is on both keyboards, with no Shift", () => {
  for (const d of DRILLS) for (const k of d.keys) for (const layout of LAYOUTS) assert.equal(strokeFor(k, layout)?.shift, false, `${d.id} ${layout}: ${k}`);
});
