import type { Metadata } from "next";
import { ja } from "@/lib/i18n/ja";
import { ExportView } from "./ExportView";

export const metadata: Metadata = { title: ja.exportView.title };

export default function ExportPage() {
  return <ExportView />;
}
