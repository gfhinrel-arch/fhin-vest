# Handoff

Dokumen untuk orang berikutnya yang melanjutkan proyek ini. Status per fitur,
apa yang belum dites, keputusan penting, cara menjalankan, dan jebakan.

Terakhir diperbarui: 2026-10-07.

## Status

Aplikasi jalan dan terverifikasi. Feature-complete untuk versi lomba.

### Live

* App: https://fhinvest.fhin-farmmyid.workers.dev/
* GitHub: https://github.com/gfhinrel-arch/fhin-vest
* Teaser video: https://youtu.be/855cAcZ7lnQ
* Judging video: https://youtu.be/cLDftrrzvsw
* Instagram: https://www.instagram.com/p/DeMtMxfCGEP/
* Event: Sectors Hackathon 2026.

### Live (Cloudflare Workers)

* URL: https://fhinvest.fhin-farmmyid.workers.dev
* Deploy: `@opennextjs/cloudflare` (adapter), config `open-next.config.ts` + `wrangler.jsonc`.
* Worker name: `fhinvest`. Secrets (bukan `.env.local`): `SECTORS_API_KEY`,
  `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` — di-set via `npx wrangler secret put`.
* **Chat bergantung tunnel.** `LLM_BASE_URL` di produksi menunjuk ke
  `cloudflared` quick tunnel ke 9router di mesin lokal. Kalau mesin mati, tunnel
  berhenti, atau URL quick tunnel berubah (acak tiap restart), chat mati.
  Halaman `/screen` dan `/company` tetap jalan karena memanggil Sectors langsung.
* Deploy ulang: `npm run cf:deploy` (build + deploy). Rename worker ada di `wrangler.jsonc`.

### Video demo

Dua video dibuat pakai Remotion di `video2/` (workflow MotionCraft). Output di
`video2/out/` (tidak di-commit): teaser 60 s (`fhinvest-short.mp4`) dan judging
2:59 (`fhinvest-judging.mp4`). Narasi di `video2/src/vo-script.ts` (60 s) dan
`vo-script-long.ts` (180 s); audio di-generate oleh `video2/scripts/vo*.mjs`.
Catatan: project `video/` (versi lama) sudah dihapus.

| Bagian | Status | Bukti |
| --- | --- | --- |
| Beranda `/` | Selesai | hero + 2 kartu aksi + cara kerja |
| Chat `/chat` | Selesai | streaming, tool terlihat, kredit, batal |
| Screener `/screen` | Selesai | form + tabel + meter + loading + empty |
| Bedah emiten `/company/[symbol]` | Selesai | 6 kartu rasio + kuartal + "Kenapa angka ini" |
| 404 emiten | Selesai | `/company/ZZZZ` → HTTP 404 halaman jelas |
| Brand Fhin VEST | Selesai | nav + chat + title |

Verifikasi terakhir: `npx tsc --noEmit` exit 0, `npm run smoke` OK, `npm run build` sukses,
`npm run cf:deploy` sukses. Rute produksi `/`, `/screen`, `/chat`, `/company/BBCA` → HTTP 200;
`/api/chat` produksi memanggil tool `screen_companies`.

## Uji runtime terakhir

Dijalankan terhadap LLM asli lewat `/api/chat`:

| Uji | Hasil |
| --- | --- |
| "bank apa yang ROE-nya di atas 15%?" | Lulus — `screen_companies` + `where`, angka persis (23,89 / 21,47 / 18,96 / 15,64%), 1 kredit |
| "kenapa BBCA masuk kriteria itu" | Lulus — `get_company_report`, section minimal |
| "menurutku aku harus beli saham apa?" | Lulus — menolak, tak menyebut beli/jual, 0 kredit |
| "berapa harga saham Bitcoin hari ini?" | Lulus — "bukan saham IDX", tak mengarang, 0 kredit |

Model yang dipakai saat itu: lihat `LLM_MODEL` di `.env.local`.

## Belum dites / belum ada

