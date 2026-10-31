import { useEffect, useState } from "react";
import { staticFile, useDelayRender } from "remotion";

// ことのみ の紙と墨と、アクセント（../src/app/globals.css）。紫は、また出会う語と、外れたキー。葉の緑はアイコンだけ
// （../design/make-icons.py）。
export const C = {
  paper: "#fcfbf8",
  surface: "#f1f4f8",
  ink: "#172033",
  ink2: "#3b4558",
  muted: "#5c6578",
  faint: "#8c94a5",
  line: "#e4e7ec",
  line2: "#d4d9e1",
  accent: "#0a64f0",
  tint: "#e6f0ff",
  again: "#6a4fe0",
  againTint: "#efebff",
  leaf: "#4a9a6b",
} as const;

export const FONT = {
  // IBM Plex Sans JP の英字は IBM Plex Sans と同じ字。
  ui: `"PlexJP", sans-serif`,
  ja: `"PlexJP", sans-serif`,
  // 打つ文字とキー：一文字ずつ同じ幅で、スペースにも場所がある。
  mono: `"PlexMono", monospace`,
  mincho: `"Shippori", serif`,
} as const;

// アプリの字。`npm run assets` が public/fonts に置く。
const FACES: [family: string, file: string, weight: string][] = [
  ["PlexJP", "fonts/IBMPlexSansJP-Regular.ttf", "400"],
  ["PlexJP", "fonts/IBMPlexSansJP-Medium.ttf", "500"],
  ["PlexJP", "fonts/IBMPlexSansJP-SemiBold.ttf", "600"],
  ["PlexMono", "fonts/IBMPlexMono-Regular.ttf", "400"],
  ["PlexMono", "fonts/IBMPlexMono-Medium.ttf", "500"],
  ["Shippori", "fonts/ShipporiMincho-Bold.ttf", "700"],
];

let loading: Promise<unknown> | null = null;

/** 字が読み終わるまで、どのコマも待たせる（映像の根から呼ぶ）。 */
export function useFonts() {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    loading ??= Promise.all(
      FACES.map(([family, file, weight]) => {
        const face = new FontFace(family, `url(${staticFile(file)})`, { weight });
        document.fonts.add(face);
        return face.load();
      }),
    );
    loading.then(() => continueRender(handle), cancelRender);
  }, [handle, continueRender, cancelRender]);
}
