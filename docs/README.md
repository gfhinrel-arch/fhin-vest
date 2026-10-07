# Fhin VEST

**Tanya soal saham IDX dalam bahasa manusia, dapat jawaban dengan angka dari satu sumber yang bisa diverifikasi.**

Sectors Hackathon 2026.

| Field | Value |
| --- | --- |
| Live | https://fhinvest.fhin-farmmyid.workers.dev/ |
| GitHub | https://github.com/gfhinrel-arch/fhin-vest |
| Teaser video | https://youtu.be/855cAcZ7lnQ |
| Judging video | https://youtu.be/cLDftrrzvsw |
| Instagram | https://www.instagram.com/p/DeMtMxfCGEP/ |
| Stack | Next.js 16 (App Router) · React 19 · TypeScript strict |
| Sumber data | Sectors Financial API v2 (`https://api.sectors.app/v2`) |
| Model | OpenAI-compatible, dikonfigurasi via `.env.local` (produksi: Worker secret) |
| Deploy | Cloudflare Workers (`@opennextjs/cloudflare`) |

## Masalah

Mencari tahu "bank mana yang ROE-nya di atas 15%" hari ini berarti membuka screener, tahu nama field
yang tepat, menulis filter SQL-like, memilih kolom, lalu memverifikasi sendiri angkanya. Chatbot biasa
menjawab dengan kalimat yang meyakinkan tanpa angka dan tanpa sumber, sehingga tidak bisa diperiksa.

## Solusi

Fhin VEST adalah asisten riset data, bukan chatbot. Pengguna bertanya bebas; sebuah agent memutuskan
data apa yang perlu diambil, memanggil tool Sectors yang tepat, lalu menjawab dengan angka, menyebut
periode, mata uang, dan nama field yang dipakai. Setiap tool yang berjalan terlihat di layar.

## Prinsip

* **Satu sumber data.** Sectors REST API adalah satu-satunya sumber data pasar.
* **Bukan nasihat keuangan.** Agent menolak menyebut beli/jual/tahan dan menolak menawarkan eksekusi order.
* **Angka, bukan klaim.** Setiap jawaban menyebut field dan periode sehingga bisa diverifikasi.
* **Agent yang transparan.** Nama tool, status, dan biaya kredit terlihat, tidak disembunyikan.

## Mulai

* [Cara kerja](how-it-works.md)
* [Alur pengguna](user-flow.md)
* [Arsitektur](architecture.md)
* [Menjalankan](deployment.md)
* [Keamanan](security.md)
