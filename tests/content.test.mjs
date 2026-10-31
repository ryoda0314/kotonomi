import { test } from "node:test";
import assert from "node:assert/strict";
import { problemsOf, senseOf } from "../src/content/check.ts";
import { LISTS, WORD, WORDS } from "../src/content/index.ts";
import { LAYOUTS, strokeFor } from "../src/lib/keys.ts";

test("every word keeps the rules (src/content/check.ts)", () => {
  const bad = [];
  for (const list of LISTS) for (const w of list.words) {
    const p = problemsOf(w);
    if (p.length) bad.push(`${list.exam}-${list.level} ${w.en}: ${p.join("; ")}`);
  }
  assert.deepEqual(bad, []);
});

test("each list has its words, and no word is twice in one exam's lists", () => {
  for (const list of LISTS) assert.ok(list.words.length >= 100, `${list.exam}-${list.level}: ${list.words.length}`);
  for (const exam of ["toeic", "toefl"]) {
    const seen = new Map();
    const twice = [];
    for (const list of LISTS.filter((l) => l.exam === exam))
      for (const w of list.words) {
        if (seen.has(w.en)) twice.push(`${w.en} (${seen.get(w.en)} and ${list.level})`);
        seen.set(w.en, list.level);
      }
    assert.deepEqual(twice, [], exam);
  }
});

test("a word in both exams' lists is one word belonging to both", () => {
  assert.equal(WORD.size, WORDS.length);
  const toeic = new Set(LISTS.filter((l) => l.exam === "toeic").flatMap((l) => l.words.map((w) => w.en)));
  const toefl = new Set(LISTS.filter((l) => l.exam === "toefl").flatMap((l) => l.words.map((w) => w.en)));
  for (const w of WORDS) {
    assert.equal(w.exams.includes("toeic"), toeic.has(w.en), w.en);
    assert.equal(w.exams.includes("toefl"), toefl.has(w.en), w.en);
  }
});

test("no two words read alike in Japanese, whole or in their first sense: 思い出す shows only the meaning", () => {
  const whole = new Map();
  const first = new Map();
  const alike = [];
  for (const w of WORDS) {
    const all = senseOf(w.ja);
    const lead = senseOf(w.ja.split("、")[0]);
    if (whole.has(all)) alike.push(`${whole.get(all)} / ${w.en}: ${w.ja}`);
    else if (first.has(lead)) alike.push(`${first.get(lead)} / ${w.en}: ${lead}`);
    whole.set(all, w.en);
    first.set(lead, w.en);
  }
  assert.deepEqual(alike, []);
});

test("every word and sentence can be typed on a Japanese and an English keyboard", () => {
  const missing = new Set();
  for (const w of WORDS) for (const layout of LAYOUTS) for (const ch of w.en + w.ex) if (!strokeFor(ch, layout)) missing.add(`${layout} ${ch}`);
  assert.deepEqual([...missing], []);
});
