"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useNow } from "@/components/now";
import page from "@/components/page.module.css";
import { exportMarkdown } from "@/lib/export";
import { ja } from "@/lib/i18n/ja";
import { dayOf } from "@/lib/record";
import { useRecord } from "@/lib/store";
import styles from "./export.module.css";

const t = ja.exportView;

/** 学習の記録: the record as one text to copy into an AI of the learner's choice. Nothing is sent anywhere. */
export function ExportView() {
  const state = useRecord();
  const now = useNow();
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const text = state && now ? exportMarkdown(state, t.prompt, now) : "";
  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/me" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>{t.title}</h1>
      </header>
      <p className={page.lead}>{ja.me.exportLead}</p>
      <div className={page.actions} style={{ paddingTop: 16 }}>
        <button
          type="button"
          className="btn"
          disabled={!text}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied("done");
            } catch {
              setCopied("failed");
            }
          }}
        >
          {copied === "done" ? t.copied : t.copy}
        </button>
        <button
          type="button"
          className="btn-quiet"
          disabled={!text}
          onClick={() => {
            const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `kotonomi-${dayOf(Date.now())}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          {t.save}
        </button>
      </div>
      <pre className={styles.text}>{text}</pre>
    </div>
  );
}
