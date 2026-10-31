"use client";

// The learner's choices, kept on this device (local.ts): which words, from where, how many new ones a round, and the
// keyboard in front of them.

import type { Exam, Level } from "@/content/types";
import { LAYOUTS, type Layout } from "@/lib/keys";
import type { Scope } from "@/lib/round";
import { useChoice } from "./local";

export type ExamChoice = Exam | "both";
export const EXAM_CHOICES: ExamChoice[] = ["toeic", "toefl", "both"];
export const LEVEL_CHOICES = ["1", "2", "3"] as const;
export const FRESH_CHOICES = ["3", "5", "8"] as const;

export const useExam = () => useChoice<ExamChoice>("exam", EXAM_CHOICES, "toeic");
export const useFrom = () => useChoice<(typeof LEVEL_CHOICES)[number]>("from", LEVEL_CHOICES, "1");
export const useFresh = () => useChoice<(typeof FRESH_CHOICES)[number]>("fresh", FRESH_CHOICES, "5");
export const useLayout = () => useChoice<Layout>("layout", LAYOUTS, "jis");

export const scopeOf = (exam: ExamChoice, from: string): Scope => ({
  exams: exam === "both" ? ["toeic", "toefl"] : [exam],
  from: Number(from) as Level,
});

export function useScope(): Scope {
  const [exam] = useExam();
  const [from] = useFrom();
  return scopeOf(exam, from);
}
