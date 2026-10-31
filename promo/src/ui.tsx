// ことのみ の画面を、映像のために描き直したもの（../src/**/*.module.css、../src/app/globals.css）。大きさはアプリの px
// のまま、画面は CSS の拡大で大きく見せる。ひとりでには動かない：どの変化もコマで決まる（アプリの CSS の animation は、
// anim.ts でコマに移した）。
import type { CSSProperties, ReactNode } from "react";
import { isLeft, ROWS, SPACE, strokeFor, type KeyDef, type Stroke } from "../../src/lib/keys.ts";
import { ja } from "../../src/lib/i18n/ja.ts";
import { f, frames, mixColor, prog, shakeChar, shakeLine } from "./anim";
import { FruitIcon } from "./fruit";
import { C, FONT } from "./theme";

// ---- アイコン（../src/components/Icon.tsx） ----------------------------------------------------------------------

const PATHS = {
  speaker: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  back: <path d="M15 18l-6-6 6-6" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  fruit: (
    <>
      <circle cx="12" cy="14.5" r="6.5" />
      <path d="M12 8V4.5" />
      <path d="M12 6.2c1.4-2.3 3.6-3 6-2.6-.6 2.4-2.8 3.7-6 2.6z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  keys: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6.5 10h1M10.5 10h1M14.5 10h1M8 14h8" />
    </>
  ),
  lines: <path d="M4 7h16M4 12h12M4 17h14" />,
  erase: (
    <>
      <path d="M8.5 5H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8.5L3 12z" />
      <path d="M11.5 9.5l5 5M16.5 9.5l-5 5" />
    </>
  ),
  hint: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
  shift: <path d="M12 4 4 12.5h4.5V20h7v-7.5H20z" />,
  enter: (
    <>
      <path d="M19 5v6a3 3 0 0 1-3 3H6" />
      <path d="M9.5 10.5 6 14l3.5 3.5" />
    </>
  ),
};
export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, color = "currentColor", stroke = 1.8 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
      {PATHS[name]}
    </svg>
  );
}

export const rgba = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",")},${a})`;

// ---- 小さな部品 ------------------------------------------------------------------------------------------------------

/** 指で押したところ：輪が寄って、離れる。`t` は押してからのコマ（前なら負）。 */
export function Press({ t, x = "50%", y = "50%", size = 46 }: { t: number; x?: number | string; y?: number | string; size?: number }) {
  if (t < -8 || t > 16) return null;
  const inP = Math.min(1, (t + 8) / 8);
  const outP = t > 0 ? Math.min(1, t / 16) : 0;
  return (
    <span
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: "50%",
        background: rgba(C.ink, 0.14 * inP * (1 - outP)),
        border: `2px solid ${rgba(C.ink, 0.32 * inP * (1 - outP))}`,
        transform: `scale(${1.25 - 0.25 * inP + 0.5 * outP})`,
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}

/** 鳴っている間、ボタンから広がる波紋（Speak.module.css の ripple、1.4 秒）。`t`：鳴りはじめてからのコマ（鳴っていなければ負）。 */
export function Ripple({ t, color = C.accent }: { t: number; color?: string }) {
  if (t < 0) return null;
  const p = (t % 42) / 42;
  return <span style={{ position: "absolute", inset: -1, borderRadius: "50%", border: `1px solid ${color}`, opacity: 0.7 * (1 - p), transform: `scale(${1 + 0.7 * p})` }} />;
}

/** 読み上げのボタン（Speak.module.css。sm は 36px）。`play`：鳴りはじめてからのコマ。 */
export function Speak({ play = -1, size = 36 }: { play?: number; size?: number }) {
  const on = play >= 0;
  return (
    <span
      style={{
        position: "relative",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1px solid ${on ? C.accent : C.line2}`,
        background: C.paper,
        color: on ? C.accent : C.ink,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name="speaker" size={size >= 44 ? 20 : 17} />
      <Ripple t={play} />
    </span>
  );
}

