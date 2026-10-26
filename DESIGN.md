# Weenipoly (WNI + Poly)

Game papan 3D satire tentang bertahan hidup sebagai Warga Negara Indonesia. Tidak ada pemenang "paling kaya". Pemenang adalah WNI terakhir yang masih bertahan.

Tagline sementara: **"Bukan siapa yang paling kaya. Siapa yang paling kuat bertahan."**

Target: web (Next.js di Vercel), 2-4 pemain, lawan bot dan online, 3D maksimal, UI/UX kelas produk.

## 1. Prinsip

1. **Satire harus sesuai kenyataan.** Setiap kartu dan event berpijak pada kejadian atau data nyata yang terdokumentasi. Tiap kartu punya label **"Di dunia nyata"** berisi fakta singkat dan tautan sumber. Ini membuat game lucu sekaligus tidak bisa dibantah sebagai karangan.
2. **Menyindir sistem, bukan orang.** Lembaga, program, dan kebijakan boleh disindir langsung. Tokoh dan nama orang yang masih diproses hukum dibuat rekaan (praduga tak bersalah, dan aman dari laporan atau blokir platform).
3. **Bertahan, bukan menumpuk.** Semua mekanik memaksa pemain memilih antara kesehatan, uang, dan pangan, dan krisis terus naik.
4. **Satu aturan, banyak klien.** Mesin aturan murni (tanpa tampilan) dipakai bot, mode online, dan tes otomatis.
5. **Tidak jatuh seperti pendahulu.** Lihat bagian 2.

## 2. Pembanding: Konohapoly

Screenshot yang kamu kirim adalah **Konohapoly** (`konohapoly.vercel.app`): "Monopoli Satire Indonesia, 3-4 pemain online", tagline "Tujuannya bukan jadi paling kaya. Tujuannya bertahan.", tag isu Inflasi, Pungli, Pemilu, Pilpres, papan isometrik low-poly dengan Monas di tengah.

Hasil cek langsung (dibuka lewat browser, diperiksa 26 Oktober 2026):
- Situsnya sekarang menampilkan **"DITUTUP SEMENTARA"**: server kewalahan karena pemain datang lebih cepat dari kapasitas, semua room dibubarkan. Hanya halaman statis, tidak ada game yang bisa dicoba. Jadi saya hanya bisa menilai dari screenshot.
- Pelajaran: (a) online harus dirancang tahan beban sejak awal, (b) jangan menyimpan room hanya di memori satu server, (c) beri antrean, batas room, dan pesan error yang ramah.

Konsepnya (bertahan, satire Indonesia, Monas di tengah) berdekatan dengan ide kita. Supaya Weenipoly berdiri sendiri:
- Nama, logo, palet, aset, dan teks dibuat dari nol. Tidak ada yang disalin.
- Pembeda utama: **empat zona bencana dan Level Krisis** (bukan sekadar papan Monopoly bertema), **kartu bersumber nyata**, **mode bot yang bagus** (tidak wajib online), dan **kualitas 3D dan UX yang lebih tinggi**.

Catatan: "Monopoly" adalah merek dagang Hasbro. Kita tidak memakai nama atau tata letak papan aslinya.

## 3. Fakta riset (sebagai bahan konten)

Riset sampai 26 Oktober 2026. Semua angka masih harus dicek ulang ke sumber primer sebelum masuk teks kartu final. Kolom status: **Kuat** = beberapa sumber konsisten, **Cek** = angka berbeda antar-sumber atau satu sumber.

