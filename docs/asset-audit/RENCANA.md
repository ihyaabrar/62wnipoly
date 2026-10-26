# Audit 101 aset dan rencana penyatuan visual +62WNIPOLY

Tanggal: 26 Oktober 2026. Cakupan: **101/101 entri katalog dibuka dan direkam**, lalu diperiksa melalui tangkapan layar individual, sembilan lembar kontak, komposisi dunia, dan kode pembentuk aset. Nomor mengikuti urutan katalog yang tampil, bukan urutan deklarasi registry.

## Kesimpulan

Tema sudah kuat dan layak diteruskan. Masalah utamanya adalah bahasa bentuk yang berbeda, beberapa model tidak sesuai arti aset, kilau yang menghapus detail, dan proporsi detail terhadap jarak kamera. Mengganti semuanya akan membuang aset yang masih berguna. Pertahankan sistem bidak, landmark yang sudah terbaca, dan properti sederhana; bangun ulang keluarga rumah, tenda, vegetasi tropis, dan kendaraan yang paling berbeda gayanya.

Rekap keputusan: **29 dipertahankan dengan perapian, 58 direvisi, 14 dibangun ulang**. Rekap prioritas: **4 P0, 57 P1, 40 P2**. “Bangun ulang” berarti mengganti bentuk dasarnya; bukan membuang seluruh kode atau harus membeli model baru.

Ini penilaian artistik dengan bukti render, bukan skor kualitas objektif. Semua tangkapan memakai katalog desktop 1280×720, kualitas sedang, sudut awal otomatis, animasi aktif. Satu tangkapan tidak membuktikan seluruh siklus animasi, sisi belakang, performa HP, maupun ekspor GLB. Efek yang samar/kosong perlu diuji pada latar pembanding. Stalling browser saat dunia lengkap dimuat tercatat sebagai gejala; belum merupakan pengukuran fps atau bukti penyebab tertentu.

## Temuan terpenting yang sudah teramati

1. **Kartu 3D kosong (075–076).** `props.card()` menaruh face di y=0.011 sedangkan box tingginya 0.02 dengan dasar y=0. Face berada di dalam badan kartu. Selain itu kedua jenis kartu memakai tanda `?`. Perbaiki posisi dan gunakan `!` pada Musibah.
2. **Rumah Medieval tidak cocok (022, 062, 063).** Rangka kayu, atap curam, cerobong besar, dan ornamen terasa Eropa/fantasi. Perlu satu keluarga rumah kampung Indonesia dengan varian normal/banjir/abu/roboh.
3. **Tenda terbaca sebagai gazebo (028).** Model yang dimuat memiliki atap dan empat tiang terbuka. Pengungsian butuh dinding terpal, pintu, tali, dan bidang alas.
4. **“Gedung kaca” bukan gedung kaca (043).** Registry memakai `cityBuilding(17)`, sementara pilihan model memakai seed modulo delapan. Hasil yang terlihat adalah ruko dua lantai. Jenis arsitektur harus eksplisit; seed hanya mengatur variasi.
5. **Api, emas, peti, dan permukaan air terlalu menyala (021, 034, 036, 054–055, 060).** Detail hilang di putih/kuning. Seimbangkan material dan pencahayaan sebelum menilai kebutuhan polygon baru.
6. **Vegetasi berbeda bahasa bentuk (029, 032–035, 041).** Pohon sehat seperti konifer, pohon terbakar bertajuk bola, kelapa/sawit berdaun papan lurus. Perlu spesies dan bentuk dasar yang saling berhubungan.
7. **Karakter lingkungan berbeda dari bidak (026, 039, 081–082 vs 067–072).** Warga dan petugas tampak seperti pion tabung tanpa wajah, sementara bidak berkaki, bermata, dan berproporsi kartun. Gunakan keluarga bentuk sama dengan detail lebih sederhana untuk kerumunan.
8. **Detail satire hilang karena penempatan.** Interior Lapas VIP tertutup tembok; kartu dan papan nama memerlukan uji kamera bermain, bukan hanya close-up.
9. **Palet belum satu sumber.** `kit.C`, `board.ZONE_COLOR`, warna hardcoded per aset, dan atlas yang diturunkan saturasinya belum mengikuti token visual yang sama. `Stage` juga menambah saturasi setelah render.
10. **Pecah tidak semuanya berasal dari model.** Resolusi render, aliasing garis tipis, tekstur teks, kilau, bayangan, dan kamera jauh harus diuji terpisah dari gaya low-poly.

## Standar visual yang diusulkan

**Arah:** diorama mainan Indonesia modern, low-poly yang rapi, permukaan matte, aksen satire yang terbaca. Bentuk utama besar, siluet jelas, detail seperlunya. Kerusakan tetap menyampaikan dampak bencana tanpa gore.

