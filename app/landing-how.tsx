"use client";

import { motion } from "framer-motion";
import { ChatCircleDots, GitBranch, Table } from "@phosphor-icons/react";
import styles from "./landing.module.css";

const STEPS = [
  {
    Icon: ChatCircleDots,
    step: "01",
    title: "Kamu bertanya",
    body: "Bahasa manusia, bebas. Tidak perlu tahu nama field atau endpoint.",
  },
  {
    Icon: GitBranch,
    step: "02",
    title: "Agent memilih data",
    body: "Dari 4 tool Sectors: screener, laporan emiten, top movers, atau keuangan kuartalan. Tiap tool yang jalan terlihat di layar.",
  },
  {
    Icon: Table,
    step: "03",
    title: "Jawaban dengan angka",
    body: "Disertai periode, mata uang, dan nama field Sectors yang dipakai supaya bisa kamu periksa sendiri.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className={styles.how} aria-label="Cara kerja">
      <h2 className={styles.howTitle}>Cara kerja</h2>
      <div className={styles.howGrid}>
        {STEPS.map(({ Icon, step, title, body }, i) => (
          <motion.article
            key={step}
            className={styles.step}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ type: "spring", stiffness: 110, damping: 20, delay: i * 0.06 }}
          >
            <span className={styles.stepIcon}>
              <Icon size={19} weight="duotone" />
            </span>
            <span className={styles.stepNum}>{step}</span>
            <h3 className={styles.stepTitle}>{title}</h3>
            <p className={styles.stepBody}>{body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
