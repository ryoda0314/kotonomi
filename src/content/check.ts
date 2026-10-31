// What a prepared word must be (tests/content.test.mjs, scripts/check-words.mjs): typed the same on a Japanese (JIS)
// and an English (US) keyboard, its sentence holding it once, its Japanese plain. Pure.

import type { Pos, WordEntry } from "./types.ts";

export const POS: Pos[] = ["動", "名", "形", "副", "前", "接", "句"];

/** What a sentence may hold: keys every keyboard has, leaving out the symbols that sit in different places. */
export const SENTENCE_CHARS = /^[A-Za-z0-9 .,'?$%-]+$/;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A meaning as 思い出す shows it, the parentheses and the 〜を set aside. The word is recalled from it alone, so no two
 * words may read alike there, neither whole nor in their first sense.
 */
export const senseOf = (ja: string) =>
  ja
    .replace(/（[^）]*）/g, "")
    .replace(/^〜[をにがとへの]?/, "")
    .replace(/〜/g, "")
    .trim();

/** Where a form stands in a sentence, as [start, end): whole words only, in any case. */
export function placesOf(text: string, form: string): [number, number][] {
  const re = new RegExp(`(?<![A-Za-z])${escape(form)}(?![A-Za-z])`, "gi");
  return [...text.matchAll(re)].map((m) => [m.index, m.index + m[0].length]);
}

export function problemsOf(w: WordEntry): string[] {
  const out: string[] = [];
  if (!/^[a-z]+(?:[ -][a-z]+)*$/.test(w.en)) out.push("en: lowercase letters, single spaces or hyphens between");
  if (!POS.includes(w.pos)) out.push(`pos: one of ${POS.join(" ")}`);
  if (!w.ja || /[A-Za-z]/.test(w.ja) || [...w.ja].length > 24) out.push("ja: Japanese only, at most 24 characters");
  if (!SENTENCE_CHARS.test(w.ex)) out.push("ex: only letters, digits, spaces and . , ' ? $ % -");
  if (!/^[A-Z0-9]/.test(w.ex) || !/[.?]$/.test(w.ex)) out.push("ex: starts with a capital, ends with . or ?");
  if (/ {2}|^ | $/.test(w.ex)) out.push("ex: single spaces");
  const n = w.ex.split(" ").length;
  if (n < 6 || n > 20) out.push(`ex: 6 to 20 words (has ${n})`);
  if (w.form !== undefined && w.form.toLowerCase() === w.en) out.push("form: only when it differs from en");
  const form = w.form ?? w.en;
  const at = placesOf(w.ex, form);
  if (at.length !== 1) out.push(`ex: holds "${form}" ${at.length} times (once wanted)`);
  if (!w.exJa || /[A-Za-z]/.test(w.exJa) || !/[。？]$/.test(w.exJa)) out.push("exJa: Japanese only, ending with 。 or ？");
  return out;
}
