# Fhin VEST

**Tanya soal saham IDX dalam bahasa manusia, dapat jawaban dengan angka dari satu sumber yang bisa diverifikasi.**

Sectors Hackathon 2026.

**Live:** https://fhinvest.fhin-farmmyid.workers.dev/
**GitHub:** https://github.com/gfhinrel-arch/fhin-vest
**Teaser video:** https://youtu.be/855cAcZ7lnQ
**Judging video:** https://youtu.be/cLDftrrzvsw
**Instagram:** https://www.instagram.com/p/DeMtMxfCGEP/

> Alat bantu riset & informasi, bukan nasihat keuangan. Bukan rekomendasi
> jual/beli. Data dari Sectors.

Dokumentasi lengkap ada di [`docs/`](docs/README.md) — mulai dari
[pendahuluan](docs/README.md), [cara kerja](docs/how-it-works.md),
[alur pengguna](docs/user-flow.md), [arsitektur](docs/architecture.md),
[menjalankan](docs/deployment.md), sampai [keamanan](docs/security.md) dan
[roadmap](docs/roadmap.md). Yang melanjutkan kerja: baca [handoff](docs/HANDOFF.md).

## Cara kerja

```
  Browser (app/chat/page.tsx)
        │  POST /api/chat  { messages: [...] }
        ▼
  Route handler (app/api/chat/route.ts)          runtime = nodejs
        │  batasi 12 pesan terakhir
        ▼
  Agent loop (lib/agent.ts)  ────────────────────────────────┐
        │  POST {LLM_BASE_URL}/chat/completions              │
        │  stream: true, temperature: 0, tools: TOOL_DEFS    │
        │                                                    │
        │  ◄── token teks / tool_call (NDJSON ke browser)    │
        ▼                                                     │
  runTool (lib/tools.ts)  →  sectorsGet (lib/sectors.ts)     │
        │                         │                          │
        │                         ▼                          │
        │              api.sectors.app/v2  (cache TTL)       │
        │                         │                          │
        └───── tool result ───────┘──────────────────────────┘
                     (maks 4 putaran, lalu jawaban akhir)

  Event ke browser: text | tool | tool_result | done | error
```

Agent berhenti setelah maksimal 4 putaran tool. Setiap hasil tool yang lebih
dari 60.000 karakter tidak dipotong; diganti objek
`{ truncated: true, note, preview }` supaya model tidak menerima JSON rusak.

## Tool dan biaya kredit

Biaya mengikuti aturan billing Sectors API v2: sukses (2xx) ditagih sesuai
endpoint, `404` tetap 1 kredit, sedangkan `400/401/403/429/5xx` gratis.

| Tool | Fungsi | Endpoint Sectors | Biaya kredit | Catatan |
|---|---|---|---|---|
| `screen_companies` | Cari/urutkan perusahaan berdasarkan kondisi | `/companies/` | 1 (tanpa `q`) atau 3 (dengan `q`) | Meminta jendela tetap 50 baris ke Sectors (tidak dihitung cache), lalu dipotong sesuai `limit` model. |
| `get_company_report` | Detail satu simbol | `/company/report/{symbol}/` | 1 per section; default 8 kalau `sections` kosong | Minta section yang perlu saja; jangan kosongkan. |
| `get_top_movers` | Gainer/loser per periode | `/companies/top-changes/` | jumlah periode x jumlah klasifikasi | Default minimal: `periods=["1d"]`, `classifications=["top_gainers"]` = 1 kredit. |
| `get_quarterly_financials` | Tren kuartalan satu simbol | `/financials/quarterly/{symbol}/` | 1 per kuartal | Default `n_quarters=4` = 4 kredit. |

Ledger kredit per sesi dikirim ke browser di event `done`. Cache menekan kredit
saat pertanyaan atau filter yang sama diulang. Argumen yang dihasilkan model bisa
berbeda antar run, jadi penghematannya tidak selalu terasa pada pertanyaan bebas.
Untuk pertanyaan yang sering diulang, penghematannya nyata.

## Setup

Butuh Node.js 20.9+.

```bash
npm install
cp .env.local.example .env.local   # lalu isi nilainya
npm run dev                         # http://localhost:3000
```

`.env.local`:

```
SECTORS_API_KEY=     # dari sectors.app, header mentah TANPA "Bearer " (Bearer hanya untuk MCP)
LLM_BASE_URL=http://localhost:20128/v1
LLM_API_KEY=         # key 9router
LLM_MODEL=ts/thirty/deepseek-v4-flash
```

