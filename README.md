<p align="center">
  <img src="docs/logo.svg" alt="+62WNIPOLY" width="520">
</p>

<p align="center">
  <b>Bukan siapa yang paling kaya. Siapa yang paling kuat bertahan jadi WNI.</b><br>
  Monopoli satire Indonesia dalam 3D, langsung main di browser.
</p>

<p align="center">
  <a href="#main-sekarang"><b>Main sekarang</b></a> ·
  <a href="#cara-main">Cara main</a> ·
  <a href="#fitur">Fitur</a> ·
  <a href="#menjalankan-sendiri">Menjalankan sendiri</a>
</p>

![Papan 3D +62WNIPOLY: Monas di tengah, empat zona bencana di sekelilingnya](docs/screenshots/game-desktop.jpg)

## Tentang

+62WNIPOLY adalah game papan 3D bergaya Monopoli, tapi tanpa hotel dan tanpa properti. Kamu warga biasa: gaji langsung dipotong pajak, harga beras naik tiap ronde, dan bencana datang bergiliran ke empat penjuru papan. Pemenangnya bukan yang paling kaya, tapi yang paling lama bertahan hidup.

Setiap kartu menyindir kejadian yang benar terjadi di Indonesia, lengkap dengan fakta singkat dan tautan sumber beritanya.

## Main sekarang

Buka situsnya, pilih peran, pilih jumlah bot, langsung main. Tidak perlu daftar akun.

<!-- URL demo diisi setelah deploy -->
**Demo:** _menyusul_

## Cara main

![Layar aturan sebelum ronde pertama](docs/screenshots/aturan.jpg)

- **Jaga tiga hal:** Sehat, Dompet, dan Makan. Satu porsi makan habis tiap giliran.
- **Kamu gugur kalau:** sehat habis, kelaparan 2 giliran berturut-turut, atau utang lewat Rp1 juta (diburu pinjol).
- **Menang:** jadi WNI terakhir yang masih hidup, atau yang paling kuat bertahan saat ronde 30 habis.
- **Tiap giliran:** tahan tombol untuk mengocok dadu, lepas untuk melempar, lalu pilih aksi di petak tujuan: kerja, makan, istirahat, atau aksi khas petak itu.
- **Level Krisis** naik tiap 2 ronde: bencana makin sering dan makin parah, harga makin mahal.

| Tombol | Fungsi |
|---|---|
| Tahan `Spasi`, lepas | Kocok dan lempar dadu |
| `Enter` | Lempar cepat |
| `1`-`9` | Pilih aksi |
| `+` / `-` / `0` | Perbesar, perkecil, kembali ke posisi kamera awal |
| Klik petak | Lihat isi petak dan siapa yang berdiri di sana |

## Fitur

- **Empat zona, empat bencana.** Pesisir banjir di selatan, hutan terbakar di barat, gunung meletus di utara, pusat kekuasaan di timur. Saat bencana datang, air naik merendam dunia sampai papan tersisa seperti pulau, lahar merambat sampai lapangan Monas, dan konvoi polisi mengawal mobil pejabat.
- **30 kartu satire bersumber.** Kesempatan (kuning) dan Musibah (hitam). Sebagian menimpa semua pemain, sebagian paling keras ke satu profesi: BBM langka paling menyiksa ojol, gaji honorer ditahan paling menyiksa guru.
- **Enam peran** dengan kelebihan dan beban berbeda: buruh kena PHK, driver ojol, guru honorer, petani, mahasiswa, pedagang pasar.
- **Dadu berfisika** yang saling tabrak, kartu yang terbang keluar dari dek di papan, kurungan yang jatuh saat masuk Lapas VIP.
- **Lawan 1-3 bot** dengan tiga tingkat kesulitan. Mesin aturannya deterministik dan diuji dengan simulasi ratusan permainan.
- **Jalan di HP.** Tata letak khusus layar sempit, kualitas grafis menyesuaikan perangkat dan turun otomatis kalau fps jatuh.

<p align="center">
  <img src="docs/screenshots/game-hp.jpg" alt="Tampilan di HP" width="260">
  &nbsp;
  <img src="docs/screenshots/glosarium.jpg" alt="Glosarium kartu" width="520">
</p>

Situsnya juga punya [glosarium kartu dan petak](src/app/(site)/glosarium), halaman [peran](src/app/(site)/peran), dan halaman [bencana](src/app/(site)/bencana).

![Beranda situs](docs/screenshots/beranda.jpg)

## Menjalankan sendiri

Butuh Node.js 20.9 atau lebih baru.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Halaman lain:

- `/main` langsung ke layar pilih peran
- `/assets` katalog semua aset 3D

```bash
npm test
```

```bash
npm run build
```

## Teknologi

- [Next.js](https://nextjs.org) (App Router) dan React
- [Three.js](https://threejs.org) lewat [react-three-fiber](https://github.com/pmndrs/react-three-fiber) dan [drei](https://github.com/pmndrs/drei)
- Pascaproses dengan [postprocessing](https://github.com/pmndrs/postprocessing), teks 3D tajam dengan [troika-three-text](https://github.com/protectwise/troika)
- Suara disintesis langsung dengan Web Audio, tanpa file audio
- Tes dengan [Vitest](https://vitest.dev)

## Struktur proyek

```
src/
  engine/     mesin aturan murni: petak, kartu, peran, bot, simulasi keseimbangan
  game/       layar main: HUD, dadu, kartu, sinematik bencana, suara
  assets3d/   dunia 3D: papan, zona, jalan, rel, model, efek
  scene/      cahaya, langit, dan pascaproses
  app/        situs (beranda, glosarium, peran, bencana), /main, /assets
public/
  models/     model 3D CC0 (KayKit, Kenney) beserta lisensinya
  fonts/      Barlow Condensed (OFL)
docs/         riset aset, audit, logo, tangkapan layar
```

## Kredit

- Model 3D [KayKit City Builder Bits](https://kaylousberg.itch.io/city-builder-bits) dan KayKit Medieval Hexagon oleh Kay Lousberg, lisensi CC0.
- [Kenney Train Kit](https://kenney.nl/assets/train-kit) oleh Kenney, lisensi CC0.
- Font [Barlow Condensed](https://github.com/jpt/barlow) oleh The Barlow Project Authors, SIL Open Font License 1.1.

Rincian sumber dan status tiap aset ada di [docs/riset-aset.md](docs/riset-aset.md).

## Catatan

+62WNIPOLY adalah karya satire. Semua tokoh di dalam game fiktif. Kejadian di kartu merujuk berita nyata, dan sumbernya tercantum di tiap kartu.
