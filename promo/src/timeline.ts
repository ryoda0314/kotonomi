// いつ何が起きるか（秒で決めて、コマにする）。ナレーションと英語の長さはクリップの長さ（src/voice.json：scripts/voice.mjs
// が書く）から、打つ長さは打ち方（anim.ts keys）から。声が言い終わってから、次のできごとへ進む。英語（アプリが端末の声で
// 言う語と例文）は、ナレーションと重ならない所で。
//
// 見る人：TOEIC・TOEFL を受ける、日本語を話す人。単語帳を目で追っても、なかなか覚えられない人（../CONCEPT.md）。
// はじめの一コマから問いかける：単語帳の5語（アプリの最初のひと回りの語）は、見れば分かる。でも、日本語から思い出して
// 打てますか？ colleague は collegue、colleage と迷ってから、やっと打てる。思い出して打つと、綴りが手に残る。それから
// 名前と、アプリのひと回り：はじめに → 出会う（見ながら打つ・例文の中で）→ 思い出す → また出会う（迷った colleague が
// 翌日、今度はひとりで）。打つうちに、指がキーの場所を覚える。点数も速さも測らない。
import { placesOf } from "../../src/content/check.ts";
import { WORD } from "../../src/content/index.ts";
import type { Word } from "../../src/content/types.ts";
import { f, keys, type Keys } from "./anim";
import VOICE from "./voice.json";

const word = (en: string) => WORD.get(en) as Word;
/** アプリの最初のひと回り（はじめに を選んだまま：TOEIC・基本・新しい語5つ）。 */
export const ROUND = ["colleague", "retire", "proposal", "postpone", "recommend"].map(word);
/** 冒頭で迷い、翌日に戻ってくる語。 */
export const HOOK = word("colleague");
/** ひと回りの中で、出会って、例文で打って、思い出す語。 */
export const MEET = word("postpone");
/** 打つ（例文を打つ）で打つ例文の語。 */
export const LINES = word("proposal");

/** 例文の中の語の場所（Sentence.tsx の markOf）。 */
export const markOf = (w: Word): [number, number] | null => placesOf(w.ex, w.form ?? w.en)[0] ?? null;

/** 冒頭：colleague を思い出して打つ。g で外れて（collegue）⌫ で戻り、a のあと e でまた外れて（colleage）、⌫ で ue。 */
export const HOOK_KEYS = keys(["colleg", "ue", 14, "⌫⌫⌫", 12, "a", 6, "ge", 14, "⌫", 8, "ue"], 5);
/** 例文の中で：語の前までは打ってある。 */
export const LINE_FROM = markOf(MEET)?.[0] ?? 0;
/** 思い出す：postpone。翌日：colleague（今度は外れずに）。 */
export const RECALL_KEYS = keys(["postpone"], 7);
export const DUE_KEYS = keys(["colleague"], 6);
/** 打つ：例文を、はじめから。はじめの T は Shift といっしょ（光ったところを見る間を置く）。 */
export const TYPE_KEYS = keys([30, LINES.ex], 5);

const sec = (frames: number) => frames / 30;

type VoiceId = keyof typeof VOICE;
/** クリップの末尾の余白（声が消えてから残した 250ms と、足した 120ms）。次の声やできごとは、ここに重ねてよい。 */
const TAIL = 0.37;
const said = (id: VoiceId) => VOICE[id] - TAIL;
/** 声（ナレーションと英語）を置いた時（秒）。 */
const cues: { id: VoiceId; at: number }[] = [];
const say = (id: VoiceId, at: number) => {
  cues.push({ id, at });
  return at + said(id);
};

/** 出会う：postpone。ゆっくり見ながら postpo まで。n が光ったまま待ち、「違うキーは」で m（入らない）、「正しいキーを」で n、e。 */
let meetKeys: Keys = { presses: [], duration: 0 };
let lineKeys: Keys = { presses: [], duration: 0 };

