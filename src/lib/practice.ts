// What is typed in 打つ (CONCEPT.md: 指が場所を覚える):
//   キーの場所   a row of keys at a time, one key after another, the key lit and the finger named
//   語・例文     words met, those typed least lately first; their sentences, those typed least lately first
//   聞いて打つ   words met, heard and not seen
// While few words have been met, the next words to meet fill a round. Nothing is timed or counted. Pure, for the tests.

import { WORDS } from "../content/index.ts";
import type { Word } from "../content/types.ts";
import { isMet, type State, type Stamps } from "./record.ts";
import { freshWords, type Scope } from "./round.ts";

export const DRILL_LENGTH = 30;
export const WORDS_PER_ROUND = 10;
export const LINES_PER_ROUND = 5;

type Rand = () => number;

/** A round of キーの場所: every key of the row comes, in a shuffled order, never the same key twice in a row. */
export function drillSequence(keys: string[], rand: Rand, n = DRILL_LENGTH): string[] {
  const out: string[] = [];
  while (out.length < n) {
    const bag = [...keys];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag.length > 1 && bag[0] === out[out.length - 1]) bag.push(bag.shift() as string);
    out.push(...bag);
  }
  return out.slice(0, n);
}

const lastOf = (s: Stamps | undefined) => (s && s.length ? Math.max(...s) : 0);

/** Met words, the least lately typed (`by`) first, a little shuffled; the next words to meet after them. */
function pick(s: State, scope: Scope, now: number, rand: Rand, n: number, by: (w: Word) => number): Word[] {
  const met = WORDS.filter((w) => isMet(s.words[w.en]))
    .map((w) => ({ w, score: Math.min(30, (now - by(w)) / 86_400_000) + rand() * 4 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.w);
  return met.length >= n ? met : [...met, ...freshWords(s, scope, n - met.length)];
}

export const practiceWords = (s: State, scope: Scope, now: number, rand: Rand, n = WORDS_PER_ROUND) =>
  pick(s, scope, now, rand, n, (w) => lastOf(s.words[w.en]?.typed));

export const practiceLines = (s: State, scope: Scope, now: number, rand: Rand, n = LINES_PER_ROUND) =>
  pick(s, scope, now, rand, n, (w) => lastOf(s.words[w.en]?.lines));
