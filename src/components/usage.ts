"use client";

import { APP } from "@/lib/connect";
import { countsHere } from "@/lib/usage";
import { prefNow } from "./local";

// How many use the app, as ことのね counts it (its src/util/usage.ts): this device's number (a random one made here, tied
// to no one), whether it was opened from the home screen, and which of three things was done:
//   open   the app opened, once a page load (CountOpen, in the app layout)
//   learn  a round of 覚える finished, when the record keeps it (_learn/Round.tsx)
//   say    a word typed from its meaning in 思い出す, when the record keeps it (_learn/Round.tsx)
// Nothing else: no account, name, email or word. Sent to ことのあめ's Supabase (pl_app_ping, in
// ../polylinga/supabase/migrations/20261103000000_app_usage.sql) by a plain fetch with the anon key, never the
// signed-in client, so a learner's session does not go with it. Only from the public address (countsHere), and not
// once switched off in 設定. Never waited for: a count that cannot go is simply not counted.

export type UsageKind = "open" | "learn" | "say";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// ことのみ has no public address yet (ことのあめ's src/lib/sisters.ts), so nothing is counted until this is set.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";
const DEVICE = "vocab:device";
/** 設定's 使われ方の数を送る: a usePref (local.ts), so kept as vocab:sendUsage, "0" once the learner switched it off. */
export const SEND_USAGE = "sendUsage";

/** This device's number, made once at random. None when the browser keeps nothing (then nothing is counted). */
function deviceId(): string | null {
  try {
    let id = localStorage.getItem(DEVICE);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Opened from the icon on the home screen (an iPhone says so on navigator). */
function standalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** One thing done, counted (not waited for). */
export function countUsage(kind: UsageKind): void {
  if (typeof window === "undefined" || !URL_ || !KEY) return;
  if (!countsHere(location.origin, SITE, process.env.NODE_ENV === "production") || !prefNow(SEND_USAGE, true)) return;
  const device = deviceId();
  if (!device) return;
  fetch(`${URL_}/rest/v1/rpc/pl_app_ping`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_app: APP, p_device: device, p_kind: kind, p_standalone: standalone() }),
    keepalive: true,
  }).catch(() => {
    // Not counted this time.
  });
}
