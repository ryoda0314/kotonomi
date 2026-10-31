// What has been typed, against what is to be typed. Two ways (CONCEPT.md):
//   見て打つ   the text is there to see: a wrong key goes in nowhere and the right one is waited for (as 寿司打 and
//              e-typing do), so the fingers learn the key
//   思い出す   the word is not shown: every key goes in, and from where it went off the way it stays violet until ⌫,
//              so the learner sees the spelling they reached for
// Pure.

/** A curly apostrophe (some keyboards and phones make one) is the straight one. */
export const plain = (ch: string) => (ch === "’" || ch === "‘" ? "'" : ch);

/** How many characters from the start `typed` shares with `target`. */
export function agreed(typed: string, target: string): number {
  let i = 0;
  while (i < typed.length && i < target.length && typed[i] === target[i]) i++;
  return i;
}

/** 思い出す: what is typed so far, and how many times it went off the way (a slip is going off, not each key off). */
export type Recall = { typed: string; slips: number };
export const emptyRecall: Recall = { typed: "", slips: 0 };

export function pressRecall(r: Recall, ch: string, target: string): Recall {
  const typed = r.typed + plain(ch);
  const wasOn = agreed(r.typed, target) === r.typed.length;
  const isOn = agreed(typed, target) === typed.length;
  return { typed, slips: r.slips + (wasOn && !isOn ? 1 : 0) };
}

export const backRecall = (r: Recall): Recall => ({ ...r, typed: r.typed.slice(0, -1) });

/** One slip is a finger's, not the memory's: a word recalled with more, or with its sound or its answer, comes back sooner. */
export const SLIPS_FORGIVEN = 1;
