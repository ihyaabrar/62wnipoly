// Data permainan Weenipoly: petak, karakter, kartu, dan angka keseimbangan.
// Murni data (tanpa Three.js/React) supaya dipakai bersama oleh mesin, bot, papan 3D, dan tes.

export type Zone = "selatan" | "barat" | "utara" | "timur";
export type TileKind = "sudut" | "biasa" | "kesempatan" | "musibah" | "bencana" | "bursa";

/** Aksi khusus petak (selain aksi umum kerja/makan/istirahat). */
export type TileSpecial =
  | "mulai" | "rumahSakit" | "bandara" | "lapas"
  | "kerjaProyek" | "pasarMurah" | "huntara" | "kebunSawit" | "konsesi" | "puskesmas" | "hutan"
  | "ladang" | "posPantau" | "evakuasi" | "kawah" | "kopdes" | "dapurGizi" | "bank" | "dewan" | "orangDalam"
  | "nelayan" | "jalanRusak" | "asap";

export type TileDef = { index: number; name: string; zone: Zone; kind: TileKind; special?: TileSpecial };

const ZONES: Zone[] = ["selatan", "barat", "utara", "timur"];
const SIDE_KINDS: TileKind[] = ["sudut", "biasa", "musibah", "biasa", "bencana", "biasa", "biasa", "kesempatan", "biasa", "biasa"];

// [nama, aksi khusus]. Urutan = indeks petak, searah jarum jam dari MULAI (pojok kanan bawah).
const RAW: [string, TileSpecial?][] = [
  ["MULAI: GAJIAN, LANGSUNG DIPOTONG PAJAK", "mulai"], ["Kampung Pesisir"], ["Musibah"], ["Dermaga Nelayan", "nelayan"], ["Banjir Bandang"],
  ["Jalan Rusak", "jalanRusak"], ["Huntara Kayu Hanyut", "huntara"], ["Kesempatan"], ["Pasar Ikan Terendam", "pasarMurah"], ["Tanggul Abadi", "kerjaProyek"],
  ["RS PENUH: ANTRE BPJS", "rumahSakit"], ["Kebun Sawit", "kebunSawit"], ["Musibah"], ["Desa Berasap", "asap"], ["Titik Api"],
  ["Jalan Lintas"], ["Kawasan Konsesi", "konsesi"], ["Kesempatan"], ["Puskesmas ISPA", "puskesmas"], ["Hutan Lindung (Dulu)", "hutan"],
  ["BANDARA: KABUR AJA DULU", "bandara"], ["Lereng Subur", "ladang"], ["Musibah"], ["Desa Lereng"], ["Erupsi"],
  ["Jalur Evakuasi", "evakuasi"], ["Pos Pantau", "posPantau"], ["Kesempatan"], ["Ladang Abu", "asap"], ["Bibir Kawah", "kawah"],
  ["LAPAS VIP", "lapas"], ["Kopdes", "kopdes"], ["Musibah"], ["Dapur Gizi", "dapurGizi"], ["Pungli"],
  ["Gedung Bursa"], ["Bank Pelat Merah", "bank"], ["Kesempatan"], ["Gedung Dewan", "dewan"], ["Pintu Orang Dalam", "orangDalam"],
];

export const TILES: TileDef[] = RAW.map(([name, special], index) => {
  const side = Math.floor(index / 10);
  const k = index % 10;
  return { index, name, zone: ZONES[side], kind: side === 3 && k === 5 ? "bursa" : SIDE_KINDS[k], special };
});

export const BOARD_SIZE = TILES.length;
export const JAIL_INDEX = 30;

export type CharacterId = "buruh" | "ojol" | "guru" | "petani" | "mahasiswa" | "pedagang";

