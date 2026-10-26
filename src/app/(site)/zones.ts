import type { Zone } from "@/engine/data";

/** Teks zona untuk situs. Warna sama dengan pita petak di papan 3D. */
export const ZONE_INFO: { id: Zone; wind: string; title: string; color: string; short: string; long: string; scene: string }[] = [
  {
    id: "selatan",
    wind: "Selatan",
    title: "Pesisir banjir",
    color: "#3d7ea6",
    short: "Rumah terendam, kayu gelondongan hanyut.",
    long: "Kampung pesisir, dermaga nelayan, pasar ikan yang terendam, dan tanggul yang tak pernah selesai. Kayu gelondongan ikut hanyut bersama air dari hulu.",
    scene: "Air meluap dari laut dan sungai sampai seluruh daratan tenggelam. Yang tersisa hanya papan, seperti pulau.",
  },
  {
    id: "barat",
    wind: "Barat",
    title: "Hutan terbakar",
    color: "#e07a2f",
    short: "Sawit, konsesi, kabut asap ke mana-mana.",
    long: "Kebun sawit, kawasan konsesi, puskesmas penuh pasien ISPA, dan hutan lindung yang tinggal nama. Helikopter bolak-balik mengambil air dari sungai.",
    scene: "Asap pekat menutup seluruh peta. Karhutla juga melukai pemain di luar zona barat.",
  },
  {
    id: "utara",
    wind: "Utara",
    title: "Gunung meletus",
    color: "#b8432f",
    short: "Lereng subur di kaki gunung aktif.",
    long: "Ladang di lereng, pos pantau, jalur evakuasi, dan tambang belerang di bibir kawah. Kereta lewat terowongan di kaki gunung.",
    scene: "Lahar merambat menyeberangi rel sampai lapangan Monas, batu pijar berjatuhan ke papan, abu turun di mana-mana.",
  },
  {
    id: "timur",
    wind: "Timur",
    title: "Pusat kekuasaan",
    color: "#d9a520",
    short: "Dewan, bursa, bank, pungli, razia.",
    long: "Gedung dewan, bursa saham, bank pelat merah, koperasi desa, dapur gizi, dan Pintu Orang Dalam. Uangnya di sini, pungli dan razianya juga.",
    scene: "Sirene meraung. Mobil polisi mengawal mobil pejabat masuk ke lapangan, sementara warga kena razia.",
  },
];
