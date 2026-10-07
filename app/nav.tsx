"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChartLineUp, ChatCircleDots, House } from "@phosphor-icons/react";
import { Brand } from "./brand";
import styles from "./nav.module.css";

const LINKS = [
  { href: "/", label: "Beranda", Icon: House },
  { href: "/screen", label: "Screener", Icon: ChartLineUp },
  { href: "/chat", label: "Chat", Icon: ChatCircleDots },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname();

  // Chat runs fullscreen with its own controls.
  if (pathname === "/chat") return null;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Brand />

        <span className={styles.live}>
          <span className={`${styles.liveDot} breathe`} aria-hidden="true" />
          live · Sectors
        </span>

        <nav className={styles.links} aria-label="Navigasi utama">
          {LINKS.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} className={styles.link} href={href} data-active={active}>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className={styles.pill}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
                <Icon size={16} weight={active ? "fill" : "regular"} className={styles.icon} />
                <span className={styles.label}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <nav className={styles.mobile} aria-label="Navigasi utama">
        {LINKS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} className={styles.mobileLink} href={href} data-active={active}>
              <Icon size={17} weight={active ? "fill" : "regular"} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
