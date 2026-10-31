"use client";

import { Icon } from "./Icon";
import { say, stop, usePlaying } from "./sound";
import styles from "./Speak.module.css";

/** Says an English text; pressed again while it sounds, stops it. A ripple spreads while it plays (as in ことのあめ). */
export function Speak({
  text,
  label,
  id = text,
  size = "md",
  onSay,
}: {
  text: string;
  label: string;
  /** Names this button, when several say the same text. */
  id?: string;
  size?: "sm" | "md";
  /** Told each time it is pressed to speak (a hint used). */
  onSay?: () => void;
}) {
  const playing = usePlaying() === id;
  return (
    <button
      type="button"
      className={[styles.button, styles[size], playing ? styles.playing : ""].join(" ")}
      // Pressed while typing, it leaves the focus where it was (a space typed next must not press it again).
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        if (playing) return stop();
        onSay?.();
        void say(text, { key: id });
      }}
      aria-label={label}
      aria-pressed={playing}
    >
      <Icon name="speaker" size={size === "sm" ? 17 : 20} />
    </button>
  );
}
