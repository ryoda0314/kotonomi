// 学習の記録: the whole record as one Markdown text, for the learner to paste into an AI of their choice (the app
// itself calls no AI). Pure.

import { WORD } from "../content/index.ts";
import { dayOf, isDue, isMet, stageOf, type Stage, type State } from "./record.ts";

const STAGE_NAMES: Record<Stage, string> = {
  known: "知っていた",
  met: "出会った",
  recalled: "思い出せた",
  again: "また思い出せた",
  settled: "身についた",
};

const gloss = (en: string) => {
  const w = WORD.get(en);
  return w ? `${en}（${w.ja}）` : en;
};

export function exportMarkdown(s: State, prompt: string, now: number): string {
  const lines: string[] = [prompt, "", "# ことのみ の記録", ""];
  const met = Object.entries(s.words).filter(([, log]) => isMet(log));
  const count = (stage: Stage) => met.filter(([, log]) => stageOf(log) === stage).length;
  lines.push(`- 出会った語: ${met.length}`);
  for (const stage of ["recalled", "again", "settled", "known"] as Stage[]) lines.push(`- ${STAGE_NAMES[stage]}: ${count(stage)}`);
  lines.push(`- 打った例文: ${met.filter(([, log]) => log.lines.length).length}`);
  lines.push(`- ひと回り: ${s.rounds.length}`);
  lines.push(`- キーの場所の練習: ${Object.values(s.drills).reduce((n, d) => n + d.length, 0)} 回`);

  const hard = met.filter(([, log]) => log.missed.length).sort((a, b) => b[1].missed.length - a[1].missed.length);
  lines.push("", "## 思い出しにくかった語", "");
  if (!hard.length) lines.push("- まだありません");
  for (const [en, log] of hard.slice(0, 40)) {
    lines.push(`- ${gloss(en)}: 思い出しにくかった ${log.missed.length} 回、思い出せた ${log.recalled.length} 回${isDue(log, now) ? "、また出てくる" : ""}`);
  }

  const settled = met.filter(([, log]) => stageOf(log) === "settled").map(([en]) => en);
  lines.push("", "## 身についた語", "");
  lines.push(settled.length ? `- ${settled.join(", ")}` : "- まだありません");

  const byDay = new Map<string, { rounds: number; fresh: Set<string>; missed: Set<string> }>();
  for (const r of s.rounds) {
    const d = dayOf(r.at);
    const e = byDay.get(d) ?? { rounds: 0, fresh: new Set<string>(), missed: new Set<string>() };
    e.rounds++;
    r.fresh.forEach((w) => e.fresh.add(w));
    r.missed.forEach((w) => e.missed.add(w));
    byDay.set(d, e);
  }
  lines.push("", "## 日ごと", "");
  if (!byDay.size) lines.push("- まだありません");
  for (const [d, e] of [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
    const parts = [`ひと回り ${e.rounds}`];
    if (e.fresh.size) parts.push(`はじめての語 ${[...e.fresh].join(", ")}`);
    if (e.missed.size) parts.push(`思い出しにくかった語 ${[...e.missed].join(", ")}`);
    lines.push(`- ${d}: ${parts.join("、")}`);
  }
  return lines.join("\n") + "\n";
}
