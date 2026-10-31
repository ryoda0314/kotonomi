// C〜F. アプリのひと回り：左に映像の言葉、右にアプリの画面。パソコンで打つアプリなので、パソコンの幅で描く（720px
// から：タブは左の列、ページは 720px、キーボードはまるごと 15 キー幅の日本語配列）。
//   はじめに：TOEIC・基本・日本語配列（選んだまま）で、はじめる。
//   出会う：postpone。音を聞いて、見ながら打つ。次のキーと指が光る。m と押し間違えると、入らずに紫で知らせて n を待つ。
//   例文の中で：例文を打つ（語は色付き）。打ち終えると例文が鳴り、Enter で次へ。
//   思い出す：〜を延期する から。出てこないので 例文で（語は空欄）。思い出して打つ。思い出せた。
//   また出会う：ひと回りのおわりに。迷った colleague は紫の「また出てくる語」。翌日、紫の罫で戻ってきて、今度はひとりで。
//   打つ：例文を打つ。はじめの T は、右の小指で Shift を押しながら。
import type { CSSProperties, ReactNode } from "react";
import type { Word } from "../../../src/content/types.ts";
import { ja } from "../../../src/lib/i18n/ja.ts";
import { copyAt, fall, lastPress, prog, recallAt, rise, SOFT, type Keys } from "../anim";
import { DUE_KEYS, HOOK, LINE_FROM, LINE_KEYS, LINES, markOf, MEET, MEET_KEYS, RECALL_KEYS, ROUND, sounding, T, TYPE_KEYS } from "../timeline";
import { C, FONT } from "../theme";
import {
  BACK,
  Bar,
  Btn,
  Copy,
  ENTER,
  exJa,
  FingerHint,
  Hint,
  Icon,
  Keyboard,
  lead,
  linkButton,
  MissHint,
  Nav,
  Press,
  Prompt,
  RecallField,
  Right,
  Speak,
  Status,
  Track,
} from "../ui";
import { Captions, Rest, type Cap } from "./Caption";

const COLLEAGUE = { text: "colleague", mono: true, color: C.again } as const;

/** 映像の言葉。 */
const CAPS: Cap[] = [
  {
    from: T.setup.cap,
    door: "setup",
    main: [["TOEIC か TOEFL か、"], ["どこから始めるか。"]],
    sub: [["基本・標準・発展は、始める場所の目安。"], ["手元のキーボードの並びも。"]],
  },
  { from: T.meet.cap, door: "meet", main: [["意味と音といっしょに、"], ["見ながら打つ。"]] },
  { from: T.meet.cap2, door: "meet", main: [["次のキーと、"], ["押す指が光る。"]], sub: [["違うキーは入らずに、"], ["正しいキーを待つ。"]], subAt: T.meet.sub2 },
  { from: T.line.cap, door: "meet", main: [["例文の中で、"], ["もう一度打つ。"]], sub: [["訳といっしょに。打ち終えると、例文の音。"]] },
  { from: T.recall.cap, door: "recall", main: [["少しあとに、"], ["日本語から思い出す。"]], sub: [["キーボードは、答えを光らせない。"]] },
  { from: T.recall.hint, door: "recall", main: [["出てこないときは、"], ["例文を手がかりに。"]], sub: [["手がかりは、自分で開いたときだけ。"]] },
  { from: T.again.cap, door: "again", main: [["思い出しにくかった語は、"], ["翌日、また出てくる。"]], sub: [["罰ではなく、もう一度出会うだけ。"]] },
  { from: T.due.cap, door: "again", main: [["翌日、"], ["迷った ", COLLEAGUE, " が。"]], sub: [["今度は、ひとりで思い出せた。"]], subAt: T.due.done + 4 },
  { from: T.due.cap2, door: "again", main: [["思い出せた語は、"], ["間をのばして、また。"]], extra: (frame) => <Rest frame={frame} at={T.due.rest} /> },
  {
    from: T.type.cap,
    door: "type",
    main: [["語を覚えるうちに、"], ["指がキーの場所を覚える。"]],
    sub: [["画面のキーボードは、手元と同じ並び。"], ["Shift は、反対の手の小指で。"]],
  },
  { from: T.type.cap2, door: "type", main: [["点数も、速さも、"], ["測らない。"]], sub: [["正しいキーを、正しい指で。"], ["速さは、あとからついてくる。"]] },
];

