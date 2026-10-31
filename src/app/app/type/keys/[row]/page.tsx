import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ja } from "@/lib/i18n/ja";
import { DRILL, DRILLS, type DrillId } from "@/lib/keys";
import { Drill } from "../../_type/Drill";

export function generateStaticParams() {
  return DRILLS.map((d) => ({ row: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/app/type/keys/[row]">): Promise<Metadata> {
  const { row } = await params;
  return { title: DRILL.has(row as DrillId) ? `${ja.type.drills[row as DrillId].name}・${ja.type.keys}` : ja.type.title };
}

export default async function DrillPage({ params }: PageProps<"/app/type/keys/[row]">) {
  const { row } = await params;
  if (!DRILL.has(row as DrillId)) notFound();
  return <Drill id={row as DrillId} />;
}
