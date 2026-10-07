# Alur pengguna

Tiga halaman utama: **beranda**, **chat**, **screener**, plus **bedah emiten**.

## 1. Beranda `/`

Hero menjelaskan apa ini, lalu dua kartu aksi:

* **Tanya AI** → `/chat`
* **Cek saham** → `/screen`

Di bawahnya, bagian "Cara kerja" tiga langkah: kamu bertanya → agent memilih data → jawaban dengan angka.
Footer memuat disclaimer: alat bantu riset, bukan nasihat keuangan.

## 2. Chat `/chat`

Pertanyaan bebas. Yang terlihat saat agent bekerja:

* **Nama tool + status** (jalan / selesai / gagal) dan biaya kredit per tool.
* Teks jawaban muncul mengalir token demi token, dengan kursor berkedip.
* Tombol **Batal** selama agent bekerja.
* Empat contoh pertanyaan yang bisa diklik.
* **Kredit terpakai** untuk request itu (bukan sisa kuota — ledger baru tiap request).

## 3. Screener `/screen`

Form di kiri, tabel di kanan.

* Filter: sub-sektor, ROE minimum, PE maksimum, market cap minimum; urutkan berdasarkan pilihan.
* Tabel: kode (klik ke bedah emiten), nama, sub-sektor, market cap, PE, ROE (dengan meter).
* "Menampilkan N dari M", biaya kredit, empty state yang menyarankan cara melonggarkan filter.
* Skeleton saat memuat (`loading.tsx`).

## 4. Bedah emiten `/company/[symbol]`

* Header: nama perusahaan + kode.
* Kartu ringkasan: harga terakhir (dengan tanggal), market cap, PE, PB, ROE, DER — tiap angka menyebut
  periode dan mata uang.
* Tabel kuartal terakhir (revenue, laba, ekuitas, margin).
* Bagian **"Kenapa angka ini"**: paragraf bahasa manusia dari agent yang sama.
* Simbol tidak ada → halaman 404 yang jelas, bukan crash.
