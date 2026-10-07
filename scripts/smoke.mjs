#!/usr/bin/env node
// Offline preflight. No network. Exits non-zero on the first failure.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const required = [
  "package.json",
  "tsconfig.json",
  "app/page.tsx",
  "app/chat/page.tsx",
  "app/screen/page.tsx",
  "app/company/[symbol]/page.tsx",
  "app/api/chat/route.ts",
  "lib/sectors.ts",
  "lib/tools.ts",
  "lib/agent.ts",
  ".gitignore",
  ".env.local",
];

for (const file of required) {
  if (!existsSync(resolve(root, file))) failures.push(`missing file: ${file}`);
}

if (!existsSync(resolve(root, "node_modules"))) {
  failures.push("node_modules not installed (run npm install)");
}

if (existsSync(resolve(root, ".env.local"))) {
  const env = readFileSync(resolve(root, ".env.local"), "utf8");
  for (const key of ["SECTORS_API_KEY", "LLM_BASE_URL", "LLM_API_KEY", "LLM_MODEL"]) {
    const re = new RegExp(`^${key}=(.+)$`, "m");
    if (!re.test(env)) failures.push(`.env.local missing or empty: ${key}`);
  }
}

if (existsSync(resolve(root, ".gitignore"))) {
  const ignore = readFileSync(resolve(root, ".gitignore"), "utf8");
  if (!/^\.env(\*|\.local|$)/m.test(ignore)) failures.push(".gitignore does not ignore .env.local");
} else {
  failures.push(".gitignore missing");
}

if (existsSync(resolve(root, "lib/tools.ts"))) {
  const tools = readFileSync(resolve(root, "lib/tools.ts"), "utf8");
  const defined = [...tools.matchAll(/name:\s*"([a-z_]+)"/g)].map((m) => m[1]);
  const handled = [...tools.matchAll(/case\s+"([a-z_]+)":/g)].map((m) => m[1]);
  const missing = defined.filter((n) => !handled.includes(n));
  const extra = handled.filter((n) => !defined.includes(n));
  if (missing.length) failures.push(`TOOL_DEFS without runTool case: ${missing.join(", ")}`);
  if (extra.length) failures.push(`runTool case without TOOL_DEFS entry: ${extra.join(", ")}`);
  if (defined.length === 0) failures.push("could not read any tool names from lib/tools.ts");
}

if (failures.length) {
  console.error("smoke: FAIL");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("smoke: OK");
