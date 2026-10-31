"use client";

// このひと回りのおわりに: the new words, those met again, and those that will come back (violet). Each opens its sheet.

import page from "@/components/page.module.css";
import { Speak } from "@/components/Speak";
import { useOpenWord } from "@/components/WordSheet";
import type { Word } from "@/content/types";
import { ja } from "@/lib/i18n/ja";
import styles from "./learn.module.css";

export function RoundEnd({
  fresh,
  due,
  missed,
  firstToday,
  onNext,
}: {
  fresh: Word[];
  due: Word[];
  missed: string[];
  firstToday: boolean;
  onNext: () => void;
}) {
  const open = useOpenWord();
  const again = new Set(missed);
  const list = (words: Word[]) => (
    <ul className={page.wordList}>
      {words.map((w) => (
        <li key={w.en}>
          <Speak text={w.en} label={`${w.en} ${ja.common.hear}`} id={`end:${w.en}`} size="sm" />
          <button type="button" className={page.wordOpen} data-again={again.has(w.en) ? "" : undefined} onClick={() => open(w.en)}>
            <span className={page.wordEn}>{w.en}</span>
            <span className={page.wordJa}>{w.ja}</span>
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <section className={styles.end}>
      <p className={styles.endLabel}>{ja.learn.endTitle}</p>
      {fresh.length ? (
        <div className={styles.endGroup}>
          <p className={styles.endHead}>{ja.learn.endFresh}</p>
          {list(fresh)}
        </div>
      ) : null}
      {due.length ? (
        <div className={styles.endGroup}>
          <p className={styles.endHead}>{ja.learn.endDue}</p>
          {list(due)}
        </div>
      ) : null}
      {missed.length ? (
        <div className={styles.owed}>
          <p className={styles.endHead}>{ja.learn.endMissed}</p>
          <p className={styles.owedWords}>
            {missed.map((en) => (
              <button key={en} type="button" className={styles.owedWord} onClick={() => open(en)} lang="en">
                {en}
              </button>
            ))}
          </p>
        </div>
      ) : null}
      <p className={page.note}>{ja.learn.endLead}</p>
      {firstToday ? <p className={page.note}>{ja.learn.enough}</p> : null}
      <div className={page.actions}>
        <button type="button" className="btn" onClick={onNext}>
          {ja.learn.nextRound}
        </button>
      </div>
    </section>
  );
}
