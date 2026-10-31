import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ja } from "@/lib/i18n/ja";
import styles from "./page.module.css";

const t = ja.intro;

/** The first screen, static: how it goes (see and type, type it in its sentence, recall it later) and the way in. */
export default function Home() {
  const { en, typed, ja: meaning, finger } = t.sample;
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo size="lg" href={null} />
      </header>
      <section className={styles.hero}>
        <h1 className={styles.lead}>{t.lead}</h1>
        <figure className={styles.figure} aria-label={`${en} ${meaning}`}>
          <p className={styles.meaning}>{meaning}</p>
          <p className={styles.word} lang="en" aria-hidden="true">
            <span className={styles.typed}>{en.slice(0, typed)}</span>
            <span className={styles.now}>{en[typed]}</span>
            <span className={styles.rest}>{en.slice(typed + 1)}</span>
          </p>
          <p className={styles.finger}>{finger}</p>
        </figure>
        {t.body.map((p) => (
          <p key={p} className={styles.body}>
            {p}
          </p>
        ))}
        <Link href="/app" className={`btn ${styles.start}`}>
          {t.start}
        </Link>
        <p className={styles.note}>{t.note}</p>
      </section>
    </div>
  );
}
