import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { createLedger, getSubsectors, sectorsGet, SectorsError } from "@/lib/sectors";
import { idr, num } from "@/lib/format";
import { EmptyState, InlineError, Meter } from "@/app/ui";
import { ScreenForm } from "./screen-form";
import styles from "./page.module.css";

type Row = {
  symbol: string;
  company_name: string;
  query_values?: { market_cap?: number; pe_ttm?: number; roe_ttm?: number; sub_sector?: string };
};
type ScreenResponse = {
  results?: Row[];
  pagination?: { total_count?: number; showing?: number };
};

export const dynamic = "force-dynamic";

const LIMIT = 10;

function buildWhere(sp: Record<string, string | undefined>): string {
  const parts: string[] = [];
  if (sp.sub_sector) parts.push(`sub_sector = '${sp.sub_sector.replace(/'/g, "")}'`);
  const minRoe = Number(sp.min_roe);
  if (sp.min_roe && Number.isFinite(minRoe)) parts.push(`roe_ttm > ${minRoe / 100}`);
  const maxPe = Number(sp.max_pe);
  if (sp.max_pe && Number.isFinite(maxPe)) parts.push(`pe_ttm < ${maxPe}`);
  const minMcap = Number(sp.min_mcap);
  if (sp.min_mcap && Number.isFinite(minMcap)) parts.push(`market_cap > ${minMcap * 1e9}`);
  // Sectors only echoes fields used in the filter/sort via query_values. These two
  // conditions are trivially true for listed equities but make market_cap and
  // pe_ttm come back so the table can show them.
  parts.push("market_cap > 0", "pe_ttm > -1");
  return parts.join(" and ");
}

export default async function ScreenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const sp: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) sp[k] = Array.isArray(v) ? v[0] : v;

  const ledger = createLedger();
  const subsectors = await getSubsectors(ledger).catch(() => []);

  const where = buildWhere(sp);
  const sort = sp.sort || "-market_cap";
  const hasQuery = Object.keys(raw).length > 0;

  let rows: Row[] = [];
  let total = 0;
  let error: string | null = null;
  let spent = 0;

  if (hasQuery) {
    try {
      const data = await sectorsGet<ScreenResponse>(
        "/companies/",
        { where: where || undefined, order_by: sort, limit: LIMIT, include_query_values: "true" },
        ledger,
      );
      rows = data.results ?? [];
      total = data.pagination?.total_count ?? rows.length;
    } catch (err) {
      error = err instanceof SectorsError ? err.message : "Gagal mengambil data dari Sectors.";
    }
  }
  spent = ledger.total;

  return (
    <main className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>Screener</h1>
        <p className={styles.subtitle}>
          Saring emiten IDX dengan angka. Angka dari Sectors; biaya kredit ditampilkan setelah tiap pencarian.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.side}>
          <ScreenForm
            subsectors={subsectors}
            initial={{
              sub_sector: sp.sub_sector ?? "",
              min_roe: sp.min_roe ?? "",
              max_pe: sp.max_pe ?? "",
              min_mcap: sp.min_mcap ?? "",
              sort,
            }}
          />
          <p className={styles.credit}>Kredit terpakai pencarian ini: {spent}</p>
        </div>

        <section className={styles.results} aria-label="Hasil screener">
          {!hasQuery && <p className={styles.empty}>Atur filter lalu tekan Cari.</p>}

          {error && <InlineError message={error} />}

          {hasQuery && !error && rows.length === 0 && (
            <EmptyState
              icon={MagnifyingGlass}
              title="Tidak ada emiten yang cocok"
              body="Longgarkan salah satu filter: turunkan ROE minimum, naikkan PE maksimum, atau kecilkan market cap minimum."
            />
          )}

          {rows.length > 0 && (
            <>
              <div className={styles.meta}>
                Menampilkan {rows.length} dari {total}
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Kode</th>
                    <th scope="col">Nama</th>
                    <th scope="col">Sub-sektor</th>
                    <th scope="col" className={styles.r}>
                      Market cap
                    </th>
                    <th scope="col" className={styles.r}>
                      PE
                    </th>
                    <th scope="col" className={styles.r}>
                      ROE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const q = r.query_values ?? {};
                    return (
                      <tr key={r.symbol} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                        <td>
                          <Link className={styles.sym} href={`/company/${r.symbol.replace(/\.JK$/i, "")}`}>
                            {r.symbol.replace(/\.JK$/i, "")}
                          </Link>
                        </td>
                        <td className={styles.name}>{r.company_name}</td>
                        <td className={styles.muted}>{q.sub_sector ?? sp.sub_sector ?? "n/a"}</td>
                        <td className={styles.r}>{idr(q.market_cap)}</td>
                        <td className={styles.r}>{num(q.pe_ttm)}</td>
                        <td className={styles.r}>
                          <Meter value={q.roe_ttm} tone="up" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