| Aspek | Aturan bersama | Cara menerima hasil |
|---|---|---|
| Bentuk | Bangunan memakai sudut/lis sedikit lembut; pohon bertajuk berkelompok; manusia satu proporsi kartun. Tidak semua permukaan harus flat shading. | Rumah, bangunan pemerintah, kendaraan, dan bidak tampak berasal dari satu diorama saat disandingkan. |
| Detail | Landmark dan bidak lebih rinci; bangunan pendukung sedang; kerumunan dan dekor kecil sederhana. | Detail penting terlihat pada kamera bermain; detail yang hilang tidak perlu dibuat sebagai mesh terpisah. |
| Skala | Tetapkan tinggi warga 0.55–0.65 unit sebagai acuan usulan; pintu 0.7–0.85, mobil panjang 1.1–1.4, lampu jalan 1.8–2.3. Landmark boleh dipadatkan dengan sengaja. | Uji lineup skala sebelum diterapkan; cek lebar jalur dan ruang petak agar tidak memaksa semua objek menjadi realistis. |
| Bidak | Tinggi tubuh dan diameter alas seragam, profesi dibedakan siluet/perlengkapan; warna pemain tetap dapat diganti. | Enam profesi dibedakan pada thumbnail dan saat warna alas sama. |
| Miniatur petak | Versi khusus dengan bentuk utama dan ikon; jangan menyalin seluruh efek, lampu, teks, dan detail aset besar. | Nama/jenis petak dan lokasi bidak lebih cepat terbaca daripada dekor. |
| Warna dasar | Aspal `#2a241c`, kertas/dinding `#efe6d2`, aksen `#f2b92e`, rumput `#7fa65a`, dedaunan gelap `#42613d`. | Satu daftar token dipakai prosedural, recolor atlas, ikon, dan HUD. |
| Warna zona | Selatan `#4f86a8`, Barat `#d07a3e`, Utara `#a95a46`, Timur `#c9a23a`. | Aksen membedakan zona; seluruh rumah/gedung tidak perlu dicat satu warna zona. |
| Material | Beton/kayu/kain roughness usulan 0.75–0.95; logam 0.35–0.55; emas hanya aksen. Air tetap punya pantulan lembut. | Pencahayaan netral menunjukkan warna asli; sinar senja tidak menutupi kelemahan material. |
| Cahaya & efek | Papan/bidak fokus pertama, landmark kedua, bencana ketiga. Api oranye punya inti terang terbatas; emas terbaca dari refleksi, bukan emisi putih. | Siluet api, kawah, emas dan permukaan air tetap jelas pada kualitas sedang dan tinggi. |
| Tipografi | Font proyek konsisten, judul pendek, subteks satire ditampilkan dekat/di panel informasi. | Uji teks dekat, jarak bermain, layar sempit, dan sisi belakang. |
| Keadaan rusak | Semua keadaan berasal dari model dasar sama: kering, basah/banjir, abu, retak/roboh, hangus. | Pemain mengenali rumah/pohon yang sama sebelum dan setelah bencana. |
| Animasi | Angin searah, amplitudo kecil, air bergerak sesuai bentuk sungai/pantai, fase efek dapat diputar ulang. | Tidak ada benda melayang, gerak meloncat, atau asap yang menutup petak aktif. |

Angka skala/material di atas adalah target rancangan, belum hasil pengukuran. Finalisasi melalui lineup dan uji papan; jangan langsung mengganti skala seluruh dunia tanpa menata ulang jarak.

## Penilaian satu per satu

Legenda keputusan: **Pertahankan** = dasar sudah cocok, perlu perapian; **Revisi** = bentuk/material/komposisi perlu perubahan berarti; **Bangun ulang** = siluet/semantik perlu diganti. Prioritas **P0**: salah tampil atau menghilangkan informasi; **P1**: pengaruh visual/tema besar; **P2**: perapian dan pelengkap. Setiap nomor memiliki foto asli pada `screenshots/NNN.png` dan tautan di `index.html`.

### Papan dan komposisi — 001–015

| No. | Aset | Penilaian dari render | Keputusan / prioritas | Perbaikan konkret |
|---|---|---|---|---|
| 001 | Dunia lengkap | Identitas empat zona kuat; taman/petak kecil di tengah medan ramai, langit/awan menyisakan ruang besar. | Revisi · P1 | Kamera bermain terpisah dari kamera katalog; fokus papan, kurangi detail luar yang bersaing, cek siluet dan overlap empat arah. |
| 002 | Petak sudut: Mulai | Kantor pajak dan satire jelas dekat; judul sangat panjang dan miniatur memuat warga/teks kecil. | Revisi · P1 | Judul pendek “MULAI”, satire ke panel; miniatur kantor khusus tanpa antrean mikro. |
| 003 | Petak Musibah | Kontras gelap dan simbol ! sudah kuat; rim dan bidang kartu masih sangat tipis. | Pertahankan · P2 | Seragamkan tebal kartu, sudut, outline ikon dan jarak ke label. |
| 004 | Petak Bencana | Rumah dalam air memberi arti cepat; detail kayu terlalu kecil dan atap sangat jenuh. | Revisi · P1 | Rumah kampung mini yang sama dengan keluarga rumah baru; ikon banjir lebih tegas dan warna atap diselaraskan. |
| 005 | Petak Kesempatan | Kuning dan ? mudah dikenali. | Pertahankan · P2 | Samakan bahasa bentuk dengan Musibah, batasi kilau dan jaga kontras teks. |
| 006 | Petak Bursa | Menara hitam dengan bar hijau terbaca; miniatur belum menyerupai menara bursa utama. | Revisi · P1 | Turunkan bentuk bursa utama ke ikon sederhana, warna pasar mengikuti keadaan game. |
| 007 | Zona Selatan | Cerita permukiman/banjir jelas, tetapi rumah Medieval dan air seperti lembar persegi melemahkan lokasi Indonesia. | Revisi · P1 | Rumah lokal, garis air mengikuti lembah, transisi lumpur/rumput, jalur penyelamatan yang terbaca. |
| 008 | Zona Utara | Gunung fokus kuat, permukiman dan reruntuhan belum satu arsitektur. | Revisi · P1 | Keluarga rumah lokal, zona abu menurun dari kawah, tempat evakuasi di daerah aman. |
| 009 | Zona Barat | Sungai, hutan dan tunggul bercerita; pohon konifer dan pohon terbakar berbeda spesies/bentuk. | Revisi · P1 | Hutan tropis satu keluarga, gradien sehat–terbakar–hangus, jalur pemadaman mudah dibaca. |
| 010 | Zona Timur | Gedung, demo dan uang memberi satire; kepadatan, ukuran landmark dan gaya ruko berbeda. | Revisi · P1 | Buat plaza dewan sebagai fokus, pisahkan area layanan, kota dan proyek; satukan material fasad. |
| 011 | Empat bangunan pojok | Bangunan punya identitas; tampilan gabungan kosong di tengah karena mengikuti koordinat dunia. | Revisi · P2 | Pertahankan koordinat untuk komposisi; tambah lineup perbandingan skala untuk audit, samakan tinggi alas dan pintu. |
| 012 | Jalan raya + kerusakan | Ruas terpisah terlihat kecil saat dibingkai bersama; lebar dan kerusakan sulit dibaca tanpa tanah. | Revisi · P1 | Audit per ruas dengan konteks tanah, bahu jalan dan kendaraan acuan; bedakan rusak vs sengaja terputus. Jangan menyebut bug hanya dari tampilan terisolasi. |
| 013 | Rel + terowongan | Loop, kereta dan portal terlihat; garis rel rapat rentan aliasing dari jauh. | Revisi · P1 | LOD bantalan/rel, ketebalan minimum layar, portal lebih seragam batuannya; daftarkan kereta sendiri untuk inspeksi. |
| 014 | Tanah dunia | Kontur menyatukan dunia; bercak hijau terang/kabur berbeda dari permukaan aset yang bersih. | Revisi · P1 | Kurangi frekuensi/kontras noise, gunakan bidang warna tanah besar, transisi zona lembut dan tepian diorama rapi. |
| 015 | Sungai mengalir | Jalur biru jelas, tepi seperti pita terpotong dan aliran berulang. | Revisi · P1 | Tambah pinggir lumpur/batu, kedalaman semu dan muara; pastikan menyatu dengan banjir serta lokasi scoop heli. |