const PANEL = { left: 850, top: 50, width: 1020, height: 980 };
const K = 1.25;
const PW = PANEL.width / K;
const PH = PANEL.height / K;
/** キーボードの幅：ページ 720px から左右の余白。 */
const KB = 720 - 32;

export function Story({ frame }: { frame: number }) {
  return (
    <>
      <Captions frame={frame} caps={CAPS} until={T.end.start} />
      <Panel frame={frame} />
    </>
  );
}

const SCREENS: [from: number, Screen: (p: { frame: number }) => ReactNode][] = [
  [T.setup.start, SetupScreen],
  [T.meet.start, MeetWordScreen],
  [T.line.start, MeetLineScreen],
  [T.recall.start, RecallScreen],
  [T.again.start, RoundEndScreen],
  [T.due.start, DueScreen],
  [T.type.start, LinesScreen],
];

function Panel({ frame }: { frame: number }) {
  return (
    <div style={{ position: "absolute", ...PANEL, borderRadius: 28, border: `1.5px solid ${C.line2}`, overflow: "hidden", background: C.paper, ...fall(frame, T.setup.start, 24, 18) }}>
      <div
        lang="ja"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PW,
          height: PH,
          transform: `scale(${K})`,
          transformOrigin: "0 0",
          fontFamily: FONT.ui,
          fontSize: 16,
          lineHeight: 1.6,
          color: C.ink,
          wordBreak: "auto-phrase" as CSSProperties["wordBreak"],
        }}
      >
        {/* 次の画面は、前の画面の上に薄れて入る（前の画面は、入りきるまで残る）。 */}
        {SCREENS.map(([from, Screen], i) => {
          const next = SCREENS[i + 1]?.[0] ?? Infinity;
          if (frame < from || frame >= next + 12) return null;
          return (
            <div key={i} style={{ position: "absolute", inset: 0, background: C.paper, opacity: i === 0 ? 1 : prog(frame, from, 12, SOFT) }}>
              <Screen frame={frame} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- 枠 ----------------------------------------------------------------------------------------------------------------

/** 左にタブの列、右に 720px のページ（app.module.css の 720px から）。 */
function Shell({ active, children }: { active: "learn" | "type"; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", background: C.paper }}>
      <Nav active={active} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ width: 720, flexShrink: 0, padding: "0 16px" }}>{children}</div>
      </div>
    </div>
  );
}

/** 覚える（Round.tsx）：上の帯、流れ、いまの画面。`scroll`：ページを下へ送った量。 */
function LearnPage({ count, at, scroll = 0, children }: { count?: string; at: number; scroll?: number; children: ReactNode }) {
  return (
    <div style={{ transform: `translateY(${-scroll}px)` }}>
      <Bar title={ja.learn.title} count={count} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "14px 0 36px" }}>
        <Track at={at} />
        {children}
      </div>
    </div>
  );
}

/** 一つの画面（learn.module.css の .screen：下から少し上がって落ち着く）。 */
function Screen({ frame, at, children }: { frame: number; at: number; children: ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 12, ...rise(frame, at, 6, 9) }}>{children}</div>;
}

/** 打つところ（typing.module.css の .wrap）。 */
const wrap: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };

/** いま手元で押したキー（押してから 5 コマ、キーボードの上で灯る）。 */
const pressOf = (k: Keys, local: number) => {
  const p = lastPress(k, local);
  return p ? { key: p.key, t: local - p.at } : null;
};

/** 例文の頭（learn.module.css の .lineHead）：音、語、意味。 */
function LineHead({ w, play = -1 }: { w: Word; play?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 10px" }}>
      <Speak play={play} />
      <span lang="en" style={{ fontFamily: FONT.mono, fontSize: 16, color: C.accent }}>
        {w.en}
      </span>
      <span style={{ fontSize: 13.5, color: C.muted }}>{w.ja}</span>
    </div>
  );
}

/** 打ち終えたら：スペースか Enter で次へ（typing.module.css の .actions）。 */
function NextRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
      <span style={{ fontSize: 12.5, color: C.muted }}>{ja.typing.nextKeys}</span>
      <Btn style={{ minWidth: 160 }}>
        {ja.common.next}
        <Icon name="arrow" size={18} />
      </Btn>
    </div>
  );
}

// ---- はじめに（Setup.tsx） -----------------------------------------------------------------------------------------