| Zona / tema | Fakta | Status | Sumber |
|---|---|---|---|
| Selatan: banjir bandang Sumatera | BNPB per 12 Jan 2026: 1.189 korban meninggal (Aceh 550, Sumut 375, Sumbar 231). Kayu gelondongan hanyut dan dipakai ulang untuk hunian sementara. Bareskrim menetapkan tersangka pembalakan liar di Sumut, Kemenhut mengaudit perusahaan. | Kuat (angka korban), Cek (penyebab izin tambang/sawit belum terbukti di sumber ini) | [Metro TV](https://www.metrotvnews.com/read/kBVCM6RL-bnpb-korban-meninggal-bencana-sumatra-1189-orang), [Kompas](https://lestari.kompas.com/read/2026/01/06/121047986/kemenhut-angkut-ratusan-gelondongan-kayu-banjir-sumatera) |
| Barat: karhutla | Kemenhut: 107.465 ha terbakar Jan-Jun 2026 (Kalbar 28.680 ha, Riau 15.478 ha). Titik panas 2026 naik sekitar 3x dari tahun lalu. Kalsel siaga darurat sampai 31 Okt 2026. | Kuat | [RCTI+](https://www.rctiplus.com/news/detail/berita-utama/5431984/kemenhut--107-465-hektare-hutan-dan-lahan-ludes-terbakar-sepanjang-2026), [Metro TV](https://www.metrotvnews.com/read/b2lC64eP-titik-panas-2026-naik-3-kali-lipat-dibanding-tahun-lalu) |
| Utara: erupsi gunung | Belum ada data erupsi 2026 di riset ini. | **Perlu riset lanjutan** | - |
| Gempa (event acak) | Gempa M6,7 Sulawesi Tengah 16 Juni 2026: sedikitnya 3 meninggal, ribuan rumah rusak (angka BNPB 1.652, BPBD Sigi 2.319). | Cek (jumlah rumah beda per sumber) | [CNN Indonesia](https://www.cnnindonesia.com/nasional/20260619210027-20-1371069/2319-rumah-rusak-akibat-gempa-di-sigi), [RCTI+](https://www.rctiplus.com/news/detail/nasional/5409428/update-gempa-m-6-7-sulawesi-tengah--1-652-rumah-rusak--3-tewas-dan-91-luka-luka) |
| Timur: MBG | Kejagung menaksir kerugian negara dugaan korupsi tata kelola MBG sekitar Rp10 triliun (perkiraan BPKP, belum dirinci). Berkas enam tersangka dilimpahkan 29 Sep 2026. Korban keracunan menurut JPPI (organisasi pemantau, bukan data resmi) 40.759 sejak 2025. | Cek (perkiraan dan satu sumber) | [Investortrust](https://investortrust.id/national/117798/eks-kepala-bgn-dadan-hindayana-cs-segera-diadili-atas-korupsi-mbg-kerugian-negara-tembus-rp-10-triliun), [NU Online](https://nu.or.id/nasional/jppi-korban-keracunan-mbg-capai-40-759-orang-sejak-2025-6MDir) |
| Timur: Kopdes Merah Putih | Tiap koperasi dapat pinjaman hingga Rp3 miliar dari bank Himbara, tenor sampai 6 tahun, bunga 6% ditanggung APBN. Cicilan pertama jatuh tempo September 2026. Angka plafon sempat berubah-ubah (Rp3-5 miliar) di pernyataan pejabat. | Kuat (skema), Cek (angka lama berubah) | [Kontan](https://nasional.kontan.co.id/news/modal-kopdes-merah-putih-dari-pinjaman-himbara-rp-3-miliar-bunga-ditanggung-apbn), [Bisnis](https://ekonomi.bisnis.com/read/20260723/12/1990572/zulhas-sebut-cicilan-pertama-kopdes-ke-himbara-jatuh-tempo-september-2026) |
| Monas: demo | Demo 28-30 Agustus 2025 dipicu tunjangan DPR dan tindakan aparat, jatuh korban jiwa termasuk dua pengemudi ojol. Daftar tuntutan viral "17+8" (bukan dokumen resmi), 8 poin jangka panjang bertenggat 31 Agustus 2026. | Kuat (peristiwa), daftar 17+8 adalah kompilasi viral | [Metro TV](https://www.metrotvnews.com/read/kewCM8pQ-apa-itu-178-yang-ramai-di-medsos-yuk-simak), [Detik](https://inet.detik.com/cyberlife/d-8091618/apa-itu-17-8-tuntutan-rakyat-yang-viral-di-medsos-indonesia) |
| Harga | Inflasi tahunan September 2026 3,28%. Beras premium di penggilingan naik 10,52% setahun, medium 4,72%. HET medium zona 1 Rp13.500, rata-rata pasar Rp14.644. | Kuat | [RCTI+](https://www.rctiplus.com/news/detail/idxchannel/5484428/bps-catat-inflasi-ri-0-30-persen-di-september-2026), [Investortrust](https://investortrust.id/business/118024/harga-beras-premium-naik-10-52-setahun-bps-ungkap-dampaknya) |
| Kerja | PHK menurut Kemnaker: 43.000 sampai Juni 2026 (laporan lain 63.789 sampai September). Survei Populix 2025: PHK/pengangguran kekhawatiran utama (54%). | Cek (angka beda antar-periode) | [Okezone](https://economy.okezone.com/read/2026/06/30/320/3227484/kemnaker-catat-phk-tembus-43-000-pekerja-hingga-juni-2026), [Goodstats](https://data.goodstats.id/statistic/isu-ekonomi-yang-paling-bikin-publik-indonesia-khawatir-2025-iA2k9) |
| Korupsi | Indeks Persepsi Korupsi 2025: skor 34/100, peringkat 109 dari 180 (turun dari 37 dan peringkat 99). | Kuat | [Katadata](https://databoks.katadata.co.id/en/economics-macro/statistics/698c16c755610/the-corruption-perception-index-of-indonesia-worsened-in-2025) |
| Pinjol dan judol | Perputaran judol 2025 Rp286,84 triliun (PPATK, klaim turunnya diragukan pengamat). OJK blokir 953 entitas pinjol ilegal sampai Maret 2026. | Cek | [Selular](https://selular.id/2026/01/kerugian-negara-capai-rp1-100-triliun-akibat-judol-di-2025/) |
| Pungli | APINDO: pungli menambah biaya kirim barang 15-20%. Data lama (2019), pakai sebagai ilustrasi, bukan angka terkini. | Cek (lama) | [Hukumonline](https://www.hukumonline.com/berita/a/penegakan-hukum-kejahatan-pungli-masih-lemah-lt5d0cf51ad8076?page=all) |
| Tanggul Laut Raksasa | Perkiraan Rp1,3 kuadriliun, 15-20 tahun, groundbreaking Jakarta ditargetkan September 2026. | Cek (target tanggal bisa bergeser) | [CNBC Indonesia](https://www.cnbcindonesia.com/news/20260504165322-4-732106/proyek-tanggul-laut-raksasa-dikebut-jakarta-semarang-jadi-prioritas) |

Belum diriset: UKT, macet Jakarta, ormas, calo, sengketa tanah, pajak, BBM. Bisa jadi riset putaran berikut.

## 4. Aturan permainan

> Status Fase 1: aturan sudah diimplementasikan di `src/engine` (mesin murni, deterministik dengan seed) beserta bot heuristik. Angka di bawah adalah draft awal; angka yang berlaku ada di `src/engine/data.ts`, disetel lewat simulasi 800 game bot: rata-rata 13,9 ronde, peluang menang tiap karakter 22-27%, penyebab gugur: sakit 44%, kelaparan 34%, pinjol 21%.

### Pemain dan status
2-4 pemain, manusia atau bot. Tiap pemain adalah satu WNI dengan tiga angka (nilai awal masih draft, harus diuji):

- **Kesehatan** (100): fisik dan mental. Turun karena asap, banjir, keracunan, kelelahan.
- **Dompet** (Rp2.000.000 dalam uang game): kas tunai. Bisa minus sampai batas utang (draft Rp-1.000.000).
- **Pangan** (5 porsi): stok makanan dan air bersih.

### Gugur
- Kesehatan sampai 0.
- Dompet melewati batas utang (diburu pinjol).
- Pangan 0 selama 2 giliran berturut-turut.

Pemain terakhir yang hidup menang. Kalau batas ronde tercapai, menang berdasarkan **skor bertahan**: Kesehatan + Pangan x 10 + (Dompet / 100.000).

### Giliran
1. Lempar dadu, jalan searah jarum jam di cincin 40 petak.
2. Mendarat di petak, pilih aksi petak (satu per giliran).
3. Boleh pakai satu kartu simpanan.
4. Akhir ronde (semua sudah jalan): **Level Krisis +1** dan jalankan efek bencana.

### Level Krisis
Naik tiap ronde. Menentukan jumlah dan kekuatan bencana:
- Level rendah: satu zona terkena, efek ringan.
- Level sedang: dua zona sekaligus, harga naik.
- Level tinggi: semua zona bergantian, bantuan makin langka.

Ini mesin yang memaksa pemain gugur satu per satu, sehingga game selalu punya akhir (target 20-35 menit).

### Aksi petak (contoh)
Cari makan, berobat, kerja serabutan (dapat Dompet, kurangi Kesehatan), antre bantuan (dapat Pangan, butuh satu giliran, bisa kena pungli), pinjam uang (cepat tapi berbunga), mengungsi ke zona lain.

### Interaksi antar pemain
Berbagi atau menjarah Pangan, aliansi sementara (efek bencana dibagi rata antar sekutu), dan dukung demo di Monas (bonus bersama tapi risiko kena aparat).

### Kartu
- **Kesempatan**: peluang (bansos cair, dapat proyek, viral lalu laris).
- **Musibah**: kejadian buruk (PHK, banjir kiriman, keracunan).
- **Kartu bersumber**: setiap kartu menampilkan "Di dunia nyata" + tautan. Target awal 60 kartu, tiap kartu satu fakta tervalidasi.

### Karakter (rekaan)
Buruh pabrik kena PHK, driver ojol, guru honorer, petani, mahasiswa, pedagang pasar. Tiap tipe punya kelebihan dan kelemahan kecil (mis. petani Pangan awal tinggi, Dompet tipis).

## 5. Papan 3D (40 petak)

Cincin 10 petak per sisi. Di dalam cincin **hanya taman Monas**. Empat zona bencana berada **di luar papan**, masing-masing di sisinya. Di tiap pojok luar ada bangunan yang sesuai petak sudut:

| Petak sudut | Bangunan pojok |
|---|---|
| 0 (kanan bawah): MULAI, gajian langsung dipotong pajak | Kantor Pajak |
| 10 (kiri bawah): RS penuh, antre BPJS | Rumah Sakit |
| 20 (kiri atas): Bandara, #KaburAjaDulu | Bandara sepi |
| 30 (kanan atas): Lapas VIP | Lapas dengan kamar suite |

Demo dipindah dari Monas ke depan Gedung Dewan (zona Timur).

Tanah keempat zona membaur tanpa batas tajam. Jalan raya berliku mengelilingi papan dengan cabang ke tiap bangunan pojok, dan rel kereta berliku di lingkar luar. Kerusakan mengikuti bencana zona: jembatan jalan ambruk di Selatan, jalan tertimbun abu dan terowongan rel setengah tertimbun di Utara, pohon terbakar tumbang dan bantalan rel hangus di Barat, ruas retak gempa di timur laut. Ruas Timur justru mulus, lengkap dengan lampu dan mobil dinas berplat merah. Tanah dasar berumput; coklat dan kelabu hanya di pusat bencana. Tanah di bawah jalan dan rel digali mengikuti tinggi jalurnya, jadi jalur tidak pernah tertutup tanah. Selatan berupa lembah yang lebih rendah dari papan; banjir (biru, luapan sungai) hanya menggenangi bagian terendah sehingga rumah di pinggir lembah kering. Di tepi jauh ada pantai berkelok dan laut biru berombak. Gunung lebih tinggi, dan rel menembus kakinya lewat terowongan berdinding batu. Pesawat lepas landas dari bandara, memutari dunia, lalu mendarat lagi. Sungai biru mengalir dari tepi barat melewati hutan lalu bermuara ke lembah banjir; helikopter mengambil air di sungai dan menyiram garis api. Zona Timur ditambah gedung kota (menara kaca, apartemen, ruko) dan satu proyek mangkrak dengan crane. Kereta berjalan memutari papan, melambat di ruas rusak (rel yang tergerus banjir diganti jembatan kayu darurat), dan berhenti di stasiun Timur.

| Sisi | Zona | Isi visual | Peran di game |
|---|---|---|---|
| Selatan | Pantai dan rumah terendam banjir | Air naik bertahap, atap rumah menyembul, kayu gelondongan hanyut, perahu karet, tenda pengungsian | Banjir, kayu menghantam petak, pengungsian, bantuan lewat jalur air |
| Utara | Gunung meletus | Gunung berasap, lava dan hujan abu, atap roboh, jalur evakuasi | Erupsi, abu mengurangi Kesehatan, jalur evakuasi |
| Barat | Hutan terbakar dan kabut asap | Pohon terbakar, kabut tebal dengan jarak pandang turun, helikopter pemadam | Karhutla menjalar petak demi petak, ISPA |
| Timur | Kompleks pemerintahan | Gedung dewan, badan gizi, kantor koperasi desa, bank pelat merah, tumpukan uang dan peti harta | Kopdes, MBG, bansos, pungli, birokrasi |
| Tengah | Taman Monas | Tugu dengan lidah api emas, rumput, jalan setapak, lampu taman | Ikon papan, titik kumpul |

Daftar 40 petak lengkap (nama, efek, kartu terkait) menyusul di dokumen terpisah setelah konsep ini disetujui.

## 6. Arah visual 3D

Stylized dan sinematik, bukan realistis penuh. Alasannya: tampil bagus di laptop biasa dan HP, bisa dibuat konsisten oleh satu orang.

- **Gaya**: low-poly bertekstur tangan dengan palet kontras tinggi. Satire berasa lewat detail kecil (papan nama, spanduk, grafiti), bukan lewat poligon.
- **Warna**: tiap zona punya tema warna sendiri (biru kelabu banjir, oranye abu vulkanik, hijau pekat berasap, emas-merah pemerintahan). Palet disatukan oleh warna netral gelap.
- **Cahaya**: satu directional light dengan bayangan lunak, ambient bergradasi, bloom ringan, fog volumetrik palsu di Barat.
- **Cuaca dan bencana sebagai animasi**:
  - Banjir: bidang air dengan shader gelombang, naik sesuai Level Krisis.
  - Erupsi: partikel asap, bara, dan hujan abu.
  - Karhutla: api partikel dan fog yang menebal.
  - Gempa: kamera bergetar dan petak retak.
- **Bidak**: figur kartun per karakter dengan animasi lompat antar petak, bayangan, dan ekspresi saat kena efek.
- **Dadu**: dadu 3D dengan fisika sederhana atau animasi terjadwal (supaya deterministik di online).
- **Kamera**: sudut isometrik miring dengan zoom dan putar. Otomatis fokus ke aksi (zoom ke petak yang dihuni, goyang saat bencana). Pemain bisa kunci kamera.
- **Performa**: target 60 fps di laptop menengah dan 30 fps di HP. Pakai instancing, tekstur terkompresi (KTX2), model GLTF dengan Draco, bayangan yang di-bake untuk objek statis, dan pengaturan kualitas Rendah/Sedang/Tinggi otomatis.
- **Aset**: dibuat atau dikonversi sendiri, atau pakai sumber berlisensi bebas (CC0). Tiap aset dicatat lisensinya.

## 7. UI/UX

Contoh referensi (halaman depan bergaya poster dengan papan 3D di tengah) sudah bagus sebagai titik awal. Kita naikkan:

- **Halaman depan**: papan 3D hidup di latar (kamera berputar pelan, banjir naik-turun), judul besar, tombol utama "Main Lawan Bot" dan "Main Online", ticker headline satir bersumber nyata.
- **Lobi**: buat/gabung room dengan kode pendek, pilih karakter, atur jumlah bot. Pesan jelas kalau server penuh (antrean, bukan error mentah).
- **HUD di game**:
  - Panel status tiap pemain (Kesehatan, Dompet, Pangan) dengan animasi perubahan angka.
  - Meter **Level Krisis** di atas layar, berubah warna dan bergetar saat naik.
  - Daftar giliran dan tombol aksi besar (satu aksi utama jelas).
  - **Berita Duka**: ticker di bawah, headline bencana dan kebijakan dalam gaya portal berita.
  - Panel kartu: kartu terbuka dengan animasi balik, bagian "Di dunia nyata" bisa dibuka untuk lihat sumber.
- **Aksesibilitas**: kontras warna sesuai WCAG AA, bisa dioperasikan dengan keyboard, label untuk pembaca layar, opsi kurangi gerakan (mengurangi getaran kamera dan partikel), ukuran teks bisa diatur. Teks utama Bahasa Indonesia, bahasa lain menyusul.
- **Mobile dulu**: layout portrait dan landscape, tombol besar, gestur pinch dan putar, HUD yang bisa dilipat.
- **Suara**: efek (dadu, langkah, sirene, hujan abu), musik latar tiap zona yang berubah mengikuti Level Krisis. Ada tombol bisukan, default aman.
- **Rasa humor**: salinan teks (microcopy) pakai gaya pemerintahan satir, seperti pesan "Kementerian Urusan Server" pada contoh. Tapi tombol dan instruksi tetap jelas.
- **Tanda tanya keamanan teks**: kartu yang menyebut kasus yang masih berproses hukum memakai rekaan, bukan nama asli.

## 8. Arsitektur teknis

- **Kerangka**: Next.js (App Router) + TypeScript di Vercel.
- **3D**: `three` lewat `@react-three/fiber` dan `@react-three/drei`, efek lewat `postprocessing`.
- **State UI**: Zustand.
- **Mesin aturan**: modul TypeScript murni (`src/engine`), tanpa DOM atau Three.js. Deterministik dengan RNG ber-seed, sehingga bot, online, dan tes memberi hasil sama. Diuji dengan Vitest, termasuk simulasi ribuan game bot-lawan-bot untuk mengecek keseimbangan.
- **Bot**: berjalan di klien (mode offline) dan di server (mode online) memakai mesin yang sama. Tingkat kesulitan: mudah, normal, sulit (heuristik bernilai, bukan machine learning).
- **Online**: server otoritatif per room. Klien kirim aksi, server validasi dan sebar hasil, klien hanya menampilkan.
  - Pilihan layanan realtime yang terkelola (bukan memori satu server) supaya tidak runtuh seperti pendahulu: antrean masuk, batas room, dan bersihkan room kosong. Pilihan konkret (PartyKit, Ably, Supabase Realtime, atau fungsi WebSocket Vercel) diputuskan di fase online setelah dibandingkan.
  - Reconnect otomatis dan pemulihan keadaan dari log aksi.
- **Konten**: kartu dan petak disimpan sebagai data (JSON) dengan skema ter-validasi, tiap kartu punya `fakta`, `sumber`, dan `tanggalVerifikasi`.
- **Vercel**: repo ke GitHub, preview deploy tiap cabang, produksi di `weenipoly.vercel.app` (domain sendiri menyusul), Web Analytics, dan Speed Insights. Aset 3D diberi cache panjang.
- **Kualitas**: lint, tes engine di CI, uji performa (jumlah draw call dan ukuran bundel), ukuran muat awal dijaga di bawah target (draft: 5 MB sebelum aset 3D, aset dimuat bertahap).

## 9. Tahapan kerja

| Fase | Isi | Selesai bila |
|---|---|---|
| 0. Fondasi | Repo Next.js, TypeScript, lint, tes, deploy kosong ke Vercel | Halaman kosong tayang di Vercel |
| 1. Mesin aturan | Papan, status, kartu, Level Krisis, bot, simulasi keseimbangan | Ribuan game bot selesai dengan akhir yang masuk akal |
| 2. Papan 3D | Empat zona, Monas, bidak, dadu, kamera, kualitas bertingkat | 60 fps di laptop menengah, bisa dimainkan lawan bot |
| 3. UI/UX | Halaman depan, lobi, HUD, kartu, ticker, suara, mobile | Satu game penuh bisa dimainkan nyaman di HP dan laptop |
| 4. Konten | 40 petak final, 60 kartu bersumber, verifikasi fakta | Semua kartu punya sumber dan tanggal verifikasi |
| 5. Online | Room, sinkronisasi, antrean, reconnect, uji beban | Uji beban lolos sebelum dibuka publik |
| 6. Polesan dan rilis | Animasi bencana, audio, aksesibilitas, SEO, analytics | Rilis publik |

Urutan ini menaruh game lawan bot lebih dulu karena paling cepat memberi nilai dan menguji aturan sebelum biaya online keluar.

## 10. Risiko

- **Merek dan kemiripan**: hindari nama dan tata letak Monopoly, dan jangan menyalin aset Konohapoly.
- **Hukum**: satire atas kebijakan aman, menyebut individu yang sedang diproses hukum berisiko. Pakai rekaan.
- **Akurasi fakta**: angka berbeda antar-sumber, perkara hukum berubah. Tiap kartu punya tanggal verifikasi dan ditinjau ulang berkala.
- **Beban server**: lihat bagian 8. Uji beban wajib sebelum rilis online.
- **Cakupan 3D "maksimal"**: mudah membengkak. Dijaga lewat fase, dengan papan 3D bagus dibuat setelah aturan stabil.
- **Keseimbangan**: angka status masih tebakan, harus diuji simulasi.

## 11. Belum diputuskan

- Layanan realtime untuk mode online.
- Data erupsi gunung (riset lanjutan untuk zona Utara).
- Daftar 40 petak lengkap dan 60 kartu.
- Gaya akhir bidak dan sumber aset 3D (buat sendiri atau berlisensi bebas).
- Domain (`weenipoly.vercel.app` atau domain sendiri).
