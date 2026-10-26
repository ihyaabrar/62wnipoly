# Pemeriksaan aset — 26 Oktober 2026

Katalog `/assets` berisi 101 entri, termasuk komposisi zona, model, efek, bidak, dan spanduk. Ini bukan 101 berkas model terpisah.

## Integritas berkas

- `public/models`: 29 glTF, 29 buffer BIN, 3 GLB, 3 tekstur PNG, dan 3 berkas lisensi.
- Seluruh referensi buffer dan gambar lokal dari 29 glTF ditemukan. Pemeriksaan ini memvalidasi keberadaan berkas, bukan seluruh spesifikasi glTF atau kualitas geometri.
- KayKit/Kenney dipadukan dengan landmark dan efek prosedural. Label katalog diperbaiki agar mencerminkan campuran ini.

## Peningkatan yang diterapkan

- Monas: tangga empat sisi, panel relief museum, emisi emas lebih rendah agar bentuk api lebih terbaca.
- Taman: warna rumput mengikuti palet riset, empat kebun bunga geometris, empat bangku, dan gerbang pagar sejajar jalan.
- Kamera katalog: jarak dihitung dari bidang pandang horizontal dan vertikal agar aset tetap masuk pada layar sempit.

## Validasi

- TypeScript: `npx tsc --noEmit` lulus.
- Mesin permainan: `npm test`, 8 tes lulus.
- Halaman katalog dan render Taman Monas diperiksa di browser pada kualitas sedang.
- Performa HP, semua 101 entri, ekspor GLB, dan kualitas rendah/tinggi belum diuji secara menyeluruh.

## Prioritas lanjutan

1. Ukur draw call dan waktu frame dunia lengkap sebelum menambah detail pada semua zona.
2. Periksa konsistensi skala bidak, kendaraan, dan bangunan dalam komposisi papan.
3. Tingkatkan landmark khas Indonesia satu per satu dengan bahasa bentuk yang sama.
4. Periksa ekspor teks SDF dan efek animasi: hasil GLB statis tidak otomatis membawa callback animasi prosedural.
