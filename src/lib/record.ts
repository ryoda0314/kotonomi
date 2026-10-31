// The learner's record: for each word, when it was typed with it in sight (or heard), when its sentence was typed,
// when it was recalled from its meaning alone and when only with help, and when it was passed over as already known;
// the rounds of key practice; the rounds. Only what happened is kept (as times). How well a word is held, and when it
// comes back, are worked out from it every time.
// Pure; kept on the device by store.ts and in the account by sync.ts, merged and never overwritten (mergeStates).

export type Stamps = number[];
export type WordLog = {
  /** Typed with the word in sight, or heard (見て打つ, 打つ). */
  typed: Stamps;
  /** Its sentence typed. */
  lines: Stamps;
  /** Typed from its meaning alone (思い出せた). */
  recalled: Stamps;
  /** Typed from its meaning only with its sound or its answer, or going off the way more than once. */
  missed: Stamps;
  /** Passed over as already known (知っている). */
  known?: number;
};
/** One round of 覚える, for looking back. */
export type RoundEntry = { at: number; fresh: string[]; due: string[]; missed: string[] };

export type State = {
  v: 1;
  words: Record<string, WordLog>;
  /** Rounds of キーの場所, by row. */
  drills: Record<string, Stamps>;
  rounds: RoundEntry[];
};

export const emptyState = (): State => ({ v: 1, words: {}, drills: {}, rounds: [] });

const STAMPS_KEPT = 40;
const ROUNDS_KEPT = 400;

const add = (s: Stamps | undefined, at: number) => {
  const out = [...(s ?? []), at];
  return out.length > STAMPS_KEPT ? out.slice(-STAMPS_KEPT) : out;
};
const first = (s: Stamps | undefined) => (s && s.length ? Math.min(...s) : 0);
const emptyLog = (): WordLog => ({ typed: [], lines: [], recalled: [], missed: [] });