### Pojok — 016–020

| No. | Aset | Penilaian dari render | Keputusan / prioritas | Perbaikan konkret |
|---|---|---|---|---|
| 016 | Pesawat jet | Siluet jet terbaca dan cocok skala miniatur; badan lebih halus daripada beberapa kendaraan darat. | Pertahankan · P2 | Samakan kaca/roda/logam, detail mesin seperlunya; cek ground clearance dan landing sepanjang animasi. |
| 017 | Kantor Pajak | Antrean, warna biru dan simbol atap memberi identitas; dinding samping sangat kosong. | Revisi · P1 | Modul fasad depan/samping, pintu/antrean sesuai skala warga, papan nama ringkas dan alas lebih tipis. |
| 018 | RS Penuh | Hijau, palang dan antrean langsung terbaca; variasi massa terlalu mirip kantor pajak. | Revisi · P1 | Tambah kanopi IGD dan zona ambulans; bedakan siluet rumah sakit tanpa menambah teks panjang. |
| 019 | Bandara | Runway, pesawat dan menara menjelaskan fungsi dengan baik; runway sangat pendek terhadap pesawat. | Revisi · P1 | Terminal kaca sederhana, proporsi runway miniatur disengaja, gerakan takeoff/landing selaras arah runway. |
| 020 | Lapas VIP | Tembok dan menara kuat; sofa/TV yang menjelaskan VIP tertutup dari sudut awal. | Revisi · P1 | Cutaway satu dinding atau kamar VIP di teras atas; kemewahan harus terlihat tanpa putar kamera. |

### Selatan — 021–030

| No. | Aset | Penilaian dari render | Keputusan / prioritas | Perbaikan konkret |
|---|---|---|---|---|
| 021 | Laut berombak | Gradien laut bagus; strip pantai memutih menyilaukan dan lembar air terlalu lurus saat sendiri. | Revisi · P1 | Turunkan highlight/bloom, buih tipis terputus, tepian sesuai garis pantai; cek kamera rendah dan kualitas rendah. |
| 022 | Rumah terendam | Rumah Eropa berbingkai kayu dan cerobong dominan; dalam katalog tanpa air belum terlihat “terendam”. | Bangun ulang · P1 | Rumah kampung berdinding plester/atap genteng atau seng, tanpa cerobong; preview dengan bidang air dan penanda tinggi air. |
| 023 | Air banjir + hujan | Air biru bersih dengan dua gelondongan; hujan tidak tampak. Kode default `withRain=false`. | Revisi · P0 | Cocokkan nama/preset hujan; tambahkan kekeruhan ringan/arus dan skala level air, tetap bedakan dari laut. |
| 024 | Kayu gelondongan | Bentuk potong jelas, warna terlalu oranye dan seragam. | Pertahankan · P2 | Gelapkan kulit, ujung potong lebih pucat, 2–3 variasi panjang/cabang dari model dasar sama. |
| 025 | Tumpukan kayu | Tumpukan silang terbaca; sebagian ujung tampak melayang, belum menunjukkan sangkutan arus. | Revisi · P2 | Tumpuk dengan titik kontak, variasikan arah arus dan sediakan varian tersangkut jembatan. |
| 026 | Perahu karet relawan | Perahu oranye sangat mudah dikenali; dua orang seperti tabung berbeda dari bidak. | Revisi · P1 | Penumpang dari karakter dasar bersama, rompi pelampung, posisi duduk; jinakkan saturasi oranye. |
| 027 | Perahu nelayan bercadik | Cadik memberikan identitas lokal; lambung seperti bidang datar tertutup. | Revisi · P1 | Lambung berongga dengan gunwale, ujung melengkung, bangku dan mesin kecil; warna kayu/cat usang. |
| 028 | Tenda pengungsian | Terlihat seperti gazebo tanpa dinding; fungsi pengungsian tidak terbaca. | Bangun ulang · P1 | Tenda terpal berdinding dengan bukaan, tali dan pasak; satu modul untuk penampungan dan pos bantuan. |
| 029 | Pohon kelapa | Siluet kelapa terbaca, batang bertingkat dan daun papan terlalu mekanis. | Bangun ulang · P1 | Batang melengkung kontinu, pelepah meruncing 2–3 segmen; buat varian pendek/tinggi/tertiup angin. |
| 030 | Karung pasir | Lebih menyerupai batu pipih; lapisan tumpukan kurang kuat. | Revisi · P2 | Bentuk bantal kotak membulat, sambungan/ikat minimal, susunan bata dengan tinggi lapisan jelas. |

### Barat — 031–041