function make() {
  // A. 問い：単語帳の5語。英語が消え、同僚 だけが残って、思い出して打つ。
  const hook = { start: 0, hide: 0, focus: 0, type: 0, done: 0, keep: 0, end: 0 };
  hook.hide = say("O01", 0.15) + 0.1;
  const o02 = say("O02", hook.hide + 0.15);
  hook.focus = hook.hide + 0.55;
  hook.type = o02 + 0.2;
  hook.done = hook.type + sec(HOOK_KEYS.duration);
  const o03 = say("O03", hook.type + 0.5);
  const e01 = say("E01", Math.max(hook.done + 0.25, o03 + 0.1));
  hook.keep = e01 + 0.15;
  hook.end = say("O04", hook.keep) + 0.45;

  // B. ことのみ：枝が伸び、葉が開き、実がなる。「ことのみ。」で名前が降り、そのあとに一行。
  const title = { start: hook.end, icon: hook.end + 0.25, word: 0, lead: 0, end: 0 };
  title.word = title.icon + 0.6;
  // V01 は「ことのみ。」のあと 1.3 秒ほど黙る（0.64〜1.94 秒）。一行は、その声が戻るところで。
  title.lead = title.word + 1.9;
  title.end = say("V01", title.word) + 0.5;

  // C1. はじめに：「トーイックか」で TOEIC、「どこから始めるか」で 基本（どちらも選んだまま）、はじめる。
  const setup = { start: title.end, cap: 0, exam: 0, level: 0, go: 0, end: 0 };
  setup.cap = setup.start + 0.35;
  const v02at = setup.start + 0.45;
  setup.exam = v02at + 0.3;
  setup.level = v02at + 2.7;
  setup.go = say("V02", v02at) + 0.3;
  setup.end = setup.go + 0.45;

  // C2. 出会う：postpone。出てくると音（sayFirst）、それから見ながら打つ。
  const meet = { start: setup.end, cap: 0, type: 0, cap2: 0, sub2: 0, miss: 0, right: 0, done: 0, end: 0 };
  meet.cap = meet.start + 0.3;
  const v03at = say("E02", meet.start + 0.35) + 0.15;
  meet.type = v03at + 0.6;
  const v04at = say("V03", v03at) + 0.1;
  meet.cap2 = v04at - 0.05;
  const v05at = say("V04", v04at) + 0.15;
  meet.sub2 = v05at;
  const v05 = say("V05", v05at);
  // V05 は「違うキーは入らずに、」のあと 0.6 秒黙る（1.60〜2.20 秒）。
  meet.miss = v05at + 0.55;
  meet.right = v05at + 2.25;
  const first = keys(["postpo"], 20);
  const at = (s: number) => f(s - meet.type);
  meetKeys = {
    presses: [...first.presses, { key: "m", at: at(meet.miss) }, { key: "n", at: at(meet.right) }, { key: "e", at: at(meet.right) + 12 }],
    duration: at(meet.right) + 12,
  };
  meet.done = meet.type + sec(meetKeys.duration);
  // 打ち終えると、ひとりでに次へ（auto、0.65 秒）。
  meet.end = Math.max(meet.done + 0.65, v05 + 0.2);

  // C3. 例文の中で、もう一度：語の前までは打ってある。打ち終えると例文が鳴り（sayDone）、Enter で次へ。
  const line = { start: meet.end, cap: 0, type: 0, done: 0, enter: 0, end: 0 };
  line.cap = line.start + 0.3;
  const v06 = say("V06", line.start + 0.4);
  line.type = line.start + 0.5;
  const typing = keys([MEET.ex.slice(LINE_FROM)], 4);
  line.done = line.type + sec(typing.duration);
  line.enter = say("E03", Math.max(line.done + 0.25, v06 + 0.1)) + 0.35;
  lineKeys = { presses: [...typing.presses, { key: "⏎", at: f(line.enter - line.type) }], duration: f(line.enter - line.type) };
  line.end = line.enter + 0.3;

  // C4. 思い出す：意味から。出てこない（線が点滅するだけ）。例文で を押すと、空欄の例文と訳。思い出して打つ。
  const recall = { start: line.end, cap: 0, hint: 0, type: 0, done: 0, end: 0 };
  recall.cap = recall.start + 0.3;
  recall.hint = say("V07", recall.start + 0.4) + 0.35;
  const v08 = say("V08", recall.hint + 0.3);
  recall.type = v08 - 0.3;
  recall.done = recall.type + sec(RECALL_KEYS.duration);
  // ひとりで思い出せたら、語が鳴って、ひとりでに次へ（auto、1.1 秒）。
  recall.end = Math.max(say("E02", recall.done + 0.15), recall.done + 1.1) + 0.3;

  // D. また出会う：ひと回りのおわりに。迷った colleague は、紫で「また出てくる語」に。
  const again = { start: recall.end, cap: 0, glow: 0, end: 0 };
  again.cap = again.start + 0.3;
  again.glow = again.start + 0.65;
  again.end = say("V09", again.start + 0.45) + 0.45;

  // E. 翌日：colleague が紫で戻ってきて、今度はひとりで思い出せる。思い出せた語は、3日・7日・16日と間をのばして。
  const due = { start: again.end, cap: 0, type: 0, done: 0, cap2: 0, rest: [] as number[], end: 0 };
  due.cap = due.start + 0.3;
  due.type = due.start + 1.1;
  due.done = due.type + sec(DUE_KEYS.duration);
  due.cap2 = say("E01", due.done + 0.15) + 0.25;
  const v10at = due.cap2 + 0.1;
  // 声の区切り（V10 の無音から測った）：はじめ、「三日」1.86 秒、「七日」3.24 秒、「十六日」4.62 秒、「間をのばして」6.30 秒。
  due.rest = [v10at, v10at + 1.86, v10at + 3.24, v10at + 4.62, v10at + 6.3];
  due.end = say("V10", v10at) + 0.5;

  // F. 打つ：例文を打つ。はじめの T は、右の小指で Shift を押しながら。
  const type = { start: due.end, cap: 0, type: 0, cap2: 0, end: 0 };
  type.cap = type.start + 0.3;
  type.type = type.start + 1.2;
  type.cap2 = say("V11", type.start + 0.45) + 0.1;
  type.end = say("V12", type.cap2 + 0.1) + 0.6;

  // G. 終わり
  const end = { start: type.end, icon: type.end + 0.25, word: 0, lead: 0, rest: 0, end: 0 };
  end.word = end.icon + 0.7;
  end.lead = end.icon + 1.3;
  end.rest = end.icon + 2.0;
  end.end = Math.max(end.start + 6.0, say("V13", end.word + 0.05) + 1.8);

  return { hook, title, setup, meet, line, recall, again, due, type, end };
}

