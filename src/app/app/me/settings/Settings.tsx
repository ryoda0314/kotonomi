"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { usePref, useText } from "@/components/local";
import page from "@/components/page.module.css";
import { EXAM_CHOICES, FRESH_CHOICES, LEVEL_CHOICES, useExam, useFresh, useFrom, useLayout } from "@/components/prefs";
import { useVoices } from "@/components/sound";
import { Speak } from "@/components/Speak";
import { SEND_USAGE } from "@/components/usage";
import type { Level } from "@/content/types";
import { ja } from "@/lib/i18n/ja";
import { LAYOUTS } from "@/lib/keys";
import { isMet } from "@/lib/record";
import { useRecord } from "@/lib/store";
import { account, resetRecord, signOut, supabase, type Account } from "@/lib/sync";
import styles from "./settings.module.css";

const t = ja.settings;
const SAMPLE = "The meeting has been postponed until Friday.";
const never = () => () => undefined;

/** 記録と設定: which words, how to type, how to hear, the ことのあめ account, the record and whether its use is counted. */
export function Settings() {
  const state = useRecord();
  const [sendUsage, setSendUsage] = usePref(SEND_USAGE, true);
  const [sound, setSound] = usePref("sound", true);
  const [slow, setSlow] = usePref("slow", false);
  const [voice, setVoice] = useText("voice");
  const voices = useVoices();
  const [guide, setGuide] = usePref("guide", true);
  const [lines, setLines] = usePref("lines", true);
  const [layout, setLayout] = useLayout();
  const [exam, setExam] = useExam();
  const [from, setFrom] = useFrom();
  const [fresh, setFresh] = useFresh();
  const [me, setMe] = useState<Account | null | undefined>(undefined);
  const [done, setDone] = useState(false);
  const canLink = useSyncExternalStore(never, () => !!supabase(), () => false);
  useEffect(() => {
    void account().then(setMe);
  }, []);

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/me" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>{t.title}</h1>
      </header>

      <section className={page.section}>
        <h2 className={page.h2}>{t.words}</h2>
        <div className={styles.toggle}>
          <span className={styles.toggleTitle}>{t.exam}</span>
          <span className={page.choices} role="group" aria-label={t.exam}>
            {EXAM_CHOICES.map((e) => (
              <button key={e} type="button" className="btn-quiet" aria-pressed={exam === e} onClick={() => setExam(e)}>
                {ja.exams[e]}
              </button>
            ))}
          </span>
        </div>
        <div className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.from}</span>
            <span className={page.note}>{ja.levelLeads[exam][Number(from) as Level]}</span>
          </span>
          <span className={page.choices} role="group" aria-label={t.from}>
            {LEVEL_CHOICES.map((l) => (
              <button key={l} type="button" className="btn-quiet" aria-pressed={from === l} onClick={() => setFrom(l)}>
                {ja.levels[Number(l) as Level]}
              </button>
            ))}
          </span>
        </div>
        <div className={styles.toggle}>
          <span className={styles.toggleTitle}>{t.fresh}</span>
          <span className={page.choices} role="group" aria-label={t.fresh}>
            {FRESH_CHOICES.map((n) => (
              <button key={n} type="button" className="btn-quiet" aria-pressed={fresh === n} onClick={() => setFresh(n)}>
                {t.freshN(Number(n))}
              </button>
            ))}
          </span>
        </div>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.typing}</h2>
        <label className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.guide}</span>
            <span className={page.note}>{t.guideLead}</span>
          </span>
          <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} />
        </label>
        <label className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.lines}</span>
            <span className={page.note}>{t.linesLead}</span>
          </span>
          <input type="checkbox" checked={lines} onChange={(e) => setLines(e.target.checked)} />
        </label>
        <div className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.layout}</span>
            <span className={page.note}>{t.layoutLead}</span>
          </span>
          <span className={page.choices} role="group" aria-label={t.layout}>
            {LAYOUTS.map((l) => (
              <button key={l} type="button" className="btn-quiet" aria-pressed={layout === l} onClick={() => setLayout(l)}>
                {ja.layouts[l]}
              </button>
            ))}
          </span>
        </div>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.listen}</h2>
        <label className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{ja.common.sound}</span>
            <span className={page.note}>{t.soundLead}</span>
          </span>
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
        </label>
        <label className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.slow}</span>
            <span className={page.note}>{t.slowLead}</span>
          </span>
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
        </label>
        <div className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.voice}</span>
            <span className={page.note}>{voices.length ? t.voiceLead : t.noVoice}</span>
          </span>
          <span className={styles.voice}>
            <select className={styles.select} value={voice} onChange={(e) => setVoice(e.target.value)} disabled={!voices.length} aria-label={t.voice}>
              <option value="">{t.voiceAuto}</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.name}>
                  {v.name}（{v.lang}）
                </option>
              ))}
            </select>
            <Speak text={SAMPLE} label={ja.common.hear} id="settings:voice" size="sm" />
          </span>
        </div>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.account}</h2>
        {me ? (
          <>
            <p className={styles.text}>{t.linked(me.email ?? "")}</p>
            <p className={page.note}>{t.linkedLead}</p>
            <div className={page.actions}>
              <button
                type="button"
                className="btn-quiet"
                onClick={async () => {
                  await signOut();
                  setMe(null);
                }}
              >
                {t.unlink}
              </button>
            </div>
          </>
        ) : me === null && canLink ? (
          <>
            <p className={page.note}>{t.linkLead}</p>
            <div className={page.actions}>
              <Link href="/login?next=/app/me/settings" className="btn">
                {t.link}
              </Link>
            </div>
          </>
        ) : me === null ? (
          <p className={page.note}>{t.unavailable}</p>
        ) : null}
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.record}</h2>
        {state ? <p className={page.note}>{t.size(Object.values(state.words).filter(isMet).length)}</p> : null}
        <div className={page.actions}>
          <button
            type="button"
            className="btn-quiet"
            onClick={async () => {
              if (!window.confirm(me ? t.resetLinkedConfirm : t.resetConfirm)) return;
              await resetRecord();
              setDone(true);
            }}
          >
            {me ? t.resetLinked : t.reset}
          </button>
        </div>
        {done ? <p className={page.note}>{t.done}</p> : null}
        <label className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.usage}</span>
            <span className={page.note}>{t.usageLead}</span>
          </span>
          <input type="checkbox" checked={sendUsage} onChange={(e) => setSendUsage(e.target.checked)} />
        </label>
      </section>
    </div>
  );
}
