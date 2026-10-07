"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, CircleNotch, WarningCircle, Wrench } from "@phosphor-icons/react";
import styles from "./tool-chip.module.css";

export type ToolStatus = "running" | "done" | "error";

const ICON: Record<ToolStatus, typeof Wrench> = {
  running: CircleNotch,
  done: CheckCircle,
  error: WarningCircle,
};

const LABEL: Record<ToolStatus, string> = {
  running: "jalan",
  done: "selesai",
  error: "gagal",
};

// Isolated so the perpetual spinner never re-renders the chat log.
export const ToolChip = memo(function ToolChip({
  name,
  status,
  credits,
  index,
}: {
  name: string;
  status: ToolStatus;
  credits?: number;
  index: number;
}) {
  const Icon = ICON[status];

  return (
    <motion.li
      className={styles.chip}
      data-status={status}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay: index * 0.05 }}
    >
      <motion.span
        className={styles.icon}
        animate={status === "running" ? { rotate: 360 } : { rotate: 0 }}
        transition={
          status === "running"
            ? { repeat: Infinity, duration: 1, ease: "linear" }
            : { type: "spring", stiffness: 200, damping: 20 }
        }
      >
        <Icon size={14} weight={status === "done" ? "fill" : "regular"} />
      </motion.span>
      <code className={styles.name}>{name}</code>
      <span className={styles.status}>
        {LABEL[status]}
        {credits !== undefined ? ` · ${credits} kredit` : ""}
      </span>
    </motion.li>
  );
});