export type CharacterDef = {
  id: CharacterId;
  name: string;
  health: number;
  wallet: number;
  food: number;
  workPay: number; // hasil kerja serabutan
  workCost: number; // kesehatan yang terkuras saat kerja
  foodPrice: number; // pengali harga makanan
  restBonus: number;
  blurb: string;
};

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  buruh: { id: "buruh", name: "Buruh kena PHK", health: 100, wallet: 1_400_000, food: 5, workPay: 460_000, workCost: 9, foodPrice: 1, restBonus: 0, blurb: "Kerja kasar dibayar paling tinggi, tabungan menipis sejak di-PHK." },
  ojol: { id: "ojol", name: "Driver ojol", health: 100, wallet: 1_450_000, food: 4, workPay: 380_000, workCost: 10, foodPrice: 1, restBonus: 0, blurb: "Selalu bisa narik, tapi badan yang jadi taruhan." },
  guru: { id: "guru", name: "Guru honorer", health: 100, wallet: 1_150_000, food: 5, workPay: 270_000, workCost: 5, foodPrice: 1, restBonus: 9, blurb: "Gaji kecil, tapi paling sabar dan cepat pulih." },
  petani: { id: "petani", name: "Petani", health: 100, wallet: 750_000, food: 7, workPay: 280_000, workCost: 8, foodPrice: 0.75, restBonus: 0, blurb: "Lumbung penuh, dompet tipis." },
  mahasiswa: { id: "mahasiswa", name: "Mahasiswa", health: 115, wallet: 1_250_000, food: 5, workPay: 310_000, workCost: 6, foodPrice: 1, restBonus: 4, blurb: "Masih muda dan kuat, makannya mi instan." },
  pedagang: { id: "pedagang", name: "Pedagang pasar", health: 95, wallet: 1_650_000, food: 5, workPay: 320_000, workCost: 7, foodPrice: 0.92, restBonus: 0, blurb: "Modal ada, tapi pasar sering sepi." },
};

/** Angka keseimbangan. Disetel lewat simulasi bot (lihat engine.test.ts). */
export const RULES = {
  maxHealth: 120,
  salary: 1_000_000, // gaji saat melewati MULAI
  salaryTax: 0.25, // langsung dipotong
  foodPrice: 160_000, // per porsi, sebelum inflasi
  maxFoodBuy: 3,
  restHeal: 12,
  debtLimit: -1_000_000, // lewat batas ini diburu pinjol: gugur
  debtInterest: 0.1, // per ronde saat dompet minus
  starveDamage: 12, // kesehatan hilang saat tidak makan
  starveTurnsToDie: 2,
  maxRounds: 30,
  crisisStart: 1,
  hospitalCost: 250_000,
  hospitalHeal: 35,
  jailTurns: 2,
  jailBribe: 1_000_000,
  escapeCost: 1_500_000, // bandara: kabur dari bencana ronde berikutnya
  ihsgStart: 100,
  haltDrop: 0.08, // turun >= 8% dalam satu ronde: trading halt
};

export type Delta = { wallet?: number; health?: number; food?: number };

export type CardEffect = Delta & {
  move?: number; // maju/mundur sekian petak
  goto?: number; // pindah ke petak
  skip?: number; // lewati giliran
  ihsg?: number; // perubahan indeks (persen, mis. -5)
  all?: boolean; // delta utama berlaku ke semua pemain hidup
  jail?: boolean;
  others?: Delta; // pemain lain (selain penarik kartu)
  richest?: Delta; // pemain hidup dengan dompet paling tebal
  chars?: Partial<Record<CharacterId, Delta>>; // tambahan untuk semua pemain hidup berkarakter ini
  zone?: { zone: Zone; delta: Delta }; // semua pemain yang sedang berdiri di zona ini
};

/** Gambar kartu (lihat game/CardArt.tsx). */
export type CardArt =
  | "bansos" | "viral" | "proyek" | "mbg" | "naik" | "gotong" | "bpjs" | "jalan" | "lembur" | "tiket"
  | "phk" | "pinjol" | "beras" | "asap" | "anjlok" | "pungli" | "ott" | "banjir" | "tilang" | "sakit"
  | "bbm" | "demo" | "gas" | "rekening" | "honorer" | "pajak" | "ojol" | "tani" | "dewan";

export type CardDef = { id: string; deck: "kesempatan" | "musibah"; title: string; text: string; art: CardArt; effect: CardEffect; fakta?: string; sumber?: string };

