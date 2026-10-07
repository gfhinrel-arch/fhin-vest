"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlass } from "@phosphor-icons/react";
import styles from "./screen-form.module.css";

type Props = {
  subsectors: { sector: string; subsector: string }[];
  initial: { sub_sector: string; min_roe: string; max_pe: string; min_mcap: string; sort: string };
};

const SORTS = [
  { value: "-market_cap", label: "Market cap (besar ke kecil)" },
  { value: "-roe_ttm", label: "ROE (tinggi ke rendah)" },
  { value: "pe_ttm", label: "PE (rendah ke tinggi)" },
  { value: "-yield_ttm", label: "Dividend yield (tinggi ke rendah)" },
];

export function ScreenForm({ subsectors, initial }: Props) {
  const router = useRouter();
  const [sub, setSub] = useState(initial.sub_sector);
  const [minRoe, setMinRoe] = useState(initial.min_roe);
  const [maxPe, setMaxPe] = useState(initial.max_pe);
  const [minMcap, setMinMcap] = useState(initial.min_mcap);
  const [sort, setSort] = useState(initial.sort);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (sub) qs.set("sub_sector", sub);
    if (minRoe.trim()) qs.set("min_roe", minRoe.trim());
    if (maxPe.trim()) qs.set("max_pe", maxPe.trim());
    if (minMcap.trim()) qs.set("min_mcap", minMcap.trim());
    qs.set("sort", sort);
    router.push(`/screen?${qs.toString()}`);
  }

  return (
    <motion.form
      className={styles.form}
      onSubmit={submit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor="sub_sector">
          Sub-sektor
        </label>
        <select id="sub_sector" className={styles.control} value={sub} onChange={(e) => setSub(e.target.value)}>
          <option value="">Semua sub-sektor</option>
          {subsectors.map((s) => (
            <option key={`${s.sector}/${s.subsector}`} value={s.subsector}>
              {s.subsector}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="min_roe">
            ROE min (%)
          </label>
          <input
            id="min_roe"
            className={styles.control}
            inputMode="decimal"
            value={minRoe}
            onChange={(e) => setMinRoe(e.target.value)}
            placeholder="15"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="max_pe">
            PE maks
          </label>
          <input
            id="max_pe"
            className={styles.control}
            inputMode="decimal"
            value={maxPe}
            onChange={(e) => setMaxPe(e.target.value)}
            placeholder="20"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="min_mcap">
          Market cap minimum (miliar Rp)
        </label>
        <input
          id="min_mcap"
          className={styles.control}
          inputMode="numeric"
          value={minMcap}
          onChange={(e) => setMinMcap(e.target.value)}
          placeholder="5000"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="sort">
          Urutkan
        </label>
        <select id="sort" className={styles.control} value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <motion.button type="submit" className={styles.submit} whileTap={{ scale: 0.97 }}>
        <MagnifyingGlass size={15} weight="bold" />
        Cari
      </motion.button>
    </motion.form>
  );
}
