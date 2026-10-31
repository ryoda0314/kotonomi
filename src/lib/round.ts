// What one round of 覚える holds, chosen on the device from the learner's own record:
//   出会う    a few words not met yet, from the level the learner chose up, each list's most met words first and
//             TOEIC's and TOEFL's taking turns: typed with it in sight, then its sentence
//   思い出す  those words and the words whose time to come back has come (most overdue first, at most MAX_DUE),
//             shuffled, typed from their meaning
// Pure, for the tests.

import { WORDS } from "../content/index.ts";
import type { Exam, Level, Word } from "../content/types.ts";
import { dueAt, isDue, isMet, type State } from "./record.ts";

export type Scope = { exams: Exam[]; from: Level };
export const MAX_DUE = 8;

/** The order new words come in: the chosen level and up first, then the levels below; in each, list by list in turns. */
export function inOrder(scope: Scope, words: Word[] = WORDS): Word[] {
  const band = (l: Level) => (l >= scope.from ? l - scope.from : 3 + l);
  const list = (w: Word) => (w.exams[0] === "toeic" ? 0 : 1);
  return words
    .filter((w) => w.exams.some((e) => scope.exams.includes(e)))
    .sort((a, b) => band(a.level) - band(b.level) || a.rank - b.rank || list(a) - list(b));
}

/** Words not met yet, in the order they come, leaving out `skip`. */
export function freshWords(s: State, scope: Scope, n: number, skip: ReadonlySet<string> = new Set(), words: Word[] = WORDS): Word[] {
  const out: Word[] = [];
  for (const w of inOrder(scope, words)) {
    if (out.length >= n) break;
    if (!isMet(s.words[w.en]) && !skip.has(w.en)) out.push(w);
  }
  return out;
}

/** Words whose time to come back has come, most overdue first. Any exam: a word met is the learner's now. */
export function dueWords(s: State, now: number, words: Word[] = WORDS): Word[] {
  return words.filter((w) => isDue(s.words[w.en], now)).sort((a, b) => dueAt(s.words[a.en]) - dueAt(s.words[b.en]));
}

export type RoundPlan = { at: number; fresh: Word[]; due: Word[] };

export function planRound(s: State, now: number, scope: Scope, fresh: number, words: Word[] = WORDS): RoundPlan {
  return { at: now, fresh: freshWords(s, scope, fresh, new Set(), words), due: dueWords(s, now, words).slice(0, MAX_DUE) };
}

/**
 * The order of 思い出す: shuffled, the word met last never first (it was just in sight), and no two in a row from the
 * same place when that can be helped.
 */
export function recallOrder(words: string[], lastMet: string | null, rand: () => number): string[] {
  const out = [...words];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out[0] === lastMet) [out[0], out[out.length - 1]] = [out[out.length - 1], out[0]];
  return out;
}

/** Where a word recalled only with help goes again in this round: a few words later, or last. */
export const AGAIN_AFTER = 3;
export function againIn<T>(queue: T[], at: number, item: T): T[] {
  const i = Math.min(at + 1 + AGAIN_AFTER, queue.length);
  return [...queue.slice(0, i), item, ...queue.slice(i)];
}
