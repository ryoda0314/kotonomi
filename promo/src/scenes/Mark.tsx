// 名前：アイコン（枝が伸び、葉が開き、青い実と紫の実がなる）と、明朝の ことのみ。一字ずつ降ってくる。下に一行。
import { fall, prog, RIPEN, SOFT } from "../anim";
import { FruitIcon } from "../fruit";
import { C, FONT } from "../theme";

export const TAGLINE = "TOEIC・TOEFL の英単語を、指で覚える。";

export function NameMark({
  frame,
  icon,
  word,
  lead,
  size,
  top,
  wordSize,
  leadSize,
}: {
  frame: number;
  icon: number;
  word: number;
  lead: number;
  size: number;
  top: number;
  wordSize: number;
  leadSize: number;
}) {
  const grow = {
    card: prog(frame, icon, 9),
    twig: prog(frame, icon + 4, 14, SOFT),
    leaf: prog(frame, icon + 12, 10, RIPEN),
    stems: prog(frame, icon + 16, 7),
    blue: prog(frame, icon + 21, 13, RIPEN),
    violet: prog(frame, icon + 28, 13, RIPEN),
  };
  return (
    <>
      <div style={{ position: "absolute", left: 960 - size / 2, top, width: size, height: size }}>
        <FruitIcon size={size} grow={grow} />
      </div>
      <p
        style={{
          position: "absolute",
          top: top + size + wordSize * 0.42,
          left: 0,
          right: 0,
          margin: 0,
          textAlign: "center",
          fontFamily: FONT.mincho,
          fontWeight: 700,
          fontSize: wordSize,
          letterSpacing: "0.06em",
          lineHeight: 1.2,
          color: C.ink,
        }}
      >
        {[..."ことのみ"].map((ch, i) => (
          <span key={i} style={{ display: "inline-block", ...fall(frame, word + i * 3, wordSize * 0.18, 16) }}>
            {ch}
          </span>
        ))}
      </p>
      <p
        style={{
          position: "absolute",
          top: top + size + wordSize * 1.95,
          left: 0,
          right: 0,
          margin: 0,
          textAlign: "center",
          fontFamily: FONT.ja,
          fontWeight: 600,
          fontSize: leadSize,
          lineHeight: 1.45,
          color: C.ink,
          ...fall(frame, lead, 14, 18),
        }}
      >
        {TAGLINE}
      </p>
    </>
  );
}
