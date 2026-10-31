import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { prog, type Keys } from "./anim";
import { End } from "./scenes/End";
import { Hook } from "./scenes/Hook";
import { NameMark } from "./scenes/Mark";
import { Story } from "./scenes/Story";
import { C, FONT, useFonts } from "./theme";
import { DUE_KEYS, HOOK_KEYS, LINE_KEYS, MEET_KEYS, RECALL_KEYS, T, TOTAL, TYPE_KEYS, VOICE_AT } from "./timeline";

/** `from` から `to`（コマ）まで見せる。両端は `fade` コマで薄れる。 */
function Window({
  frame,
  from,
  to,
  fade = 12,
  fadeIn = true,
  fadeOut = true,
  children,
}: {
  frame: number;
  from: number;
  to: number;
  fade?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  children: React.ReactNode;
}) {
  if (frame < from || frame >= to) return null;
  const opacity = Math.min(fadeIn ? prog(frame, from, fade) : 1, fadeOut ? 1 - prog(frame, to - fade, fade) : 1);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

/** 映像。 */
export function Promo() {
  useFonts();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.paper, color: C.ink, fontFamily: FONT.ui, WebkitFontSmoothing: "antialiased" }}>
      <style>{"* { box-sizing: border-box; }"}</style>
      <Window frame={frame} from={0} to={T.title.start + 8} fadeIn={false} fade={14}>
        <Hook frame={frame} />
      </Window>
      <Window frame={frame} from={T.title.start} to={T.setup.start + 10} fade={14}>
        <NameMark frame={frame} icon={T.title.icon} word={T.title.word} lead={T.title.lead} size={280} top={150} wordSize={104} leadSize={46} />
      </Window>
      <Window frame={frame} from={T.setup.start} to={T.end.start + 10} fade={14}>
        <Story frame={frame} />
      </Window>
      <Window frame={frame} from={T.end.start} to={TOTAL} fade={20} fadeOut={false}>
        <End frame={frame} />
      </Window>
      <Sound />
    </AbsoluteFill>
  );
}

// ---- 音：ナレーションと英語（scripts/voice.mjs）、静かな音楽と小さな音（scripts/music.py） ----------------------------

const MUSIC = 0.5;
/** 声のあいだ、音楽をどれだけ下げるか（0〜1）。 */
const DUCK = 0.5;

/** 音楽を下げる度合い（コマごと、0〜1）。声の 4 コマ前から下げはじめ、声が消えてから、ゆっくり戻す。 */
const DUCKING: number[] = (() => {
  const want = new Float32Array(TOTAL);
  for (const v of VOICE_AT) for (let i = Math.max(0, v.from - 4); i < Math.min(TOTAL, v.until + 2); i++) want[i] = 1;
  const out: number[] = [];
  let level = 0;
  for (let i = 0; i < TOTAL; i++) {
    level += (want[i] - level) * (want[i] > level ? 0.25 : 0.07);
    out.push(level);
  }
  return out;
})();

function Clip({ from, src, volume = 1, frames }: { from: number; src: string; volume?: number; frames?: number }) {
  return (
    <Sequence from={from} durationInFrames={frames} layout="none">
      <Audio src={staticFile(src)} volume={volume} />
    </Sequence>
  );
}

/** 打ったキーの音：打ちはじめのコマと、打ち方。`until` より前のものだけ（次の場面へ移ったら鳴らさない）。 */
const TYPING: [start: number, k: Keys, until: number][] = [
  [T.hook.type, HOOK_KEYS, T.title.start],
  [T.meet.type, MEET_KEYS, T.line.start],
  [T.line.type, LINE_KEYS, T.recall.start],
  [T.recall.type, RECALL_KEYS, T.again.start],
  [T.due.type, DUE_KEYS, T.type.start],
  [T.type.type, TYPE_KEYS, T.end.start - 6],
];

function Sound() {
  const musicVolume = (frame: number) =>
    MUSIC * interpolate(frame, [0, 20, TOTAL - 75, TOTAL - 4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (1 - DUCK * (DUCKING[frame] ?? 0));
  const keys = TYPING.flatMap(([start, k, until]) => k.presses.map((p) => ({ at: start + p.at, key: p.key })).filter((p) => p.at < until));
  // 押したところ（はじめにの選び・はじめる、思い出すの 例文で）。
  const taps = [T.setup.exam, T.setup.level, T.setup.go, T.recall.hint];
  // 見て打つで外れたキー（入らない）：小さく、低く。責める音ではない。
  const slip = T.meet.type + (MEET_KEYS.presses.find((p) => p.key === "m")?.at ?? 0);
  return (
    <>
      <Audio src={staticFile("sound/music.wav")} volume={musicVolume} />
      {VOICE_AT.map((v) => (
        <Clip key={`${v.id}${v.from}`} from={v.from} src={`voice/${v.id}.wav`} />
      ))}
      {keys.map((p, i) => (
        <Clip key={`k${p.at}`} from={p.at - 1} src={`sound/key${(i % 3) + 1}.wav`} volume={p.key === "⌫" ? 0.22 : 0.3} />
      ))}
      <Clip from={slip} src="sound/slip.wav" volume={0.3} />
      {taps.map((at) => (
        <Clip key={`p${at}`} from={at - 2} src="sound/tap.wav" volume={0.45} />
      ))}
      {/* 実がなる：青い実、紫の実。 */}
      {[T.title.icon, T.end.icon].flatMap((icon, j) =>
        [21, 28].map((d, i) => <Clip key={`f${j}${d}`} from={icon + d + 4} src={`sound/drop${i + 1}.wav`} volume={j === 0 ? 0.3 : 0.24} />),
      )}
      {/* 思い出せた：冒頭の colleague、翌日の colleague。 */}
      <Clip from={T.hook.done + 2} src="sound/chime.wav" volume={0.22} />
      <Clip from={T.due.done + 2} src="sound/chime.wav" volume={0.24} />
    </>
  );
}
