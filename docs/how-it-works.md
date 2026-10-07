# Cara kerja

Fhin VEST menjalankan **satu loop tool-calling terbuka**: model memilih tool, kode mengeksekusinya,
hasilnya dikembalikan ke model. Tidak ada jawaban yang ditulis tanpa data.

## Loop agent

1. Pengguna mengirim pertanyaan.
2. Agent (OpenAI-compatible, `stream: true`, `temperature: 0`) memutuskan: butuh data apa?
3. Model memanggil satu atau lebih tool. Servernya yang mengeksekusi, bukan model.
4. Hasil tool (JSON) dikembalikan ke model.
5. Diulang maksimal **4 putaran**, lalu model menulis jawaban akhir.

Setiap langkah dikirim ke browser sebagai event NDJSON: `text`, `tool`, `tool_result`, `done`, `error`.

```mermaid
sequenceDiagram
    participant U as Pengguna (browser)
    participant R as Route handler /api/chat
    participant A as Agent (lib/agent.ts)
    participant L as LLM (LLM_BASE_URL)
    participant S as Sectors API v2

    U->>R: POST { messages }
    R->>A: 12 pesan terakhir
    A->>L: chat/completions + tools
    L-->>A: tool_call(screen_companies)
    A->>S: GET /companies/?where=...
    S-->>A: results + pagination
    A->>L: tool result
    L-->>A: jawaban teks
    A-->>U: NDJSON text / tool / tool_result / done
```

## Empat tool

| Tool | Endpoint Sectors | Kapan dipakai |
| --- | --- | --- |
| `screen_companies` | `/companies/` | Cari/urutkan emiten dengan kondisi (utamakan `where`) |
| `get_company_report` | `/company/report/{symbol}/` | Detail satu simbol; minta section yang perlu saja |
| `get_top_movers` | `/companies/top-changes/` | Gainer/loser per periode |
| `get_quarterly_financials` | `/financials/quarterly/{symbol}/` | Tren kuartal satu simbol |

## Batas yang disengaja pada loop

* **`id` tool_call yang hilang.** Sebagian router menghilangkan `id` saat streaming. Kalau kosong, kode
  membuat id sendiri dan memakai nilai yang sama di assistant message dan tool reply.
* **Hasil tool panjang.** Di atas 60.000 karakter, hasil diganti objek
  `{ truncated: true, note, preview }`. Tidak pernah dipotong dengan `.slice()` karena itu merusak JSON.
* **Biaya.** Setiap panggilan dihitung kreditnya (lihat tabel di [pendahuluan](README.md)); ledger dikirim
  di event `done`.
