"use client";

// 覚える, or before the first round はじめに (once: which words, from where, the keyboard in front of the learner).

import { useChosen } from "@/components/local";
import page from "@/components/page.module.css";
import { ja } from "@/lib/i18n/ja";
import { useRecord } from "@/lib/store";
import { Round } from "./Round";
import { Setup } from "./Setup";

export function Start() {
  const chosen = useChosen("exam");
  const state = useRecord();
  if (chosen === undefined || !state) {
    return (
      <div className={page.page}>
        <p className={page.skeleton}>{ja.common.loading}</p>
      </div>
    );
  }
  return chosen ? <Round /> : <Setup />;
}