// Kartu bersumber nyata: teksnya satire, faktanya ringkas, sumbernya untuk dicek ulang (lihat DESIGN.md bagian 3).
export const CARDS: CardDef[] = [
  { id: "bansos", deck: "kesempatan", art: "bansos", title: "Bansos cair", text: "Bansos cair tepat sebelum musim pemilu. Kebetulan.", effect: { wallet: 400_000, food: 2 } },
  { id: "viral", deck: "kesempatan", art: "viral", title: "Viral di medsos", text: "Dagangan viral, laris sehari. Besok sepi lagi.", effect: { wallet: 600_000 } },
  { id: "proyek", deck: "kesempatan", art: "proyek", title: "Dapat proyek", text: "Kenal orang dalam, dapat proyek tanggul.", effect: { wallet: 900_000, health: -5 } },
  { id: "makan-gratis", deck: "kesempatan", art: "mbg", title: "Makan gratis", text: "Dapat jatah makan bergizi gratis. Baunya agak aneh.", effect: { food: 3, health: -8 }, fakta: "Pemantau JPPI mencatat 40.759 korban keracunan MBG sejak 2025 (data satu organisasi).", sumber: "https://nu.or.id/nasional/jppi-korban-keracunan-mbg-capai-40-759-orang-sejak-2025-6MDir" },
  { id: "stimulus", deck: "kesempatan", art: "naik", title: "Stimulus ekonomi", text: "Pemerintah umumkan stimulus. Pasar senang sebentar.", effect: { ihsg: 6, wallet: 200_000 } },
  { id: "gotong-royong", deck: "kesempatan", art: "gotong", title: "Gotong royong", text: "Tetangga berbagi makanan. Rakyat menolong rakyat.", effect: { food: 2, health: 6, others: { food: 1 } } },
  { id: "bpjs", deck: "kesempatan", art: "bpjs", title: "BPJS lancar", text: "Antrean BPJS hari ini pendek. Keajaiban.", effect: { health: 20 } },
  { id: "jalan-pintas", deck: "kesempatan", art: "jalan", title: "Jalan pintas", text: "Lewat jalan tikus, sampai lebih cepat.", effect: { move: 3 } },
  { id: "gajian", deck: "kesempatan", art: "lembur", title: "Lembur dibayar", text: "Lembur dibayar penuh. Jarang terjadi, nikmati.", effect: { wallet: 500_000, health: -6 } },
  { id: "kabur", deck: "kesempatan", art: "tiket", title: "Tiket promo", text: "Dapat tiket promo. Langsung ke bandara.", effect: { goto: 20 } },
  { id: "potongan-ojol", deck: "kesempatan", art: "ojol", title: "Potongan aplikasi turun", text: "Setelah demo berkali-kali, potongan aplikasi akhirnya dipangkas. Ojol bisa napas.", effect: { wallet: 100_000, chars: { ojol: { wallet: 500_000, health: 5 } } }, fakta: "Mei 2025: ribuan pengemudi ojol berdemo menuntut potongan aplikasi dibatasi maksimal 10%.", sumber: "https://tirto.id/mitra-ojol-tuntut-komisi-aplikasi-dibatasi-10-persen-heCs" },
  { id: "pupuk-tunai", deck: "kesempatan", art: "tani", title: "Subsidi pupuk jadi tunai", text: "Subsidi pupuk dikirim langsung ke petani. Pupuknya tetap harus dicari.", effect: { food: 1, chars: { petani: { wallet: 400_000, food: 2 } } }, fakta: "Pemerintah merencanakan subsidi pupuk dialihkan menjadi bantuan langsung ke petani mulai 2026.", sumber: "https://ekonomi.bisnis.com/read/20240718/99/1783310/selamat-tinggal-subsidi-pupuk-petani-terima-uang-tunai-mulai-2026" },
  { id: "tunjangan-dicabut", deck: "kesempatan", art: "dewan", title: "Tunjangan dicabut", text: "Setelah demo seminggu, tunjangan wakil rakyat dicabut. Rakyat merasa didengar. Sehari.", effect: { all: true, health: 5 }, fakta: "Tunjangan rumah DPR Rp50 juta per bulan dihentikan 30 Agustus 2025 setelah demo besar di banyak kota.", sumber: "https://www.jawapos.com/nasional/2509030482/dasco-tegaskan-tunjangan-rumah-anggota-dpr-sudah-disetop-sejak-30-agustus-2025" },

  { id: "phk", deck: "musibah", art: "phk", title: "Kena PHK", text: "Pabrik tutup, pesangon dicicil.", effect: { wallet: -500_000, health: -5, chars: { buruh: { wallet: -200_000 } } }, fakta: "Kemnaker mencatat PHK menembus 43.000 pekerja hingga Juni 2026.", sumber: "https://economy.okezone.com/read/2026/06/30/320/3227484/kemnaker-catat-phk-tembus-43-000-pekerja-hingga-juni-2026" },
  { id: "pinjol", deck: "musibah", art: "pinjol", title: "Diteror pinjol", text: "Dulu pinjam sedikit, sekarang bunganya beranak.", effect: { wallet: -600_000, health: -6 }, fakta: "OJK memblokir 953 entitas pinjol ilegal hingga Maret 2026.", sumber: "https://investortrust.id/esg/102008/mahasiswa-unpam-edukasi-bahaya-judol-dan-pinjol-ilegal-di-tangsel" },
  { id: "beras", deck: "musibah", art: "beras", title: "Harga beras naik", text: "Beras premium naik lagi. Semua orang makan dikurangi.", effect: { all: true, food: -1, chars: { petani: { wallet: 150_000 } } }, fakta: "BPS: harga beras premium di penggilingan naik 10,52% setahun (September 2026).", sumber: "https://investortrust.id/business/118024/harga-beras-premium-naik-10-52-setahun-bps-ungkap-dampaknya" },
  { id: "asap", deck: "musibah", art: "asap", title: "Kabut asap", text: "Asap karhutla sampai ke kota. Sekolah diliburkan.", effect: { health: -10, all: true, zone: { zone: "barat", delta: { health: -6 } } }, fakta: "Kemenhut: 107.465 hektare hutan dan lahan terbakar Januari-Juni 2026.", sumber: "https://www.rctiplus.com/news/detail/berita-utama/5431984/kemenhut--107-465-hektare-hutan-dan-lahan-ludes-terbakar-sepanjang-2026" },
  { id: "msci", deck: "musibah", art: "anjlok", title: "IHSG anjlok", text: "MSCI umumkan konsultasi reklasifikasi. Bursa merah membara.", effect: { ihsg: -9 }, fakta: "IHSG turun 14,91% dalam sepekan 12-16 Oktober 2026 dan kena trading halt.", sumber: "https://www.rctiplus.com/news/detail/sindonews/5495801/rekor-kelam-ihsg--sepekan-ambruk-14-91-hingga-picu-trading-halt-imbas-msci" },
  { id: "pungli", deck: "musibah", art: "pungli", title: "Pungli di jalan", text: "Ada \"uang rokok\" di setiap pos.", effect: { wallet: -250_000, chars: { ojol: { wallet: -100_000 }, pedagang: { wallet: -100_000 } } } },
  { id: "ott", deck: "musibah", art: "ott", title: "Ikut terseret OTT", text: "Atasanmu kena OTT. Kamu diperiksa sebagai saksi.", effect: { jail: true } },
  { id: "banjir-kiriman", deck: "musibah", art: "banjir", title: "Banjir kiriman", text: "Hujan di hulu, banjir di hilir. Stok makanan warga pesisir hanyut.", effect: { food: -2, health: -5, zone: { zone: "selatan", delta: { food: -2, health: -6 } } }, fakta: "BNPB: 1.189 korban meninggal banjir Sumatra per 12 Januari 2026.", sumber: "https://www.metrotvnews.com/read/kBVCM6RL-bnpb-korban-meninggal-bencana-sumatra-1189-orang" },
  { id: "tilang", deck: "musibah", art: "tilang", title: "Ditilang", text: "Surat lengkap, tetap kena. Damai di tempat.", effect: { wallet: -200_000, move: -2 } },
  { id: "sakit", deck: "musibah", art: "sakit", title: "Tipes", text: "Kecapekan, harus opname.", effect: { health: -15, skip: 1 } },
  { id: "bbm-langka", deck: "musibah", art: "bbm", title: "BBM langka", text: "Antrean SPBU mengular sampai tikungan. Ojol paling menderita: tak ada bensin, tak ada orderan.", effect: { all: true, health: -3, chars: { ojol: { wallet: -400_000, health: -6 }, pedagang: { wallet: -150_000 } } }, fakta: "BPH Migas (Juli 2026): konsumsi BBM subsidi naik 10-15%, antrean panjang di sejumlah daerah.", sumber: "https://industri.kontan.co.id/news/kelangkaan-bbm-di-sejumlah-daerah-picu-antrean-panjang-ini-penjelasan-bph-migas" },
  { id: "demo-macet", deck: "musibah", art: "demo", title: "Kebijakan baru, demo besar", text: "Tunjangan wakil rakyat naik, rakyat turun ke jalan. Jalan macet total, gas air mata di mana-mana.", effect: { all: true, health: -6, chars: { ojol: { wallet: -300_000 }, mahasiswa: { health: -6 } }, ihsg: -3 }, fakta: "Agustus 2025: tunjangan rumah DPR Rp50 juta per bulan memicu demo di banyak kota; seorang pengemudi ojol tewas terlindas kendaraan taktis polisi.", sumber: "https://www.detik.com/jabar/berita/d-8088075/lini-masa-demo-agustus-2025-dari-joget-dpr-hingga-rumah-sahroni-dijarah" },
  { id: "lpg-langka", deck: "musibah", art: "gas", title: "Gas melon hilang", text: "Warung dilarang jual gas 3 kg. Antre di pangkalan, masak pakai kayu.", effect: { all: true, food: -1, health: -2, chars: { pedagang: { wallet: -200_000 } } }, fakta: "Februari 2025: larangan pengecer menjual LPG 3 kg memicu antrean panjang di banyak kota.", sumber: "https://ekonomi.bisnis.com/read/20250204/44/1836589/kisruh-kebijakan-baru-lpg-3-kg-warung-tak-boleh-jual-stok-langka-di-pangkalan" },
  { id: "beras-oplosan", deck: "musibah", art: "beras", title: "Beras oplosan", text: "Beras premium ternyata campuran. Harganya tetap premium.", effect: { all: true, wallet: -100_000, food: -1 }, fakta: "Juli 2025: Kementan dan Satgas Pangan menemukan 212 merek beras tak sesuai mutu; kerugian konsumen ditaksir Rp99,35 triliun per tahun.", sumber: "https://www.cnnindonesia.com/ekonomi/20250715063054-92-1250711/212-merek-beras-ternyata-oplosan-salah-siapa" },
  { id: "rekening-blokir", deck: "musibah", art: "rekening", title: "Rekening dibekukan", text: "Tabungan jarang dipakai dianggap mencurigakan. Yang paling banyak uangnya paling lama urusannya.", effect: { wallet: -150_000, richest: { wallet: -700_000 } }, fakta: "2025: PPATK memblokir sekitar 31 juta rekening dormant senilai Rp6 triliun, lalu membukanya bertahap setelah ramai diprotes.", sumber: "https://finansial.bisnis.com/read/20250731/90/1898202/ppatk-blokir-31-juta-rekening-dormant-dengan-total-nilai-rp6-triliun" },
  { id: "honorer", deck: "musibah", art: "honorer", title: "Gaji honorer ditahan", text: "Anggarannya ada, tapi surat edaran melarang membayar. Guru tetap mengajar.", effect: { wallet: -100_000, chars: { guru: { wallet: -500_000, health: -4 } } }, fakta: "April 2026: 3.823 tenaga honorer di Jawa Barat belum digaji Maret-April karena surat edaran Kementerian PAN-RB.", sumber: "https://jabarprov.go.id/en/berita/cari-solusi-agar-gaji-guru-honorer-dibayar-kdm-segera-temui-menteri-pan-rb-23887" },
  { id: "pbb-naik", deck: "musibah", art: "pajak", title: "Pajak naik 250%", text: "Pemda butuh pemasukan. Yang protes ditantang demo, lalu kenaikannya dibatalkan.", effect: { all: true, wallet: -200_000, health: -2 }, fakta: "Agustus 2025: kenaikan PBB-P2 hingga 250% di Pati memicu demo besar meski kenaikannya akhirnya dibatalkan.", sumber: "https://www.detik.com/jateng/berita/d-8050847/kenaikan-pbb-pati-250-dibatalkan" },
];

/** Bencana per zona di akhir ronde. Kekuatan dikali Level Krisis. */
export const DISASTERS: Record<Zone, { name: string; health: number; food: number; wallet: number }> = {
  selatan: { name: "Banjir bandang", health: 6, food: 1, wallet: 100_000 },
  barat: { name: "Karhutla dan kabut asap", health: 8, food: 0, wallet: 50_000 },
  utara: { name: "Erupsi gunung", health: 10, food: 1, wallet: 0 },
  timur: { name: "Pungli dan razia", health: 2, food: 0, wallet: 250_000 },
};
