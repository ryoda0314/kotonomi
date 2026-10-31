// A. 問い：はじめの一コマから、単語帳の5語（アプリの最初のひと回りの語）。見れば、分かる。英語が消えて、意味だけが
// 残る。でも、日本語から思い出して、打てますか？ 同僚 から colleague を思い出して打つ（TypeRecall と同じ見え方を
// 大きく）：collegue（g から紫）、⌫ で戻って colleage（e から紫）、⌫ で戻って colleague。語が鳴る。
import { ja } from "../../../src/lib/i18n/ja.ts";
import { fall, leave, mix, mixColor, prog, recallAt, SOFT } from "../anim";
import { HOOK, HOOK_KEYS, ROUND, T } from "../timeline";
import { C, FONT } from "../theme";
import { Pos, RecallField, Right, Status } from "../ui";

/** 単語帳：英語の列と、意味の列。 */
const LIST = { left: 470, top: 130, width: 980, row: 100, en: 60, ja: 480 };
const EN_SIZE = 52;
const JA_SIZE = 38;
/** 思い出す欄：アプリの大きさ（px）で組み、3 倍に。 */
const VIEW = { left: 450, top: 150, width: 340, k: 3 };
/** 意味（同僚）の、列の中の場所と、思い出す欄の中の場所。 */
const FROM = { left: LIST.left + LIST.ja, top: LIST.top + (LIST.row - JA_SIZE * 1.5) / 2, size: JA_SIZE };
const TO = { left: VIEW.left + 50 * VIEW.k, top: VIEW.top + 4 * VIEW.k, size: 19 * VIEW.k };

const caption = { position: "absolute", left: 0, right: 0, margin: 0, textAlign: "center", fontFamily: FONT.ui, fontWeight: 600, color: C.ink } as const;

/** `from` から `to` まで：降りてきて、次が来ると上がって消える。次の一文は、前の一文が消えてから（STEP コマあと）降る。 */
const STEP = 9;
function Line({ frame, from, to, top, size = 60, children }: { frame: number; from: number; to: number; top: number; size?: number; children: React.ReactNode }) {
  if (frame < from || frame >= to + STEP) return null;
  return <div style={{ ...caption, top, fontSize: size, lineHeight: 1.45, ...(frame >= to ? leave(frame, to, STEP, 12) : fall(frame, from, 14, 16)) }}>{children}</div>;
}

export function Hook({ frame }: { frame: number }) {
  const h = T.hook;
  const gone = prog(frame, h.focus, 10, SOFT);
  const float = prog(frame, h.focus, 20, SOFT);
  const shown = prog(frame, h.focus + 14, 12);
  const r = recallAt(HOOK.en, HOOK_KEYS, frame - h.type);
  const o03 = h.type + 15;
  return (
    <>
      {/* 単語帳の5語。英語の列は、行ごとに少しずつ、左から消える。 */}
      {gone < 1 ? (
        <div style={{ position: "absolute", left: LIST.left, top: LIST.top, width: LIST.width }}>
          {ROUND.map((w, i) => {
            const wipe = prog(frame, h.hide + i * 2, 10, SOFT);
            return (
              <div
                key={w.en}
                style={{
                  position: "relative",
                  height: LIST.row,
                  borderTop: `1px solid ${C.line}`,
                  borderBottom: i === ROUND.length - 1 ? `1px solid ${C.line}` : undefined,
                  opacity: 1 - gone,
                }}
              >
                <span
                  lang="en"
                  style={{
                    position: "absolute",
                    left: LIST.en,
                    top: (LIST.row - EN_SIZE * 1.3) / 2,
                    fontFamily: FONT.mono,
                    fontSize: EN_SIZE,
                    lineHeight: 1.3,
                    color: C.ink,
                    clipPath: `inset(0 0 0 ${wipe * 100}%)`,
                  }}
                >
                  {w.en}
                </span>
                {i > 0 ? (
                  <span style={{ position: "absolute", left: LIST.ja, top: (LIST.row - JA_SIZE * 1.5) / 2, fontSize: JA_SIZE, lineHeight: 1.5, fontWeight: 600, color: C.ink2, whiteSpace: "nowrap" }}>{w.ja}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* 同僚 だけが残り、思い出す欄の意味の場所へ。 */}
      {frame < h.focus + 20 ? (
        <span
          style={{
            position: "absolute",
            left: mix(FROM.left, TO.left, float),
            top: mix(FROM.top, TO.top, float),
            fontSize: mix(FROM.size, TO.size, float),
            lineHeight: 1.5,
            fontWeight: 600,
            color: mixColor(C.ink2, C.ink, float),
            whiteSpace: "nowrap",
          }}
        >
          {HOOK.ja}
        </span>
      ) : null}

      {/* 思い出す：意味と、打つ欄と、その下の一行。 */}
      {frame >= h.focus + 14 ? (
        <div style={{ position: "absolute", left: VIEW.left, top: VIEW.top, width: VIEW.width, transform: `scale(${VIEW.k})`, transformOrigin: "0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
            <span style={{ opacity: shown }}>
              <Pos>{ja.word.pos[HOOK.pos]}</Pos>
            </span>
            <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 19, fontWeight: 600, lineHeight: 1.5, opacity: frame >= h.focus + 20 ? 1 : 0 }}>{HOOK.ja}</p>
          </div>
          <div style={{ marginTop: 28, opacity: shown }}>
            <RecallField frame={frame} typed={r.typed} ok={r.ok} done={r.done} shakeT={frame - h.type - r.shakeAt} />
            <div style={{ marginTop: 10 }}>
              <Status state={r.done ? "done" : r.off ? "miss" : undefined}>{r.done ? <Right /> : r.off ? ja.typing.toBack(r.off) : " "}</Status>
            </div>
          </div>
        </div>
      ) : null}

      <Line frame={frame} from={6} to={h.hide} top={760} size={64}>
        見れば、分かる。
      </Line>
      <Line frame={frame} from={h.hide + STEP} to={o03} top={760} size={64}>
        でも、思い出して打てますか？
      </Line>
      <Line frame={frame} from={o03 + STEP} to={h.keep} top={730} size={56}>
        見て分かる語も、
        <br />
        打とうとすると、指が迷う。
      </Line>
      <Line frame={frame} from={h.keep + STEP} to={h.end} top={730} size={56}>
        思い出して打つと、
        <br />
        綴りが手に残る。
      </Line>
    </>
  );
}
