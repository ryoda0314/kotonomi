"use client";

// はじめに: which words (TOEIC, TOEFL or both), from which level, and the keyboard in front of the learner — read
// from the keyboard itself where the browser tells (Chrome and Edge), so a JIS keyboard is found without asking.

import { useEffect, useState } from "react";
import page from "@/components/page.module.css";
import { EXAM_CHOICES, LEVEL_CHOICES, useExam, useFrom, useLayout, type ExamChoice } from "@/components/prefs";
import type { Level } from "@/content/types";
import { ja } from "@/lib/i18n/ja";
import { LAYOUTS, type Layout } from "@/lib/keys";
import styles from "./learn.module.css";

const t = ja.setup;

type KeyboardApi = { getLayoutMap?: () => Promise<Map<string, string>> };

export function Setup() {
  const [exam, setExam] = useState<ExamChoice>("toeic");
  const [from, setFrom] = useState<(typeof LEVEL_CHOICES)[number]>("1");
  const [layout, setLayout] = useState<Layout>("jis");
  const [detected, setDetected] = useState(false);
  const [, keepExam] = useExam();
  const [, keepFrom] = useFrom();
  const [, keepLayout] = useLayout();

  useEffect(() => {
    const kb = (navigator as Navigator & { keyboard?: KeyboardApi }).keyboard;
    if (!kb?.getLayoutMap) return;
    let live = true;
    kb.getLayoutMap()
      .then((map) => {
        // The key right of ; makes : on a Japanese keyboard and ' on an English one.
        const quote = map.get("Quote");
        if (!live || (quote !== ":" && quote !== "'")) return;
        setLayout(quote === ":" ? "jis" : "us");
        setDetected(true);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{t.title}</h1>
      </header>
      <p className={page.lead}>{t.lead}</p>

      <section className={page.section}>
        <h2 className={page.h2}>{t.exam}</h2>
        <ul className={styles.options}>
          {EXAM_CHOICES.map((e) => (
            <li key={e}>
              <button type="button" className={styles.option} aria-pressed={exam === e} onClick={() => setExam(e)}>
                <span className={styles.optionTitle}>{ja.exams[e]}</span>
                <span className={styles.optionLead}>{ja.examLeads[e]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.from}</h2>
        <p className={page.note}>{t.fromLead}</p>
        <ul className={`${styles.options} ${styles.three}`}>
          {LEVEL_CHOICES.map((l) => (
            <li key={l}>
              <button type="button" className={styles.option} aria-pressed={from === l} onClick={() => setFrom(l)}>
                <span className={styles.optionTitle}>{ja.levels[Number(l) as Level]}</span>
                <span className={styles.optionLead}>{ja.levelLeads[exam][Number(l) as Level]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.layout}</h2>
        <p className={page.note}>{detected ? t.detected : t.layoutLead}</p>
        <div className={page.choices}>
          {LAYOUTS.map((l) => (
            <button key={l} type="button" className="btn-quiet" aria-pressed={layout === l} onClick={() => setLayout(l)}>
              {ja.layouts[l]}
            </button>
          ))}
        </div>
      </section>

      <div className={page.actions}>
        <button
          type="button"
          className="btn"
          onClick={() => {
            keepLayout(layout);
            keepFrom(from);
            // Last: once the words are chosen, 覚える begins.
            keepExam(exam);
          }}
        >
          {t.start}
        </button>
      </div>
    </div>
  );
}
