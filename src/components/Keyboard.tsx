"use client";

// The keyboard on screen, drawn like the one in front of the learner (JIS or US, src/lib/keys.ts). On a computer it is
// a guide: a key typed there lights here for a moment, and the key to press next is lit with the Shift that goes with
// it, so the eyes learn where the fingers are. On a phone its keys are pressed instead. Every key can be pressed at
// any time, and the keyboard never rearranges itself while a text is typed.
//
// A wide keyboard (a computer) is drawn whole, its rows staggered by the keys at their ends; a narrow one (a phone)
// keeps the keys the sentences need, with the same stagger.

import { useEffect, useEffectEvent, useState, type CSSProperties } from "react";
import { ja } from "@/lib/i18n/ja";
import { isLeft, ROWS, SPACE, strokeFor, type KeyDef, type Layout } from "@/lib/keys";
import { Icon } from "./Icon";
import styles from "./Keyboard.module.css";

export const BACK = "⌫";
export const ENTER = "⏎";

/** A short buzz for a key off the way, where the device has one (a phone). */
export function buzz(): void {
  try {
    navigator.vibrate?.(30);
  } catch {
    // no vibration here
  }
}

/** A key on screen never takes the focus: a space typed in front of the learner must not press it again. */
const keepFocus = (e: React.PointerEvent | React.MouseEvent) => e.preventDefault();

/** True while a sheet is open over the page: the keys in front of the learner are left to it. */
const covered = () => typeof document !== "undefined" && !!document.querySelector("dialog[open]");

type End = { kind: "label" | "back" | "enter" | "shift" | "blank"; w: number; label?: string };
/** The keys at the ends of each row (widths in keys), as on the keyboard in front of the learner. */
const ENDS: Record<Layout, { lead: End; tail: End }[]> = {
  jis: [
    { lead: { kind: "label", w: 1, label: "半/全" }, tail: { kind: "back", w: 1 } },
    { lead: { kind: "label", w: 1.5, label: "Tab" }, tail: { kind: "blank", w: 1.5 } },
    { lead: { kind: "label", w: 1.75, label: "Caps" }, tail: { kind: "enter", w: 1.25 } },
    { lead: { kind: "shift", w: 2.25 }, tail: { kind: "shift", w: 1.75 } },
  ],
  us: [
    { lead: { kind: "label", w: 1, label: "`" }, tail: { kind: "back", w: 2 } },
    { lead: { kind: "label", w: 1.5, label: "Tab" }, tail: { kind: "blank", w: 0.5 } },
    { lead: { kind: "label", w: 1.75, label: "Caps" }, tail: { kind: "enter", w: 2.25 } },
    { lead: { kind: "shift", w: 2.25 }, tail: { kind: "shift", w: 2.75 } },
  ],
};

const width = (w: number, narrow?: number) => ({ "--w": w, ...(narrow ? { "--wn": narrow } : {}) }) as CSSProperties;
const isLetter = (ch: string) => /^[a-z]$/.test(ch);

