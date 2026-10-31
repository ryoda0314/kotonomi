import type { Metadata } from "next";
import { ja } from "@/lib/i18n/ja";
import { Start } from "./_learn/Start";

export const metadata: Metadata = { title: ja.learn.title };

export default function LearnPage() {
  return <Start />;
}
