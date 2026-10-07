"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ChartLineUp, PaperPlaneRight, Robot, Sparkle, User, X } from "@phosphor-icons/react";
import { Brand } from "@/app/brand";
import { ToolChip, type ToolStatus } from "@/app/tool-chip";
import { InlineError, StatusChip } from "@/app/ui";
import styles from "./page.module.css";

type ToolRun = { name: string; args: unknown; status: ToolStatus; credits?: number };
type Turn = { role: "user" | "assistant"; text: string; tools: ToolRun[]; credits?: number };
type AgentEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; args: unknown }
  | { type: "tool_result"; name: string; credits: number; result: unknown }
  | { type: "done"; credits: { total: number } }
  | { type: "error"; message: string };

const EXAMPLES = [
  "Bank apa yang ROE-nya di atas 15%?",
  "Bagaimana tren laba BBCA 8 kuartal terakhir?",
  "Saham apa yang paling turun minggu ini?",
  "Berapa market cap TLKM sekarang?",
];

export default function Page() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;

    const history = [
      ...turns.map((t) => ({ role: t.role, content: t.text })),
      { role: "user" as const, content: q },
    ];

    setInput("");
    setError(null);
    setBusy(true);
    setTurns((prev) => [...prev, { role: "user", text: q, tools: [] }, { role: "assistant", text: "", tools: [] }]);

    const controller = new AbortController();
    abortRef.current = controller;

    const patchLast = (fn: (t: Turn) => Turn) =>
      setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? fn(t) : t)));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          let event: AgentEvent;
          try {
            event = JSON.parse(line) as AgentEvent;
          } catch {
            continue;
          }
          apply(event);
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setError("Dibatalkan.");
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }

    function apply(event: AgentEvent) {
      if (event.type === "text") {
        patchLast((t) => ({ ...t, text: t.text + event.text }));
      } else if (event.type === "tool") {
        patchLast((t) => ({
          ...t,
          tools: [...t.tools, { name: event.name, args: event.args, status: "running" }],
        }));
      } else if (event.type === "tool_result") {
        patchLast((t) => {
          const tools = [...t.tools];
          for (let i = tools.length - 1; i >= 0; i--) {
            const cur = tools[i]!;
            if (cur.name === event.name && cur.status === "running") {
              tools[i] = { ...cur, status: "done", credits: event.credits };
              break;
            }
          }
          return { ...t, tools };
        });
      } else if (event.type === "done") {
        patchLast((t) => ({ ...t, credits: event.credits.total }));
      } else if (event.type === "error") {
        patchLast((t) => {
          const tools = t.tools.map((x) => (x.status === "running" ? { ...x, status: "error" as const } : x));
          return { ...t, tools, text: t.text || `Gagal: ${event.message}` };
        });
      }
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Brand />
        <span className={styles.topHint}>
          <span className={`${styles.topDot} breathe`} aria-hidden="true" />
          chat
        </span>
        <Link className={styles.topLink} href="/screen">
          <ChartLineUp size={15} weight="bold" />
          Screener
        </Link>
      </header>

      <section className={styles.log} aria-live="polite" aria-label="Percakapan">
        <AnimatePresence initial={false}>
          {turns.length === 0 && !busy && (
            <motion.div
              key="empty"
              className={styles.empty}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
            >
              <p className={styles.emptyTitle}>
                <Sparkle size={15} weight="fill" className={styles.spark} />
                Tanya dalam bahasa manusia.
              </p>
              <p className={styles.emptyHint}>Agent memilih tool Sectors lalu menjawab dengan angka.</p>
              <ul className={styles.examples}>
                {EXAMPLES.map((ex, i) => (
                  <motion.li
                    key={ex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i, type: "spring", stiffness: 200, damping: 24 }}
                  >
                    <button type="button" className={styles.example} onClick={() => setInput(ex)}>
                      <ArrowUp size={13} weight="bold" className={styles.exampleIcon} />
                      {ex}
                    </button>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {turns.map((turn, i) => (
          <motion.article
            key={i}
            className={turn.role === "user" ? styles.userRow : styles.botRow}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
          >
            <span className={styles.avatar} data-role={turn.role} aria-hidden="true">
              {turn.role === "user" ? <User size={15} weight="fill" /> : <Robot size={15} weight="fill" />}
            </span>

            <div className={styles.bubbleCol}>
              <div className={styles.turnRole}>
                {turn.role === "user" ? "Kamu" : "Agent"}
                {turn.role === "assistant" && turn.credits !== undefined && (
                  <StatusChip tone="accent" label={`${turn.credits} kredit`} />
                )}
              </div>

              {turn.tools.length > 0 && (
                <ul className={styles.tools} aria-label="Tool yang dipakai">
                  {turn.tools.map((tool, j) => (
                    <ToolChip key={j} name={tool.name} status={tool.status} credits={tool.credits} index={j} />
                  ))}
                </ul>
              )}

              {turn.text && (
                <div className={styles.body}>
                  {turn.text}
                  {turn.role === "assistant" && busy && i === turns.length - 1 && (
                    <span className={styles.caret} aria-hidden="true" />
                  )}
                </div>
              )}

              {turn.role === "assistant" && turn.text === "" && busy && i === turns.length - 1 && (
                <div className={styles.working} aria-label="Agent bekerja">
                  <span className={styles.pulse} />
                  <span className={styles.pulse} />
                  <span className={styles.pulse} />
                </div>
              )}
            </div>
          </motion.article>
        ))}
        <div ref={endRef} />
      </section>

      <AnimatePresence>
        {error && (
          <motion.div
            className={styles.errorWrap}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <InlineError message={error} />
          </motion.div>
        )}
      </AnimatePresence>

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pertanyaan tentang saham IDX..."
          aria-label="Pertanyaan"
          disabled={busy}
        />
        {busy ? (
          <motion.button
            type="button"
            className={styles.cancel}
            onClick={() => abortRef.current?.abort()}
            whileTap={{ scale: 0.97 }}
          >
            <X size={15} weight="bold" />
            Batal
          </motion.button>
        ) : (
          <motion.button
            type="submit"
            className={styles.submit}
            disabled={!input.trim()}
            whileTap={{ scale: 0.97 }}
          >
            Kirim
            <PaperPlaneRight size={15} weight="fill" />
          </motion.button>
        )}
      </form>

      <footer className={styles.footer}>
        Alat bantu riset &amp; informasi, bukan nasihat keuangan. Bukan rekomendasi jual/beli. Data dari Sectors.
      </footer>
    </main>
  );
}
