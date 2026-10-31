"use client";

// 例文を打つ: the sentences of words met (those typed least lately first), typed over themselves with the word lit and
// the translation under them, said once typed.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import page from "@/components/page.module.css";
import { scopeOf, useExam, useFrom } from "@/components/prefs";
import { markOf } from "@/components/Sentence";
import { Speak } from "@/components/Speak";
import { TypeCopy } from "@/components/TypeCopy";
import type { Word } from "@/content/types";
import { ja } from "@/lib/i18n/ja";
import { practiceLines } from "@/lib/practice";
import { typedLine } from "@/lib/record";
import { commit, getState } from "@/lib/store";
import learn from "../../_learn/learn.module.css";
import styles from "./type.module.css";

const t = ja.type;

export function LinesRound() {
  const [exam] = useExam();
  const [from] = useFrom();
  const [words, setWords] = useState<Word[] | null>(null);
  const [i, setI] = useState(0);

  const start = useCallback(() => {
    setWords(practiceLines(getState(), scopeOf(exam, from), Date.now(), Math.random));
    setI(0);
    window.scrollTo({ top: 0 });
  }, [exam, from]);

  useEffect(() => {
    const timer = window.setTimeout(start, 0);
    return () => window.clearTimeout(timer);
  }, [start]);

  const done = !!words && i >= words.length;
  const w = words && !done ? words[i] : null;

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/type" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>{t.lines}</h1>
        {words && !done ? <span className={page.count}>{ja.common.countOf(i + 1, words.length)}</span> : null}
      </header>

      {!words ? (
        <p className={page.skeleton}>{ja.common.loading}</p>
      ) : done ? (
        <section className={styles.end}>
          <p className={styles.endTitle}>{t.done}</p>
          <div className={page.actions}>
            <button type="button" className="btn" onClick={start}>
              {t.again}
            </button>
            <Link href="/app/type" className="btn-quiet">
              {t.toHub}
            </Link>
          </div>
        </section>
      ) : w ? (
        <div className={styles.round}>
          <div className={learn.lineHead}>
            <Speak text={w.ex} label={`${ja.word.example} ${ja.common.hear}`} id={`lines:${w.en}`} size="sm" />
            <span className={learn.lineWord} lang="en">
              {w.en}
            </span>
            <span className={learn.lineJa}>{w.ja}</span>
          </div>
          <TypeCopy
            key={`${w.en}:${i}`}
            target={w.ex}
            view="line"
            mark={markOf(w)}
            sayDone
            below={<p className={learn.exJa}>{w.exJa}</p>}
            onTyped={() => commit((s) => typedLine(s, w.en, Date.now()))}
            onDone={() => setI(i + 1)}
          />
        </div>
      ) : null}
    </div>
  );
}