function Option({ title, sub, on, press = -99 }: { title: string; sub: string; on: boolean; press?: number }) {
  return (
    <span
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        padding: "12px 14px",
        border: `1px solid ${on ? C.accent : C.line2}`,
        borderRadius: 12,
        background: on ? C.tint : C.paper,
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 600, color: on ? C.accent : C.ink }}>{title}</span>
      <span style={{ fontSize: 12.5, lineHeight: 1.6, color: C.muted }}>{sub}</span>
      <Press t={press} size={52} />
    </span>
  );
}

function Section({ title, note, first = false, children }: { title: string; note?: string; first?: boolean; children: ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10, padding: "20px 0", borderTop: first ? undefined : `1px solid ${C.line}` }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h2>
      {note ? <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: C.muted }}>{note}</p> : null}
      {children}
    </section>
  );
}

function SetupScreen({ frame }: { frame: number }) {
  const t = T.setup;
  const s = ja.setup;
  // はじめる まで、ページを少し下へ送る。
  const scroll = 64 * prog(frame, t.level + 24, 24, SOFT);
  const choice = (label: string, on: boolean) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 40,
        padding: "0 14px",
        borderRadius: 12,
        border: `1px solid ${on ? C.accent : C.line2}`,
        background: on ? C.tint : C.paper,
        color: on ? C.accent : C.ink,
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
  return (
    <Shell active="learn">
      <div style={{ transform: `translateY(${-scroll}px)` }}>
      <div style={rise(frame, t.start, 6, 9)}>
        <Bar title={s.title} />
        <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.75, color: C.muted }}>{s.lead}</p>
        <Section title={s.exam} first>
          <div style={{ display: "grid", gap: 8 }}>
            {(["toeic", "toefl", "both"] as const).map((e) => (
              <Option key={e} title={ja.exams[e]} sub={ja.examLeads[e]} on={e === "toeic"} press={e === "toeic" ? frame - t.exam : -99} />
            ))}
          </div>
        </Section>
        <Section title={s.from} note={s.fromLead}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            {([1, 2, 3] as const).map((l) => (
              <Option key={l} title={ja.levels[l]} sub={ja.levelLeads.toeic[l]} on={l === 1} press={l === 1 ? frame - t.level : -99} />
            ))}
          </div>
        </Section>
        <Section title={s.layout} note={s.detected}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {choice(ja.layouts.jis, true)}
            {choice(ja.layouts.us, false)}
          </div>
        </Section>
        <div style={{ display: "flex", padding: "8px 0 20px" }}>
          <Btn press={frame - t.go}>{s.start}</Btn>
        </div>
      </div>
      </div>
    </Shell>
  );
}

// ---- 出会う（Meet.tsx）：見ながら打つ ------------------------------------------------------------------------------

function MeetWordScreen({ frame }: { frame: number }) {
  const t = T.meet;
  const local = frame - t.type;
  const s = copyAt(MEET.en, MEET_KEYS, frame >= t.type ? local : -1);
  const now = s.done ? null : MEET.en[s.pos];
  const miss = s.miss ? { key: s.miss, t: local - s.missAt } : null;
  return (
    <Shell active="learn">
      <LearnPage count={ja.common.countOf(4, ROUND.length)} at={0}>
        <Screen frame={frame} at={t.start}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "4px 12px" }}>
            <p style={lead}>{ja.learn.meetLead}</p>
            {linkButton(ja.learn.known)}
          </div>
          <Prompt pos={ja.word.pos[MEET.pos]} meaning={MEET.ja}>
            <Speak play={sounding(frame, "E02")} />
          </Prompt>
          <div style={wrap}>
            <Copy target={MEET.en} pos={s.pos} miss={miss} view="word" />
            <Status state={s.done ? "done" : miss ? "miss" : undefined}>
              {s.done ? <Right /> : miss && now ? <MissHint pressed={miss.key} want={now} /> : now ? <FingerHint ch={now} /> : " "}
            </Status>
            <Keyboard next={now} press={pressOf(MEET_KEYS, local)} miss={miss} width={KB} />
          </div>
        </Screen>
      </LearnPage>
    </Shell>
  );
}

// ---- 出会う（Meet.tsx）：例文の中で、もう一度 ----------------------------------------------------------------------

