"use client";

// 見て打つ: a word or a sentence in sight, typed over itself. What is typed turns to ink, the next character is
// underlined, and its key lights on the keyboard with the finger named. A wrong key goes in nowhere: the character it
// should have been shakes, the key pressed stands over it in violet until the right one comes, and the line under the
// text says which key was pressed and which is wanted (CONCEPT.md). When every character is in, the learner moves on:
// by itself (`auto`), or by 次へ, the space bar or Enter.

import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { ja } from "@/lib/i18n/ja";
import { strokeFor } from "@/lib/keys";
import { plain } from "@/lib/typing";
import { FingerHint, MissHint } from "./FingerHint";
import { Icon } from "./Icon";
import { buzz, ENTER, Keyboard } from "./Keyboard";
import { usePref } from "./local";
import { useLayout } from "./prefs";
import { say, stop } from "./sound";
import styles from "./typing.module.css";

export function TypeCopy({
  target,
  view = "word",
  mark,
  sayFirst = false,
  sayDone = false,
  auto = false,
  below,
  onTyped,
  onDone,
}: {
  target: string;
  view?: "word" | "line";
  /** Shown under the text (a sentence's translation). */
  below?: ReactNode;
  /** Where the word stands in a sentence, [start, end): lit as it is typed. */
  mark?: [number, number] | null;
  /** Say it as it comes up: hear, then type. */
  sayFirst?: boolean;
  /** Say it once it is typed. */
  sayDone?: boolean;
  /** Move on by itself once it is typed. */
  auto?: boolean;
  /** Every character is in: kept at once, whether or not the learner moves on. */
  onTyped?: () => void;
  onDone: () => void;
}) {
  const [layout] = useLayout();
  const [guideOn] = usePref("guide", true);
  const [pos, setPos] = useState(0);
  const [miss, setMiss] = useState<string | null>(null);
  // Counts the keys off the way, so each one shakes and flashes anew.
  const [misses, setMisses] = useState(0);
  const moved = useRef(false);
  const done = pos >= target.length;
  const id = `copy:${target}`;

  const speak = () => void say(target, { key: id });
  const finish = () => {
    if (moved.current) return;
    moved.current = true;
    onDone();
  };
  const speakNow = useEffectEvent(speak);
  const finishNow = useEffectEvent(finish);

  useEffect(() => {
    if (!sayFirst) return;
    const t = window.setTimeout(() => speakNow(), 250);
    return () => window.clearTimeout(t);
  }, [sayFirst]);

  useEffect(() => () => stop(), []);

  useEffect(() => {
    if (!done || !auto) return;
    const t = window.setTimeout(() => finishNow(), 650);
    return () => window.clearTimeout(t);
  }, [done, auto]);

  const onKey = (ch: string) => {
    if (done) {
      // 次へ by the space bar too, as by Enter.
      if (ch === " ") finish();
      return;
    }
    const c = plain(ch);
    if (c !== target[pos]) {
      setMiss(c);
      setMisses(misses + 1);
      buzz();
      return;
    }
    setMiss(null);
    setPos(pos + 1);
    if (pos + 1 >= target.length) {
      onTyped?.();
      if (sayDone) speak();
    }
  };

  const now = done ? null : target[pos];
  const stroke = now ? strokeFor(now, layout) : null;
  const inMark = (i: number) => !!mark && i >= mark[0] && i < mark[1];

  const char = (i: number) => {
    const here = i === pos;
    return (
      <span
        // A new key for each miss: the character shakes again.
        key={here && miss ? `miss${misses}` : i}
        aria-hidden="true"
        className={[
          i < pos ? styles.typed : here ? styles.now : styles.rest,
          here && miss ? styles.miss : "",
          inMark(i) ? styles.mark : "",
        ].join(" ")}
      >
        {target[i]}
        {here && miss ? <span className={styles.ghost}>{miss === " " ? "␣" : miss}</span> : null}
      </span>
    );
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.copy} data-view={view} data-done={done ? "" : undefined} lang="en" aria-label={target}>
        {/* Each word kept whole on its line; a line breaks only at the spaces between them. */}
        {[...target.matchAll(/ +|[^ ]+/g)].map((m) =>
          m[0][0] === " " ? (
            [...m[0]].map((_, k) => char(m.index + k))
          ) : (
            <span key={`w${m.index}`} className={styles.word}>
              {[...m[0]].map((_, k) => char(m.index + k))}
            </span>
          ),
        )}
      </p>
      {below}

      <p className={styles.status} data-state={done ? "done" : miss ? "miss" : undefined} aria-live="polite">
        {done ? (
          <>
            <Icon name="check" size={18} />
            {ja.typing.right}
          </>
        ) : miss && now ? (
          <MissHint pressed={miss} want={now} stroke={guideOn ? stroke : null} />
        ) : guideOn && stroke && now ? (
          <FingerHint ch={now} stroke={stroke} />
        ) : (
          " "
        )}
      </p>

      {done && !auto ? (
        <div className={styles.actions}>
          <span className={styles.keysNote}>{ja.typing.nextKeys}</span>
          <button type="button" className="btn" onClick={finish}>
            {ja.common.next}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      ) : null}

      <Keyboard
        layout={layout}
        next={done ? (auto ? null : ENTER) : guideOn ? now : null}
        miss={miss}
        missN={misses}
        onKey={onKey}
        onBack={() => undefined}
        onEnter={done ? finish : undefined}
      />
    </div>
  );
}
