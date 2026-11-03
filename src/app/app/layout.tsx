import { BottomNav } from "@/components/BottomNav";
import { CountOpen } from "@/components/CountOpen";
import { Logo } from "@/components/Logo";
import { SyncOnce } from "@/components/SyncOnce";
import { WordHost } from "@/components/WordSheet";
import { ja } from "@/lib/i18n/ja";
import styles from "./app.module.css";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className={styles.shell}>
      <WordHost>
        <main className={styles.main}>{children}</main>
      </WordHost>
      <BottomNav labels={ja.nav} brand={<Logo size="sm" href="/" />} />
      <SyncOnce />
      <CountOpen />
    </div>
  );
}
