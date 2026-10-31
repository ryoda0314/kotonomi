"use client";

// 自分: looking back. The learner's own counts (never compared); the words as they stand for this learner — those
// coming back first, in violet, then 出会った … 身についた and 知っていた — each opening its sheet; the days; the
// record's text and the settings.

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { useNow } from "@/components/now";
import page from "@/components/page.module.css";
import { useOpenWord } from "@/components/WordSheet";
import { WORD } from "@/content/index";
import { ja } from "@/lib/i18n/ja";
import { dayOf, dueAt, isDue, isMet, metAt, stageOf, type Stage } from "@/lib/record";
import { useRecord } from "@/lib/store";
import styles from "./me.module.css";

const t = ja.me;
const SHOWN = 24;
type Group = "due" | Stage;
const GROUPS: Group[] = ["due", "met", "recalled", "again", "settled", "known"];

function dayLabel(day: string, today: string): string {
  if (today && day === today) return t.today;
  if (today && day === dayOf(Date.parse(`${today}T12:00:00+09:00`) - 86_400_000)) return t.yesterday;
  return new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(new Date(`${day}T12:00:00+09:00`));
}

export function Me() {
  const state = useRecord();
  const now = useNow();
  const open = useOpenWord();
  const [more, setMore] = useState<Partial<Record<Group, boolean>>>({});

  const groups = useMemo(() => {
    const out = Object.fromEntries(GROUPS.map((g) => [g, [] as string[]])) as Record<Group, string[]>;
    if (!state || !now) return out;
    const met = Object.entries(state.words).filter(([en, log]) => isMet(log) && WORD.has(en));
    for (const [en, log] of met) out[isDue(log, now) ? "due" : stageOf(log)].push(en);
    out.due.sort((a, b) => dueAt(state.words[a]) - dueAt(state.words[b]));
    for (const g of GROUPS.slice(1)) out[g].sort((a, b) => metAt(state.words[b]) - metAt(state.words[a]));
    return out;
  }, [state, now]);

  const days = useMemo(() => {
    if (!state) return [];
    const m = new Map<string, { rounds: number; fresh: Set<string>; missed: Set<string> }>();
    for (const r of state.rounds) {
      const d = dayOf(r.at);
      const e = m.get(d) ?? { rounds: 0, fresh: new Set<string>(), missed: new Set<string>() };
      e.rounds++;
      r.fresh.forEach((w) => e.fresh.add(w));
      r.missed.forEach((w) => e.missed.add(w));
      m.set(d, e);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
  }, [state]);

  if (!state) {
    return (
      <div className={page.page}>
        <header className={page.bar}>
          <h1 className={page.barTitle}>{t.title}</h1>
        </header>
        <p className={page.skeleton}>{ja.common.loading}</p>
      </div>
    );
  }

  const logs = Object.values(state.words).filter(isMet);
  const stats = [
    { label: t.stats.met, value: logs.length },
    { label: t.stats.recalled, value: logs.filter((l) => ["recalled", "again", "settled"].includes(stageOf(l))).length },
    { label: t.stats.settled, value: logs.filter((l) => stageOf(l) === "settled").length },
    { label: t.stats.lines, value: logs.filter((l) => l.lines.length).length },
  ];
  const today = now ? dayOf(now) : "";
  const anyWords = GROUPS.some((g) => groups[g].length);

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{t.title}</h1>
        <Link href="/app/me/settings" className={page.barButton}>
          {t.settings}
        </Link>
      </header>
      <p className={page.lead}>{t.lead}</p>

      <section className={page.section}>
        <dl className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.words}</h2>
        {anyWords ? (
          <>
            <p className={page.note}>{t.wordsLead}</p>
            {GROUPS.filter((g) => groups[g].length).map((g) => {
              const all = groups[g];
              const shown = more[g] ? all : all.slice(0, SHOWN);
              return (
                <div key={g} className={styles.group} data-group={g}>
                  <p className={styles.groupTitle}>
                    {t.groups[g]}
                    <span>{all.length}</span>
                  </p>
                  <ul className={styles.chips}>
                    {shown.map((en) => (
                      <li key={en}>
                        <button type="button" className={styles.chip} onClick={() => open(en)} lang="en">
                          {en}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {all.length > shown.length ? (
                    <button type="button" className="link-button" onClick={() => setMore({ ...more, [g]: true })}>
                      {t.more(all.length - shown.length)}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </>
        ) : (
          <p className={page.empty}>{t.wordsEmpty}</p>
        )}
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.days}</h2>
        {days.length ? (
          <ul className={styles.days}>
            {days.map(([d, e]) => (
              <li key={d}>
                <p className={styles.dayHead}>
                  {dayLabel(d, today)} <span>{t.dayRounds(e.rounds)}</span>
                </p>
                <dl className={styles.dayList}>
                  {e.fresh.size ? (
                    <div>
                      <dt>{t.dayFresh}</dt>
                      <dd lang="en">{[...e.fresh].join(", ")}</dd>
                    </div>
                  ) : null}
                  {e.missed.size ? (
                    <div>
                      <dt>{t.dayMissed}</dt>
                      <dd className="again" lang="en">
                        {[...e.missed].join(", ")}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className={page.empty}>{t.daysEmpty}</p>
        )}
      </section>

      <section className={page.section}>
        <ul className={page.rows}>
          <li>
            <Link href="/app/me/export" className={page.row}>
              <span className={page.rowMain}>
                <span className={page.rowTitle}>{t.export}</span>
                <span className={page.rowSub}>{t.exportLead}</span>
              </span>
              <Icon name="arrow" size={18} />
            </Link>
          </li>
          <li>
            <Link href="/app/me/settings" className={page.row}>
              <span className={page.rowMain}>
                <span className={page.rowTitle}>{t.settings}</span>
              </span>
              <Icon name="arrow" size={18} />
            </Link>
          </li>
        </ul>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.sister}</h2>
        <ul className={page.rows}>
          {t.sisters.map((s) => (
            <li key={s.name}>
              <a href={s.url} className={page.row} target="_blank" rel="noopener">
                <span className={page.rowMain}>
                  <span className={`wordmark-kana ${page.rowTitle}`}>{s.name}</span>
                  <span className={page.rowSub}>{s.lead}</span>
                </span>
                <Icon name="arrow" size={18} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
