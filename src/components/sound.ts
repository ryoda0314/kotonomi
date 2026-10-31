"use client";

// English said aloud by the device's own voice (speechSynthesis): computers and phones carry English voices, so every
// word and sentence can be heard without anything made ahead. The learner may choose one of them (設定); otherwise
// the one that sounds most natural is taken. One sound at a time; `usePlaying` tells a button it is the one sounding.

import { useSyncExternalStore } from "react";
import { prefNow, textNow } from "./local";

let playing: string | null = null;
let generation = 0;
const listeners = new Set<() => void>();
const set = (key: string | null) => {
  playing = key;
  listeners.forEach((l) => l());
};

const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);

// Some browsers list their voices late (Chrome, after `voiceschanged`): kept here, and refreshed when they come.
const NONE: SpeechSynthesisVoice[] = [];
let voices: SpeechSynthesisVoice[] = NONE;
const voiceListeners = new Set<() => void>();
const isEnglish = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-").startsWith("en");

function refresh() {
  const s = synth();
  const next = s ? s.getVoices().filter(isEnglish) : NONE;
  if (next.length === voices.length && next.every((v, i) => v === voices[i])) return;
  voices = next;
  voiceListeners.forEach((l) => l());
}

let watching = false;
function watch() {
  const s = synth();
  if (!s || watching) return;
  watching = true;
  refresh();
  s.addEventListener("voiceschanged", refresh);
}

/** How natural a voice tends to sound, from its name; American, then British English first. */
function rank(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase().replace("_", "-");
  let r = lang === "en-us" ? 3 : lang === "en-gb" ? 2 : 0;
  if (/natural|neural|online|premium|enhanced/.test(name)) r += 6;
  if (/google/.test(name)) r += 4;
  if (/samantha|aria|jenny|guy|ava|allison|daniel|serena|zira|alex/.test(name)) r += 2;
  return r;
}

function chosen(): SpeechSynthesisVoice | null {
  watch();
  refresh();
  if (!voices.length) return null;
  const name = textNow("voice");
  return voices.find((v) => v.name === name) ?? [...voices].sort((a, b) => rank(b) - rank(a))[0];
}

/**
 * Says an English text. `key` names the button asking (several may say the same text). Resolves when it has ended,
 * or something newer took over, or the device has no voice.
 */
export function say(text: string, { key = text }: { key?: string } = {}): Promise<boolean> {
  const s = synth();
  if (!s || !prefNow("sound", true)) return Promise.resolve(false);
  const voice = chosen();
  const gen = ++generation;
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else u.lang = "en-US";
    u.rate = prefNow("slow", false) ? 0.72 : 0.95;
    let settled = false;
    let guard = 0;
    const end = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(guard);
      if (gen === generation) set(null);
      resolve(ok && gen === generation);
    };
    u.onend = () => end(true);
    u.onerror = () => end(false);
    // A voice that never starts never ends: give up after the text's likely length.
    guard = window.setTimeout(() => end(false), 2500 + text.length * 140);
    s.cancel();
    set(key);
    s.speak(u);
  });
}

export function stop(): void {
  generation++;
  synth()?.cancel();
  set(null);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function usePlaying(): string | null {
  return useSyncExternalStore(subscribe, () => playing, () => null);
}

function subscribeVoices(l: () => void) {
  voiceListeners.add(l);
  watch();
  return () => voiceListeners.delete(l);
}
/** The device's English voices (empty on the server, and until the browser has listed them). */
export function useVoices(): SpeechSynthesisVoice[] {
  return useSyncExternalStore(subscribeVoices, () => voices, () => NONE);
}
