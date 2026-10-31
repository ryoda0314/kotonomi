import { Icon, type IconName } from "@/components/Icon";
import styles from "./track.module.css";

export type LearnStep = "meet" | "recall";
const ICONS: Record<LearnStep, IconName> = { meet: "keys", recall: "hint" };

/**
 * Where the learner is in this round: the steps on a track, those behind checked, this one lit, those ahead faint
 * (the sisters' Track). A guide, not a score: nothing is counted.
 */
export function Track({ steps, current, done = false }: { steps: { step: LearnStep; label: string }[]; current: LearnStep; done?: boolean }) {
  const at = done ? steps.length : steps.findIndex((s) => s.step === current);
  return (
    <ol className={styles.steps} aria-label="このひと回りの流れ" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s, i) => {
        const state = i < at ? "done" : i === at ? "now" : "next";
        return (
          <li key={s.step} className={styles.step} data-state={state} aria-current={state === "now" ? "step" : undefined}>
            <span className={styles.node} aria-hidden="true">
              <Icon name={state === "done" ? "check" : ICONS[s.step]} size={20} />
            </span>
            <span className={styles.label}>
              <span className={styles.number}>{i + 1}</span>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
