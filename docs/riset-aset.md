# Riset aset 3D +62WNIPOLY

Tujuan: semua aset terlihat satu gaya, warnanya seragam dan nyaman di mata, tulisan di papan jelas, dan tetap ringan di HP.

## Masalah sekarang

- Semua aset dirakit dari kotak, tabung, dan bola lewat kode. Bentuknya kaku dan detailnya terbatas.
- Warna dipilih per aset, tidak dari satu palet. Hasilnya beberapa warna terlalu jenuh dan saling bertabrakan.
- Tulisan petak digambar ke tekstur kanvas. Saat kamera menjauh atau miring, hurufnya buram.

## Pilihan sumber aset

| Sumber | Isi yang relevan | Lisensi | Format | Catatan |
|---|---|---|---|---|
| KayKit City Builder Bits (Kay Lousberg) | 32+ bangunan kota, jalan, pohon, kendaraan | CC0, bebas komersial tanpa atribusi | glTF, FBX, OBJ | Semua model memakai satu tekstur gradasi 1024px. Warna bisa diganti seluruhnya dengan menukar satu tekstur itu. Dioptimalkan untuk HP. |
| Kenney City Kit (Roads, Commercial, Suburban, Industrial) | Jalan, rambu, lampu lalu lintas, ruko, rumah | CC0 | glTF (cek per paket) | Kit Roads versi 2.1 sudah punya rambu dan lampu lalu lintas. |
| Kenney Car Kit | 40+ kendaraan: sedan, van, ambulans, truk | CC0 | glTF, FBX, OBJ | Untuk mobil dinas, ambulans, truk. |
| Kenney Mini Characters | 12 karakter, masing-masing 32 animasi | CC0 | cek isi zip (glTF belum terkonfirmasi) | Kandidat warga, demonstran, polisi. |
| Kenney Nature Kit | 330+ objek: pohon, batu, tanaman | CC0 | cek isi zip | Hutan, lereng gunung. |
| Quaternius Stylized Nature MegaKit | 116 model alam (versi gratis berisi 68) | CC0 | glTF | Pohon dan batu lebih lembut daripada Kenney. |
| Quaternius LowPoly Buildings Pack | Bangunan modular, palet bisa diganti lewat atlas | CC0 | FBX, OBJ, Blend | Perlu dikonversi ke glTF. |
| Poly Pizza | Ribuan model kurasi | Campuran CC0 dan CC-BY | glTF | Cek lisensi tiap model. CC-BY wajib mencantumkan kredit. |
| Meshy (AI) | Model landmark dari teks/gambar | Gratis: CC BY 4.0 (wajib kredit). Berbayar: tanpa kredit | glTF | Untuk Monas, gedung dewan berkubah, gerobak, tabung gas melon. Perlu dirapikan di Blender. |
| Hunyuan3D 2.x (AI, open source) | Model dari gambar | Lisensi komunitas Tencent, tidak berlaku di UE, Inggris, dan Korea Selatan | glTF | Indonesia termasuk wilayah lisensi, tapi pemain dari UE/Inggris membuat ini berisiko untuk situs publik. Tidak disarankan. |

## Rekomendasi

1. **Satu gaya dasar: KayKit City Builder Bits** untuk kota dan jalan, ditambah Kenney Car Kit untuk kendaraan dan Quaternius Stylized Nature untuk alam. Ketiganya CC0, low-poly, dan memakai atlas warna, jadi bisa diseragamkan.
2. **Seragamkan warna lewat satu atlas palet.** Semua model diarahkan ke satu tekstur palet milik +62WNIPOLY (lihat bagian Palet). Warna dari paket mana pun otomatis cocok satu sama lain.
3. **Landmark khas Indonesia** (Monas, gedung dewan, gunung, empat bangunan pojok) dibuat dengan Meshy paket berbayar atau tangan di Blender, lalu diwarnai ulang dengan atlas yang sama.
4. **Efek tetap prosedural** (lahar, banjir, asap, api, dadu, kartu): ini kekuatan versi sekarang dan tidak perlu diganti.
5. **Kompresi**: semua `.glb` dilewatkan `gltf-transform` (Meshopt + tekstur WebP) supaya unduhan tetap kecil.

## Palet (dipakai di atlas, HUD, dan situs)

Aturan: maksimal 2-3 warna inti plus 1 aksen, saturasi sedang, tanpa hitam atau putih murni di 3D supaya tidak menyilaukan.

| Peran | Warna | Pakai untuk |
|---|---|---|
| Aspal (dasar gelap) | `#2a241c` | Jalan, bayangan, panel HUD |
| Krem kertas | `#efe6d2` | Petak, dinding rumah, teks HUD |
| Kuning rambu (aksen) | `#f2b92e` | Sorotan, tombol utama, garis jalan |
| Rumput | `#7fa65a` | Lapangan Monas, lereng |
| Zona selatan (air) | `#4f86a8` | Banjir, laut, pita petak selatan |
| Zona barat (api) | `#d07a3e` | Hutan terbakar, pita petak barat |
| Zona utara (gunung) | `#a95a46` | Batu vulkanik, pita petak utara |
| Zona timur (kuasa) | `#c9a23a` | Gedung pemerintahan, pita petak timur |