| No. | Aset | Penilaian dari render | Keputusan / prioritas | Perbaikan konkret |
|---|---|---|---|---|
| 031 | Misi helikopter | Heli dan ember terbaca; tanpa konteks sungai/api maksud misi tidak terlihat dalam satu frame. | Revisi · P1 | Preset audit menampilkan titik ambil/buang dan fase 18 detik; ember menyentuh air, isi serta siraman sesuai fase. |
| 032 | Pohon | Konifer kerucut sangat rapi, tetapi kurang tepat sebagai vegetasi dominan hutan tropis. | Bangun ulang · P1 | Tajuk tropis lebar berkelompok; pertahankan konifer hanya sebagai vegetasi lereng terpilih. |
| 033 | Pohon sawit | Batang pendek dan roset daun membedakan sawit; pelepah lurus seperti baling-baling. | Revisi · P1 | Pelepah melengkung/meruncing dan pangkal bekas pelepah, warna daun dari token bersama kelapa. |
| 034 | Pohon terbakar | Tajuk bola hangus tidak cocok dengan pohon sehat kerucut; api menutupi bagian atas. | Bangun ulang · P1 | Turunkan dari pohon tropis dasar; sebagian daun tetap terlihat, api menempel di batang/tajuk. |
| 035 | Pohon hangus | Batang bercabang jelas, tetapi tidak berkaitan dengan bentuk sehat maupun terbakar. | Revisi · P1 | Rangka cabang sama, hilangkan daun bertahap, warna arang dengan ujung bara terbatas. |
| 036 | Api | Inti hampir seluruhnya putih/kuning; lidah api kehilangan bentuk. | Revisi · P1 | Kurangi emisi dan bloom, bentuk dasar oranye, inti terang kecil; tetapkan batas jumlah lampu lokal. |
| 037 | Kabut asap | Sangat samar pada latar katalog hangat sampai hampir tak terlihat. | Revisi · P1 | Preview dengan kartu kontras/objek pembanding, density bertingkat, kabut tetap lokal dan tidak menutupi papan. |
| 038 | Helikopter water bombing | Siluet berfungsi, siraman terbaca sebagai kabut putih, kabin masih berlian kasar. | Revisi · P1 | Lembutkan massa kabin, material sama dengan pesawat/kendaraan, siraman menyempit lalu menyebar ke tanah. |
| 039 | Pemadam | Helm/oranye/selang terbaca, tetapi tubuh berupa tiang tanpa kaki/tangan yang jelas. | Bangun ulang · P1 | Karakter lingkungan dari proporsi bidak, pose menahan selang, masker/rompi sederhana. |
| 040 | Papan konsesi | Tulisan jelas dekat dan satire cocok. | Pertahankan · P2 | Font proyek, kayu lebih redup, versi usang ringan; periksa keterbacaan saat dipasang di hutan. |
| 041 | Tunggul | Model yang terlihat seperti prisma coklat tinggi, tanpa permukaan potong yang jelas. | Revisi · P1 | Pendekkan, tambah akar melebar dan warna lingkar potongan; cocokkan dengan diameter pohon dasar. |

### Timur — 042–057

| No. | Aset | Penilaian dari render | Keputusan / prioritas | Perbaikan konkret |
|---|---|---|---|---|
| 042 | Gedung kota (acak) | Gedung hijau berjendela berbingkai klasik, papan “mall” kurang cocok ukuran bangunan. | Revisi · P1 | Pisahkan tipe ruko/apartemen/kantor; papan sesuai fungsi dan modul fasad modern Indonesia. |
| 043 | Gedung kota (kaca) | Yang tampil ruko bata oranye/gelap dua lantai, bukan menara kaca. | Bangun ulang · P0 | Pilih `kind` eksplisit, buat modul menara kaca dengan pantulan matte; seed hanya variasi tinggi/warna. |
| 044 | Gedung mangkrak + crane | Struktur beton dan besi mencuat bercerita jelas; crane seperti huruf T polos. | Revisi · P2 | Rangka crane sederhana, footing/penyeimbang, pagar proyek dan patch material beton kusam. |
| 045 | Gedung Dewan | Kubah kembar hijau, kolom dan bendera dikenali; kubah tampak terpisah dan fasad rapat. | Revisi · P1 | Rapikan kontinuitas kubah, profil alas dan pilar, papan satire tidak menutup pintu/jendela. |
| 046 | Demo + aparat | Konfrontasi dan spanduk kuat; kerumunan berpion, gas terlalu putih dan ramai. | Revisi · P1 | Karakter satu keluarga, ruang negatif di antara massa, asap lokal, spanduk utama dibatasi agar terbaca. |
| 047 | Dapur Gizi Gratis* | Bangunan dan ompreng relevan; lebih menyerupai rumah kosong dengan papan nama. | Revisi · P1 | Pintu servis, ventilasi dapur, rak ompreng dan area pengiriman; turunkan saturasi atap. |
| 048 | Ambulans | Garis merah/nama memberi fungsi; bodi kotak polos berbeda jauh dari mobil KayKit. | Bangun ulang · P1 | Keluarga van dengan kaca, roda dan sudut sama kendaraan lain; lampu sirene tidak mendominasi. |
| 049 | Kopdes + gudang | Merah-putih dan gudang cocok; fasad datar dan papan menutupi jendela. | Revisi · P1 | Teras layanan, pintu gudang, palet barang dan papan singkat; bangun dengan modul arsitektur lokal. |
| 050 | Bank Pelat Merah | Pilar dan atap segitiga terbaca sebagai bank, tetapi sangat klasik/generik. | Revisi · P2 | Tambah kanopi/ATM modern, bahan dinding sama kantor lain; kolom lebih sedikit dan tebal. |
| 051 | Bursa + IHSG | Menara gelap/layar indeks terbaca, layar sangat padat dan menara terlihat seperti kisi jendela terang. | Revisi · P1 | Sederhanakan pola jendela, batasi info layar dari jauh, teks/angka rinci di panel; samakan kaca dengan 043. |
| 052 | Truk water cannon | Fungsi meriam terbaca, bodi balok polos dan gelap kehilangan detail. | Bangun ulang · P1 | Kabin/roda keluarga kendaraan, panel samping lebar, meriam lebih jelas; warna gelap tetap punya bidang pembeda. |
| 053 | Tumpukan uang | Bundel mudah dikenali; warna pastel dan pita putih terasa hadiah/permen. | Revisi · P2 | Variasi merah-biru yang lebih redup, strip pengikat sempit, penanda nominal rekaan; jangan meniru detail uang asli. |
| 054 | Emas batangan | Terbaca emas, bentuk bata siku dan highlight putih berlebihan. | Revisi · P1 | Batang trapesium dengan bevel kecil, cap rekaan sederhana, turunkan pantulan/emisi. |
| 055 | Peti harta | Berfungsi sebagai satire penumpukan kekayaan, tetapi terasa fantasi dan isinya meledak cahaya. | Revisi · P1 | Turunkan glow, kunci/pengikat industrial, pertimbangkan brankas sebagai varian modern tanpa menghapus peti lama. |
| 056 | Bendera | Merah-putih jelas dan proporsi konsisten. | Pertahankan · P2 | Samakan arah angin dengan kain lain, hindari tiang hilang karena aliasing dan periksa normal kain bergerak. |
| 057 | Gerbang orang dalam | Palang dan satire terbaca, pos keamanan seperti kubus kosong. | Pertahankan · P2 | Garis palang merah-putih, pos dengan jendela, engsel/pivot jelas; samakan ketebalan rambu. |

