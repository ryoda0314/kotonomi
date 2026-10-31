import type { Metadata } from "next";
import { ja } from "@/lib/i18n/ja";
import { WordsRound } from "../_type/WordsRound";

export const metadata: Metadata = { title: ja.type.listen };

export default function ListenPage() {
  return <WordsRound mode="hear" />;
}
