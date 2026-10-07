"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChartLineUp, ChatCircleDots, ArrowRight } from "@phosphor-icons/react";
import styles from "./landing.module.css";

const CARDS = [
  {
    href: "/chat",
    Icon: ChatCircleDots,
    title: "Tanya AI",
    body: "Ajukan pertanyaan bebas. Agent memilih data dari Sectors dan menjawab dengan angka.",
    cta: "Mulai tanya",
    primary: true,
  },
  {
    href: "/screen",
    Icon: ChartLineUp,
    title: "Cek saham",
    body: "Saring emiten dengan filter angka: sub-sektor, ROE, PE, dan market cap.",
    cta: "Buka screener",
    primary: false,
  },
] as const;

export function ActionCards() {
  return (
    <section className={styles.actions} aria-label="Pilih cara mulai">
      {CARDS.map(({ href, Icon, title, body, cta, primary }, i) => (
        <motion.div
          key={href}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.18 + i * 0.08 }}
        >
          <Link className={styles.card} href={href} data-primary={primary}>
            <span className={styles.cardIcon}>
              <Icon size={22} weight="duotone" />
            </span>
            <h2 className={styles.cardTitle}>{title}</h2>
            <p className={styles.cardBody}>{body}</p>
            <span className={styles.cardCta}>
              {cta}
              <ArrowRight size={15} weight="bold" className={styles.cardArrow} />
            </span>
          </Link>
        </motion.div>
      ))}
    </section>
  );
}
