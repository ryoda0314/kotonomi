import { test } from "node:test";
import assert from "node:assert/strict";
import { agreed, backRecall, emptyRecall, plain, pressRecall } from "../src/lib/typing.ts";
import { drillSequence } from "../src/lib/practice.ts";

const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const typeAll = (r, text, target) => [...text].reduce((x, ch) => pressRecall(x, ch, target), r);

test("agreed: how far the typed text follows the target from the start", () => {
  assert.equal(agreed("allo", "allocate"), 4);
  assert.equal(agreed("alo", "allocate"), 2);
  assert.equal(agreed("", "allocate"), 0);
  assert.equal(agreed("allocated", "allocate"), 8);
});

test("思い出す: a slip is going off the way once, however many keys follow it", () => {
  let r = typeAll(emptyRecall, "aloc", "allocate");
  assert.equal(r.slips, 1);
  r = backRecall(backRecall(r));
  assert.equal(r.typed, "al");
  r = typeAll(r, "locate", "allocate");
  assert.equal(r.typed, "allocate");
  assert.equal(r.slips, 1);
});

test("思い出す: going off again after coming back is a second slip", () => {
  let r = typeAll(emptyRecall, "acc", "accommodate");
  r = typeAll(r, "omo", "accommodate");
  assert.equal(r.slips, 1);
  r = backRecall(r);
  r = typeAll(r, "modate", "accommodate");
  assert.equal(r.typed, "accommodate");
  assert.equal(r.slips, 1);
  const twice = typeAll(backRecall(typeAll(backRecall(typeAll(emptyRecall, "x", "on")), "oo", "on")), "n", "on");
  assert.equal(twice.typed, "on");
  assert.equal(twice.slips, 2);
});

test("a curly apostrophe is the straight one", () => {
  assert.equal(plain("’"), "'");
  assert.equal(typeAll(emptyRecall, "don’t", "don't").typed, "don't");
});

test("キーの場所: every key of the row comes, never the same twice in a row", () => {
  const keys = [..."asdfghjkl;"];
  const seq = drillSequence(keys, seeded(4), 30);
  assert.equal(seq.length, 30);
  assert.ok(keys.every((k) => seq.includes(k)));
  assert.ok(seq.every((k, i) => i === 0 || k !== seq[i - 1]));
});
