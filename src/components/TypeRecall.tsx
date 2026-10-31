"use client";

// 思い出して打つ: the word is not in sight. Every key goes in; from where it went off the way it is violet, on a violet
// ground, until ⌫ takes it back, so the learner sees the spelling they reached for. Going off the way shakes the line
// and lights ⌫ in violet. The keyboard lights nothing that would give the word away — only ⌫, and the next key once
// the answer has been opened (`reveal`). Done when the word is typed whole; then on by 次へ, the space bar or Enter.

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ja } from "@/lib/i18n/ja";
import { strokeFor } from "@/lib/keys";
import { agreed, backRecall, emptyRecall, pressRecall, type Recall } from "@/lib/typing";
import { FingerHint } from "./FingerHint";
import { Icon } from "./Icon";
import { BACK, buzz, ENTER, Keyboard } from "./Keyboard";
import { usePref } from "./local";
import { useLayout } from "./prefs";
import { say, stop } from "./sound";
import styles from "./typing.module.css";

export function TypeRecall({
  target,
  reveal = false,
  sayDone = true,
  auto = false,
  onTyped,
  onDone,
}: {
  target: string;
  /** The answer is open: the keyboard may light the way. */
  reveal?: boolean;
  sayDone?: boolean;
  /** Move on by itself once it is typed. */
  auto?: boolean;
  /** Typed whole: how many times it went off the way. */
  onTyped: (r: { slips: number }) => void;
  onDone: () => void;
}) {
  const [layout] = useLayout();
  const [guideOn] = usePref("guide", true);
  const [r, setR] = useState<Recall>(emptyRecall);
  // Counts the slips, so each one shakes the line anew.
  const [shakes, setShakes] = useState(0);
  const moved = useRef(false);
  const ok = agreed(r.typed, target);
  const off = r.typed.length - ok;
  const done = r.typed === target;

  const finish = () => {
    if (moved.current) return;
    moved.current = true;
    onDone();
  };
  const finishNow = useEffectEvent(finish);

  useEffect(() => () => stop(), []);

  useEffect(() => {
    if (!done || !auto) return;
    const t = window.setTimeout(() => finishNow(), 1100);
    return () => window.clearTimeout(t);
  }, [done, auto]);

  const onKey = (ch: string) => {
    if (done) {
      // 次へ by the space bar too, as by Enter.
      if (ch === " ") finish();
      return;
    }
    const next = pressRecall(r, ch, target);
    if (next.slips > r.slips) {
      setShakes(shakes + 1);
      buzz();
    }
    setR(next);
    if (next.typed === target) {
      onTyped({ slips: next.slips });
      if (sayDone) void say(target, { key: `recall:${target}` });
    }
  };

  const now = !done && !off && reveal ? target[ok] : null;
  const stroke = now ? strokeFor(now, layout) : null;

  return (
    <div className={styles.wrap}>
      <div
        className={styles.field}
        data-done={done ? "" : undefined}
        data-shake={shakes ? (shakes % 2 ? "a" : "b") : undefined}
        aria-live="polite"
      >
        {r.typed ? (
          <span className={styles.recall} lang="en">
            {r.typed.slice(0, ok)}
            <span className={styles.off}>{r.typed.slice(ok)}</span>
            {!done ? <span className={styles.caret} aria-hidden="true" /> : null}
          </span>
        ) : (
          <span className={styles.placeholder}>
            <span className={styles.caret} aria-hidden="true" />
            {ja.typing.placeholder}
          </span>
        )}
      </div>

      <p className={styles.status} data-state={done ? "done" : off ? "miss" : undefined}>
        {done ? (
          <>
            <Icon name="check" size={18} />
            {ja.typing.right}
          </>
        ) : off ? (
          ja.typing.toBack(off)
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
        next={done ? (auto ? null : ENTER) : off ? BACK : guideOn ? now : null}
        onKey={onKey}
        onBack={() => {
          if (!done) setR(backRecall(r));
        }}
        onEnter={done ? finish : undefined}
      />
    </div>
  );
}
