# RuangSinyal

RuangSinyal adalah aplikasi pembayaran digital dengan frontend dan backend
terpisah dalam satu folder proyek.
Frontend dan backend berada dalam satu folder proyek, tetapi konfigurasi,
database, domain, rekening, serta kredensial provider wajib dibuat khusus
untuk RuangSinyal.

## Struktur

- `ruangsinyal-fe`: aplikasi Next.js
- `ruangsinyal-be`: API Go dan migrasi database

## Menyiapkan konfigurasi

1. Salin `ruangsinyal-fe/.env-example` menjadi `.env.local`.
2. Salin `ruangsinyal-be/.env.example` menjadi `.env`.
3. Gunakan database baru; jangan arahkan `DATABASE_URL` ke database proyek lain.
4. Isi rekening deposit melalui variabel `RUANGSINYAL_DEPOSIT_*`.
5. Gunakan API key, webhook, OAuth, dan domain khusus RuangSinyal.

File environment dan hasil build tidak disertakan dari proyek sumber.
