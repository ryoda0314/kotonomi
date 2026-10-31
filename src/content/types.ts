// A word to meet, type and remember. TOEIC's words are those of work (the office, hiring, travel, shopping, money);
// TOEFL's those of lectures and reading (the sciences, history, society). Prepared ahead, checked by
// tests/content.test.mjs (src/content/check.ts).

export type Exam = "toeic" | "toefl";

/**
 * Where a word sits, as a guide to where to start, never a list to clear: 1 基本 (TOEIC 600 / TOEFL iBT 60 ほど),
 * 2 標準 (730 / 80), 3 発展 (860 / 100 から).
 */
export type Level = 1 | 2 | 3;

/** 動詞・名詞・形容詞・副詞・前置詞・接続詞・決まった言い方. */
export type Pos = "動" | "名" | "形" | "副" | "前" | "接" | "句";

/** As written in src/content/words/*.ts. */
export type WordEntry = {
  /** The headword as it is typed: "allocate", "in charge of". */
  en: string;
  pos: Pos;
  /** Its meaning in Japanese, at most two senses, the one in `ex` first: "〜を割り当てる". */
  ja: string;
  /** One sentence of the kind the exam uses, holding the word once. */
  ex: string;
  exJa: string;
  /** The word as it stands in `ex` when not as `en` ("allocated"). */
  form?: string;
};

/** A word with where it belongs (src/content/index.ts): its exams, its level, its place in its list. */
export type Word = WordEntry & { exams: Exam[]; level: Level; rank: number };