/** ボタン（globals.css の .btn）。 */
export function Btn({ children, press = -99, style }: { children: ReactNode; press?: number; style?: CSSProperties }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 52,
        padding: "0 24px",
        borderRadius: 12,
        border: `1px solid ${C.accent}`,
        background: C.accent,
        color: "#fff",
        fontSize: 16,
        fontWeight: 600,
        transform: press >= 0 && press < 6 ? "scale(0.97)" : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
      <Press t={press} />
    </span>
  );
}

/** 上の帯（page.module.css の .bar）。 */
export function Bar({ title, count, back = false }: { title: string; count?: string; back?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 60, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
      {back ? (
        <span style={{ width: 44, height: 44, marginLeft: -10, display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.ink }}>
          <Icon name="back" size={22} />
        </span>
      ) : null}
      <h1 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.4 }}>{title}</h1>
      {count ? <span style={{ fontSize: 13, color: C.faint, letterSpacing: "0.04em" }}>{count}</span> : null}
    </div>
  );
}

export const lead: CSSProperties = { margin: 0, fontSize: 14, lineHeight: 1.7, color: C.muted };
export const exJa: CSSProperties = { margin: 0, fontSize: 14, lineHeight: 1.7, color: C.muted };

/** ひと回りの流れ（_learn/Track.tsx・track.module.css）：済んだ所は印、いまの所は灯り、先は薄く。 */
export function Track({ at }: { at: number }) {
  const steps: { icon: IconName; label: string }[] = [
    { icon: "keys", label: ja.learn.steps.meet },
    { icon: "hint", label: ja.learn.steps.recall },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, padding: "4px 0 14px", borderBottom: `1px solid ${C.line}` }}>
      {steps.map((s, i) => {
        const state = i < at ? "done" : i === at ? "now" : "next";
        return (
          <div key={s.label} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
            {i > 0 ? <span style={{ position: "absolute", top: 17, right: "50%", width: "100%", height: 2, background: i <= at ? C.accent : C.line2 }} /> : null}
            <span
              style={{
                position: "relative",
                zIndex: 1,
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${state === "next" ? C.line2 : C.accent}`,
                background: state === "done" ? C.accent : state === "now" ? C.tint : C.paper,
                color: state === "done" ? "#fff" : state === "now" ? C.accent : C.faint,
                outline: state === "now" ? `4px solid ${C.tint}` : undefined,
                outlineOffset: 2,
              }}
            >
              <Icon name={state === "done" ? "check" : s.icon} size={20} />
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 4, fontSize: 14, lineHeight: 1.3, whiteSpace: "nowrap", color: state === "done" ? C.ink2 : state === "now" ? C.accent : C.faint, fontWeight: state === "now" ? 600 : 400 }}>
              <span style={{ fontSize: 12 }}>{i + 1}</span>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 横のタブ（BottomNav.module.css の 720〜1279px：アイコンの下に名前、上にアプリのアイコン）。 */
export function Nav({ active }: { active: "learn" | "type" | "me" }) {
  const items: [typeof active, IconName, string][] = [
    ["learn", "fruit", ja.nav.learn],
    ["type", "keys", ja.nav.type],
    ["me", "user", ja.nav.me],
  ];
  return (
    <div style={{ width: 88, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4, padding: "18px 8px 20px", borderRight: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", justifyContent: "center", padding: "2px 0 20px" }}>
        <span style={{ borderRadius: "22%", overflow: "hidden", width: 28, height: 28 }}>
          <FruitIcon size={28} />
        </span>
      </div>
      {items.map(([id, icon, name]) => (
        <span
          key={id}
          style={{
            minHeight: 64,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            borderRadius: 10,
            fontSize: 11,
            color: id === active ? C.accent : C.muted,
            fontWeight: id === active ? 600 : 400,
            background: id === active ? C.tint : undefined,
          }}
        >
          <Icon name={icon} size={22} />
          {name}
        </span>
      ))}
    </div>
  );
}

// ---- キーボード（components/Keyboard.tsx・Keyboard.module.css の、560px からのまるごとのキーボード。日本語配列） ------

export const BACK = "⌫";
export const ENTER = "⏎";

type End = { kind: "label" | "back" | "enter" | "shift" | "blank"; w: number; label?: string };
/** 段の両はしのキー（幅はキーいくつ分）。手元のキーボードと同じ。 */
const ENDS: { lead: End; tail: End }[] = [
  { lead: { kind: "label", w: 1, label: "半/全" }, tail: { kind: "back", w: 1 } },
  { lead: { kind: "label", w: 1.5, label: "Tab" }, tail: { kind: "blank", w: 1.5 } },
  { lead: { kind: "label", w: 1.75, label: "Caps" }, tail: { kind: "enter", w: 1.25 } },
  { lead: { kind: "shift", w: 2.25 }, tail: { kind: "shift", w: 1.75 } },
];
const isLetter = (ch: string) => /^[a-z]$/.test(ch);
const GAP = 5;
const PAD = 6;

/**
 * `next`：次に押すもの（字、BACK、ENTER：Enter はスペースといっしょに光る）。`press`：いま手元で押したキー（字、BACK、
 * ENTER）と、押してからのコマ。`miss`：外れたキーと、外れてからのコマ（紫に光り、次のキーが小さく弾む）。
 * `width`：キーボードの幅（px）。
 */
export function Keyboard({
  next,
  press,
  miss,
  width,
}: {
  next?: string | null;
  press?: { key: string; t: number } | null;
  miss?: { key: string; t: number } | null;
  width: number;
}) {
  const u = (width - 2 * PAD) / 15;
  const stroke = next && next !== BACK && next !== ENTER ? strokeFor(next, "jis") : null;
  const shiftSide = stroke && isLeft(stroke.key.finger) ? "right" : "left";
  const upper = !!stroke?.shift && isLetter(stroke.key.base);
  const missed = miss ? strokeFor(miss.key, "jis")?.key.code : undefined;
  const down = press && press.t >= 0 && press.t < 5 ? press.key : null;
  const downCode = down === BACK ? "Backspace" : down === ENTER ? "Enter" : down ? strokeFor(down, "jis")?.key.code : undefined;
  // 外れたキー：紫がぱっと灯って（0.5 秒）、正しいキーが来るまで薄い紫。次のキーは小さく弾む（0.4 秒）。
  const flash = miss ? 1 - prog(miss.t, 0, f(0.5), (x) => 1 - (1 - x) * (1 - x)) : 0;
  const nudge = miss ? frames(miss.t, f(0.4), [[0, 1], [0.35, 1.16], [1, 1]]) : 1;

  const box = (w: number, lit: boolean, extra: CSSProperties = {}): CSSProperties => ({
    position: "relative",
    flex: "0 0 auto",
    width: u * w - GAP,
    marginRight: GAP,
    height: 46,
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${lit ? C.accent : C.line2}`,
    borderRadius: 7,
    background: lit ? C.accent : C.paper,
    color: lit ? "#fff" : C.ink,
    fontFamily: FONT.mono,
    fontSize: 17,
    lineHeight: 1.1,
    ...extra,
  });
  const sub = (lit: boolean): CSSProperties => ({ display: "block", fontSize: 11, color: lit ? "rgba(255,255,255,0.82)" : C.muted });
  const label = (lit: boolean): CSSProperties => ({ fontFamily: FONT.ui, fontSize: 11, color: lit ? "rgba(255,255,255,0.82)" : C.muted });
  const pressed = (on: boolean, lit: boolean): CSSProperties => (on ? { outline: `3px solid ${C.tint}`, background: lit ? C.accent : C.tint } : {});

  const charKey = (k: KeyDef) => {
    const lit = stroke?.key.code === k.code;
    const isMissed = missed === k.code && !lit;
    const missStyle: CSSProperties = isMissed
      ? {
          borderColor: C.again,
          background: mixColor(C.againTint, C.again, flash),
          color: flash > 0.5 ? "#fff" : C.again,
          transform: `scale(${1 + 0.08 * flash})`,
          zIndex: 2,
        }
      : {};
    return (
      <span key={k.code} style={{ ...box(1, lit), ...pressed(downCode === k.code, lit), ...missStyle, ...(lit && miss ? { transform: `scale(${nudge})`, zIndex: 2 } : {}) }}>
        {isLetter(k.base) ? (
          <span style={{ display: "block" }}>{upper ? k.shift : k.base}</span>
        ) : (
          <>
            {k.shift ? <span style={sub(lit)}>{k.shift}</span> : null}
            <span style={{ display: "block" }}>{k.base}</span>
          </>
        )}
        {k.code === "KeyF" || k.code === "KeyJ" ? (
          <span style={{ position: "absolute", bottom: 6, left: "50%", width: 9, height: 2, borderRadius: 1, background: "currentColor", opacity: 0.45, transform: "translateX(-50%)" }} />
        ) : null}
      </span>
    );
  };

  const end = (e: End, side: "lead" | "tail", row: number) => {
    const key = `${side}${row}`;
    if (e.kind === "shift") {
      const lit = !!stroke?.shift && (side === "lead" ? shiftSide === "left" : shiftSide === "right");
      return (
        <span key={key} style={{ ...box(e.w, lit), color: lit ? "#fff" : C.ink2 }}>
          <Icon name="shift" size={18} />
        </span>
      );
    }
    if (e.kind === "back") {
      const lit = next === BACK;
      return (
        <span key={key} style={{ ...box(e.w, lit), color: lit ? "#fff" : C.ink2, ...(lit ? { background: C.again, borderColor: C.again } : {}), ...pressed(down === BACK, false) }}>
          <Icon name="erase" size={20} />
        </span>
      );
    }
    if (e.kind === "enter") {
      const lit = next === ENTER;
      return (
        <span key={key} style={{ ...box(e.w, lit), color: lit ? "#fff" : C.ink2, ...pressed(down === ENTER, lit) }}>
          <Icon name="enter" size={18} />
        </span>
      );
    }
    return (
      <span key={key} style={{ ...box(e.w, false), color: C.ink2, visibility: e.kind === "blank" ? "hidden" : undefined }}>
        {e.label ? <span style={label(false)}>{e.label}</span> : null}
      </span>
    );
  };

  const spaceLit = stroke?.key.code === SPACE.code || next === ENTER;
  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap: GAP, padding: `${PAD}px ${PAD - GAP}px ${PAD}px ${PAD}px`, border: `1px solid ${C.line}`, borderRadius: 14, background: C.surface }}>
      {ROWS.jis.map((row, i) => (
        <div key={i} style={{ display: "flex" }}>
          {end(ENDS[i].lead, "lead", i)}
          {row.map(charKey)}
          {end(ENDS[i].tail, "tail", i)}
        </div>
      ))}
      <div style={{ display: "flex", paddingLeft: u * 4 }}>
        <span style={{ ...box(7, spaceLit), ...pressed(downCode === SPACE.code, spaceLit) }}>
          <span style={label(spaceLit)}>{ja.typing.space}</span>
        </span>
      </div>
    </div>
  );
}

