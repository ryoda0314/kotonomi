// The keyboard in front of the learner, as touch typing teaches it: the key that makes each character on a Japanese
// (JIS) or an English (US) keyboard, with or without Shift, and the finger that presses it. Pure.
//
//   JIS  1 2 3 4 5 6 7 8 9 0 - ^ ¥          US  1 2 3 4 5 6 7 8 9 0 - =
//         q w e r t y u i o p @ [                q w e r t y u i o p [ ] \
//          a s d f g h j k l ; : ]                a s d f g h j k l ; '
//           z x c v b n m , . / _                  z x c v b n m , . /
//
// Letters, digits and . , / ; - are in the same places on both. Of the rest, the sentences use only ' ? $ %
// (src/content/check.ts), and only ' moves: Shift + 7 on JIS, a key of its own on US. Keys no sentence needs are
// `extra`: drawn on a wide screen so the keyboard looks like the one in front of the learner, left out on a phone.

export type Layout = "jis" | "us";
export const LAYOUTS: Layout[] = ["jis", "us"];

/** The left or right hand's little, ring, middle and index finger; the thumbs for the space bar. */
export type Finger = "lp" | "lr" | "lm" | "li" | "ri" | "rm" | "rr" | "rp" | "th";

export type KeyDef = { code: string; base: string; shift: string; finger: Finger; extra?: true };

// The home position: the left hand on A S D F, the right on J K L ;, each finger taking the keys above and below.
const FINGER: Record<string, Finger> = {
  Digit1: "lp", KeyQ: "lp", KeyA: "lp", KeyZ: "lp",
  Digit2: "lr", KeyW: "lr", KeyS: "lr", KeyX: "lr",
  Digit3: "lm", KeyE: "lm", KeyD: "lm", KeyC: "lm",
  Digit4: "li", Digit5: "li", KeyR: "li", KeyT: "li", KeyF: "li", KeyG: "li", KeyV: "li", KeyB: "li",
  Digit6: "ri", Digit7: "ri", KeyY: "ri", KeyU: "ri", KeyH: "ri", KeyJ: "ri", KeyN: "ri", KeyM: "ri",
  Digit8: "rm", KeyI: "rm", KeyK: "rm", Comma: "rm",
  Digit9: "rr", KeyO: "rr", KeyL: "rr", Period: "rr",
  Space: "th",
};

const key = (code: string, base: string, shift: string, extra = false): KeyDef => ({
  code,
  base,
  shift,
  finger: FINGER[code] ?? "rp",
  ...(extra ? { extra: true as const } : {}),
});
const letters = (row: string) => [...row].map((ch) => key(`Key${ch.toUpperCase()}`, ch, ch.toUpperCase()));
const digits = (shifted: string[]) => [..."1234567890"].map((d, i) => key(`Digit${d}`, d, shifted[i]));

export const SPACE: KeyDef = key("Space", " ", " ");

/** The four rows of character keys, top to bottom. */
export const ROWS: Record<Layout, KeyDef[][]> = {
  jis: [
    [...digits(["!", '"', "#", "$", "%", "&", "'", "(", ")", ""]), key("Minus", "-", "="), key("Equal", "^", "~", true), key("IntlYen", "¥", "|", true)],
    [...letters("qwertyuiop"), key("BracketLeft", "@", "`", true), key("BracketRight", "[", "{", true)],
    [...letters("asdfghjkl"), key("Semicolon", ";", "+"), key("Quote", ":", "*", true), key("Backslash", "]", "}", true)],
    [...letters("zxcvbnm"), key("Comma", ",", "<"), key("Period", ".", ">"), key("Slash", "/", "?"), key("IntlRo", "\\", "_", true)],
  ],
  us: [
    [...digits(["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"]), key("Minus", "-", "_"), key("Equal", "=", "+", true)],
    [...letters("qwertyuiop"), key("BracketLeft", "[", "{", true), key("BracketRight", "]", "}", true), key("Backslash", "\\", "|", true)],
    [...letters("asdfghjkl"), key("Semicolon", ";", ":"), key("Quote", "'", '"')],
    [...letters("zxcvbnm"), key("Comma", ",", "<"), key("Period", ".", ">"), key("Slash", "/", "?")],
  ],
};

export type Stroke = { key: KeyDef; shift: boolean };

function indexOf(layout: Layout): Map<string, Stroke> {
  const out = new Map<string, Stroke>([[" ", { key: SPACE, shift: false }]]);
  for (const k of ROWS[layout].flat()) out.set(k.base, { key: k, shift: false });
  for (const k of ROWS[layout].flat()) if (k.shift && !out.has(k.shift)) out.set(k.shift, { key: k, shift: true });
  return out;
}
const INDEX: Record<Layout, Map<string, Stroke>> = { jis: indexOf("jis"), us: indexOf("us") };
const BY_CODE: Record<Layout, Map<string, KeyDef>> = {
  jis: new Map([...ROWS.jis.flat(), SPACE].map((k) => [k.code, k])),
  us: new Map([...ROWS.us.flat(), SPACE].map((k) => [k.code, k])),
};

/** The key that makes a character, and whether Shift goes with it; null for one the keyboard does not have. */
export const strokeFor = (ch: string, layout: Layout): Stroke | null => INDEX[layout].get(ch) ?? null;

export const keyOfCode = (code: string, layout: Layout): KeyDef | undefined => BY_CODE[layout].get(code);

export const isLeft = (f: Finger) => f.startsWith("l");

/** The keys to drill, a row at a time (打つ, キーの場所): the home row first, as touch typing begins there. */
export type DrillId = "home" | "top" | "bottom" | "numbers" | "all";
export const DRILLS: { id: DrillId; keys: string[] }[] = [
  { id: "home", keys: [..."asdfghjkl;"] },
  { id: "top", keys: [..."qwertyuiop"] },
  { id: "bottom", keys: [..."zxcvbnm,./"] },
  { id: "numbers", keys: [..."1234567890-"] },
  { id: "all", keys: [..."abcdefghijklmnopqrstuvwxyz"] },
];
export const DRILL = new Map(DRILLS.map((d) => [d.id, d]));
