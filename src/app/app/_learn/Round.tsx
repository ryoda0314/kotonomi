"use client";

// 覚える: one round at a time, chosen on the device from the learner's own record (src/lib/round.ts):
//   出会う    each new word typed in sight (its sound first), then its sentence (typed, or read and heard); a word
//             already known can be passed over, and the next new word takes its place
//   思い出す  the new words and those whose time has come, shuffled, typed from their meaning; a word recalled only
//             with help comes once more a little later
// then the words that will come back are said (ことのあめ's violet). Nothing is scored, timed or counted against the
// learner: a word not recalled simply comes back.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import page from "@/components/page.module.css";
import { usePref } from "@/components/local";
import { scopeOf, useExam, useFresh, useFrom } from "@/components/prefs";
import { stop } from "@/components/sound";
import { countUsage } from "@/components/usage";
import { WORD } from "@/content/index";
import type { Word } from "@/content/types";
import { ja } from "@/lib/i18n/ja";
import { dayOf, finishRound, knewWord, recalledWord, typedLine, typedWord, type RoundEntry } from "@/lib/record";
import { againIn, freshWords, planRound, recallOrder, type RoundPlan } from "@/lib/round";
import { commit, getState, useRecord } from "@/lib/store";
import { RoundEnd } from "./End";
import { MeetLine, MeetWord } from "./Meet";
import { RecallWord } from "./Recall";
import { Track } from "./Track";
import styles from "./learn.module.css";

type Item = { kind: "word" | "line"; w: Word; n: number } | { kind: "recall"; w: Word; again: number };

type Run = {
  plan: RoundPlan;
  queue: Item[];
  i: number;
  /** The new words of this round, as they stand (a word passed over gives its place to the next). */
  fresh: Word[];
  missed: string[];
  firstToday: boolean;
};

/** How many times a word recalled only with help comes again in the same round. */
const AGAIN_MAX = 2;

