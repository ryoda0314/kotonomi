// Every word, from the six lists (src/content/words): TOEIC's and TOEFL's, three levels each. A word in both exams'
// lists is one word: it keeps the sentence and level of the list it is met in first (the lower level; TOEIC's at the
// same level) and belongs to both.

import type { Exam, Level, Word, WordEntry } from "./types.ts";
import { TOEFL_1 } from "./words/toefl-1.ts";
import { TOEFL_2 } from "./words/toefl-2.ts";
import { TOEFL_3 } from "./words/toefl-3.ts";
import { TOEIC_1 } from "./words/toeic-1.ts";
import { TOEIC_2 } from "./words/toeic-2.ts";
import { TOEIC_3 } from "./words/toeic-3.ts";

export const LISTS: { exam: Exam; level: Level; words: WordEntry[] }[] = [
  { exam: "toeic", level: 1, words: TOEIC_1 },
  { exam: "toefl", level: 1, words: TOEFL_1 },
  { exam: "toeic", level: 2, words: TOEIC_2 },
  { exam: "toefl", level: 2, words: TOEFL_2 },
  { exam: "toeic", level: 3, words: TOEIC_3 },
  { exam: "toefl", level: 3, words: TOEFL_3 },
];

function gather(): Word[] {
  const byEn = new Map<string, Word>();
  for (const list of LISTS) {
    list.words.forEach((w, rank) => {
      const had = byEn.get(w.en);
      if (had) {
        if (!had.exams.includes(list.exam)) had.exams.push(list.exam);
      } else byEn.set(w.en, { ...w, exams: [list.exam], level: list.level, rank });
    });
  }
  return [...byEn.values()];
}

export const WORDS: Word[] = gather();
export const WORD = new Map(WORDS.map((w) => [w.en, w]));