// ---- 次のキーと指（FingerHint.tsx） ----------------------------------------------------------------------------------

export function Kbd({ children, miss = false }: { children: ReactNode; miss?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 26,
        height: 26,
        padding: "0 6px",
        border: `1px solid ${miss ? C.again : C.line2}`,
        borderRadius: 6,
        background: miss ? C.again : C.paper,
        fontFamily: FONT.mono,
        fontSize: 14,
        fontWeight: 500,
        color: miss ? "#fff" : C.ink,
      }}
    >
      {children}
    </span>
  );
}

const keyName = (ch: string) => (ch === " " ? ja.typing.spaceName : ch);
const fingerOf = (s: Stroke) => `${ja.typing.fingers[s.key.finger]}${s.shift ? `・${ja.typing.withShift(isLeft(s.key.finger))}` : ""}`;

/** [t] 左の人さし指・右の小指で Shift を押しながら */
export function FingerHint({ ch }: { ch: string }) {
  const s = strokeFor(ch, "jis");
  if (!s) return null;
  return (
    <>
      <Kbd>{keyName(ch)}</Kbd>
      {fingerOf(s)}
    </>
  );
}

/** [m] ではなく [n]：右の人さし指 */
export function MissHint({ pressed, want }: { pressed: string; want: string }) {
  const s = strokeFor(want, "jis");
  return (
    <>
      <Kbd miss>{keyName(pressed)}</Kbd>
      {ja.typing.notThis}
      <Kbd>{keyName(want)}</Kbd>
      {s ? `：${fingerOf(s)}` : ""}
    </>
  );
}