API key hanya dibaca di server (route handler dan `lib/`). Tidak pernah
dikirim ke client dan tidak pernah masuk bundle klien.

## Cara verifikasi

Tiga langkah, dari yang paling murah:

1. **Preflight (offline, tanpa jaringan).**
   ```bash
   npm run smoke
   ```
   Cek file wajib ada, `node_modules` terpasang, isi `.env.local`, nama tool di
   `TOOL_DEFS` sinkron dengan `runTool`, dan `.env.local` ada di `.gitignore`.
   Exit non-zero kalau ada yang gagal.

2. **Typecheck.**
   ```bash
   npx tsc --noEmit
   ```

3. **Jalankan dan uji manual.**
   ```bash
   npm run dev
   ```
   Lalu di browser, uji hal-hal berikut:
   - "Bank apa yang ROE-nya di atas 15%?" → agent memanggil `screen_companies`
     dengan `where`, bukan `q`.
   - "Jelaskan kenapa BBCA masuk kriteria itu" → agent memanggil
     `get_company_report`.
   - "Menurutmu aku harus beli saham apa?" → agent menolak memberi rekomendasi
     dan mengalihkan ke apa yang ditunjukkan data.
   - Pertanyaan di luar cakupan data Sectors → agent bilang tidak tahu.
   - Ulangi pertanyaan yang sama setelah refresh → kredit lebih sedikit
     (cache bekerja). Efektif bila model menghasilkan argumen tool yang sama.

   Hasil di atas diuji dengan model `ts/thirty/deepseek-v4-flash` pada
   2026-09-24. Model lain bisa berperilaku berbeda, terutama pada keputusan tool
   dan kestabilan argumen.

## Struktur folder

```
app/
  layout.tsx              shell + metadata + nav
  page.tsx                landing: hero, 2 aksi, cara kerja
  nav.tsx                 navigasi (Beranda / Screener / Chat)
  ui.tsx                  komponen bersama (chip, meter, empty, error)
  globals.css             token warna, grain, shimmer, breathe
  chat/page.tsx           UI chat streaming (client component)
  screen/page.tsx         screener: form + tabel
  screen/loading.tsx      skeleton tabel saat memuat
  company/[symbol]/page.tsx  bedah emiten + not-found
  api/chat/route.ts       route handler streaming (NDJSON)
lib/
  sectors.ts              klien REST Sectors, cache TTL, ledger kredit
  format.ts               format IDR, persen, angka
  tools.ts                4 tool agent + skema + runTool
  agent.ts                loop tool-calling streaming + SYSTEM_PROMPT
scripts/
  smoke.mjs               preflight offline
docs/
  README.md               pendahuluan
  SUMMARY.md              indeks dokumentasi
  how-it-works.md         loop agent + 4 tool
  user-flow.md            alur beranda / chat / screener / emiten
  architecture.md         lapisan dan boundary
  deployment.md           setup, verifikasi, dan deploy Cloudflare
  security.md             rahasia dan permukaan serangan
  roadmap.md              batasan dan kandidat berikutnya
  HANDOFF.md              status untuk yang melanjutkan
open-next.config.ts       config adapter Cloudflare
wrangler.jsonc            config Worker (nama, assets, compat)
```

## Video demo

Dua video untuk lomba, dibuat dengan Remotion di `video2/` (sub-proyek terpisah;
lihat `video2/README.md`). Narasi bahasa Inggris, voice-over + musik.

| Video | Durasi | Berkas |
|---|---|---|
| Teaser | 60 s | `video2/out/fhinvest-short.mp4` |
| Judging | 2:59 | `video2/out/fhinvest-judging.mp4` |

Alur lima babak: Hook/Problem, deep dive problem, solution/product, live workflow
demo, technical/impact — plus tutorial cara pakai di akhir. Berkas hasil ada di
`video2/out/` dan tidak di-commit (di-.gitignore).

## Batasan yang disengaja

- **Tanpa eksekusi order.** Tidak ada fitur memasang order dalam bentuk apa pun.
- **Bukan nasihat keuangan.** Agent dilarang menyebut beli/jual/tahan dan
  dilarang memberi target harga sebagai rekomendasi.
- **Tanpa database.** Tidak ada penyimpanan; riwayat hanya hidup di memori
  browser selama satu sesi.
- **Tanpa auth.** Satu instance untuk satu pengguna.
- **Tanpa rate limiting.**
- **Cache per-proses.** Cache adalah `Map` in-memory; hilang saat server
  restart dan tidak dibagi antar worker. Cocok untuk satu proses pengembangan,
  bukan untuk produksi multi-instance.
