# Roadmap dan batasan

## Batasan yang disengaja (versi ini)

* **Tanpa eksekusi order.** Tidak ada fitur memasang order dalam bentuk apa pun.
* **Bukan nasihat keuangan.** Agent dilarang menyebut beli/jual/tahan dan dilarang memberi target harga
  sebagai rekomendasi.
* **Tanpa database.** Tidak ada penyimpanan; riwayat hanya di memori browser.
* **Tanpa auth.** Satu instance untuk satu pengguna.
* **Tanpa rate limiting.**
* **Cache per-proses.** `Map` in-memory; hilang saat restart, tidak dibagi antar worker.
* **Chat produksi bergantung tunnel.** `LLM_BASE_URL` produksi menunjuk ke `cloudflared` quick
  tunnel ke 9router lokal; mati bila tunnel berhenti. `/screen` dan `/company` tidak terpengaruh.

## Catatan jujur

* Model dapat menghasilkan argumen tool yang berbeda antar run untuk pertanyaan identik, sehingga cache
  tidak selalu terasa pada pertanyaan bebas. Cache nyata manfaatnya untuk pertanyaan yang sering diulang.
* Beberapa metrik di halaman emiten berasal dari laporan tahunan Sectors (mis. `financials.historical_financial_ratio`),
  bukan seri TTM; label periode (`FYxxxx`) ditampilkan agar tidak menyesatkan.

## Kandidat berikutnya

* Rate limiting sederhana per sesi.
* Cache persisten lintas restart (mis. file/SQLite) bila perlu.
* Menampilkan saldo kuota Sectors bila endpoint tersedia.
* Streaming jawaban dengan sitasi field yang bisa diklik.
* Hosting LLM tetap (bukan tunnel yang bergantung pada satu mesin).
