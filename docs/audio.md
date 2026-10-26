# Audio +62WNIPOLY

Semua suara disintesis dengan Web Audio: tanpa file audio, unduhan nol, dan nada bisa mengikuti keadaan game.

## Analisis (sebelum perubahan)

- 20 efek suara: dadu (kocok, lempar, benturan), langkah, kartu, koin, sakit, bencana (erupsi, banjir, karhutla, sirene), batu jatuh, jeruji lapas, peluit polisi, gugur, menang, giliran, klik.
- Tidak ada musik latar.
- Tidak ada suara untuk: makan, pulih, Level Krisis naik, trading halt.
- Penutup menang dan gugur hanya empat nada pendek, dan kalah memakai suara yang sama dengan pemain gugur di tengah game.
- Satu tombol bisukan untuk semuanya, tanpa volume terpisah.

## Yang ditambahkan

| Bagian | Isi |
|---|---|
| Musik latar (`music.ts`) | Gamelan laras slendro: saron berpasangan sumbang tipis (ombak), peking pengisi, kendang, kenong, gong ageng tiap 64 langkah. Melodi jalan acak ber-seed, selalu jatuh di nada dasar. |
| Mengikuti Level Krisis | Tempo naik dari 81 ke 126 bpm, peking masuk di level 3, kendang rapat di level 5, dengung sekon kecil di level 4 ke atas yang makin keras. |
| Mereda otomatis | Musik turun ke 30% saat sinematik bencana, layar aturan, atau kartu terbuka. |
| Efek baru | `eat` (makan), `heal` (pulih), `crisis` (dua gong rendah saat Level Krisis naik), `halt` (alarm bursa). |
| Penutup | `victory` (frase slendro naik + gong) dan `defeat` (frase turun lambat + gong menggantung). Musik dipudarkan dulu. |
| Pengaturan | Slider Musik dan Efek terpisah, disimpan di perangkat. Tombol bisu tetap membisukan semuanya. |

## Belum ada (ide berikut)

- Suara sekitar per zona (ombak di selatan, gemeretak api di barat) yang mengeras saat kamera mendekat.
- Pergantian musik saat Level Krisis melewati ambang, bukan hanya tempo.
- Suara khusus per aksi di petak (kerja, pinjam, beli saham).
- Pilihan "musik mati, efek nyala" sebagai satu tombol di HP.