export function Keyboard({
  layout,
  next,
  onKey,
  onBack,
  onEnter,
  focus,
  miss,
  missN = 0,
  listen = true,
}: {
  layout: Layout;
  /** What to press next: a character (its key lit, with Shift when it needs one), BACK, ENTER (lit with the space bar,
   *  which moves on too), or nothing. */
  next?: string | null;
  onKey: (ch: string) => void;
  onBack: () => void;
  onEnter?: () => void;
  /** The keys in use (キーの場所): the rest are faint. */
  focus?: ReadonlySet<string> | null;
  /** A character just pressed off the way: its key flashes violet, and the key wanted is nudged. */
  miss?: string | null;
  /** How many keys have gone off the way: each new one flashes anew. */
  missN?: number;
  /** Take the keys of the keyboard in front of the learner too. */
  listen?: boolean;
}) {
  const [shift, setShift] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [ime, setIme] = useState(false);
  const [caps, setCaps] = useState(false);

  const onDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || covered()) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    // Japanese input is on: the keys make kana, not letters.
    if (e.isComposing || e.key === "Process" || e.keyCode === 229) {
      setIme(true);
      return;
    }
    setCaps(!!e.getModifierState?.("CapsLock"));
    if (e.key === "Backspace") {
      e.preventDefault();
      onBack();
    } else if (e.key === "Enter") {
      // Never a button the mouse left the focus on (聞く, 答えを見る): Enter is 次へ, or nothing yet.
      e.preventDefault();
      if (!onEnter || e.repeat) return;
      onEnter();
    } else if (e.key.length === 1) {
      e.preventDefault();
      if (e.repeat) return;
      setIme(false);
      onKey(e.key === "¥" ? "\\" : e.key);
    } else return;
    setPressed(e.code);
  });

  useEffect(() => {
    if (!listen) return;
    const down = (e: KeyboardEvent) => onDown(e);
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [listen]);

  useEffect(() => {
    if (!pressed) return;
    const t = window.setTimeout(() => setPressed(null), 160);
    return () => window.clearTimeout(t);
  }, [pressed]);

  const tap = (k: KeyDef) => {
    onKey(shift && k.shift ? k.shift : k.base);
    setShift(false);
    setPressed(k.code);
  };

  const stroke = next && next !== BACK && next !== ENTER ? strokeFor(next, layout) : null;
  const needShift = !!stroke?.shift && !shift;
  // Shift is pressed by the other hand: the right Shift for a key of the left hand.
  const shiftSide = stroke && isLeft(stroke.key.finger) ? "right" : "left";
  const missed = miss ? strokeFor(miss, layout)?.key.code : undefined;
  const upper = shift || (!!stroke?.shift && isLetter(stroke.key.base));

  const charKey = (k: KeyDef) => {
    const lit = stroke?.key.code === k.code;
    const inUse = !focus || focus.has(k.base) || focus.has(k.shift);
    return (
      <button
        key={k.code}
        type="button"
        className={[
          styles.key,
          k.extra ? styles.extra : "",
          lit ? styles.next : "",
          !inUse && !lit ? styles.faint : "",
          pressed === k.code ? styles.pressed : "",
          // Two names for one animation, taken in turns, so each new miss plays it again.
          missed === k.code && !lit ? `${styles.missed} ${missN % 2 ? styles.flashA : styles.flashB}` : "",
          lit && miss ? (missN % 2 ? styles.nudgeA : styles.nudgeB) : "",
          k.code === "KeyF" || k.code === "KeyJ" ? styles.bump : "",
        ].join(" ")}
        aria-label={shift && k.shift ? k.shift : k.base}
        onPointerDown={keepFocus}
        onMouseDown={keepFocus}
        onClick={() => tap(k)}
      >
        {isLetter(k.base) ? (
          <span className={styles.main}>{upper ? k.shift : k.base}</span>
        ) : (
          <>
            {k.shift ? <span className={styles.top}>{k.shift}</span> : null}
            <span className={styles.main}>{k.base === " " ? "" : k.base}</span>
          </>
        )}
      </button>
    );
  };

  const end = (e: End, side: "lead" | "tail", row: number) => {
    const cls = [styles.key, styles.mod, styles[side]];
    if (e.kind === "shift") {
      const lit = needShift && (side === "lead" ? shiftSide === "left" : shiftSide === "right");
      return (
        <button
          key={`${side}${row}`}
          type="button"
          className={[...cls, styles.shiftKey, shift ? styles.on : "", lit ? styles.next : ""].join(" ")}
          style={width(e.w, side === "lead" ? 1.25 : undefined)}
          aria-label={ja.typing.shift}
          aria-pressed={shift}
          onPointerDown={keepFocus}
          onMouseDown={keepFocus}
          onClick={() => setShift(!shift)}
        >
          <Icon name="shift" size={18} />
        </button>
      );
    }
    if (e.kind === "back") {
      return (
        <button
          key={`${side}${row}`}
          type="button"
          className={[...cls, styles.backKey, next === BACK ? `${styles.next} ${styles.nextBack}` : "", pressed === "Backspace" ? styles.pressed : ""].join(" ")}
          style={width(e.w, 1.5)}
          aria-label={ja.typing.back}
          onPointerDown={keepFocus}
          onMouseDown={keepFocus}
          onClick={() => {
            onBack();
            setPressed("Backspace");
          }}
        >
          <Icon name="erase" size={20} />
        </button>
      );
    }
    if (e.kind === "enter") {
      return (
        <button
          key={`${side}${row}`}
          type="button"
          className={[...cls, next === ENTER ? styles.next : "", pressed === "Enter" ? styles.pressed : ""].join(" ")}
          style={width(e.w)}
          aria-label={ja.typing.enter}
          onPointerDown={keepFocus}
          onMouseDown={keepFocus}
          onClick={() => onEnter?.()}
        >
          <Icon name="enter" size={18} />
        </button>
      );
    }
    return (
      <span key={`${side}${row}`} className={[...cls, e.kind === "blank" ? styles.blank : ""].join(" ")} style={width(e.w)} aria-hidden="true">
        {e.label ? <span className={styles.label}>{e.label}</span> : null}
      </span>
    );
  };

  return (
    <div className={styles.wrap}>
      {ime ? <p className={styles.notice}>{ja.typing.ime}</p> : caps ? <p className={styles.notice}>{ja.typing.caps}</p> : null}
      <div className={styles.board}>
        <div className={styles.keys} role="group" aria-label={ja.typing.keyboard}>
          {ROWS[layout].map((row, i) => (
            <div key={i} className={styles.row} data-row={i}>
              {end(ENDS[layout][i].lead, "lead", i)}
              {row.map(charKey)}
              {end(ENDS[layout][i].tail, "tail", i)}
            </div>
          ))}
          <div className={`${styles.row} ${styles.spaceRow}`}>
            <button
              type="button"
              className={[
                styles.key,
                styles.space,
                stroke?.key.code === SPACE.code || next === ENTER ? styles.next : "",
                pressed === "Space" ? styles.pressed : "",
              ].join(" ")}
              style={width(7, 6)}
              aria-label={ja.typing.space}
              onPointerDown={keepFocus}
              onMouseDown={keepFocus}
              onClick={() => tap(SPACE)}
            >
              <span className={styles.label}>{ja.typing.space}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
