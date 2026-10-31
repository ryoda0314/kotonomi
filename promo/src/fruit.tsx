// アプリのアイコン（../design/make-icons.py と同じ絵）を SVG で：小枝に、葉と、青い実と紫の実。映像では、枝が伸び、
// 葉が開き、実がなる（言の実）。どの変化も 0〜1 で、コマで決まる。512 の四角に描いた絵を、カードの中に 6% の余白で置く
// （make-icons.py の card(…, True, 0.06)）。
import { C } from "./theme";

const INSET = 0.06;
const SCALE = 1 - 2 * INSET;
// 絵は 512 の中で 92〜440 × 70〜424：真ん中に寄せる（make-icons.py の ox・oy）。
const OX = (512 - 512 * SCALE) / 2 + (256 - 266) * SCALE;
const OY = (512 - 512 * SCALE) / 2 + (256 - 247) * SCALE;
const SHINE = "rgba(255,255,255,0.353)";

export type Grow = { card?: number; twig?: number; leaf?: number; stems?: number; blue?: number; violet?: number };

/** 実：吊られたところ（上の端）から、ふくらむ。 */
function Fruit({ cx, cy, r, color, p }: { cx: number; cy: number; r: number; color: string; p: number }) {
  if (p <= 0) return null;
  return (
    <g transform={`translate(${cx} ${cy - r}) scale(${p}) translate(${-cx} ${-(cy - r)})`}>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <ellipse cx={cx - r * 0.42} cy={cy - r * 0.42} rx={r * 0.2} ry={r * 0.16} fill={SHINE} />
    </g>
  );
}

export function FruitIcon({ size, grow = {} }: { size: number; grow?: Grow }) {
  const { card = 1, twig = 1, leaf = 1, stems = 1, blue = 1, violet = 1 } = grow;
  const edge = 512 * 0.012;
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" style={{ display: "block", overflow: "visible" }}>
      <rect
        x={edge / 2}
        y={edge / 2}
        width={512 - edge}
        height={512 - edge}
        rx={512 * 0.22 - edge / 2}
        fill={C.paper}
        stroke={C.line}
        strokeWidth={edge}
        opacity={card}
      />
      <g transform={`translate(${OX} ${OY}) scale(${SCALE})`}>
        {leaf > 0 ? (
          <path
            d="M150 162 C156 108 120 80 70 76 C80 126 108 158 150 162 Z"
            fill={C.leaf}
            transform={`translate(150 162) scale(${leaf}) translate(-150 -162)`}
          />
        ) : null}
        {twig > 0 ? (
          <path d="M92 178 C190 118 320 196 428 140" fill="none" stroke={C.ink} strokeWidth={18} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - twig} />
        ) : null}
        {stems > 0 ? (
          <g stroke={C.ink} fill="none">
            <path d={`M214 158 L${214 + 2 * stems} ${158 + 66 * stems}`} strokeWidth={12} />
            <path d={`M372 160 L${372 + 8 * stems} ${160 + 88 * stems}`} strokeWidth={10} />
          </g>
        ) : null}
        <Fruit cx={218} cy={322} r={100} color={C.accent} p={blue} />
        <Fruit cx={384} cy={304} r={58} color={C.again} p={violet} />
      </g>
    </svg>
  );
}
