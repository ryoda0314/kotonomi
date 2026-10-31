"use client";

// 語を打つ and 聞いて打つ: a round of words met (those typed least lately first), each said as it comes up. Seen
// (`see`), it is typed over itself and moves on by itself; heard (`hear`), it is typed from its sound, the meaning
// above it and its answer there when asked for. Typing them here is practice: it does not change when they come back.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import page from "@/components/page.module.css";
import { scopeOf, useExam, useFrom } from "@/components/prefs";
import { say } from "@/components/sound";
import { Speak } from "@/components/Speak";
import { TypeCopy } from "@/components/TypeCopy";
import { TypeRecall } from "@/components/TypeRecall";
import { useOpenWord } from "@/components/WordSheet";
import type { Word } from "@/content/types";
import { ja } from "@/lib/i18n/ja";
import { practiceWords } from "@/lib/practice";
import { typedWord } from "@/lib/record";
import { commit, getState } from "@/lib/store";
import learn from "../../_learn/learn.module.css";
import styles from "./type.module.css";

const t = ja.type;

export function WordsRound({ mode }: { mode: "see" | "hear" }) {
  const [exam] = useExam();
  const [from] = useFrom();
  const [words, setWords] = useState<Word[] | null>(null);
  const [i, setI] = useState(0);
  const open = useOpenWord();

  const start = useCallback(() => {
    setWords(practiceWords(getState(), scopeOf(exam, from), Date.now(), Math.random));
    setI(0);
    window.scrollTo({ top: 0 });
  }, [exam, from]);

  useEffect(() => {
    const timer = window.setTimeout(start, 0);
    return () => window.clearTimeout(timer);
  }, [start]);

  const done = !!words && i >= words.length;
  const w = words && !done ? words[i] : null;
  const typed = (en: string) => commit((s) => typedWord(s, en, Date.now()));

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/type" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>{mode === "see" ? t.words : t.listen}</h1>
        {words && !done ? <span className={page.count}>{ja.common.countOf(i + 1, words.length)}</span> : null}
      </header>

      {!words ? (
        <p className={page.skeleton}>{ja.common.loading}</p>
      ) : done ? (
        <section className={styles.end}>
          <p className={styles.endTitle}>{t.done}</p>
          <p className={page.note}>{t.doneWords}</p>
          <ul className={page.wordList}>
            {words.map((x) => (
              <li key={x.en}>
                <Speak text={x.en} label={`${x.en} ${ja.common.hear}`} id={`typed:${x.en}`} size="sm" />
                <button type="button" className={page.wordOpen} onClick={() => open(x.en)}>
                  <span className={page.wordEn}>{x.en}</span>
                  <span className={page.wordJa}>{x.ja}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className={page.actions}>
            <button type="button" className="btn" onClick={start}>
              {t.again}
            </button>
            <Link href="/app/type" className="btn-quiet">
              {t.toHub}
            </Link>
          </div>
        </section>
      ) : w && mode === "see" ? (
        <div className={styles.round}>
          <div className={learn.prompt}>
            <span className={learn.pos}>{ja.word.pos[w.pos]}</span>
            <p className={learn.meaning}>{w.ja}</p>
          </div>
          <TypeCopy key={`${w.en}:${i}`} target={w.en} view="word" sayFirst auto onTyped={() => typed(w.en)} onDone={() => setI(i + 1)} />
        </div>
      ) : w ? (
        <Heard key={`${w.en}:${i}`} w={w} onTyped={() => typed(w.en)} onDone={() => setI(i + 1)} />
      ) : null}
    </div>
  );
}

/** One word heard: its sound first (and again when pressed), its meaning, its answer when asked for. */
function Heard({ w, onTyped, onDone }: { w: Word; onTyped: () => void; onDone: () => void }) {
  const [answer, setAnswer] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => void say(w.en, { key: `heard:${w.en}` }), 300);
    return () => window.clearTimeout(t);
  }, [w.en]);
  return (
    <div className={styles.round}>
      <div className={learn.prompt}>
        <Speak text={w.en} label={ja.common.hearAgain} id={`heard:${w.en}`} />
        <p className={learn.meaning}>{w.ja}</p>
      </div>
      <div className={learn.hints} onMouseDown={(e) => e.preventDefault()}>
        <button type="button" className={learn.hint} disabled={answer} onClick={() => setAnswer(true)}>
          <Icon name="eye" size={17} />
          {ja.learn.hints.answer}
        </button>
        {answer ? (
          <span className={learn.shown} lang="en">
            {w.en}
          </span>
        ) : null}
      </div>
      <TypeRecall target={w.en} reveal={answer} sayDone={false} auto onTyped={onTyped} onDone={onDone} />
    </div>
  );
}