/** Days are Japan days (as the sisters'): 2026-10-29. */
export function dayOf(at: number): string {
  return new Date(at + 9 * 3600_000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- how well a word is held

/** A day for coming back: about the same time the next day, a few hours early being fine. */
export const DAY = 20 * 3600_000;
/**
 * How many days a word rests at each step before it comes back: met, the next day; recalled once, the next day
 * again; then 3, 7, 16, 35, 75 and at most 120. Recalled from its meaning alone once it has rested, it goes a step on;
 * recalled only with help, it starts again from the first.
 */
export const REST = [1, 1, 3, 7, 16, 35, 75, 120];
/** A word passed over as known rests a week, then is asked once. */
export const KNOWN_STEP = 3;

export type Stage = "known" | "met" | "recalled" | "again" | "settled";
export const STAGES: Stage[] = ["met", "recalled", "again", "settled", "known"];

export const isMet = (log: WordLog | undefined): log is WordLog =>
  !!log && (log.typed.length > 0 || log.recalled.length > 0 || log.missed.length > 0 || !!log.known);

/** The step a word stands on, and since when (src/lib/record.ts REST). */
export function strengthOf(log: WordLog): { step: number; since: number } {
  let step = log.known ? KNOWN_STEP : 0;
  let since = log.known ?? first(log.typed);
  const events = [...log.recalled.map((t) => ({ t, ok: true })), ...log.missed.map((t) => ({ t, ok: false }))].sort((a, b) => a.t - b.t);
  if (!since && events.length) since = events[0].t;
  for (const e of events) {
    if (!e.ok) {
      step = 0;
      since = e.t;
    } else if (step === 0 || e.t - since >= REST[step] * DAY) {
      step = Math.min(step + 1, REST.length - 1);
      since = e.t;
    }
  }
  return { step, since };
}

export function dueAt(log: WordLog): number {
  const { step, since } = strengthOf(log);
  return since + REST[step] * DAY;
}

/** Met, and its time to come back has come. */
export const isDue = (log: WordLog | undefined, now: number) => isMet(log) && now >= dueAt(log);

/** How the word stands, in the learner's words (自分): 知っていた, 出会った, 思い出せた, また思い出せた, 身についた. */
export function stageOf(log: WordLog): Stage {
  if (log.known && !log.recalled.length && !log.missed.length) return "known";
  const { step } = strengthOf(log);
  return step >= 4 ? "settled" : step >= 2 ? "again" : step === 1 ? "recalled" : "met";
}

/** When it was first met. */
export const metAt = (log: WordLog) => Math.min(...[first(log.typed), first(log.recalled), first(log.missed), log.known ?? 0].filter(Boolean));

// ---------------------------------------------------------------- what happened

const touch = (s: State, en: string, change: (log: WordLog) => WordLog): State => ({
  ...s,
  words: { ...s.words, [en]: change(s.words[en] ?? emptyLog()) },
});

export const typedWord = (s: State, en: string, at: number): State => touch(s, en, (l) => ({ ...l, typed: add(l.typed, at) }));

export const typedLine = (s: State, en: string, at: number): State => touch(s, en, (l) => ({ ...l, lines: add(l.lines, at) }));

/** Typed from its meaning: alone (`clean`), or only with help. */
export const recalledWord = (s: State, en: string, at: number, clean: boolean): State =>
  touch(s, en, (l) => (clean ? { ...l, recalled: add(l.recalled, at) } : { ...l, missed: add(l.missed, at) }));

export const knewWord = (s: State, en: string, at: number): State => touch(s, en, (l) => (l.known ? l : { ...l, known: at }));

export const finishDrill = (s: State, id: string, at: number): State => ({ ...s, drills: { ...s.drills, [id]: add(s.drills[id], at) } });

export function finishRound(s: State, entry: RoundEntry): State {
  if (s.rounds.some((r) => r.at === entry.at)) return s;
  return { ...s, rounds: [...s.rounds, entry].slice(-ROUNDS_KEPT) };
}

// ---------------------------------------------------------------- two copies made one

const union = (a: Stamps = [], b: Stamps = []) => {
  const out = [...new Set([...a, ...b])].sort((x, y) => x - y);
  return out.length > STAMPS_KEPT ? out.slice(-STAMPS_KEPT) : out;
};
const minOf = (a?: number, b?: number) => (a && b ? Math.min(a, b) : a || b);

/** The device's record and the account's, made one: nothing either has is lost. */
export function mergeStates(a: State, b: State): State {
  const words: State["words"] = {};
  for (const en of new Set([...Object.keys(a.words), ...Object.keys(b.words)])) {
    const x = a.words[en] ?? emptyLog();
    const y = b.words[en] ?? emptyLog();
    const log: WordLog = {
      typed: union(x.typed, y.typed),
      lines: union(x.lines, y.lines),
      recalled: union(x.recalled, y.recalled),
      missed: union(x.missed, y.missed),
    };
    const known = minOf(x.known, y.known);
    words[en] = known ? { ...log, known } : log;
  }
  const drills: State["drills"] = {};
  for (const id of new Set([...Object.keys(a.drills), ...Object.keys(b.drills)])) drills[id] = union(a.drills[id], b.drills[id]);
  const byAt = new Map<number, RoundEntry>();
  for (const r of [...a.rounds, ...b.rounds]) byAt.set(r.at, r);
  const rounds = [...byAt.values()].sort((x, y) => x.at - y.at).slice(-ROUNDS_KEPT);
  return { v: 1, words, drills, rounds };
}

/** Kept small: the rounds are capped as they grow (each word's times are capped as they are added). */
export function bounded(s: State): State {
  return s.rounds.length > ROUNDS_KEPT ? { ...s, rounds: s.rounds.slice(-ROUNDS_KEPT) } : s;
}

/** A record read back from the device: this shape, or nothing. */
export function revive(raw: unknown): State | null {
  const s = raw as Partial<State> | null;
  if (!s || s.v !== 1 || typeof s.words !== "object") return null;
  return { ...emptyState(), ...s, v: 1 };
}
