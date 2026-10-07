import { LandingHero } from "./landing-hero";
import { ActionCards } from "./landing-actions";
import { HowItWorks } from "./landing-how";
import styles from "./landing.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <LandingHero />
      <ActionCards />
      <HowItWorks />
      <footer className={styles.footer}>
        <p className={styles.footerBody}>
          Alat bantu riset &amp; informasi, bukan nasihat keuangan. Bukan rekomendasi jual/beli. Data dari
          Sectors Financial API.
        </p>
        <span className={styles.footerTag}>#WhereBuildersBuild</span>
      </footer>
    </main>
  );
}
