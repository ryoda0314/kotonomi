import type { Metadata } from "next";
import { ja } from "@/lib/i18n/ja";
import { TypeHub } from "./_type/TypeHub";

export const metadata: Metadata = { title: ja.type.title };

export default function TypePage() {
  return <TypeHub />;
}