/** 打つ欄の下の一行（typing.module.css の .status）。 */
export function Status({ state, children }: { state?: "miss" | "done"; children: ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        minHeight: "1.8em",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontSize: state === "done" ? 15 : 13.5,
        color: state === "miss" ? C.again : state === "done" ? C.accent : C.muted,
        fontWeight: state ? 600 : 400,
        textAlign: "center",
      }}
    >
      {children}
    </p>
  );
}

export const Right = () => (
  <>
    <Icon name="check" size={18} />
    {ja.typing.right}
  </>
);

/** 打つところの細い縦線（typing.module.css の .caret、1.1 秒で点滅）。 */
export function Caret({ frame, height = "1.05em" }: { frame: number; height?: number | string }) {
  return <span style={{ display: "inline-block", width: 2, height, marginLeft: 2, verticalAlign: "-0.12em", background: C.accent, opacity: frame % 33 < 17 ? 1 : 0 }} />;
}

// ---- 見て打つ（TypeCopy.tsx）：打った字は墨、次の字に下線、外れたら紫で知らせて、正しいキーを待つ -------------------

/**
 * `pos`：打てた字の数。`miss`：外れたキーと、外れてからのコマ（字がふるえ、押したキーがその上に紫で立つ）。
 * `mark`：例文の中の語（打つと色が付く）。
 */
