# Hasil implementasi penyatuan aset

## Cakupan

Katalog berkembang dari **101 menjadi 125 entri**: 11 aset/varian tambahan, 9 komponen yang sebelumnya hanya terlihat dalam komposisi, dan 4 tampilan standar untuk membandingkan skala, palet, keadaan rumah serta pohon. ID asli tetap dipertahankan.

Perbaikan menjangkau semua kelompok aset melalui pembuat aset dan material bersama. Tidak semua entri harus menjadi model baru: spanduk, dadu, kartu, petak dan properti yang masih sesuai tetap dipakai dengan perbaikan yang relevan.

## Perubahan yang diterapkan

| Kelompok | Implementasi |
|---|---|
| Standar visual | `style.ts`: palet bersama, warna empat zona, acuan ukuran dan jenis permukaan. `kit.C` dan warna pita petak merujuk sumber ini. Atlas impor tetap dipertahankan dengan adaptasi saturasi; tidak semua piksel atlas dipetakan persis ke swatch. |
| Rumah | `village.ts`: keluarga rumah kampung berdinding plester, teras, ventilasi, atap genteng/seng; keadaan normal, banjir, abu dan roboh. Rumah Medieval dihentikan pemuatannya. |
| Tenda | Tenda berdinding terpal dengan pintu, flap, tali dan pasak menggantikan gazebo. Modul yang sama membentuk posko. |
| Vegetasi | `vegetation.ts`: tajuk tropis, rangka cabang sama untuk pohon sehat/terbakar/hangus, tunggul berpermukaan potong, kelapa dan sawit berpelepah meruncing/melengkung. Material daun dibagi bersama. |
| Karakter | `characters.ts`: warga, relawan, pemadam dan aparat berbagi bentuk badan berkaki, tangan dan kepala yang berkaitan dengan bidak. Perahu memakai penumpang duduk/rompi. |
| Bidak | Enam profesi dipertahankan; ukuran mata, emisi/ketebalan alas, visor/kacamata, warna pakaian, celemek dan posisi cangkul dirapikan. |
| Kendaraan | `vehicles.ts`: ambulans, water cannon dan van logistik satu keluarga bodi/roda/kaca; skuter baru untuk ojol. Mobil impor tetap dipakai, pelat merah eksplisit ditambahkan. |
| Kota | Jenis ruko, apartemen dan menara kaca dipilih eksplisit; seed hanya variasi. Fasad samping, pintu, pembagian lantai dan warna diseragamkan. |
| Landmark | Monas tetap menjadi ikon utama; kubah dewan dirapatkan, fasad kantor/RS ditambah, area IGD diperjelas, koperasi/dapur diberi detail layanan, bank mendapat ATM, lapas memakai cutaway dan brankas. |
| Efek | Emisi lava/api/emas, lampu lokal dan bloom dikurangi. Banjir lebih keruh dan pantulan air lebih lunak. Abu memakai posisi terhadap waktu; kereta dapat di-scrub dan berhenti di stasiun. |
| Papan | Miniatur kantor besar memakai ikon khusus tanpa menyalin antrean/lampu/efek. Judul sudut dipersingkat, teks satire lengkap tetap ada pada data/panel petak. |
| Properti | Kartu diperbaiki posisi gambarnya dan simbol Musibah; dadu dibeveI, karung menjadi kantong, ompreng memakai bibir/sekat rendah, kayu/uang/logam lebih redup, toa mendapat mulut gelap, barikade mendapat kaki. |
| Tulisan | Spanduk/baliho tetap satu pembuat, warna diselaraskan, kalimat kayu dipecah ulang. Font Barlow Condensed dipakai teks kanvas; tekstur teks identik di-cache dan resolusinya dibatasi. |
| Komposisi | Hutan diberi ruang kosong, demo diperkecil, kota dibedakan jenisnya, posko/warung/dermaga/pompa/pengukur air ditempatkan di Selatan dengan pemeriksaan jarak jalur. |
| Medan/jalur | Noise warna medan diperhalus, grid tanah dikurangi, air lebih matte, bantalan rel mendapat LOD. Katalog jalan dan rel kini menyertakan tanah sebagai konteks. |
| Pemuat model | Model rumah/tenda/pohon lama yang diganti tidak lagi dimuat; cache material membedakan sifat warna/transparansi/sisi, bukan hanya alamat atlas. Geometri dan tekstur bersama ditandai agar tidak dibuang saat instance dilepas. |
| Katalog | Pencarian, navigasi sebelumnya/berikutnya, URL per aset, empat sudut, cahaya netral/senja, fase animasi, intensitas krisis, pemeriksaan geometri dan metrik render. Tata letak responsif memisahkan kontrol dari viewport. |
| Ekspor | Snapshot GLB portabel menghilangkan partikel shader, lampu runtime dan teks SDF. Ekspor kolektif menjadi satu ZIP dengan katalog dan keterangan batasan; lisensi sumber tidak berubah. |
| Optimasi | Mesh statis digabung juga pada pratinjau individual, material daun dipakai bersama, lampu lokal dibatasi 0/2/4 menurut kualitas, resource milik instance dilepas saat berpindah aset. Material transparan dan vertex color tidak digabung secara sembarangan. |

