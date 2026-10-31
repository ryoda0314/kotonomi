"use client";

// 出会う: a new word, then its sentence. The word is heard as it comes up and typed in sight; its meaning stands
// above it. Then the sentence holding it, typed (or read and heard, 設定) with its translation under it.

import { useEffect, useEffectEvent } from "react";
import { Icon } from "@/components/Icon";
import { Sentence, markOf } from "@/components/Sentence";
import { say, stop } from "@/components/sound";
import { Speak } from "@/components/Speak";
import { TypeCopy } from "@/components/TypeCopy";
import typing from "@/components/typing.module.css";
import type { Word } from "@/content/types";
import { ja } from "@/lib/i18n/ja";
import styles from "./learn.module.css";

export function MeetWord({ w, onTyped, onKnown, onDone }: { w: Word; onTyped: () => void; onKnown: () => void; onDone: () => void }) {
  return (
    <div className={styles.screen}>
      <div className={styles.leadRow}>
        <p className={styles.lead}>{ja.learn.meetLead}</p>
        <button type="button" className="link-button" onMouseDown={(e) => e.preventDefault()} onClick={onKnown}>
          {ja.learn.known}
        </button>
      </div>
      <div className={styles.prompt}>
        <span className={styles.pos}>{ja.word.pos[w.pos]}</span>
        <p className={styles.meaning}>{w.ja}</p>
        <Speak text={w.en} label={`${w.en} ${ja.common.hear}`} id={`meet:${w.en}`} size="sm" />
      </div>
      <TypeCopy target={w.en} view="word" sayFirst auto onTyped={onTyped} onDone={onDone} />
    </div>
  );
}

export function MeetLine({ w, typeIt, onTyped, onDone }: { w: Word; typeIt: boolean; onTyped: () => void; onDone: () => void }) {
  return (
    <div className={styles.screen}>
      <p className={styles.lead}>{typeIt ? ja.learn.lineLead : ja.learn.lineRead}</p>
      <div className={styles.lineHead}>
        <Speak text={w.ex} label={`${ja.word.example} ${ja.common.hear}`} id={`line:${w.en}`} size="sm" />
        <span className={styles.lineWord} lang="en">
          {w.en}
        </span>
        <span className={styles.lineJa}>{w.ja}</span>
      </div>
      {typeIt ? (
        <TypeCopy target={w.ex} view="line" mark={markOf(w)} sayDone onTyped={onTyped} onDone={onDone} below={<p className={styles.exJa}>{w.exJa}</p>} />
      ) : (
        <ReadLine w={w} onDone={onDone} />
      )}
    </div>
  );
}

/** The sentence read and heard, not typed: 次へ, or the space bar or Enter on the keyboard in front of the learner. */
function ReadLine({ w, onDone }: { w: Word; onDone: () => void }) {
  const sayNow = useEffectEvent(() => void say(w.ex, { key: `line:${w.en}` }));
  const doneNow = useEffectEvent(onDone);
  useEffect(() => {
    const t = window.setTimeout(() => sayNow(), 250);
    const onNext = (e: KeyboardEvent) => {
      if ((e.key !== "Enter" && e.key !== " ") || e.repeat || document.querySelector("dialog[open]")) return;
      e.preventDefault();
      doneNow();
    };
    window.addEventListener("keydown", onNext);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onNext);
      stop();
    };
  }, []);
  return (
    <>
      <p className={styles.readLine}>
        <Sentence word={w} />
      </p>
      <p className={styles.exJa}>{w.exJa}</p>
      <div className={typing.actions}>
        <span className={typing.keysNote}>{ja.typing.nextKeys}</span>
        <button type="button" className="btn" onClick={onDone}>
          {ja.common.next}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </>
  );
}