### Tengah dan Utara — 058–066

| No. | Aset | Penilaian dari render | Keputusan / prioritas | Perbaikan konkret |
|---|---|---|---|---|
| 058 | Monas | Siluet ikon langsung terbaca; tugu sangat pucat dan api masih kecil/terang. | Pertahankan · P1 | Kontras marmer halus, bentuk api emas lebih terarah, kurangi sparkles; jaga rasio puncak/tugu/cawan. |
| 059 | Taman Monas | Komposisi simetris dan jalan masuk rapi, jauh lebih koheren; konifer mengurangi kesan Jakarta. | Revisi · P1 | Tukar tajuk tropis, detail lampu/pagar punya LOD, bangku dan kebun tetap; cek kepadatan di papan penuh. |
| 060 | Gunung meletus | Siluet, kawah dan kolom asap kuat; lahar seperti pita kuning bercahaya dan kaki gunung agak bergerigi. | Revisi · P1 | Lava bertepi merah gelap, inti terbatas, batu/tanah satu palet, vegetasi sesuai ketinggian; detail level bencana bertahap. |
| 061 | Hujan abu | Partikel terlihat samar; bentuk area lebih terbaca dari sebaran titik daripada jatuhnya abu. | Revisi · P1 | Preview dengan atap/latar gelap, variasi ukuran kecil, arah angin dan endapan; cek batas area/tinggi pada animasi. |
| 062 | Rumah roboh | Reruntuhan berbentuk rangka rumah Medieval; kerusakan terbaca tetapi jenis bangunan tidak sesuai lokasi. | Bangun ulang · P1 | Turunan rumah kampung yang sama, dinding bata/plester dan genteng runtuh, debris dibatasi. |
| 063 | Rumah tertimbun abu | Bentuk Medieval tetap dominan; atap hijau masih kuat sehingga “tertimbun” kurang terbaca. | Bangun ulang · P1 | Dasar rumah lokal 022, endapan abu pada atap/teras dengan ketebalan terlihat; jangan sekadar tint seluruh material. |
| 064 | Pos pantau | Rumah kecil bertiang empat; sirene dan nama ada, tetapi tanpa akses tangga. | Revisi · P2 | Tambah tangga/railing dan alat pantau sederhana; ketebalan tiang serta material sesuai bangunan lokal. |
| 065 | Rambu evakuasi | Hijau dan panah memberi fungsi jelas. | Pertahankan · P2 | Piktogram orang/arah, teks dipersingkat; samakan tinggi tiang dan ukuran papan dengan keluarga rambu. |
| 066 | Bebatuan | Siluet low-poly sesuai medan; permukaan sangat terang/netral dibanding batu gunung. | Pertahankan · P2 | Varian batu vulkanik gelap, lembap dan abu dari geometri sama; tambahkan sedikit penanaman ke tanah. |

### Bidak — 067–073

| No. | Aset | Penilaian dari render | Keputusan / prioritas | Perbaikan konkret |
|---|---|---|---|---|
| 067 | Buruh kena PHK | Helm, seragam dan surat memberi identitas; alas merah terlalu jenuh dan tebal. | Pertahankan · P1 | Jadikan acuan proporsi semua karakter, pendekkan alas, surat dekat tangan/dada dan outline mata lebih halus. |
| 068 | Driver ojol | Hijau, helm dan tas cocok; wajah/visor tumpang tindih dan badan dominan hijau. | Pertahankan · P1 | Rapikan visor dan bukaan wajah, pisahkan hijau jaket/helm/alas lewat nilai terang, tas lebih jelas. |
| 069 | Guru honorer | Kacamata dan buku jelas; kacamata seperti balok hitam penuh. | Pertahankan · P2 | Bingkai tipis dengan mata tetap terlihat, warna baju satu palet, buku konsisten dengan ukuran tangan. |
| 070 | Petani | Caping paling mudah dibedakan; cangkul menembus/dekat tepi caping dan menutup wajah. | Revisi · P1 | Geser pose cangkul, kepala cangkul di samping tubuh, wajah terlihat dari kamera awal. |
| 071 | Mahasiswa | Jaket, ransel dan topi memberi variasi; topi tampak seperti peci/baret generik. | Pertahankan · P2 | Rambut/atribut kampus rekaan, ransel terlihat dari samping; warna kuning tidak menyatu dengan alas. |
| 072 | Pedagang pasar | Tampah dan celemek membedakan peran; celemek seperti papan kaku. | Pertahankan · P2 | Rapikan kain celemek mengikuti badan, tampah bertekstur sederhana dan isi lebih terbaca. |
| 073 | Motor ojol | Roda, jok dan setang ada; bentuk lebih mirip sepeda rangka balok daripada motor. | Bangun ulang · P1 | Siluet skuter dengan fairing, lampu depan, spatbor dan mesin; ukuran cocok dengan pengendara 068. |

