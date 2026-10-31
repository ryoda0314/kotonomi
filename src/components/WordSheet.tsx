"use client";

// その語のこと, over any page (useOpenWord): the word and its sound, its meaning, where it belongs, its sentence with
// the word lit and its translation, and how it stands for this learner (出会った … 身についた, when it comes back).
// Opening it is only looking: nothing is kept.

import { createContext, useContext, useState, type ReactNode } from "react";
import { WORD } from "@/content/index";
import type { Word } from "@/content/types";
import { ja } from "@/lib/i18n/ja";
import { dueAt, isDue, isMet, metAt, stageOf } from "@/lib/record";
import { useRecord } from "@/lib/store";
import { useNow } from "./now";
import { Sentence } from "./Sentence";
import { Sheet } from "./Sheet";
import { Speak } from "./Speak";
import styles from "./WordSheet.module.css";

const OpenWord = createContext<(en: string) => void>(() => undefined);
export const useOpenWord = () => useContext(OpenWord);

const date = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", timeZone: "Asia/Tokyo" });

export function WordHost({ children }: { children: ReactNode }) {
  const [en, setEn] = useState<string | null>(null);
  const word = en ? WORD.get(en) : undefined;
  return (
    <OpenWord.Provider value={setEn}>
      {children}
      <Sheet open={!!word} onClose={() => setEn(null)} closeLabel={ja.common.close} title={word ? <Head word={word} /> : null}>
        {word ? <Body word={word} /> : null}
      </Sheet>
    </OpenWord.Provider>
  );
}

function Head({ word }: { word: Word }) {
  return (
    <div className={styles.head}>
      <Speak text={word.en} label={`${word.en} ${ja.common.hear}`} id={`sheet:${word.en}`} />
      <span className={styles.en} lang="en">
        {word.en}
      </span>
      <span className={styles.pos}>{ja.word.pos[word.pos]}</span>
    </div>
  );
}

function Body({ word }: { word: Word }) {
  const state = useRecord();
  const now = useNow();
  const log = state?.words[word.en];
  const met = isMet(log);
  const due = met && now > 0 && isDue(log, now);
  return (
    <>
      <section className={styles.section}>
        <p className={styles.ja}>{word.ja}</p>
        <p className={styles.where}>
          {word.exams.map((e) => ja.exams[e]).join("・")} {ja.levels[word.level]}
        </p>
      </section>

      <section className={styles.section}>
        <p className="label">{ja.word.example}</p>
        <div className={styles.line}>
          <Speak text={word.ex} label={`${ja.word.example} ${ja.common.hear}`} id={`sheet-ex:${word.en}`} size="sm" />
          <p className={styles.ex}>
            <Sentence word={word} />
          </p>
        </div>
        <p className={styles.exJa}>{word.exJa}</p>
      </section>

      <section className={styles.section}>
        {met ? (
          <>
            <p className={styles.stage} data-due={due ? "" : undefined}>
              {ja.word.stage[stageOf(log)]}
              <span>{due ? ja.word.dueNow : now ? ja.word.comesBack(date.format(dueAt(log))) : ""}</span>
            </p>
            <p className={styles.counts}>{ja.word.counts(log.typed.length, log.recalled.length, log.missed.length)}</p>
            <p className={styles.counts}>{ja.word.metOn(date.format(metAt(log)))}</p>
          </>
        ) : (
          <p className={styles.counts}>{ja.word.notMet}</p>
        )}
      </section>
    </>
  );
}
