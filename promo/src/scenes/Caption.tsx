// 映像の言葉。アプリの画面の左に：いまどこか（見出し）、短い一文、その下の静かな一文。
// 時が来ると降ってきて、前のものは上がって消える（姉妹の映像と同じ）。
import type { CSSProperties, ReactNode } from "react";
import { fall, leave, mixColor, prog } from "../anim";
import { C, FONT } from "../theme";
import { Icon, type IconName } from "../ui";

export const CAP = { left: 120, width: 680, kickerTop: 290, mainTop: 362 };
// 見出し：いまどこか（アイコンと名前）。
export const KICKER = { icon: { left: CAP.left, top: 291, size: 34 }, text: { left: CAP.left + 46, top: 290, size: 30 } };
/** 本文の一行の高さ（52px × 1.42）。 */
export const MAIN_LINE = 52 * 1.42;

/** 一切れ：ただの字か、色や字体を変えた字（打つ英語は等幅）。`at`：その字に色が付くコマ（無ければ一文が降りたとき）。 */
export type Part = string | { text: string; color?: string; mono?: boolean; at?: number };
/** いまどこか：はじめに、出会う、思い出す、また出会う、打つ。 */
export type Door = "setup" | "meet" | "recall" | "again" | "type";
const DOOR: Record<Door, { name: string; icon: IconName; color: string }> = {
  setup: { name: "はじめに", icon: "fruit", color: C.accent },
  meet: { name: "出会う", icon: "keys", color: C.accent },
  recall: { name: "思い出す", icon: "hint", color: C.accent },
  // 紫は、また出会うもの（globals.css の --again）。
  again: { name: "また出会う", icon: "fruit", color: C.again },
  type: { name: "打つ", icon: "keys", color: C.accent },
};
/** `subAt`：静かな一文が降る時（ふだんは本文のすぐあと）。`extra`：本文の下に置くもの（間隔の図など）。 */
export type Cap = { from: number; door: Door; main: Part[][]; sub?: Part[][]; subAt?: number; extra?: (frame: number) => ReactNode };

export function Kicker({ door, style }: { door: Door; style?: CSSProperties }) {
  const d = DOOR[door];
  return (
    <>
      <span style={{ position: "absolute", left: KICKER.icon.left, top: KICKER.icon.top, color: d.color, ...style }}>
        <Icon name={d.icon} size={KICKER.icon.size} stroke={1.7} />
      </span>
      <span
        style={{
          position: "absolute",
          left: KICKER.text.left,
          top: KICKER.text.top,
          fontSize: KICKER.text.size,
          lineHeight: "36px",
          fontWeight: 600,
          color: d.color,
          fontFamily: FONT.ja,
          whiteSpace: "nowrap",
          ...style,
        }}
      >
        {d.name}
      </span>
    </>
  );
}

function Parts({ parts, frame, colorAt }: { parts: Part[]; frame: number; colorAt: number }) {
  return (
    <>
      {parts.map((part, k) => {
        if (typeof part === "string") return <span key={k}>{part}</span>;
        return (
          <span
            key={k}
            style={{
              fontFamily: part.mono ? FONT.mono : undefined,
              fontWeight: part.mono ? 500 : part.color ? 600 : undefined,
              color: part.color ? mixColor(C.ink2, part.color, prog(frame, part.at ?? colorAt, 14)) : undefined,
            }}
          >
            {part.text}
          </span>
        );
      })}
    </>
  );
}