### Properti — 074–085

| No. | Aset | Penilaian dari render | Keputusan / prioritas | Perbaikan konkret |
|---|---|---|---|---|
| 074 | Dadu | Titik kontras dan susunan sisi jelas; sudut kubus sangat tajam. | Pertahankan · P2 | Bevel kecil, titik terbenam/lebih rata, konfirmasi sisi berlawanan berjumlah tujuh dan skala dengan tangan/alas. |
| 075 | Kartu Kesempatan | Bidang kuning polos; judul dan simbol tidak muncul. | Revisi · P0 | Letakkan face di atas y=0.02, samakan dengan kartu di petak, sudut/rim lebih lembut. |
| 076 | Kartu Musibah | Bidang hitam polos; judul dan simbol tidak muncul. | Revisi · P0 | Perbaiki face seperti 075, gunakan simbol !, kontras merah/krem sesuai petak Musibah. |
| 077 | Kotak bansos | Label dan lakban langsung terbaca; bentuk terlalu sempurna. | Pertahankan · P2 | Sedikit bevel/lipatan, satu cap distribusi rekaan; tekstur label dipakai bersama. |
| 078 | Karung beras | Berbentuk tabung/faset keras dengan label persegi yang mengambang di depan. | Revisi · P1 | Bentuk kantong mengembang, leher ikatan, cetak label mengikuti permukaan; detail teks sekunder ke panel. |
| 079 | Ompreng makan | Nasi/lauk/sayur terbaca; sekat seperti tembok tinggi dan tanpa bibir luar yang cukup. | Revisi · P1 | Nampan cekung dengan bibir, sekat rendah dan kompartemen konsisten; turunkan kilau baja. |
| 080 | HP pinjol | Bentuk dan teks sesuai satire; jarak dua baris terlalu jauh dan ukuran sangat kecil. | Pertahankan · P2 | Layout layar ringkas dengan tombol pinjam rekaan, bezel/sudut sedikit lembut, kontras konsisten. |
| 081 | Warga | Tubuh tabung dan kepala tanpa wajah terasa seperti pion lain, bukan keluarga bidak. | Bangun ulang · P1 | Karakter lingkungan sederhana dari proporsi bidak: dua kaki, tangan dan wajah minimal; variasikan pakaian/pose. |
| 082 | Aparat bertameng | Helm/tameng jelas; badan seperti tiang, tameng terlalu pucat/solid. | Bangun ulang · P1 | Proporsi karakter bersama, visor dan kaki terbaca, tameng abu transparan dengan tepi; periksa sorting transparansi. |
| 083 | Barikade | Kontras merah-putih baik; ketebalan batang/pilar seragam dan bentuk sangat sederhana. | Pertahankan · P2 | Kaki penopang, strip miring/reflector, samakan material gerbang; jangan menambah detail kecil berlebihan. |
| 084 | Toa | Siluet corong cukup jelas, lubang terlihat tertutup pucat. | Revisi · P2 | Mulut corong berongga/gelap, bibir tipis, pegangan terhubung dan material plastik matte. |
| 085 | Gas air mata | Tabung kecil dengan kabut putih luas; efek menelan latar dan tabung mudah hilang. | Revisi · P1 | Asap dari nozzle, opacity bertahap, batas area lebih kecil; preview pada tanah/rambu untuk melihat dampak. |

### Spanduk dan baliho — 086–101

Semua entri berikut dibuka sendiri. Geometrinya memang berbagi pembuat yang sama, tetapi panjang teks, warna dan konteks penempatan ditinjau per entri. Audit ini menilai tampilan; klaim angka/tanggal/pernyataan publik pada teks belum diverifikasi ulang dan tidak diperlakukan sebagai fakta baru.