export function Copy({
  target,
  pos,
  miss,
  view,
  mark = null,
}: {
  target: string;
  pos: number;
  miss?: { key: string; t: number } | null;
  view: "word" | "line";
  mark?: [number, number] | null;
}) {
  const inMark = (i: number) => !!mark && i >= mark[0] && i < mark[1];
  const char = (i: number) => {
    const here = i === pos;
    const m = inMark(i);
    let style: CSSProperties =
      i < pos
        ? { color: m ? C.accent : C.ink, fontWeight: m ? 600 : undefined }
        : here
          ? {
              position: "relative",
              color: m ? C.accent : C.ink,
              background: C.tint,
              borderRadius: 2,
              textDecoration: `underline ${C.accent} 2px`,
              textUnderlineOffset: "0.2em",
            }
          : { color: m ? C.accent : C.faint, opacity: m ? 0.55 : undefined };
    if (here && miss) {
      style = {
        ...style,
        left: shakeChar(miss.t),
        color: C.again,
        background: C.againTint,
        textDecoration: `underline wavy ${C.again}`,
        textUnderlineOffset: "0.2em",
      };
    }
    const g = here && miss ? prog(miss.t, 0, f(0.22)) : 0;
    return (
      <span key={i} style={style}>
        {target[i]}
        {here && miss ? (
          <span
            style={{
              position: "absolute",
              left: "50%",
              bottom: "100%",
              padding: "0 0.4em",
              borderRadius: "0.35em",
              background: C.again,
              color: "#fff",
              fontSize: "max(15px, 0.5em)",
              lineHeight: 1.5,
              whiteSpace: "pre",
              fontWeight: 400,
              textDecoration: "none",
              opacity: g,
              transform: `translate(-50%, ${-3 + 8 * (1 - g)}px) scale(${0.8 + 0.2 * g})`,
            }}
          >
            {miss.key === " " ? "␣" : miss.key}
          </span>
        ) : null}
      </span>
    );
  };
  const words = [...target.matchAll(/ +|[^ ]+/g)];
  return (
    <p
      lang="en"
      style={{
        margin: 0,
        fontFamily: FONT.mono,
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
        ...(view === "word"
          ? { padding: "14px 0 4px", fontSize: 44, lineHeight: 1.3, textAlign: "center", letterSpacing: "0.02em" }
          : { padding: "10px 0 4px", fontSize: 21, lineHeight: 1.95 }),
      }}
    >
      {words.map((m) =>
        m[0][0] === " " ? (
          [...m[0]].map((_, k) => char((m.index ?? 0) + k))
        ) : (
          <span key={`w${m.index}`} style={{ whiteSpace: "nowrap" }}>
            {[...m[0]].map((_, k) => char((m.index ?? 0) + k))}
          </span>
        ),
      )}
    </p>
  );
}

