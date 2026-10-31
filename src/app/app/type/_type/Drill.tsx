"use client";

// キーの場所: one row of the keyboard, a key at a time, the key lit and the finger named. A wrong key shakes the key
// to press, flashes the one pressed, says both, and waits; nothing is timed or counted. A round is 30 keys.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FingerHint, MissHint } from "@/components/FingerHint";
import { Icon } from "@/components/Icon";
import { buzz, Keyboard } from "@/components/Keyboard";
import page from "@/components/page.module.css";
import { useLayout } from "@/components/prefs";
import typing from "@/components/typing.module.css";
import { ja } from "@/lib/i18n/ja";
import { DRILL, strokeFor, type DrillId } from "@/lib/keys";
import { drillSequence } from "@/lib/practice";
import { finishDrill } from "@/lib/record";
import { commit } from "@/lib/store";
import styles from "./type.module.css";

const t = ja.type;
const AHEAD = 6;

export function Drill({ id }: { id: DrillId }) {
  const [layout] = useLayout();
  const keys = DRILL.get(id)?.keys ?? [];
  const [seq, setSeq] = useState<string[] | null>(null);
  const [i, setI] = useState(0);
  const [miss, setMiss] = useState<string | null>(null);
  // Counts the keys off the way, so each one shakes and flashes anew.
  const [misses, setMisses] = useState(0);

  const start = useCallback(() => {
    setSeq(drillSequence(DRILL.get(id)?.keys ?? [], Math.random));
    setI(0);
    setMiss(null);
  }, [id]);

  useEffect(() => {
    // Shuffled on the device.
    const timer = window.setTimeout(start, 0);
    return () => window.clearTimeout(timer);
  }, [start]);

  const done = !!seq && i >= seq.length;
  const now = seq && !done ? seq[i] : null;
  const stroke = now ? strokeFor(now, layout) : null;

  const onKey = (k: string) => {
    if (!seq || done) return;
    if (k !== seq[i]) {
      setMiss(k);
      setMisses(misses + 1);
      buzz();
      return;
    }
    setMiss(null);
    setI(i + 1);
    if (i + 1 >= seq.length) commit((s) => finishDrill(s, id, Date.now()));
  };

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/type" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>
          <span className={page.barSub}>{t.keys}</span>
          {t.drills[id].name}
        </h1>
        {seq ? <span className={page.count}>{ja.common.countOf(Math.min(i + 1, seq.length), seq.length)}</span> : null}
      </header>

      {done ? (
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
      ) : (
        <div className={styles.drill}>
          <div className={styles.now} aria-live="polite">
            <span key={`${i}:${now}:${miss ? misses : 0}`} className={styles.big} data-miss={miss ? "" : undefined}>
              {now}
            </span>
            <ol className={styles.ahead} aria-hidden="true">
              {(seq ?? []).slice(i + 1, i + 1 + AHEAD).map((ch, j) => (
                <li key={`${i + 1 + j}`}>{ch}</li>
              ))}
            </ol>
          </div>
          <p className={typing.status} data-state={miss ? "miss" : undefined}>
            {miss && now ? (
              <MissHint pressed={miss} want={now} stroke={stroke} />
            ) : stroke && now ? (
              <FingerHint ch={now} stroke={stroke} />
            ) : (
              t.pressLit
            )}
          </p>
          <Keyboard layout={layout} onKey={onKey} onBack={() => undefined} next={now} miss={miss} missN={misses} focus={new Set(keys)} />
        </div>
      )}
    </div>
  );
}
