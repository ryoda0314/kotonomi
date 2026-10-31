import type { Metadata } from "next";
import { ja } from "@/lib/i18n/ja";
import { LinesRound } from "../_type/LinesRound";

export const metadata: Metadata = { title: ja.type.lines };

export default function LinesPage() {
  return <LinesRound />;
}