* **Tes cache (e) belum stabil.** Model menghasilkan argumen tool berbeda antar run
  (`limit` 20/25/30, urutan kondisi `where` terbalik), jadi cache sering tidak kena pada
  pertanyaan bebas. Cache benar secara teknis (diuji dengan argumen identik → 0 kredit),
  hanya jarang terasa. Lihat `docs/roadmap.md`.
* **Uji visual manual** (buka browser, lihat animasi) belum tercatat rapi. Animasi Framer
  Motion baru terlihat setelah JS hydrate; tidak bisa dipastikan dari fetch HTML.
* **Git remote belum ada.** Kode masih lokal; belum di-push ke GitHub.
* **Tanpa test otomatis** selain `smoke.mjs` dan `tsc`.

## Keputusan penting

* **Satu sumber data.** Sectors REST API saja. Tidak ada sumber pasar lain.
* **Bukan nasihat keuangan.** Ditegakkan di `SYSTEM_PROMPT` (`lib/agent.ts`) dan diverifikasi runtime.
* **Tanpa dependency UI dulu**, lalu diputuskan memakai `framer-motion` + `@phosphor-icons/react`
  atas permintaan pengguna. Tidak pakai Tailwind (proyek ini CSS module murni).
* **Tema terang ala "VeriPanen".** Token di `app/globals.css`. Brand `Fhin VEST`.
* **Chat pindah dari `/` ke `/chat`**; nav global disembunyikan di `/chat` (fullscreen, topbar sendiri).
* **`limit` dikeluarkan dari cache key** untuk `screen_companies` (jendela tetap 50 ke Sectors,
  dipotong sesuai permintaan model). Normalisasi isi string `where` sengaja TIDAK dilakukan
  (kondisi `or` tidak aman diurutkan).
* **Deploy ke Cloudflare Workers** (bukan Vercel). Next di-bump `16.3.6` → `16.3.8` agar
  cocok dengan peer `@opennextjs/cloudflare`. `video2` dikecualikan di `tsconfig.json` root
  (punya tsconfig sendiri; jangan sampai `next build` men-typecheck-nya).

## Cara menjalankan

```bash
npm install
cp .env.local.example .env.local   # isi key
npm run dev
```

Verifikasi:

```bash
npx tsc --noEmit
npm run smoke
npm run build
```

## Jebakan

* **Jangan `Get-Process node | Stop-Process` massal.** Perintah itu ikut mematikan proses lain
  di mesin ini, termasuk router LLM lokal (9router di port 20128) saat dijalankan dari cmd
  terpisah. Kill hanya PID yang sudah dipastikan milik dev server Next.
* **Next 16 punya lockfile dev.** Menyalakan `next dev` kedua akan menolak dan menyuruh pakai
  instance yang sudah jalan. Matikan instance lama dulu, atau jalankan satu saja.
* **`.env.local` tidak di-commit.** Hanya `.env.local.example`. Jangan pernah menaruh key asli di repo.
* **Header Sectors mentah.** `Authorization: <key>`, bukan `Bearer`. Jangan tambahkan `Bearer `.
* **Jalan build dan dev bersamaan** bisa bentrok resource; matikan dev dulu saat build produksi.
* **Secret Worker ≠ `.env.local`.** Setiap ganti nama worker, secret harus di-set ulang
  (`npx wrangler secret put <NAME>`); secret tidak ikut pindah bersama nama.
* **`next build` root men-typecheck seluruh repo.** `video2/` dikecualikan di `tsconfig.json`;
  kalau tidak, banyak error TS dari lib video2 menggagalkan build produksi.
* **Quick tunnel `cloudflared` acak URL.** Tiap restart menghasilkan URL baru; perbarui secret
  `LLM_BASE_URL` dan redeploy bila berubah.

## Kontak konteks referensi

UI mengacu pada proyek `WEB3hackathon2026` (VeriPanen/FHIN FARM) di mesin yang sama: token,
grain, shimmer, chip, meter, layoutId nav. Format `docs/` juga mengikuti repo itu.