// ---- 思い出して打つ（TypeRecall.tsx）：どのキーも入り、外れたところから紫。⌫ で戻る -----------------------------------

export function RecallField({
  frame,
  typed,
  ok,
  done,
  shakeT = -99,
  size = 34,
  minHeight = 68,
}: {
  frame: number;
  typed: string;
  ok: number;
  done: boolean;
  shakeT?: number;
  size?: number;
  minHeight?: number;
}) {
  return (
    <div
      style={{
        minHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 12px",
        borderBottom: `1.5px solid ${done ? C.accent : C.ink}`,
        background: done ? C.tint : undefined,
        borderRadius: done ? "12px 12px 0 0" : 0,
        transform: `translateX(${shakeLine(shakeT)}px)`,
      }}
    >
      {typed ? (
        <span lang="en" style={{ fontFamily: FONT.mono, fontSize: size, lineHeight: 1.3, color: C.ink, whiteSpace: "pre" }}>
          {typed.slice(0, ok)}
          <span style={{ color: C.again, background: C.againTint, borderRadius: 3, textDecoration: `underline wavy ${C.again}`, textUnderlineOffset: "0.22em" }}>{typed.slice(ok)}</span>
          {done ? null : <Caret frame={frame} />}
        </span>
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: C.faint }}>
          <Caret frame={frame} />
          {ja.typing.placeholder}
        </span>
      )}
    </div>
  );
}

// ---- 覚える：意味と、思い出すときの手がかり（learn.module.css） -----------------------------------------------------

export function Pos({ children, due = false }: { children: ReactNode; due?: boolean }) {
  return <span style={{ flexShrink: 0, fontSize: 12, color: C.muted, padding: "2px 8px", borderRadius: 999, background: due ? C.paper : C.surface }}>{children}</span>;
}

/** 意味（.prompt）。`due`：前に出会った語が、また出てきたとき（紫の罫）。 */
export function Prompt({ pos, meaning, due = false, children }: { pos: string; meaning: string; due?: boolean; children?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: due ? "8px 12px" : "4px 0", ...(due ? { borderLeft: `3px solid ${C.again}`, background: C.againTint } : {}) }}>
      <Pos due={due}>{pos}</Pos>
      <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 19, fontWeight: 600, lineHeight: 1.5 }}>{meaning}</p>
      {children}
    </div>
  );
}

/** 思い出すときの手がかりのボタン（.hint）。`off`：押したあと（例文で・答えを見る は一度だけ）。 */
export function Hint({ icon, label, off = false, press = -99 }: { icon: IconName; label: string; off?: boolean; press?: number }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        minHeight: 36,
        padding: "0 12px",
        borderRadius: 999,
        border: `1px solid ${C.line2}`,
        background: C.paper,
        fontSize: 13,
        color: off ? C.faint : C.ink2,
      }}
    >
      <Icon name={icon} size={17} />
      {label}
      <Press t={press} size={40} />
    </span>
  );
}

/** 文字のリンク（globals.css の .link-button）。 */
export const linkButton = (s: string) => <span style={{ color: C.accent, fontSize: 13, textDecoration: "underline", textUnderlineOffset: "0.25em" }}>{s}</span>;