## Aset tambahan dan komponen

Tambahan: rumah kampung normal, posko bantuan, warung warga, dermaga, pompa banjir, penanda tinggi air, rambu titik kumpul, rambu jalan rusak, brankas/arsip, van logistik, dan apartemen.

Komponen yang kini bisa diperiksa sendiri: mobil warga, mobil dinas, mobil polisi, lampu jalan, lampu lalu lintas, bangku, semak, KRL tiga gerbong, serta awan. Aset sumber yang tidak diganti tetap memiliki berkas lisensinya; tidak ada pembelian atau unggahan aset ke layanan luar.

## Validasi dan batas hasil

- Pemeriksaan browser sempat menunjukkan **125/125 valid** dengan model impor dimuat, pada fase 0/2/9/15 detik. Ini pemeriksaan koordinat/transform, bukan penilaian kualitas gambar otomatis.
- Pemeriksaan gambar memastikan kartu Musibah kembali menampilkan judul dan `!`, rumah lokal memiliki empat keadaan, dan tampilan Selatan/Utara memakai keluarga baru.
- **Build produksi akhir lulus**, termasuk kompilasi, pemeriksaan TypeScript dan pembuatan seluruh halaman. `npx tsc --noEmit` juga lulus secara terpisah; `git diff --check` tidak menemukan kesalahan whitespace.
- Pengujian akhir: **140/140 tes lulus**, dua berkas tes, durasi 311,35 detik pada lingkungan ini. Termasuk 132 pemeriksaan aset/ekspor dan 8 tes mesin permainan. Uji simulasi dijalankan dengan `WNIPOLY_SIM_TIMEOUT_MS=600000`; assertion dan jumlah game tidak dikurangi.
- Foto `after/screenshots/002.png`–`008.png` direkam saat implementasi sebelum optimasi akhir. Foto lama di `screenshots/` tetap menjadi bukti audit awal dan tidak ditimpa.
- Sambungan computer-use terputus saat perekaman ulang zona berat. **Belum tersedia set lengkap 125 screenshot akhir, pemeriksaan empat sudut setiap aset, atau pengukuran GPU sesudah optimasi terakhir.** Jangan menganggap galeri awal sebagai tampilan akhir.
- Tidak ada perangkat HP fisik yang diuji. Tata letak responsif dan kualitas rendah tersedia, tetapi target 30 fps HP/60 fps laptop belum dapat dinyatakan tercapai untuk dunia lengkap.
- Ekspor GLB adalah snapshot statis. Gerak runtime, partikel, font SDF, serta logika permainan tetap berada di aplikasi. Tes format GLB tidak menggantikan inspeksi hasil dalam semua aplikasi 3D.

## Cara memeriksa hasil

Jalankan `npm run dev`, buka `/assets`, lalu gunakan **Perbandingan skala**, **Empat keadaan rumah**, **Keadaan pohon tropis** dan **Palet material bersama**. Gunakan pencarian untuk aset tertentu. Tombol **Validasi katalog** menguji katalog yang dimuat browser, dan **Unduh laporan** menyimpan hasilnya.

`npm test` mencakup integritas katalog, posisi gambar kartu, pemilihan jenis bangunan, pelepasan material bersama dan ekspor GLB, selain tes mesin permainan. Model/font/canvas pada tes Node menggunakan stub; rendering dengan model impor diperiksa terpisah di browser.

Simulasi game tetap memakai jumlah permainan dan assertion semula. Pada mesin yang sedang berat, `WNIPOLY_SIM_TIMEOUT_MS=600000` memberi kedua uji simulasi waktu lebih panjang; batas default lama dipertahankan ketika variabel tidak disetel. Tidak ada perubahan aturan permainan.

## Pemeriksaan penerimaan yang masih membutuhkan browser/perangkat

1. Ambil ulang seluruh 125 entri dan empat sudut dunia pada build akhir; cek overlap, bayangan, detail kain dan normal permukaan bergerak.
2. Profil dunia lengkap pada tiga kualitas setelah cache hangat; catat perangkat, viewport, fps/frame time, draw call serta memori. Angka satu aset tidak berlaku bagi seluruh dunia.
3. Uji HP fisik, sentuhan, viewport sempit dan putar layar; pastikan kontrol tidak menutup aksi.
4. Buka ZIP/GLB hasil ekspor dalam viewer 3D lain dan bandingkan tekstur yang memang didukung.

Implementasi dapat dilanjutkan dari sini tanpa mengulang audit awal. Catatan ini sengaja memisahkan perubahan kode yang telah diterapkan dari penerimaan visual/performa yang belum terbukti.
