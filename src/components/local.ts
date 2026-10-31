"use client";

import { useCallback, useSyncExternalStore } from "react";

// Small things kept on this device only (localStorage), as in the sisters: how the learner likes to hear and type,
// and which words they chose. Every reader falls back to the default when the browser has dropped them.

const EVENT = "vocab:local";
const PREFIX = "vocab:";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null || value === "") window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Private mode or storage switched off: the value simply is not kept.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** The raw value: undefined on the server and before hydration, null when nothing is kept. */
function useLocal(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => undefined,
  );
}

/** An on/off preference remembered on this device. */
export function usePref(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
  const raw = useLocal(key);
  const set = useCallback((value: boolean) => write(key, value ? "1" : "0"), [key]);
  return [raw == null ? fallback : raw === "1", set];
}

/** One of a few named choices remembered on this device. */
export function useChoice<T extends string>(key: string, choices: readonly T[], fallback: T): [T, (value: T) => void] {
  const raw = useLocal(key);
  const set = useCallback((value: T) => write(key, value), [key]);
  return [(choices as readonly string[]).includes(raw ?? "") ? (raw as T) : fallback, set];
}

/** A free text remembered on this device (a voice's name); "" when none. */
export function useText(key: string): [string, (value: string) => void] {
  const raw = useLocal(key);
  const set = useCallback((value: string) => write(key, value), [key]);
  return [raw ?? "", set];
}

/** Whether a choice has been made at all: undefined until the page is on the device. */
export function useChosen(key: string): boolean | undefined {
  const raw = useLocal(key);
  return raw === undefined ? undefined : raw !== null;
}

/** Read outside React (the voice). */
export function prefNow(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const raw = read(key);
  return raw === null ? fallback : raw === "1";
}

export function textNow(key: string): string {
  return (typeof window !== "undefined" && read(key)) || "";
}
