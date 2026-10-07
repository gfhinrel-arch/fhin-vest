import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.page}>
      <div className={`${styles.title} shimmer`} aria-hidden="true" />
      <div className={styles.layout}>
        <div className={`${styles.side} shimmer`} aria-hidden="true" />
        <div className={styles.rows}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 44, animationDelay: `${i * 60}ms` }} aria-hidden="true" />
          ))}
        </div>
      </div>
    </main>
  );
}
