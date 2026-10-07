const BASE = "https://api.sectors.app/v2";

export type CreditLedger = { total: number; calls: Array<{ endpoint: string; credits: number; status: number }> };

function newLedger(): CreditLedger {
  return { total: 0, calls: [] };
}

// In-memory TTL cache. Process-local; fine for a single dev/read app.
const TTL_MS: Record<string, number> = {
  "/companies/": 5 * 60_000,
  "/company/report/": 30 * 60_000,
  "/companies/top-changes/": 5 * 60_000,
  "/financials/quarterly/": 60 * 60_000,
  "/subsectors/": 24 * 60 * 60_000,
};
const cache = new Map<string, { at: number; value: unknown }>();

function ttlFor(path: string): number {
  for (const key of Object.keys(TTL_MS)) if (path.startsWith(key)) return TTL_MS[key]!;
  return 5 * 60_000;
}

export class SectorsError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Credit cost rules from the v2 docs. 400/401/403/429/5xx are free; 404 is billed.
export function creditCost(endpoint: string, status: number, params: URLSearchParams): number {
  if (status === 400 || status === 401 || status === 403 || status === 429 || status >= 500) return 0;
  if (status === 404) return 1;
  if (endpoint === "/companies/") return params.has("q") ? 3 : 1;
  if (endpoint.startsWith("/company/report/")) {
    const sections = params.get("sections");
    return sections ? sections.split(",").filter(Boolean).length : 8;
  }
  if (endpoint === "/companies/top-changes/") {
    const periods = (params.get("periods") ?? "1d,7d,14d,30d,365d").split(",").filter(Boolean).length;
    const classes = (params.get("classifications") ?? "top_gainers,top_losers").split(",").filter(Boolean).length;
    return periods * classes;
  }
  if (endpoint.startsWith("/financials/quarterly/")) {
    const n = Number(params.get("n_quarters") ?? 0);
    return n > 0 ? n : 1;
  }
  return 1;
}

export async function sectorsGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  ledger: CreditLedger,
  cacheIgnore: string[] = [],
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) qs.set(k, String(v));
  const query = qs.toString();
  const url = `${BASE}${path}${query ? `?${query}` : ""}`;

  // Cache key ignores parameter order and any params named in cacheIgnore (e.g. a
  // window size that callers vary while the underlying data is identical).
  const ignore = new Set(cacheIgnore);
  const cacheKey = `${path}?${[...qs.entries()]
    .filter(([k]) => !ignore.has(k))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&")}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < ttlFor(path)) {
    // Cache hit: no network call, no credits.
    return hit.value as T;
  }

  const key = process.env.SECTORS_API_KEY;
  if (!key) throw new SectorsError(0, "SECTORS_API_KEY is not set");

  const res = await fetch(url, { headers: { Authorization: key }, cache: "no-store" });
  ledger.total += creditCost(path, res.status, qs);
  ledger.calls.push({ endpoint: path, credits: creditCost(path, res.status, qs), status: res.status });

  const text = await res.text();
  if (!res.ok) throw new SectorsError(res.status, `Sectors ${res.status}: ${text.slice(0, 500)}`);

  const value = JSON.parse(text) as T;
  cache.set(cacheKey, { at: Date.now(), value });
  return value;
}

export function createLedger(): CreditLedger {
  return newLedger();
}

export type Subsector = { sector: string; subsector: string };

// Cached reference list for the screener dropdown.
export async function getSubsectors(ledger: CreditLedger): Promise<Subsector[]> {
  return sectorsGet<Subsector[]>("/subsectors/", {}, ledger);
}

