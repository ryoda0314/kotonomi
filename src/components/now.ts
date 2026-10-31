"use client";

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const t = window.setInterval(onChange, MINUTE);
  return () => window.clearInterval(t);
}

/** The time now, to the minute (0 on the server): what has come back, what day it is. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, () => Math.floor(Date.now() / MINUTE) * MINUTE, () => 0);
}
