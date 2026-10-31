import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";
import { agreed, backRecall, emptyRecall, pressRecall, type Recall } from "../../src/lib/typing.ts";

export const FPS = 30;

/** 秒 → コマ。 */
export const f = (seconds: number) => Math.round(seconds * FPS);

// 降ってきて落ち着く（姉妹の映像と同じ）。
export const FALL = Easing.bezier(0.2, 0.8, 0.3, 1);
export const SOFT = Easing.bezier(0.33, 0, 0.2, 1);
/** 実がなる：少しふくらみすぎてから落ち着く。 */
export const RIPEN = Easing.bezier(0.3, 1.45, 0.5, 1);

/** `start` から `dur` コマで 0 → 1。 */
export function prog(frame: number, start: number, dur: number, easing: (t: number) => number = FALL): number {
  if (dur <= 0) return frame >= start ? 1 : 0;
  return interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
}

/** 上から降ってくる。 */
export function fall(frame: number, start: number, dist = 18, dur = f(0.55)): CSSProperties {
  const p = prog(frame, start, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * -dist}px)` };
}

/** 下からせり上がる。 */
export function rise(frame: number, start: number, dist = 14, dur = f(0.6)): CSSProperties {
  const p = prog(frame, start, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
}

/** 少し上がりながら、静かに消える。 */
export function leave(frame: number, start: number, dur = f(0.4), dist = 10): CSSProperties {
  const p = prog(frame, start, dur, SOFT);
  return { opacity: 1 - p, transform: `translateY(${p * -dist}px)` };
}

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** 色から色へ（どちらも #rrggbb）。 */
export function mixColor(a: string, b: string, p: number): string {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${ca.map((x, i) => Math.round(mix(x, cb[i], p))).join(",")})`;
}

/** アプリの CSS の keyframes を、コマで：`t` は始まってからのコマ、`stops` は [0〜1 の位置, 値]。前と後は最初と最後の値。 */
export function frames(t: number, dur: number, stops: [number, number][]): number {
  if (t < 0 || t > dur) return stops[t < 0 ? 0 : stops.length - 1][1];
  return interpolate(t / dur, stops.map((s) => s[0]), stops.map((s) => s[1]), { easing: Easing.inOut(Easing.ease) });
}

/** 打つ字がふるえる（typing.module.css の shake、0.32 秒）。 */
export const shakeChar = (t: number) => frames(t, f(0.32), [[0, 0], [0.2, -4], [0.4, 4], [0.6, -3], [0.8, 2], [1, 0]]);
/** 思い出す欄がふるえる（lineA / lineB、0.34 秒）。 */
export const shakeLine = (t: number) => frames(t, f(0.34), [[0, 0], [0.2, -6], [0.4, 6], [0.6, -4], [0.8, 3], [1, 0]]);

// ---- 打つ：キーを一つずつ押す ----------------------------------------------------------------------------------------

/** 一打ち：押したキー（字、"⌫"、"⏎"）と、打ちはじめからのコマ。 */
export type Press = { key: string; at: number };
export type Keys = { presses: Press[]; duration: number };

/** 人の指の間合い：一打ちごとに少しずつ揺れる（決まった揺れなので、何度書き出しても同じ）。 */
const SWAY = [0, 1, -1, 2, 0, -1, 1, -2];

/**
 * 打つ順。字の列（一字ずつ押す。"⌫" は一つ戻す、"⏎" は Enter）と、間（数：次のキーの前に足すコマ）。`per`：一打ちの
 * コマ数。
 */
export function keys(plan: (string | number)[], per = 6): Keys {
  const presses: Press[] = [];
  let t = 0;
  let n = 0;
  for (const step of plan) {
    if (typeof step === "number") {
      t += step;
      continue;
    }
    for (const key of [...step]) {
      t += Math.max(2, per + Math.round((SWAY[n % SWAY.length] * per) / 8));
      presses.push({ key, at: t });
      n++;
    }
  }
  return { presses, duration: t };
}

/** `frame`（打ちはじめからのコマ）までに押した最後のキー。 */
export const lastPress = (k: Keys, frame: number) => [...k.presses].reverse().find((p) => p.at <= frame);

/**
 * 見て打つ（TypeCopy）：違うキーは入らずに、正しいキーを待つ。`from`：はじめから打ってあった字の数。
 * `miss`：いま外れているキー（正しいキーが来るまで）、`missAt`：外れたコマ、`misses`：外れた数。
 */
export function copyAt(target: string, k: Keys, frame: number, from = 0) {
  let pos = from;
  let miss: string | null = null;
  let missAt = -99;
  let misses = 0;
  let enter = false;
  for (const p of k.presses) {
    if (p.at > frame) break;
    if (pos >= target.length) {
      if (p.key === "⏎" || p.key === " ") enter = true;
      continue;
    }
    if (p.key === target[pos]) {
      pos++;
      miss = null;
    } else {
      miss = p.key;
      missAt = p.at;
      misses++;
    }
  }
  return { pos, miss, missAt, misses, done: pos >= target.length, enter };
}

/**
 * 思い出して打つ（TypeRecall）：どのキーも入り、外れたところから紫。⌫ で戻る。アプリの typing.ts のとおりに数える
 * （外れるのは、外れていなかったところから外れた一回）。`shakeAt`：最後に外れたコマ（欄がふるえる）。
 */
export function recallAt(target: string, k: Keys, frame: number) {
  let r: Recall = emptyRecall;
  let shakeAt = -99;
  for (const p of k.presses) {
    if (p.at > frame) break;
    if (p.key === "⌫") r = backRecall(r);
    else if (p.key !== "⏎") {
      const next = pressRecall(r, p.key, target);
      if (next.slips > r.slips) shakeAt = p.at;
      r = next;
    }
  }
  const ok = agreed(r.typed, target);
  return { typed: r.typed, ok, off: r.typed.length - ok, slips: r.slips, shakeAt, done: r.typed === target };
}