function MeetLineScreen({ frame }: { frame: number }) {
  const t = T.line;
  const local = frame - t.type;
  const s = copyAt(MEET.ex, LINE_KEYS, frame >= t.type ? local : -1, LINE_FROM);
  const now = s.done ? null : MEET.ex[s.pos];
  return (
    <Shell active="learn">
      <LearnPage count={ja.common.countOf(4, ROUND.length)} at={0}>
        <Screen frame={frame} at={t.start}>
          <p style={lead}>{ja.learn.lineLead}</p>
          <LineHead w={MEET} play={sounding(frame, "E03")} />
          <div style={wrap}>
            <Copy target={MEET.ex} pos={s.pos} view="line" mark={markOf(MEET)} />
            <p style={exJa}>{MEET.exJa}</p>
            <Status state={s.done ? "done" : undefined}>{s.done ? <Right /> : now ? <FingerHint ch={now} /> : " "}</Status>
            {s.done ? <NextRow /> : null}
            <Keyboard next={s.done ? ENTER : now} press={pressOf(LINE_KEYS, local)} width={KB} />
          </div>
        </Screen>
      </LearnPage>
    </Shell>
  );
}

// ---- 思い出す（Recall.tsx） ----------------------------------------------------------------------------------------

/** 例文で：語のところは空欄の例文と、訳（.hintLine）。思い出せたら、空欄に語が入る。 */
function HintLine({ w, blank, frame, at }: { w: Word; blank: boolean; frame: number; at: number }) {
  const m = markOf(w);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", borderRadius: 12, background: C.surface, opacity: prog(frame, at, 6) }}>
      <p lang="en" style={{ margin: 0, fontSize: 17, lineHeight: 1.8 }}>
        {m ? (
          <>
            {w.ex.slice(0, m[0])}
            {blank ? (
              <span style={{ display: "inline-block", width: "4.5em", height: "1em", margin: "0 0.1em", verticalAlign: "-0.15em", borderBottom: `1.5px solid ${C.accent}` }} />
            ) : (
              <span style={{ color: C.accent, fontWeight: 600 }}>{w.ex.slice(m[0], m[1])}</span>
            )}
            {w.ex.slice(m[1])}
          </>
        ) : (
          w.ex
        )}
      </p>
      <p style={exJa}>{w.exJa}</p>
    </div>
  );
}