export function Round() {
  const state = useRecord();
  const [exam] = useExam();
  const [from] = useFrom();
  const [freshN] = useFresh();
  const [typeLines] = usePref("lines", true);
  const [run, setRun] = useState<Run | null>(null);

  const start = useCallback(() => {
    stop();
    const s = getState();
    const now = Date.now();
    const plan = planRound(s, now, scopeOf(exam, from), Number(freshN));
    const order = recallOrder([...plan.fresh, ...plan.due].map((w) => w.en), plan.fresh.at(-1)?.en ?? null, Math.random);
    const queue: Item[] = [
      ...plan.fresh.flatMap((w, k): Item[] => [
        { kind: "word", w, n: k + 1 },
        { kind: "line", w, n: k + 1 },
      ]),
      ...order.map((en): Item => ({ kind: "recall", w: WORD.get(en) as Word, again: 0 })),
    ];
    setRun({ plan, queue, i: 0, fresh: plan.fresh, missed: [], firstToday: !s.rounds.some((r) => dayOf(r.at) === dayOf(now)) });
    window.scrollTo({ top: 0 });
  }, [exam, from, freshN]);

  useEffect(() => {
    // The first round is chosen once the page is on the device, where the record is.
    if (state && !run) {
      const t = window.setTimeout(start, 0);
      return () => window.clearTimeout(t);
    }
  }, [state, run, start]);

  useEffect(() => () => stop(), []);

  if (!run) {
    return (
      <div className={page.page}>
        <header className={page.bar}>
          <h1 className={page.barTitle}>{ja.learn.title}</h1>
        </header>
        <p className={page.skeleton}>{ja.learn.loading}</p>
      </div>
    );
  }

  const item = run.queue[run.i];
  const recalls = run.queue.filter((x) => x.kind === "recall");

  /** The round done: kept in the record, and counted once it is (src/components/usage.ts), whichever way it ended. */
  const finish = (entry: RoundEntry) => {
    const before = getState();
    if (commit((s) => finishRound(s, entry)) !== before) countUsage("learn");
  };

  const next = () => {
    stop();
    if (run.i + 1 >= run.queue.length) {
      finish({ at: run.plan.at, fresh: run.fresh.map((w) => w.en), due: run.plan.due.map((w) => w.en), missed: run.missed });
    }
    setRun({ ...run, i: run.i + 1 });
    window.scrollTo({ top: 0 });
  };

  /** A new word passed over as known: its sentence and its recall go, and the next new word takes its place. */
  const passOver = (w: Word) => {
    commit((s) => knewWord(s, w.en, Date.now()));
    const [more] = freshWords(getState(), scopeOf(exam, from), 1, new Set(run.fresh.map((x) => x.en)));
    const n = item.kind === "recall" ? 0 : item.n;
    const rest = run.queue.slice(run.i + 1).filter((x) => x.w.en !== w.en);
    const queue = [
      ...run.queue.slice(0, run.i),
      ...(more
        ? ([
            { kind: "word", w: more, n },
            { kind: "line", w: more, n },
          ] as Item[])
        : []),
      ...rest,
      ...(more ? [{ kind: "recall", w: more, again: 0 } as Item] : []),
    ];
    const fresh = run.fresh.flatMap((x) => (x.en !== w.en ? [x] : more ? [more] : []));
    if (run.i >= queue.length) {
      finish({ at: run.plan.at, fresh: fresh.map((x) => x.en), due: run.plan.due.map((x) => x.en), missed: run.missed });
    }
    setRun({ ...run, queue, fresh });
  };

  const recalled = (w: Word, again: number, clean: boolean) => {
    commit((s) => recalledWord(s, w.en, Date.now(), clean));
    // Typed from its meaning, alone or with help: counted as the learner's own (src/components/usage.ts).
    countUsage("say");
    if (clean) return;
    setRun((r) =>
      r && {
        ...r,
        missed: r.missed.includes(w.en) ? r.missed : [...r.missed, w.en],
        queue: again < AGAIN_MAX ? againIn(r.queue, r.i, { kind: "recall", w, again: again + 1 }) : r.queue,
      },
    );
  };

  if (!run.queue.length) {
    return (
      <div className={page.page}>
        <header className={page.bar}>
          <h1 className={page.barTitle}>{ja.learn.title}</h1>
        </header>
        <p className={page.empty}>{ja.learn.allMet}</p>
        <div className={page.actions}>
          <Link href="/app/me/settings" className="btn">
            {ja.learn.toSettings}
          </Link>
          <Link href="/app/type" className="btn-quiet">
            {ja.learn.toType}
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    ...(run.fresh.length ? [{ step: "meet" as const, label: ja.learn.steps.meet }] : []),
    { step: "recall" as const, label: ja.learn.steps.recall },
  ];
  const count = !item
    ? null
    : item.kind === "recall"
      ? ja.common.countOf(run.queue.slice(0, run.i + 1).filter((x) => x.kind === "recall").length, recalls.length)
      : ja.common.countOf(item.n, run.fresh.length);

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{ja.learn.title}</h1>
        {count ? <span className={page.count}>{count}</span> : null}
      </header>
      <div className={styles.body}>
        <Track steps={steps} current={item?.kind === "recall" ? "recall" : "meet"} done={!item} />

        {item?.kind === "word" ? (
          <MeetWord
            key={`${run.plan.at}:${run.i}:${item.w.en}`}
            w={item.w}
            onTyped={() => commit((s) => typedWord(s, item.w.en, Date.now()))}
            onKnown={() => passOver(item.w)}
            onDone={next}
          />
        ) : null}

        {item?.kind === "line" ? (
          <MeetLine
            key={`${run.plan.at}:${run.i}:${item.w.en}`}
            w={item.w}
            typeIt={typeLines}
            onTyped={() => commit((s) => typedLine(s, item.w.en, Date.now()))}
            onDone={next}
          />
        ) : null}

        {item?.kind === "recall" ? (
          <RecallWord
            key={`${run.plan.at}:${run.i}:${item.w.en}`}
            w={item.w}
            due={run.plan.due.includes(item.w)}
            again={item.again < AGAIN_MAX}
            onTyped={(clean) => recalled(item.w, item.again, clean)}
            onDone={next}
          />
        ) : null}

        {!item ? <RoundEnd fresh={run.fresh} due={run.plan.due} missed={run.missed} firstToday={run.firstToday} onNext={start} /> : null}
      </div>
    </div>
  );
}
