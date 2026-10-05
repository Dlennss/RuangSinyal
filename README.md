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

## Validasi dan audit

- Backend: jalankan `go test -count=1 ./...` dan `go vet ./...` dari `ruangsinyal-be`.
- Frontend: jalankan `npx tsc --noEmit --incremental false` dan `npm run lint -- --quiet` dari `ruangsinyal-fe`.
- Tes regresi frontend (Node 22.18+ atau 24): `node --experimental-strip-types --test tests/*.test.mjs`.
- Catatan cakupan dan batas pengujian: [Audit 14 September 2026](docs/AUDIT-2026-09-14.md).

Login Apple memerlukan `APPLE_CLIENT_ID` di backend. Untuk beberapa aplikasi,
isi `APPLE_CLIENT_IDS` dengan daftar ID dipisahkan koma; `APPLE_BUNDLE_ID` dapat
dipakai untuk ID aplikasi native dan notifikasi Apple. Tanpa ID yang diizinkan,
token Apple ditolak. Jangan memakai Client ID Google untuk variabel ini.
