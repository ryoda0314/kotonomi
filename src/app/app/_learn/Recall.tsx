"use client";

// 思い出す: the meaning, and the word typed from it. Help is there when it is asked for, never before (CONCEPT.md):
// 例文で shows the sentence with the word left blank (still the learner's own recall), 聞く says the word and
// 答えを見る shows it (then it comes back sooner). Recalled alone, at most one slip of a finger, it goes on by itself;
// otherwise the word stays in sight until 次へ.

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Sentence } from "@/components/Sentence";
import { say } from "@/components/sound";
import { TypeRecall } from "@/components/TypeRecall";
import type { Word } from "@/content/types";
import { ja } from "@/lib/i18n/ja";
import { SLIPS_FORGIVEN } from "@/lib/typing";
import styles from "./learn.module.css";

export function RecallWord({
  w,
  due,
  again,
  onTyped,
  onDone,
}: {
  w: Word;
  /** A word come back from an earlier day. */
  due: boolean;
  /** Recalled only with help, it comes once more in this round. */
  again: boolean;
  onTyped: (clean: boolean) => void;
  onDone: () => void;
}) {
  const [line, setLine] = useState(false);
  const [heard, setHeard] = useState(false);
  const [answer, setAnswer] = useState(false);
  const [clean, setClean] = useState<boolean | null>(null);
  const done = clean !== null;

  return (
    <div className={styles.screen}>
      <p className={styles.lead}>{due ? ja.learn.dueLead : ja.learn.recallLead}</p>
      <div className={styles.prompt} data-due={due ? "" : undefined}>
        <span className={styles.pos}>{ja.word.pos[w.pos]}</span>
        <p className={styles.meaning}>{w.ja}</p>
      </div>

      {line ? (
        <div className={styles.hintLine}>
          <p className={styles.readLine}>
            <Sentence word={w} blank={!done && !answer} />
          </p>
          <p className={styles.exJa}>{w.exJa}</p>
        </div>
      ) : null}

      {done ? (
        <p className={styles.result} data-clean={clean ? "" : undefined}>
          <span className={styles.answer} lang="en">
            {w.en}
          </span>
          <span>{clean ? ja.learn.recalled : again ? ja.learn.again : ja.learn.comesBack}</span>
        </p>
      ) : (
        <div className={styles.hints} onMouseDown={(e) => e.preventDefault()}>
          <button type="button" className={styles.hint} disabled={line} onClick={() => setLine(true)}>
            <Icon name="lines" size={17} />
            {ja.learn.hints.line}
          </button>
          <button
            type="button"
            className={styles.hint}
            onClick={() => {
              setHeard(true);
              void say(w.en, { key: `hint:${w.en}` });
            }}
          >
            <Icon name="speaker" size={17} />
            {ja.learn.hints.hear}
          </button>
          <button type="button" className={styles.hint} disabled={answer} onClick={() => setAnswer(true)}>
            <Icon name="eye" size={17} />
            {ja.learn.hints.answer}
          </button>
          {answer ? (
            <span className={styles.shown} lang="en">
              {w.en}
            </span>
          ) : null}
        </div>
      )}

      <TypeRecall
        target={w.en}
        reveal={answer}
        auto={clean === true}
        onTyped={({ slips }) => {
          const ok = !heard && !answer && slips <= SLIPS_FORGIVEN;
          setClean(ok);
          onTyped(ok);
        }}
        onDone={onDone}
      />
    </div>
  );
}
