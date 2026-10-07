"use client";

import { motion } from "framer-motion";
import { SealCheck } from "@phosphor-icons/react";
import styles from "./landing.module.css";

export function LandingHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroLeft}>
        <motion.p
          className={styles.eyebrow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <SealCheck size={14} weight="fill" className={styles.eyebrowIcon} />
          data IDX · satu sumber · bisa diverifikasi
        </motion.p>
        <motion.h1
          className={styles.h1}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        >
          Tanya soal saham IDX, dapat jawaban dengan angka.
        </motion.h1>
        <motion.p
          className={styles.lead}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.06 }}
        >
          Agent menerjemahkan pertanyaan bahasa manusia menjadi query ke Sectors Financial API, memilih tool
          yang tepat, lalu menjawab dengan angka serta nama field yang dipakai. Bukan asisten yang mengarang.
        </motion.p>
      </div>

      <motion.aside
        className={styles.heroPanel}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.12 }}
      >
        <p className={styles.panelLabel}>contoh jawaban</p>
        <p className={styles.panelQ}>Bank apa yang ROE-nya di atas 15%?</p>
        <div className={styles.panelTool}>
          <span className={styles.panelToolDot} />
          <code>screen_companies</code>
          <span className={styles.panelToolMeta}>where roe_ttm &gt; 0.15</span>
        </div>
        <ul className={styles.panelRows}>
          <li>
            <span>BMRI</span>
            <span className={styles.panelNum}>23,89%</span>
          </li>
          <li>
            <span>BBCA</span>
            <span className={styles.panelNum}>21,47%</span>
          </li>
          <li>
            <span>BBRI</span>
            <span className={styles.panelNum}>18,96%</span>
          </li>
        </ul>
        <p className={styles.panelFoot}>field roe_ttm · TTM, bukan per tanggal</p>
      </motion.aside>
    </section>
  );
}
