import Link from "next/link";
import styles from "./brand.module.css";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link className={styles.brand} href={href}>
      <span className={styles.mark} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 15.5 8.5 9l3 4 4.5-8"
            stroke="#60a5fa"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="5" r="2.2" fill="#3b82f6" />
        </svg>
      </span>
      <span className={styles.text}>
        Fhin<span className={styles.vest}>VEST</span>
      </span>
    </Link>
  );
}
