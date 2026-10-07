# Arsitektur

## Lapisan

```
app/                      UI (App Router, Server Components + leaf client)
  layout.tsx              shell + nav
  page.tsx                beranda (RSC statis)
  chat/page.tsx           chat streaming (client)
  screen/page.tsx         screener (RSC) + screen-form.tsx (client)
  company/[symbol]/       bedah emiten (RSC)
  api/chat/route.ts       route handler streaming (NDJSON, runtime nodejs)
  ui.tsx  brand.tsx       komponen bersama
lib/
  sectors.ts              klien REST Sectors, cache TTL, ledger kredit
  tools.ts                4 tool + skema + runTool
  agent.ts                loop tool-calling + SYSTEM_PROMPT
  format.ts               format IDR / persen / angka
```

## Aturan boundary

* **Data diambil di server.** Halaman dan route handler membaca Sectors lewat `lib/sectors.ts`. Tidak
  ada HTTP call dari browser ke API sendiri.
* **API key hanya di server.** Di lokal dibaca dari `.env.local` (proses Node); di produksi dari
  Worker secret. Tidak pernah dikirim ke client atau masuk bundle klien.
* **Interaktivitas terisolasi.** Komponen yang butuh state/animasi (`"use client"`) adalah leaf; RSC
  merender layout statis.

## Runtime

* **Lokal:** `next dev` / `next start` (Node).
* **Produksi:** Cloudflare Workers lewat `@opennextjs/cloudflare` (`open-next.config.ts`,
  `wrangler.jsonc`). Route handler tetap `runtime = "nodejs"` lewat flag `nodejs_compat`.
  Deploy: `npm run cf:deploy`.

## Cache dan ledger

* **Cache.** `Map` in-memory, TTL per endpoint (`/companies/` 5 menit, report 30 menit, kuartal 60 menit,
  `/subsectors/` 24 jam). Key mencerminkan parameter; untuk `screen_companies`, `limit` dikeluarkan dari
  key (jendela tetap 50 diminta ke Sectors, lalu dipotong sesuai permintaan model) supaya variasi `limit`
  tidak mematikan cache.
* **Ledger kredit.** `creditCost()` menerapkan aturan billing Sectors v2: sukses ditagih sesuai endpoint,
  `404` tetap 1, `400/401/403/429/5xx` gratis.

## Aliran data (ringkas)

```
Browser → POST /api/chat → lib/agent.ts → LLM (tools) → lib/tools.ts → lib/sectors.ts → api.sectors.app
```
