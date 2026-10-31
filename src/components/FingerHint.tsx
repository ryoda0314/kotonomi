import { ja } from "@/lib/i18n/ja";
import { isLeft, type Stroke } from "@/lib/keys";
import styles from "./typing.module.css";

const keyName = (ch: string) => (ch === " " ? ja.typing.spaceName : ch);
const fingerOf = (stroke: Stroke) =>
  `${ja.typing.fingers[stroke.key.finger]}${stroke.shift ? `・${ja.typing.withShift(isLeft(stroke.key.finger))}` : ""}`;

/** The next key and the finger for it, with the other hand's Shift when it needs one: [t] 左の人さし指・右の小指で Shift. */
export function FingerHint({ ch, stroke }: { ch: string; stroke: Stroke }) {
  return (
    <>
      <kbd className={styles.kbd}>{keyName(ch)}</kbd>
      {fingerOf(stroke)}
    </>
  );
}

/**
 * A key off the way, said plainly: what was pressed, the key wanted instead (a capital or a small letter named when
 * only the case was off) and, with the guide on, the finger for it: [m] ではなく [M]（大文字）：右の人さし指・…
 */
export function MissHint({ pressed, want, stroke }: { pressed: string; want: string; stroke: Stroke | null }) {
  const caseOnly = pressed !== want && pressed.toLowerCase() === want.toLowerCase();
  return (
    <>
      <kbd className={`${styles.kbd} ${styles.kbdMiss}`}>{keyName(pressed)}</kbd>
      {ja.typing.notThis}
      <kbd className={styles.kbd}>{keyName(want)}</kbd>
      {caseOnly ? (want === want.toUpperCase() ? ja.typing.upper : ja.typing.lower) : ""}
      {stroke ? `：${fingerOf(stroke)}` : ""}
    </>
  );
}
