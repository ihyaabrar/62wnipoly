// Teks spanduk satire. Bukan kutipan siapa pun; ditulis sebagai suara kerumunan.
// Frasa yang terinspirasi pernyataan publik ditandai `inspirasi` (lihat DESIGN.md bagian 3).
export type Slogan = { text: string[]; bg: string; fg: string; inspirasi?: string };

export const SLOGANS: Slogan[] = [
  { text: ["IHSG MERAH", "KATANYA CUMA SENTIMEN"], bg: "#efe6d2", fg: "#b63e3b", inspirasi: "respons pejabat soal IHSG, Okt 2026" },
  { text: ["ORANG KAMPUNG", "GAK MAIN SAHAM"], bg: "#f2ead8", fg: "#1d1f24", inspirasi: "pernyataan soal saham, Des 2024 & Mar 2025 (parafrase)" },
  { text: ["SALAHKAN", "ANTEK ASING!"], bg: "#b63e3b", fg: "#efe6d2", inspirasi: "frasa tuduhan medsos, belum terverifikasi" },
  { text: ["BUKAN PANIK", "CUMA FOMO"], bg: "#efe6d2", fg: "#1d1f24", inspirasi: "respons pejabat, Feb 2026" },
  { text: ["TRADING HALT", "HIDUP TETAP JALAN"], bg: "#d9b85e", fg: "#1d1f24" },
  { text: ["TUNJANGAN NAIK", "RAKYAT NAIK DARAH"], bg: "#1d1f24", fg: "#d9b85e", inspirasi: "demo Agustus 2025" },
  { text: ["MAKAN GRATIS", "PERUT BAYAR"], bg: "#efe6d2", fg: "#b63e3b", inspirasi: "keracunan MBG" },
  { text: ["HUTAN HABIS", "ASAP GRATIS"], bg: "#5b5a58", fg: "#efe6d2", inspirasi: "karhutla 2026" },
  { text: ["KAYUNYA", "DARI MANA, PAK?"], bg: "#8a5a35", fg: "#efe6d2", inspirasi: "kayu gelondongan banjir Sumatera" },
  { text: ["17+8", "MASIH DITUNGGU"], bg: "#cfaa99", fg: "#1d1f24", inspirasi: "tuntutan 17+8" },
  { text: ["RUPIAH 18 RIBU", "GAJI MASIH UMR"], bg: "#efe6d2", fg: "#24345c", inspirasi: "rupiah Rp18.000, Okt 2026" },
  { text: ["KAMI BUTUH KERJA", "BUKAN JANJI"], bg: "#24345c", fg: "#efe6d2", inspirasi: "PHK 2026" },
];
