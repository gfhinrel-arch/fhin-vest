// Narration for the 180s FhinVest judging video. duration=180 -> cut(x)=x seconds,
// so scene seconds and the numbers below line up 1:1.
// `at` values are spaced so no line overlaps the next (see scripts/vo-long.mjs).

export type Line = {id: string; text: string; at: number};

export const LONG: Line[] = [
  {id: 'L1', at: 1.0, text: 'Ask a language model about a stock, and you get something that reads well and proves nothing.'},
  {id: 'L2', at: 8.0, text: 'No period. No currency. No source. That is the problem we set out to solve.'},
  {id: 'L3', at: 14.0, text: 'Market data in Indonesia sits behind a screener with SQL-like filters and thousands of listed companies.'},
  {id: 'L4', at: 23.0, text: 'To answer even one question well, you must know which endpoint to call, how to write the filter, and which column holds the value.'},
  {id: 'L5', at: 33.0, text: 'Most people give up, and accept a guess.'},
  {id: 'L6', at: 36.5, text: 'And a guess is expensive here. A number without its period, its currency, or its field name is not data. It is decoration.'},
  {id: 'L7', at: 45.0, text: 'Fhin VEST is a research assistant built on one rule: a single source of market data, and no answer the data cannot support.'},
  {id: 'L8', at: 53.5, text: 'The Sectors Financial API is the only source. Nothing else.'},
  {id: 'L9', at: 58.5, text: 'It is deliberately not a financial advisor. It will not say buy, sell, or hold. It cannot place orders, and it does not pretend to.'},
  {id: 'L10', at: 67.0, text: 'When you ask what you should do, it reframes the question into what the data shows.'},
  {id: 'L11', at: 72.5, text: 'Three surfaces. A screener that filters the market by sub-sector, return on equity, price to earnings, and market cap.'},
  {id: 'L12', at: 80.5, text: 'A chat that answers in plain language. And a company breakdown, with every ratio labelled with its period and currency.'},
  {id: 'L13', at: 88.0, text: 'Let us run the workflow. First question: which banks have a return on equity above fifteen percent?'},
  {id: 'L14', at: 94.5, text: 'Watch the tool panel. The agent chose the screener, with a structured filter, not a natural language query.'},
  {id: 'L15', at: 101.0, text: 'That choice costs one credit instead of three. The answer names four banks and quotes the exact figure for each.'},
  {id: 'L16', at: 108.0, text: 'Second question: why does BBCA qualify? The agent switches tools on its own, and requests only the sections it needs.'},
  {id: 'L17', at: 116.0, text: 'Two credits, not eight. Every tool it runs is visible on screen, with its cost.'},
  {id: 'L18', at: 122.0, text: 'Now a trap. Ask it what to buy. It declines, and turns the question back to the data. No buy, sell, or hold anywhere in the reply.'},
  {id: 'L19', at: 131.5, text: 'And a second trap: ask about Bitcoin. It is outside the source, so the agent says so, instead of inventing a price.'},
  {id: 'L20', at: 140.0, text: 'Under the hood, the interface streams over one route handler. The agent runs a tool-calling loop, up to four rounds, at temperature zero.'},
  {id: 'L21', at: 146.0, text: 'It handles the tool call ids some routers drop while streaming, and it never truncates a long result with a slice that would break the JSON.'},
  {id: 'L22', at: 154.0, text: 'Credit cost is modelled from the API billing rules, and a per-process cache keeps repeated identical queries free.'},
  {id: 'L23', at: 160.5, text: 'The API key never leaves the server. There is no database, no authentication, and no order execution, by design.'},
  {id: 'L24', at: 169.0, text: 'Here is how you use it. Pick a mode on the landing page: ask a question, or open the screener.'},
  {id: 'L25', at: 174.0, text: 'Filter the market, open a company, read every ratio. Fhin VEST.'},
];