/** 一続きの言葉。`from` コマから、次が来るまで。 */
export function Captions({ frame, caps, until }: { frame: number; caps: Cap[]; until: number }) {
  return (
    <>
      {caps.map((c, i) => {
        const next = caps[i + 1]?.from ?? until;
        if (frame < c.from || frame > next + 14) return null;
        const prevDoor = caps[i - 1]?.door;
        const nextDoor = caps[i + 1]?.door;
        // 前の一文が消えて（9 コマ）から、次が降る。二つの文が重ならないように。
        const style = frame >= next ? leave(frame, next, 9, 12) : fall(frame, c.from + 8, 16, 16);
        // 見出しは、同じところの間は残り、変わると入れ替わる。
        const kickerIn = prevDoor === c.door ? { opacity: 1 } : fall(frame, c.from + 8, 10, 12);
        const kickerOut = nextDoor === c.door || !caps[i + 1] ? null : leave(frame, next, 8, 8);
        const kick = frame >= next && kickerOut ? kickerOut : frame >= next ? { opacity: 0 } : kickerIn;
        const subAt = c.subAt ?? c.from + 16;
        return (
          <div key={c.from}>
            <Kicker door={c.door} style={kick} />
            <div style={{ position: "absolute", left: CAP.left, top: CAP.mainTop, width: CAP.width, ...style }}>
              {c.main.map((m, j) => (
                <p key={j} style={{ margin: 0, fontSize: 52, fontWeight: 600, lineHeight: 1.42, letterSpacing: "0.01em", color: C.ink, fontFamily: FONT.ui, whiteSpace: "nowrap" }}>
                  <Parts parts={m} frame={frame} colorAt={c.from + 8} />
                </p>
              ))}
              {c.sub ? (
                <div style={{ marginTop: 30, ...fall(frame, subAt, 10, 16) }}>
                  {c.sub.map((line, j) => (
                    <p key={j} style={{ margin: 0, fontSize: 27, lineHeight: 1.75, color: C.ink2, fontFamily: FONT.ui, whiteSpace: "nowrap" }}>
                      <Parts parts={line} frame={frame} colorAt={subAt + 8} />
                    </p>
                  ))}
                </div>
              ) : null}
              {c.extra ? c.extra(frame) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ---- 間をのばして：出会った日から、翌日・3日・7日・16日（../src/lib/record.ts の REST） -------------------------------

const GAPS: [days: number, label: string][] = [
  [1, "翌日"],
  [3, "3日"],
  [7, "7日"],
  [16, "16日"],
];
const WIDTH = 560;
// 間の長さは、日数の平方根で（16日が1日の16倍だと、はじめの間が見えない）。
const ROOT = GAPS.map(([d]) => Math.sqrt(d));
const UNIT = WIDTH / ROOT.reduce((a, b) => a + b, 0);

/** `at`：区間が伸びはじめるコマ（声が「三日」「七日」「十六日」と言うところ）。最後の一つは「…」。 */
export function Rest({ frame, at }: { frame: number; at: number[] }) {
  let x = 0;
  const top = 46;
  return (
    <div style={{ position: "relative", marginTop: 40, height: 120, width: WIDTH + 80 }}>
      <span style={{ position: "absolute", left: -7, top: top - 7, width: 14, height: 14, borderRadius: "50%", background: C.accent, ...fall(frame, at[0], 6, 10) }} />
      {GAPS.map(([, label], i) => {
        const w = ROOT[i] * UNIT;
        const left = x;
        x += w;
        const p = prog(frame, at[i], 14);
        return (
          <div key={label}>
            <span style={{ position: "absolute", left, top: top - 1, width: w * p, height: 2, background: C.accent }} />
            <span style={{ position: "absolute", left: left + w - 7, top: top - 7, width: 14, height: 14, borderRadius: "50%", background: C.accent, transform: `scale(${prog(frame, at[i] + 10, 8)})` }} />
            <span style={{ position: "absolute", left, width: w, top: 0, textAlign: "center", fontSize: 24, fontWeight: 600, color: C.ink2, fontFamily: FONT.ja, whiteSpace: "nowrap", ...fall(frame, at[i] + 2, 8, 12) }}>
              {label}
            </span>
          </div>
        );
      })}
      <span style={{ position: "absolute", left: x + 12, top: top - 1, width: 56 * prog(frame, at[4], 16), height: 2, borderTop: `2px dashed ${C.accent}` }} />
      <span style={{ position: "absolute", left: 0, top: top + 22, fontSize: 20, color: C.muted, fontFamily: FONT.ja, whiteSpace: "nowrap", ...fall(frame, at[0] + 4, 6, 12) }}>出会った日</span>
    </div>
  );
}
