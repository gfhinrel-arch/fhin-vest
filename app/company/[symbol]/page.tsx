import Link from "next/link";
import { notFound } from "next/navigation";
import { createLedger, sectorsGet, SectorsError } from "@/lib/sectors";
import { runAgent } from "@/lib/agent";
import { idr, num, pct } from "@/lib/format";
import { Meter } from "@/app/ui";
import styles from "./page.module.css";

type HistoricalRatio = {
  year: string;
  profitability?: { roe?: number; roa?: number; net_profit_margin?: number };
  leverage?: { debt_to_equity_ratio?: number };
};
type HistoricalValuation = { year: number; pe?: number; pb?: number };
type Report = {
  symbol: string;
  company_name: string;
  overview?: {
    sector?: string;
    sub_sector?: string;
    market_cap?: number;
    last_close_price?: number;
    latest_close_date?: string;
    daily_close_change?: number;
  };
  valuation?: { forward_pe?: number; historical_valuation?: HistoricalValuation[] };
  financials?: { historical_financial_ratio?: HistoricalRatio[] };
};
type Quarter = {
  date: string;
  revenue?: number;
  earnings?: number;
  total_equity?: number;
};

export const dynamic = "force-dynamic";

function yearValue<T>(items: { year: string | number; value: T }[] | undefined): { year: string | number; value: T } | null {
  if (!items || items.length === 0) return null;
  return items[items.length - 1] ?? null;
}

async function whyParagraph(symbol: string): Promise<string> {
  const question = `Jelaskan singkat dalam bahasa manusia kenapa rasio emiten ${symbol} seperti ini. Fokus pada ROE, PE, dan DER dari data yang kamu ambil. Maksimal dua paragraf. Jangan sebut harga sebagai rekomendasi.`;
  let text = "";
  for await (const ev of runAgent([{ role: "user", content: question }])) {
    if (ev.type === "text") text += ev.text;
    if (ev.type === "error") return "";
  }
  return text.trim();
}

async function fetchReport(symbol: string): Promise<Report | null> {
  const ledger = createLedger();
  try {
    return await sectorsGet<Report>(`/company/report/${symbol}/`, {
      sections: "overview,valuation,financials",
    }, ledger);
  } catch (err) {
    if (err instanceof SectorsError && err.status === 404) return null;
    throw err;
  }
}

export default async function CompanyPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();

  const report = await fetchReport(symbol);
  if (!report) notFound();

  const ledger = createLedger();
  let quarters: Quarter[] = [];
  try {
    quarters = (await sectorsGet<Quarter[]>(`/financials/quarterly/${symbol}/`, { n_quarters: 4 }, ledger)).slice(0, 4);
  } catch {
    quarters = [];
  }

  const why = await whyParagraph(symbol).catch(() => "");

  const ov = report.overview ?? {};
  const ratios = report.financials?.historical_financial_ratio;
  const roe = yearValue(ratios?.map((r) => ({ year: r.year, value: r.profitability?.roe })));
  const der = yearValue(ratios?.map((r) => ({ year: r.year, value: r.leverage?.debt_to_equity_ratio })));
  const pv = yearValue(report.valuation?.historical_valuation?.map((v) => ({ year: v.year, value: v.pe })));
  const pbv = yearValue(report.valuation?.historical_valuation?.map((v) => ({ year: v.year, value: v.pb })));

  const closeDate = ov.latest_close_date ?? "";

  return (
    <main className={styles.page}>
      <p className={styles.crumb}>
        <Link className={styles.crumbLink} href="/screen">
          Screener
        </Link>{" "}
        / {symbol.replace(/\.JK$/i, "")}
      </p>

      <header className={styles.header}>
        <h1 className={styles.title}>{report.company_name}</h1>
        <p className={styles.code}>
          {report.symbol} · {ov.sub_sector ?? ov.sector ?? "n/a"}
        </p>
      </header>

      <section className={styles.cards} aria-label="Ringkasan">
        <div className={styles.card}>
          <div className={styles.cardLabel}>Harga terakhir</div>
          <div className={styles.cardValue}>{idr(ov.last_close_price)}</div>
          <div className={styles.cardMeta}>{closeDate ? `per ${closeDate}` : "tanggal tidak tersedia"}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Market cap</div>
          <div className={styles.cardValue}>{idr(ov.market_cap)}</div>
          <div className={styles.cardMeta}>IDR</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>PE TTM</div>
          <div className={styles.cardValue}>{num(report.valuation?.forward_pe)}</div>
          <div className={styles.cardMeta}>forward PE, estimasi tahun berikutnya</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>PB MRQ</div>
          <div className={styles.cardValue}>{pbv ? num(pbv.value) : "n/a"}</div>
          <div className={styles.cardMeta}>{pbv ? `FY${pbv.year}` : "tidak tersedia"}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>ROE TTM</div>
          <div className={styles.cardValue}>{roe ? pct(roe.value) : "n/a"}</div>
          <div className={styles.cardBar}>
            <Meter value={roe?.value} tone="up" />
          </div>
          <div className={styles.cardMeta}>{roe ? `FY${roe.year}` : "tidak tersedia"}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>DER</div>
          <div className={styles.cardValue}>{der ? num(der.value) : "n/a"}</div>
          <div className={styles.cardMeta}>{der ? `FY${der.year}` : "tidak tersedia"}</div>
        </div>
      </section>

      <section className={styles.section} aria-label="Rasio kuartalan">
        <h2 className={styles.h2}>Laporan kuartalan terakhir</h2>
        {quarters.length === 0 ? (
          <p className={styles.empty}>Data kuartalan tidak tersedia.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Periode</th>
                <th scope="col" className={styles.r}>
                  Revenue (IDR)
                </th>
                <th scope="col" className={styles.r}>
                  Laba (IDR)
                </th>
                <th scope="col" className={styles.r}>
                  Total ekuitas (IDR)
                </th>
                <th scope="col" className={styles.r}>
                  Margin laba
                </th>
              </tr>
            </thead>
            <tbody>
              {quarters.map((q, i) => {
                const margin = q.revenue && q.earnings !== undefined ? q.earnings / q.revenue : undefined;
                return (
                  <tr key={q.date} style={{ animationDelay: `${i * 60}ms` }}>
                    <td>{q.date}</td>
                    <td className={styles.r}>{idr(q.revenue)}</td>
                    <td className={styles.r}>{idr(q.earnings)}</td>
                    <td className={styles.r}>{idr(q.total_equity)}</td>
                    <td className={styles.r}>{pct(margin)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className={styles.note}>
          Rasio per kuartal (ROE/PE) tidak disediakan Sectors per kuartal; margin dihitung dari laba dibagi revenue.
        </p>
      </section>

      <section className={styles.section} aria-label="Kenapa angka ini">
        <h2 className={styles.h2}>Kenapa angka ini</h2>
        {why ? (
          <div className={styles.prose}>{why}</div>
        ) : (
          <p className={styles.empty}>Penjelasan tidak tersedia saat ini (model LLM tidak merespons).</p>
        )}
      </section>

      <footer className={styles.footer}>
        Alat bantu riset &amp; informasi, bukan nasihat keuangan. Bukan rekomendasi jual/beli. Data dari Sectors.
      </footer>
    </main>
  );
}
