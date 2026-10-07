import { runAgent, type AgentEvent, type ChatMessage } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HISTORY = 12;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const history = (body as { messages?: unknown }).messages;
  if (!Array.isArray(history)) return new Response("messages[] is required", { status: 400 });

  const messages: ChatMessage[] = history
    .filter(
      (m): m is ChatMessage =>
        typeof m === "object" && m !== null && (m as ChatMessage).role !== undefined &&
        ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
        typeof (m as ChatMessage).content === "string",
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content }));

  if (messages.length === 0) return new Response("No usable messages", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        for await (const event of runAgent(messages)) send(event);
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
