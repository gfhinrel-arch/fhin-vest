"use client";

import { motion } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";
import styles from "./ui.module.css";

type Tone = "accent" | "up" | "down" | "neutral" | "amber";

export function StatusChip({ tone = "neutral", label, live = false }: { tone?: Tone; label: string; live?: boolean }) {
  return (
    <span className={styles.chip} data-tone={tone}>
      {live && <span className={`${styles.chipDot} breathe`} aria-hidden="true" />}
      {label}
    </span>
  );
}

export function Skeleton({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return <span className="shimmer" style={{ display: "block", width, height }} aria-hidden="true" />;
}

export function Meter({ value, tone = "accent" }: { value: number | null | undefined; tone?: Tone }) {
  if (value === null || value === undefined || !Number.isFinite(value)) return <span className={styles.meterNa}>n/a</span>;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <span className={styles.meterWrap}>
      <span className={styles.meterTrack}>
        <motion.span
          className={styles.meterFill}
          data-tone={tone}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: clamped }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </span>
      <span className={styles.meterValue}>{(clamped * 100).toFixed(1)}%</span>
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon?: Icon;
  title: string;
  body?: string;
}) {
  return (
    <motion.div
      className={styles.empty}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 24 }}
    >
      {Icon && <Icon size={26} weight="duotone" className={styles.emptyIcon} />}
      <h3 className={styles.emptyTitle}>{title}</h3>
      {body && <p className={styles.emptyBody}>{body}</p>}
    </motion.div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <motion.div
      className={styles.inlineError}
      role="alert"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      <span className={styles.errorDot} aria-hidden="true" />
      <p className={styles.errorText}>{message}</p>
    </motion.div>
  );
}
