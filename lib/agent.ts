import { TOOL_DEFS, isToolName, runTool } from "./tools";
import { createLedger, type CreditLedger } from "./sectors";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AgentEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; args: unknown }
  | { type: "tool_result"; name: string; credits: number; result: unknown }
  | { type: "done"; credits: CreditLedger }
  | { type: "error"; message: string };

export const SYSTEM_PROMPT = `You are a research assistant for Indonesian stocks listed on the IDX (Bursa Efek Indonesia). You answer questions about companies using data from the Sectors Financial API.

You are an information and analysis tool, NOT a financial advisor.
- Never say buy, sell, or hold. Never give a price target as a recommendation.
- You cannot place orders and must not offer to. If asked, say order execution is out of scope here.
- If a question asks "what should I do", reframe it as "what does the data show" and present the trade-offs neutrally.
- State the period and currency of every number. Never present stale figures as current.
- Name the Sectors fields you used (e.g. roe_ttm, revenue[2024]) so the user can verify.
- If the data does not answer the question, say so plainly. Do not invent numbers.

Write only the final answer the user should read. Never include process notes, meta commentary, markers, or bracketed tags like "{skip: ...}" in your reply. Do not narrate what you decided not to do; just answer.

Tools:
- screen_companies: find or rank companies by a condition. Prefer the structured \`where\` form.
- get_company_report: detail for one known symbol; request only the sections you need.
- get_top_movers: gainers/losers across periods, market-wide or by subsector.
- get_quarterly_financials: quarter-by-quarter trend for one symbol.

Work step by step: decide what data you need, call the tools, then answer with the actual numbers. Keep answers concise and grounded in the returned data. If the same question was asked before, reuse the exact same tool arguments (same 'limit', same condition order) instead of varying them.`;

const MAX_ROUNDS = 4;
const MAX_TOOL_CHARS = 60_000;

type AssistantToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: AssistantToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type StreamDelta = {
  content?: string | null;
  tool_calls?: Array<{
    index: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }>;
};

export async function* runAgent(history: ChatMessage[]): AsyncGenerator<AgentEvent> {
  const base = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!base || !apiKey || !model) {
    yield { type: "error", message: "LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL must be set" };
    return;
  }

  const ledger = createLedger();
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m): Message => ({ role: m.role, content: m.content })),
  ];

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, tools: TOOL_DEFS, stream: true, temperature: 0 }),
        cache: "no-store",
      });

      if (!res.ok || !res.body) {
        yield { type: "error", message: `LLM ${res.status}: ${(await res.text()).slice(0, 300)}` };
        return;
      }

      let content = "";
      const calls: AssistantToolCall[] = [];

      for await (const chunk of parseSse(res.body)) {
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;
        if (typeof delta.content === "string" && delta.content) {
          content += delta.content;
          yield { type: "text", text: delta.content };
        }
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const slot = (calls[tc.index] ??= { id: "", type: "function", function: { name: "", arguments: "" } });
            // Some routers drop the id while streaming; mint one here, reused for the reply.
            if (tc.id) slot.id = tc.id;
            if (tc.function?.name) slot.function.name = tc.function.name;
            if (tc.function?.arguments) slot.function.arguments += tc.function.arguments;
          }
        }
      }

      for (const [i, c] of calls.entries()) if (!c.id) c.id = `call_${round}_${i}`;

      if (calls.length === 0) {
        yield { type: "done", credits: ledger };
        return;
      }

      messages.push({ role: "assistant", content: content || null, tool_calls: calls });

      for (const call of calls) {
        const name = call.function.name;
        let args: Record<string, unknown> = {};
        try {
          args = call.function.arguments ? (JSON.parse(call.function.arguments) as Record<string, unknown>) : {};
        } catch {
          messages.push({ role: "tool", tool_call_id: call.id, content: "Error: arguments were not valid JSON." });
          continue;
        }

        yield { type: "tool", name, args };

        if (!isToolName(name)) {
          messages.push({ role: "tool", tool_call_id: call.id, content: `Error: unknown tool ${name}` });
          continue;
        }

        const before = ledger.total;
        let payload: { ok: true; data: unknown } | { ok: false; error: string };
        try {
          payload = { ok: true, data: await runTool(name, args, ledger) };
        } catch (err) {
          payload = { ok: false, error: err instanceof Error ? err.message : String(err) };
        }
        const spent = ledger.total - before;

        // Never .slice() tool output: that cuts JSON mid-way. Oversize results
        // become a small, valid object the model can reason about.
        const json = JSON.stringify(payload.ok ? payload.data : { error: payload.error });
        const content =
          json.length > MAX_TOOL_CHARS
            ? JSON.stringify({
                truncated: true,
                note: `Result was ${json.length} characters. Narrow the query (fewer fields, rows, sections, or periods).`,
                preview: json.slice(0, 4000),
              })
            : json;

        yield { type: "tool_result", name, credits: spent, result: JSON.parse(content) };
        messages.push({ role: "tool", tool_call_id: call.id, content });
      }
    }

    yield { type: "error", message: `Stopped after ${MAX_ROUNDS} tool rounds without a final answer.` };
  } catch (err) {
    yield { type: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

type Chunk = { choices?: Array<{ delta?: StreamDelta }> };

async function* parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<Chunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        yield JSON.parse(data) as Chunk;
      } catch {
        // ignore keep-alive or partial fragments
      }
    }
  }
}
