import { test } from "node:test";
import assert from "node:assert/strict";
import { WORDS } from "../src/content/index.ts";
import { exportMarkdown } from "../src/lib/export.ts";
import { DAY, emptyState, finishRound, recalledWord, typedWord } from "../src/lib/record.ts";

const T0 = Date.UTC(2026, 9, 29, 1);

test("学習の記録: the prompt, the counts, the words hard to recall with their meaning, the days", () => {
  const [a, b] = WORDS;
  let s = typedWord(typedWord(emptyState(), a.en, T0), b.en, T0);
  s = recalledWord(s, a.en, T0 + 1, false);
  s = recalledWord(s, b.en, T0 + 1, true);
  s = finishRound(s, { at: T0, fresh: [a.en, b.en], due: [], missed: [a.en] });
  const text = exportMarkdown(s, "見てください。", T0 + 2 * DAY);
  assert.ok(text.startsWith("見てください。\n"));
  assert.match(text, /- 出会った語: 2/);
  assert.match(text, /- 思い出せた: 1/);
  assert.ok(text.includes(`- ${a.en}（${a.ja}）: 思い出しにくかった 1 回、思い出せた 0 回、また出てくる`));
  assert.ok(text.includes(`- 2026-10-29: ひと回り 1、はじめての語 ${a.en}, ${b.en}、思い出しにくかった語 ${a.en}`));
});