const S = make();
const frames = <T extends Record<string, number | number[]>>(o: T) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.map(f) : f(v)])) as { [K in keyof T]: T[K] extends number[] ? number[] : number };

export const T = {
  hook: frames(S.hook),
  title: frames(S.title),
  setup: frames(S.setup),
  meet: frames(S.meet),
  line: frames(S.line),
  recall: frames(S.recall),
  again: frames(S.again),
  due: frames(S.due),
  type: frames(S.type),
  end: frames(S.end),
};

export const TOTAL = f(S.end.end);
export const MEET_KEYS = meetKeys;
export const LINE_KEYS = lineKeys;

/** 声：クリップと、鳴らしはじめるコマ・声が消えるコマ（音楽はこの間だけ下がる）。 */
export const VOICE_AT = cues.map((c) => ({ id: c.id, from: f(c.at), until: f(c.at + said(c.id)) }));

/** `id` の声が `frame` に鳴っていれば、鳴りはじめてからのコマ（なければ -1）。同じ声を何度か鳴らすときは、いま鳴っているもの。 */
export function sounding(frame: number, id: VoiceId): number {
  for (const c of VOICE_AT) if (c.id === id && frame >= c.from && frame < c.until) return frame - c.from;
  return -1;
}

/**
 * 音楽の区切り（秒）。scripts/music.py に渡す：はじめから分散和音がまばらに入り、名前から流れ、また出会うところで
 * 鐘が答え、終わりのカードで主和音に帰る。
 */
export const MUSIC_MARKS = { title: 0, story: S.title.start, later: S.again.start, end: S.end.start, total: S.end.end };
