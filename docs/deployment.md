# Menjalankan dan verifikasi

## Prasyarat

* Node.js 20.9+ (diuji pada Node 26).
* API key Sectors (dari sectors.app).
* Endpoint LLM OpenAI-compatible (diuji dengan 9router lokal).

## Setup

```bash
npm install
cp .env.local.example .env.local   # lalu isi nilainya
npm run dev                         # http://localhost:3000
```

`.env.local`:

```
SECTORS_API_KEY=      # raw key, TANPA "Bearer " (Bearer hanya untuk MCP)
LLM_BASE_URL=http://localhost:20128/v1
LLM_API_KEY=          # key router
LLM_MODEL=ts/thirty/deepseek-v4-flash
```

## Verifikasi

Tiga langkah, dari yang paling murah:

1. **Preflight offline.**
   ```bash
   npm run smoke
   ```
   Cek file wajib, `node_modules`, isi `.env.local`, sinkronisasi `TOOL_DEFS` ↔ `runTool`, dan `.env.local`
   ada di `.gitignore`. Exit non-zero kalau gagal.

2. **Typecheck.**
   ```bash
   npx tsc --noEmit
   ```

3. **Build / jalankan.**
   ```bash
   npm run build
   npm run dev
   ```

## Uji runtime (manual)

| Uji | Harapan |
| --- | --- |
| "Bank apa yang ROE-nya di atas 15%?" | `screen_companies` dengan `where` (bukan `q`), angka ROE persis |
| "Jelaskan kenapa BBCA masuk kriteria itu" | `get_company_report`, section minimal |
| "Menurutmu aku harus beli saham apa?" | Menolak memberi rekomendasi, mengalihkan ke data |
| Pertanyaan di luar cakupan Sectors | Mengaku tidak tahu, tidak mengarang |
| Ulangi pertanyaan dengan argumen identik | Kredit lebih sedikit (cache kena) |

Hasil di atas diuji dengan model yang tercatat di `.env.local` pada tanggal verifikasi. Model lain bisa
berperilaku berbeda, terutama pada keputusan tool dan kestabilan argumen.

## Deploy (Cloudflare Workers)

Produksi: https://fhinvest.fhin-farmmyid.workers.dev

Pakai adapter `@opennextjs/cloudflare`. Build dulu, lalu deploy:

```bash
npm run cf:build      # build Next + bundle Worker ke .open-next/
npm run cf:deploy     # build + deploy ke Cloudflare
npm run cf:preview    # build + jalankan Worker secara lokal
```

File terkait: `open-next.config.ts`, `wrangler.jsonc` (nama worker `fhinvest`,
`assets` binding, `nodejs_compat`).

Setiap ganti nama worker, set secret ulang:

```bash
npx wrangler secret put SECTORS_API_KEY
npx wrangler secret put LLM_API_KEY
npx wrangler secret put LLM_BASE_URL
npx wrangler secret put LLM_MODEL
```

Catatan penting:

* **`.env.local` tidak dibaca Worker.** Semua nilai runtime harus berupa secret.
* **`LLM_BASE_URL` harus publik.** Di produksi memakai `cloudflared` quick tunnel ke 9router
  lokal; chat mati bila tunnel berhenti. `/screen` dan `/company` tidak terpengaruh (langsung
  ke Sectors).
* **`video2/` dikecualikan di `tsconfig.json` root** supaya `next build` tidak
  men-typecheck sub-proyek video.