Warna zona sengaja diturunkan saturasinya dari versi sekarang supaya empat zona tetap berbeda tapi tidak saling berteriak.

## Tulisan di papan

- Ganti tekstur kanvas dengan **teks SDF** (`Text` dari drei, berbasis troika-three-text). Huruf tetap tajam di jarak dan sudut berapa pun, dan font dimuat sekali.
- Teks petak: huruf tebal kondensed, krem di atas pita zona yang sudah diredupkan. Kontrasnya dicek minimal 4,5:1.
- Info panjang dipindah ke panel HTML saat petak diklik, bukan ditulis di petak.

## Petak bisa diklik

- Klik atau ketuk petak membuka panel info: nama, zona, jenis, aksi yang tersedia dengan harga saat ini, siapa yang sedang berdiri di sana, dan dampak bencana untuk petak bencana.
- Petak yang dipilih diberi bingkai kuning di papan 3D.
- Panel ditutup dengan tombol Tutup atau Escape.

## Urutan kerja yang disarankan

1. Petak bisa diklik dengan panel info (selesai di tahap ini).
2. Pasang pemuat `.glb` + kompresi, lalu tukar satu aset (mis. rumah dan mobil) sebagai percobaan.
3. Buat atlas palet dan terapkan ke semua aset `.glb`.
4. Ganti tulisan petak ke teks SDF.
5. Ganti landmark satu per satu: Monas, gedung dewan, gunung, bangunan pojok.

## Status penggantian aset

Pemuat ada di `src/assets3d/models.ts`. Model dimuat sekali sebelum dunia dibangun. Atlas warnanya diredupkan sekali per file atlas, dan satu material dipakai bersama per atlas supaya mesh bisa digabung. Kalau model gagal dimuat, aset prosedural lama otomatis dipakai.

| Aset | Sekarang | Sumber |
|---|---|---|
| Mobil (biasa, dinas, gosong, polisi konvoi) | Model | KayKit City Builder Bits |
| Gedung kota zona timur (+ papan nama satire) | Model | KayKit City Builder Bits |
| Lampu jalan, lampu lalu lintas, semak, bangku | Model | KayKit City Builder Bits |
| Pohon (hutan, lereng gunung, taman Monas) dan tunggul | Model | KayKit Medieval Hexagon |
| Batu | Model | KayKit Medieval Hexagon |
| Rumah terendam, rumah tertimbun abu, rumah roboh | Model | KayKit Medieval Hexagon |
| Tenda pengungsian | Model | KayKit Medieval Hexagon |
| Sawit, kelapa, pohon terbakar/hangus | Prosedural | Tidak ada padanan CC0 dengan gaya sama |
| Monas, gedung dewan, bursa, bank, gunung, 4 bangunan pojok, bidak | Prosedural | Landmark khas Indonesia: perlu Meshy (berbayar) atau Blender |
| Efek: lahar, banjir, asap, api, dadu, kartu | Prosedural | Sengaja tetap prosedural |

Model ada di `public/models/kaykit/` dan `public/models/kaykit-medieval/`, masing-masing dengan `LICENSE.txt` aslinya.

## Kredit

Model 3D oleh Kay Lousberg (www.kaylousberg.com), paket KayKit City Builder Bits dan KayKit Medieval Hexagon, lisensi CC0. Kredit tidak wajib tapi dicantumkan sebagai terima kasih.

## Sumber

- KayKit City Builder Bits: https://kaylousberg.itch.io/city-builder-bits
- Kenney City Kit Roads: https://gamedev.net/news/5156-city-kit-roads/
- Kenney Car Kit: https://kenney-assets.itch.io/car-kit
- Kenney Mini Characters: https://opengameart.org/content/mini-character-1
- Kenney Nature Kit: https://opengameart.org/content/nature-kit
- Quaternius Stylized Nature MegaKit: https://quaternius.com/packs/stylizednaturemegakit.html
- Quaternius LowPoly Buildings Pack: https://opengameart.org/content/lowpoly-buildings-pack
- Poly Pizza: https://gamefromscratch.com/poly-pizza-a-replacement-to-google-poly/
- Lisensi Meshy: https://intercom.help/meshy/en/articles/16102098-can-i-use-meshy-assets-commercially
- Lisensi Hunyuan3D 2.0: https://huggingface.co/tencent/Hunyuan3D-2/blob/main/LICENSE
- troika-three-text: https://npmjs.com/package/troika-three-text
