import { sectorsGet, type CreditLedger } from "./sectors";

export type ToolName =
  | "screen_companies"
  | "get_company_report"
  | "get_top_movers"
  | "get_quarterly_financials";

export type ToolDef = {
  type: "function";
  function: {
    name: ToolName;
    description: string;
    parameters: Record<string, unknown>;
  };
};

// Descriptions say WHEN to use the tool, not just what it does.
export const TOOL_DEFS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "screen_companies",
      description:
        "Use this first for most questions: find which IDX companies match a numeric or categorical condition, or rank companies by a metric. Prefer `where` (structured, 1 credit) over `q` (natural language, 3 credits). Use `q` only when the condition cannot be expressed as a SQL-like expression. Returns a list of companies. Each row includes a `query_values` object holding the exact values of the fields used in the filter and sort, so quote those numbers directly when explaining why a company matched (e.g. its roe_ttm). Example where: \"roe_ttm > 0.15 and sector = 'Financials'\", order_by: \"-market_cap\".",
      parameters: {
        type: "object",
        properties: {
          where: {
            type: "string",
            description:
              "SQL-like filter. Operators: = != > >= < <= like in; combine with and/or. Fields include symbol, company_name, sector, sub_sector, industry, market_cap, last_close_price, pe_ttm, pb_mrq, roe_ttm, roa_ttm, der_mrq, yield_ttm, and yearly fields via brackets e.g. revenue[2024], roe[2024].",
          },
          order_by: {
            type: "string",
            description: "Field to sort by; prefix with - for descending, e.g. \"-market_cap\".",
          },
          q: {
            type: "string",
            description: "Natural language query. Costs 3 credits. Use only if `where` cannot express it.",
          },
          limit: { type: "integer", description: "Max rows to return. Default 10." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_company_report",
      description:
        "Use after you already know the symbol and need narrative/structured detail (valuation, financials, dividend, management, ownership, peers, overview, future). Billed per section, so request ONLY the sections you need. Prefer screen_companies when you are still choosing candidates.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "IDX ticker, e.g. BBCA or BBCA.jk." },
          sections: {
            type: "array",
            items: {
              type: "string",
              enum: ["dividend", "financials", "future", "management", "overview", "ownership", "peers", "valuation"],
            },
            description: "Sections to fetch. Omit only if you truly need all 8 (8 credits).",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_top_movers",
      description:
        "Use for market-wide or subsector momentum questions: biggest gainers and losers over recent periods. Costs 1 credit per classification × period, so omit nothing and you pay 10. Defaults are the minimum (periods [\"1d\"], classifications [\"top_gainers\"] = 1 credit). Ask for extra periods or the losers list only when the user actually wants them.",
      parameters: {
        type: "object",
        properties: {
          sub_sector: { type: "string", description: "Kebab-case slug, e.g. \"banks\". Omit for whole market." },
          periods: {
            type: "array",
            items: { type: "string", enum: ["1d", "7d", "14d", "30d", "365d"] },
            description: "Periods to fetch. Omit costs 1 credit (defaults to [\"1d\"]); each extra period adds 1 credit.",
          },
          classifications: {
            type: "array",
            items: { type: "string", enum: ["top_gainers", "top_losers"] },
            description: "Omit costs 1 credit (defaults to [\"top_gainers\"]); adding top_losers adds 1 credit per period.",
          },
          n_stock: { type: "integer", description: "Stocks per list, 1-10. Default 5." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_quarterly_financials",
      description:
        "Use for quarter-by-quarter trends of one company (revenue, earnings, assets, equity, and sector-specific metrics like net_interest_income for banks). Costs 1 credit per quarter returned. Default is 4 credits; ask for more quarters only if the user wants a longer trend.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "IDX ticker, e.g. BBCA." },
          n_quarters: { type: "integer", description: "Number of most recent quarters. Default 4. Each quarter costs 1 credit." },
        },
        required: ["symbol"],
      },
    },
  },
];

const TOOL_NAMES = new Set<string>(TOOL_DEFS.map((t) => t.function.name));

// Fixed window requested from the screener, independent of the caller's limit.
const WINDOW = 50;

type ScreenResponse = {
  results?: unknown[];
  pagination?: { total_count?: number; showing?: number };
};

export function isToolName(name: string): name is ToolName {
  return TOOL_NAMES.has(name);
}

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  ledger: CreditLedger,
): Promise<unknown> {
  switch (name) {
    case "screen_companies": {
      // Always ask Sectors for the same window so the cache key is stable, then trim
      // to the caller's limit. The model varies `limit` between runs; that must not
      // defeat the cache.
      const params: Record<string, string | number | undefined> = {
        limit: WINDOW,
        include_query_values: "true",
      };
      if (typeof args.where === "string") params.where = args.where;
      if (typeof args.order_by === "string") params.order_by = args.order_by;
      if (typeof args.q === "string") params.q = args.q;
      const data = await sectorsGet<ScreenResponse>("/companies/", params, ledger, ["limit"]);
      const wanted = Math.min(Math.max(num(args.limit, 10), 1), WINDOW);
      return {
        results: (data.results ?? []).slice(0, wanted),
        pagination: { ...data.pagination, showing: Math.min(wanted, data.results?.length ?? 0) },
      };
    }
    case "get_company_report": {
      const symbol = str(args.symbol);
      const sections = Array.isArray(args.sections) ? args.sections.join(",") : undefined;
      return sectorsGet(`/company/report/${symbol}/`, { sections }, ledger);
    }
    case "get_top_movers": {
      const params: Record<string, string | number | undefined> = { n_stock: num(args.n_stock, 5) };
      if (typeof args.sub_sector === "string") params.sub_sector = args.sub_sector;
      params.periods = (Array.isArray(args.periods) && args.periods.length ? args.periods : ["1d"]).join(",");
      params.classifications = (
        Array.isArray(args.classifications) && args.classifications.length ? args.classifications : ["top_gainers"]
      ).join(",");
      return sectorsGet("/companies/top-changes/", params, ledger);
    }
    case "get_quarterly_financials": {
      return sectorsGet(`/financials/quarterly/${str(args.symbol)}/`, { n_quarters: num(args.n_quarters, 4) }, ledger);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function str(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  throw new Error("Missing required string argument");
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
