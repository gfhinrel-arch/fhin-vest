import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Emiten tidak ditemukan</h1>
      <p className={styles.body}>
        Kode yang kamu minta tidak ada di data Sectors. Periksa kodenya, atau lihat daftar lewat screener.
      </p>
      <Link className={styles.link} href="/screen">
        Buka screener
      </Link>
    </main>
  );
}