| No. | Aset | Penilaian dari render | Keputusan / prioritas | Perbaikan konkret |
|---|---|---|---|---|
| 086 | IHSG MERAH / KATANYA CUMA SENTIMEN | Merah-krem kuat; baris kedua padat. | Pertahankan · P2 | Besarkan “IHSG MERAH”, ringkas subteks atau pindahkan keterangan ke panel; tampilkan dekat bursa/demo. |
| 087 | ORANG KAMPUNG / GAK MAIN SAHAM | Kontras sangat jelas, dua baris cukup seimbang. | Pertahankan · P2 | Jaga konteks sebagai suara satire kerumunan; pakai bahan kain/font sama spanduk lain. |
| 088 | SALAHKAN / ANTEK ASING! | Putih-merah kuat, komposisi jelas. | Pertahankan · P2 | Turunkan merah agar tidak menyaingi indikator bahaya; label konteks satire di informasi. |
| 089 | BUKAN PANIK / CUMA FOMO | Teks pendek paling mudah dibaca. | Pertahankan · P2 | Jadikan acuan margin dan ukuran huruf keluarga spanduk. |
| 090 | TRADING HALT / HIDUP TETAP JALAN | Kuning membantu keterbacaan tetapi bersaing dengan warna Kesempatan. | Pertahankan · P2 | Gunakan kuning kertas lebih redup, jaga warna gameplay tetap lebih kuat. |
| 091 | TUNJANGAN NAIK / RAKYAT NAIK DARAH | Kontras kuning-hitam baik; kedua baris panjang dan rapat. | Pertahankan · P2 | Lebarkan kain atau pendekkan baris, tetapkan satu spanduk utama pada demo. |
| 092 | MAKAN GRATIS / PERUT BAYAR | Pendek, kuat, sesuai area dapur. | Pertahankan · P2 | Pasang dekat dapur dengan orientasi terbaca dari kamera; gunakan kain krem bersama. |
| 093 | HUTAN HABIS / ASAP GRATIS | Warna asap dan teks terang cocok zona Barat. | Pertahankan · P2 | Pertahankan, pastikan kabut tidak menutupi seluruh teks pada intensitas tinggi. |
| 094 | KAYUNYA DARI MANA / PAK? | Baris pertama jauh lebih padat daripada kedua. | Revisi · P2 | Pecah “KAYUNYA / DARI MANA, PAK?” atau atur lebar khusus; papan dekat log jam/banjir. |
| 095 | 17+8 / MASIH DITUNGGU | Angka besar terbaca; pink terasa keluar dari keluarga warna zona. | Revisi · P2 | Pink cukup sebagai variasi kecil kerumunan, atau ubah krem dengan aksen merah; informasi konteks terpisah. |
| 096 | RUPIAH 18 RIBU / GAJI MASIH UMR | Biru-krem jelas; angka nominal terikat waktu. | Revisi · P2 | Pisahkan varian teks dari model kain, tandai sebagai teks skenario game sampai sumber diverifikasi. |
| 097 | KAMI BUTUH KERJA / BUKAN JANJI | Pesan kuat, baris pertama padat tetapi masih terbaca dekat. | Pertahankan · P2 | Sesuaikan lebar/margin, cocok dengan bidak buruh dan demo; batasi pengulangan. |
| 098 | Baliho IHSG MERAH | Bidang berbingkai/tiang lebih berat daripada spanduk; subteks relatif kecil. | Revisi · P2 | Struktur baja dan kaki jelas, hierarki judul/subjudul, jangan membesarkan seluruh tekstur tanpa alasan. |
| 099 | Baliho ORANG KAMPUNG | Teks gelap-krem kuat; isi panjang untuk satu papan kecil. | Revisi · P2 | Perbesar bidang sesuai ruang atau ringkas teks, struktur sama 098, cek belakang papan. |
| 100 | Baliho SALAHKAN ANTEK ASING | Merah dominan dan bingkai kuat; bisa menyaingi label penting di papan. | Revisi · P2 | Batasi satu lokasi aksen, kurangi saturasi, tempatkan jauh dari petak aktif. |
| 101 | Baliho BUKAN PANIK CUMA FOMO | Pendek dan paling cocok menjadi acuan baliho. | Pertahankan · P2 | Jadikan master proporsi panel, kaki, margin dan ukuran huruf seluruh baliho. |

## Tambahan aset yang layak

Tambahan berikut berupa usulan, belum dibuat. Utamakan pengganti model yang salah sebelum menambah dekor. Satu kit dapat menghasilkan banyak variasi tanpa memperbanyak unduhan secara berlebihan.

| Tambahan | Tujuan | Prioritas | Pemakaian ulang |
|---|---|---|---|
| Kit rumah kampung lokal | Mengganti rumah Medieval; atap genteng/seng, teras, ventilasi, tandon kecil. | P1 | Selatan/Utara; normal, banjir, abu, roboh. |
| Kit pohon tropis dan keadaan rusaknya | Menyatukan vegetasi sehat/terbakar/hangus. | P1 | Barat, Selatan, taman; tajuk lebar, kelapa dan sawit tetap spesies berbeda. |
| Kit tenda terpal | Pengungsian terbaca sebagai tempat tinggal sementara. | P1 | Posko, tenda keluarga, dapur lapangan. |
| Kit karakter lingkungan | Menyatukan warga/polisi/relawan/pemadam. | P1 | Kerumunan, antrean, perahu, petugas; badan sama, atribut berbeda. |
| Kit van/skuter/kendaraan layanan | Menyamakan ambulans, truk, mobil biasa dan motor. | P1 | Ambulans, logistik, kendaraan petugas; hanya model yang memang dibutuhkan. |
| Menara kaca eksplisit | Memenuhi janji jenis aset 043 dan memperjelas skyline Timur. | P1 | Kantor/apartemen modern, bursa. |
| Posko bantuan dengan papan distribusi | Memberi tujuan visual bagi perahu, bansos dan tenda. | P2 | Selatan; antrean/posko kesehatan. |
| Dermaga kecil dan tangga air | Menjelaskan lokasi naik-turun perahu. | P2 | Pesisir, sungai, area pengungsian. |
| Pompa air + selang + penanda tinggi banjir | Memperjelas respons bencana dan level air. | P2 | Selatan dan properti petak. |
| Paket rambu bersama | Evakuasi, titik kumpul, jalan rusak, area terlarang. | P1 | Semua zona; piktogram, tiang dan material satu keluarga. |
| Warung/gerobak pasar | Menguatkan kehidupan sehari-hari Indonesia, bukan hanya institusi dan bencana. | P2 | Selatan/Timur dan profesi pedagang. |
| Brankas/lemari arsip modern | Alternatif satire kekayaan/birokrasi yang lebih sesuai dunia modern daripada peti fantasi. | P2 | Bank, lapas VIP, kantor. |

**Aset yang sudah ada tetapi belum menjadi entri mandiri:** mobil biasa/dinas/polisi, lampu jalan/lalu lintas, semak, bangku model, kereta tiga gerbong, awan, dan sejumlah miniatur petak. Jangan mengunduh/membuat duplikat. Tambah entri inspeksi untuk komponen tersebut, sehingga audit lanjutan melampaui 101 entri komposisi yang sekarang. Audit ini tidak mengklaim setiap varian seed atau 40 petak unik telah diperiksa sendiri.

## Urutan pengerjaan keseluruhan

