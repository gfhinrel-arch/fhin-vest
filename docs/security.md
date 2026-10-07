# Keamanan

## Rahasia

* **API key hanya di server.** Di lokal `SECTORS_API_KEY` dan `LLM_API_KEY` dibaca dari `process.env`
  (proses Node, route handler + `lib/`); di produksi dari Cloudflare Worker secret. Tidak pernah dikirim
  ke client, tidak masuk bundle klien.
* **Header auth mentah.** Sectors menerima `Authorization: <raw key>` — bukan `Bearer`. (`Bearer`
  hanya untuk MCP.)
* **`.env.local` di gitignore.** Hanya `.env.local.example` yang masuk repo, berisi nama variabel tanpa nilai.
  Secret produksi disimpan di Cloudflare, bukan di repo.

## Permukaan serangan

* **Tidak ada auth pengguna.** Satu instance diperuntukkan satu pengguna. Tidak ada sesi, tidak ada data
  pribadi, tidak ada penyimpanan.
* **Tidak ada eksekusi order.** Tidak ada endpoint yang memodifikasi apa pun; seluruh alur hanya membaca
  data pasar. Tidak ada integrasi order, dompet, atau transaksi.
* **Tidak ada LLM call pihak ketiga di luar `LLM_BASE_URL`.** Hanya satu endpoint model, dari konfigurasi.
  Di produksi endpoint itu adalah tunnel publik ke router lokal; URL-nya diketahui publik tetapi tetap
  butuh `LLM_API_KEY`, dan tidak ada data pengguna yang dikirim ke sana.

## Batasan yang diketahui

* **Tanpa rate limiting.** Pertanyaan bertubi-tubi menghabiskan kredit Sectors dan kuota LLM. Di luar
  cakupan versi ini; lihat [roadmap](roadmap.md).
* **Tanpa database.** Riwayat hanya hidup di memori browser selama satu sesi.
* **Cache per-proses.** Hilang saat restart server; tidak dibagi antar worker.
