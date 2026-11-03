"use client";

import { useEffect } from "react";
import { countUsage } from "@/components/usage";

// Once a page load: the app layout mounts again after a visit to the intro, and twice while developing.
let counted = false;

/** The app opened (src/components/usage.ts): counted when a page of it is loaded, not on moving between its pages. */
export function CountOpen() {
  useEffect(() => {
    if (counted) return;
    counted = true;
    countUsage("open");
  }, []);
  return null;
}