/** 思い出せた（.result、data-clean）。 */
function Result({ en, frame, at }: { en: string; frame: number; at: number }) {
  return (
    <p style={{ margin: 0, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 14px", padding: "8px 12px", borderLeft: `3px solid ${C.accent}`, background: C.tint, color: C.accent, fontSize: 14, ...rise(frame, at, 4, 8) }}>
      <span lang="en" style={{ fontFamily: FONT.mono, fontSize: 24, color: C.ink }}>
        {en}
      </span>
      <span>{ja.learn.recalled}</span>
    </p>
  );
}

function Hints({ frame, line = -99 }: { frame: number; line?: number }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
      <Hint icon="lines" label={ja.learn.hints.line} off={line >= 0 && frame >= line} press={frame - line} />
      <Hint icon="speaker" label={ja.learn.hints.hear} />
      <Hint icon="eye" label={ja.learn.hints.answer} />
    </div>
  );
}

/** 思い出す欄と、その下の一行と、キーボード（答えにつながるキーは光らない。外れたら ⌫ が紫）。 */
function RecallBox({ frame, target, k, start }: { frame: number; target: string; k: Keys; start: number }) {
  const local = frame - start;
  const r = recallAt(target, k, frame >= start ? local : -1);
  return (
    <div style={wrap}>
      <RecallField frame={frame} typed={r.typed} ok={r.ok} done={r.done} shakeT={local - r.shakeAt} />
      <Status state={r.done ? "done" : r.off ? "miss" : undefined}>{r.done ? <Right /> : r.off ? ja.typing.toBack(r.off) : " "}</Status>
      <Keyboard next={r.done ? null : r.off ? BACK : null} press={pressOf(k, local)} width={KB} />
    </div>
  );
}

function RecallScreen({ frame }: { frame: number }) {
  const t = T.recall;
  const done = frame >= t.done;
  const line = frame >= t.hint;
  return (
    <Shell active="learn">
      <LearnPage count={ja.common.countOf(2, ROUND.length + 1)} at={1}>
        <Screen frame={frame} at={t.start}>
          <p style={lead}>{ja.learn.recallLead}</p>
          <Prompt pos={ja.word.pos[MEET.pos]} meaning={MEET.ja} />
          {line ? <HintLine w={MEET} blank={!done} frame={frame} at={t.hint} /> : null}
          {done ? <Result en={MEET.en} frame={frame} at={t.done} /> : <Hints frame={frame} line={t.hint} />}
          <RecallBox frame={frame} target={MEET.en} k={RECALL_KEYS} start={t.type} />
        </Screen>
      </LearnPage>
    </Shell>
  );
}

// ---- このひと回りのおわりに（End.tsx） -----------------------------------------------------------------------------

function RoundEndScreen({ frame }: { frame: number }) {
  const t = T.again;
  const glow = prog(frame, t.glow, 8) * (1 - prog(frame, t.glow + 14, 16, SOFT));
  return (
    <Shell active="learn">
      <LearnPage at={2}>
        <section style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4, ...rise(frame, t.start, 6, 12) }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.muted }}>{ja.learn.endTitle}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.ink2 }}>{ja.learn.endFresh}</p>
            <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${C.line}` }}>
              {ROUND.map((w) => (
                <div key={w.en} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.line}` }}>
                  <Speak />
                  <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "2px 12px", padding: "6px 0" }}>
                    <span lang="en" style={{ fontFamily: FONT.mono, fontSize: 16, color: w.en === HOOK.en ? C.again : C.ink }}>
                      {w.en}
                    </span>
                    <span style={{ fontSize: 13.5, color: C.muted }}>{w.ja}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", borderLeft: `3px solid ${C.again}`, background: C.againTint }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.again }}>{ja.learn.endMissed}</p>
            <p style={{ margin: 0, display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span
                lang="en"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 38,
                  padding: "0 12px",
                  border: `1px solid ${C.again}`,
                  borderRadius: 10,
                  background: C.paper,
                  color: C.again,
                  fontFamily: FONT.mono,
                  fontSize: 15,
                  transform: `scale(${1 + 0.08 * glow})`,
                  outline: `${4 * glow}px solid rgba(106,79,224,${0.25 * glow})`,
                }}
              >
                {HOOK.en}
              </span>
            </p>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: C.muted }}>{ja.learn.endLead}</p>
          <div style={{ display: "flex", padding: "8px 0 20px" }}>
            <Btn>{ja.learn.nextRound}</Btn>
          </div>
        </section>
      </LearnPage>
    </Shell>
  );
}

// ---- 翌日：前に出会った語が、また（Recall.tsx の due） ------------------------------------------------------------

function DueScreen({ frame }: { frame: number }) {
  const t = T.due;
  const done = frame >= t.done;
  return (
    <Shell active="learn">
      <LearnPage count={ja.common.countOf(3, 10)} at={1}>
        <Screen frame={frame} at={t.start}>
          <p style={lead}>{ja.learn.dueLead}</p>
          <Prompt pos={ja.word.pos[HOOK.pos]} meaning={HOOK.ja} due />
          {done ? <Result en={HOOK.en} frame={frame} at={t.done} /> : <Hints frame={frame} />}
          <RecallBox frame={frame} target={HOOK.en} k={DUE_KEYS} start={t.type} />
        </Screen>
      </LearnPage>
    </Shell>
  );
}

// ---- 打つ：例文を打つ（LinesRound.tsx） ----------------------------------------------------------------------------

function LinesScreen({ frame }: { frame: number }) {
  const t = T.type;
  const local = frame - t.type;
  const s = copyAt(LINES.ex, TYPE_KEYS, frame >= t.type ? local : -1);
  const now = s.done ? null : LINES.ex[s.pos];
  return (
    <Shell active="type">
      <Bar title={ja.type.lines} count={ja.common.countOf(1, ROUND.length)} back />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 0 32px", ...rise(frame, t.start, 6, 9) }}>
        <LineHead w={LINES} />
        <div style={wrap}>
          <Copy target={LINES.ex} pos={s.pos} view="line" mark={markOf(LINES)} />
          <p style={exJa}>{LINES.exJa}</p>
          <Status state={s.done ? "done" : undefined}>{s.done ? <Right /> : now ? <FingerHint ch={now} /> : " "}</Status>
          <Keyboard next={now} press={pressOf(TYPE_KEYS, local)} width={KB} />
        </div>
      </div>
    </Shell>
  );
}
