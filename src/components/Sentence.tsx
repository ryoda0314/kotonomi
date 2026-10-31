import { placesOf } from "@/content/check";
import type { Word } from "@/content/types";
import styles from "./Sentence.module.css";

/** Where the word stands in its sentence, [start, end). */
export const markOf = (w: Word): [number, number] | null => placesOf(w.ex, w.form ?? w.en)[0] ?? null;

/** A word's sentence with the word lit, or left blank (思い出す's 例文で: the sentence as a hint, the word not given). */
export function Sentence({ word, blank = false, className }: { word: Word; blank?: boolean; className?: string }) {
  const at = markOf(word);
  if (!at) return <span className={className}>{word.ex}</span>;
  return (
    <span className={className} lang="en">
      {word.ex.slice(0, at[0])}
      {blank ? <span className={styles.blank} aria-label="空欄" /> : <span className={styles.mark}>{word.ex.slice(at[0], at[1])}</span>}
      {word.ex.slice(at[1])}
    </span>
  );
}
