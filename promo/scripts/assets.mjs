// 映像に要る字を public/fonts に集める。
//   - アプリの字（IBM Plex Sans JP・打つ文字とキーの IBM Plex Mono・名前のしっぽり明朝）。Google Fonts の倉庫（OFL）から
//     まるごと取り、映像の元（src/）と、映像が読み込むアプリの部品（../src/lib/i18n/ja.ts の文言、../src/content の語と
//     例文）に出てくる字だけに切る（Python の fontTools）。言葉を変えたら、もう一度走らせる。
//   - アイコンは取らない：映像では design/make-icons.py と同じ絵を SVG で描き、実がなるところを動かす（src/fruit.tsx）。
//   - アプリには前もって作った声がない（端末の英語の声で言う）。映像の英語は scripts/voice.mjs が作る。
//   node scripts/assets.mjs        (npm run assets)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APP = "..";
const FONTS = {
  "IBMPlexSansJP-Regular.ttf": "ibmplexsansjp/IBMPlexSansJP-Regular.ttf",
  "IBMPlexSansJP-Medium.ttf": "ibmplexsansjp/IBMPlexSansJP-Medium.ttf",
  "IBMPlexSansJP-SemiBold.ttf": "ibmplexsansjp/IBMPlexSansJP-SemiBold.ttf",
  "IBMPlexMono-Regular.ttf": "ibmplexmono/IBMPlexMono-Regular.ttf",
  "IBMPlexMono-Medium.ttf": "ibmplexmono/IBMPlexMono-Medium.ttf",
  "ShipporiMincho-Bold.ttf": "shipporimincho/ShipporiMincho-Bold.ttf",
};
const WHOLE = "node_modules/.cache/fonts";

for (const d of ["public/fonts", WHOLE]) mkdirSync(d, { recursive: true });

// 映像の元と、読み込むアプリの部品に出てくる字（と、印字できる ASCII すべて）。
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const chars = new Set(Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)));
for (const file of [...walk("src"), `${APP}/src/lib/i18n/ja.ts`, ...walk(`${APP}/src/content/words`)]) for (const ch of readFileSync(file, "utf8")) if (ch > "\u007f") chars.add(ch);
writeFileSync(`${WHOLE}/chars.txt`, [...chars].join(""));

for (const [file, path] of Object.entries(FONTS)) {
  if (!existsSync(`${WHOLE}/${file}`)) {
    const res = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${path}`);
    if (!res.ok) throw new Error(`${file}: ${res.status}`);
    writeFileSync(`${WHOLE}/${file}`, Buffer.from(await res.arrayBuffer()));
    console.log(`  font ${file}`);
  }
  const cut = spawnSync(
    "python",
    ["-m", "fontTools.subset", `${WHOLE}/${file}`, `--text-file=${WHOLE}/chars.txt`, `--output-file=public/fonts/${file}`, "--layout-features=*", "--no-hinting"],
    { encoding: "utf8" },
  );
  if (cut.status !== 0) throw new Error(`cutting ${file} (pip install fonttools): ${cut.stderr}`);
}
console.log(`  fonts cut to ${chars.size} characters`);