| Tahap | Pekerjaan | Hasil review | Selesai bila |
|---|---|---|---|
| 1. Koreksi informasi visual | Face kartu, simbol Musibah, preset hujan, tipe gedung kaca; expose interior VIP. | Sebelum/sesudah 075, 076, 023, 043, 020. | Tidak ada objek yang berbeda arti dari namanya; tekstur utama tampil. |
| 2. Kunci standar bersama | Token warna/material, lineup ukuran, bentuk sudut, font, preset cahaya netral dan senja. | Satu lineup rumah–warga–bidak–mobil–pohon–lampu dan swatch. | Semua perubahan berikut merujuk standar yang sama; acuan skala disetujui melalui tampilan nyata. |
| 3. Keluarga aset inti | Rumah lokal empat keadaan, tenda, pohon tropis, karakter lingkungan, kendaraan. | Lineup varian, foto depan/samping dan thumbnail. | Varian terbaca sebagai keluarga yang sama; tidak ada cerobong/gazebo/konifer dominan yang salah konteks. |
| 4. Landmark dan bangunan | Dewan, RS, kantor pajak, bandara, lapas, dapur, kopdes, bank, bursa, Monas. | Landmark pada skala dunia dan skala petak. | Siluet dikenali tanpa membaca teks, pintu/jendela konsisten, detail VIP/satire terlihat. |
| 5. Material, medan dan efek | Terrain, sungai, laut, banjir, api, lava, kabut, abu dan siraman. | Snapshot level krisis rendah/sedang/tinggi dan fase animasi tetap. | Efek tidak menghapus bentuk/teks, air mengikuti medan, intensitas sesuai bencana. |
| 6. Tata ulang dunia | Kepadatan dan hierarki empat zona, jalur, garis pandang petak, kamera. | Empat sudut dunia + kamera bermain dekat/jauh. | Pemain segera melihat bidak/petak aktif; zona tetap dikenali; dekor tidak menutup aksi. |
| 7. Properti dan tulisan | Karung, ompreng, uang, emas, rambu, spanduk, baliho, kartu dan dadu. | Contact sheet diperbarui dengan pasangan sebelum/sesudah. | Material/teks satu gaya; yang penting terbaca dari jarak sesuai fungsi. |
| 8. Optimasi dan penerimaan | Miniatur ringan, instancing/merge yang sesuai, LOD garis tipis, batas lampu/partikel/tekstur. | Profil frame, draw call, memori dan ukuran unduhan pada perangkat acuan. | Target 60 fps laptop / 30 fps HP dari DESIGN diuji, bukan diasumsikan; kualitas rendah tetap jelas. |

Tahap 1–2 harus lebih dulu; tahap 3–4 saling berbagi modul; detail dekor baru masuk setelah komposisi 6 stabil. Tidak perlu membeli generator/model baru sebelum pengganti prosedural atau kit yang sudah tersedia dievaluasi.

## Pemeriksaan teknis yang mendukung rencana

- `models.ts` menyatukan material dengan kunci atlas. **Perlu diperiksa lebih lanjut** apakah material berbeda yang kebetulan memakai atlas sama kehilangan pengaturan opacity, sidedness atau parameter lain. Ini risiko dari kode, belum terbukti sebagai kerusakan render pada semua model.
- `tone()` menurunkan saturasi atlas, sementara warna prosedural tidak melalui transformasi sama dan `Stage` menambah saturasi. Satukan hasil akhir lewat token dan swatch, bukan sekadar filter global.
- `textTexture()` membuat kanvas 3× resolusi permintaan. Audit memori dan reuse tekstur sebelum menaikkan resolusi lagi; kalimat identik sebaiknya memakai tekstur yang sama bila aman.
- Miniatur memanggil pembuat bangunan penuh dan beberapa efek/lampu. Buat versi mini khusus; ukur dampaknya sebelum menetapkan penghematan tertentu.
- Pengelolaan resource saat ganti aset katalog perlu diperiksa: geometry/material unik dibersihkan, resource cache bersama dipertahankan. Pergantian 101 aset bukan benchmark performa permainan.
- Efek berbasis `userData.update`, shader, sprite dan teks SDF tidak otomatis menjadi animasi/teks setara saat diekspor GLB. Uji hasil ekspor terpisah.
- Kamera katalog sekarang dapat membuka `?asset=<id>` langsung untuk bukti yang dapat diulang. Default tetap dunia lengkap.

## Kriteria review akhir

1. Setiap dari 101 entri memiliki catatan keputusan dan bukti foto; komponen baru juga didaftarkan.
2. Model diperiksa di cahaya netral, senja, kamera bermain, dan close-up; tidak dinilai hanya dari foto promosi.
3. Semua karakter, kendaraan, rumah dan vegetasi dibandingkan dalam satu lineup skala.
4. Banjir/abu/api memiliki keadaan 0/50/100% serta fase animasi yang dapat diulang.
5. Kartu, teks dan rambu tampil benar; objek penting tetap terbaca saat kualitas rendah.
6. Tidak ada benda mengambang/menembus jalan, air, terpal atau atap dalam sudut-sudut yang diuji.
7. Uji nyata desktop dan HP mencatat perangkat, viewport, kualitas, fps/frame time, draw call, tekstur dan memori. Batas final mengikuti perangkat acuan, bukan jumlah polygon arbitrer.
8. Lisensi dan asal berkas tetap dicatat. Sumber KayKit/Kenney tidak otomatis menjamin setiap pilihan model sesuai tema Indonesia.

## Berkas audit

- `catalog.json`: nama 101 entri sesuai tampilan katalog.
- `screenshots/001.png`–`101.png`: bukti asli, satu per entri.
- `sheet-01.jpg`–`sheet-09.jpg`: lembar perbandingan berlabel.
- `index.html`: galeri seluruh aset dengan nomor dan tautan foto resolusi asli.
- `contact_sheets.py`: membuat ulang lembar kontak dari bukti, tanpa mengganti render.

Tidak ada penggantian model/efek dalam tahap audit ini. Perubahan aplikasi hanya dukungan pemilihan aset melalui URL untuk inspeksi yang dapat diulang.
