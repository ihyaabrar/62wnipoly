import * as THREE from "three";
import * as S from "./selatan";
import * as U from "./utara";
import * as B from "./barat";
import * as T from "./timur";
import * as K from "./corners";
import * as R from "./routes";
import * as P from "./props";
import * as W from "./pawns";
import { monas, monasPark } from "./monas";
import {
  fullBoard,
  tile,
  tileLineup,
  dressSelatan,
  dressUtara,
  dressBarat,
  dressTimur,
  dressCorners,
} from "./board";
import { SLOGANS } from "./banners";
import {
  kampungHouse,
  reliefPost,
  marketStall,
  dock,
  waterPump,
  floodGauge,
} from "./village";
import { roadSign, safeCabinet } from "./architecture";
import { serviceVehicle } from "./vehicles";
import { model } from "./models";
import { connectedWater } from "./water";
import {
  benchReview,
  cloudReview,
  effectReview,
  floodedHouseReview,
  houseLineup,
  paletteLineup,
  routeReview,
  scaleLineup,
  trainLineup,
  treeLineup,
} from "./review";

export type AssetEntry = {
  id: string;
  name: string;
  category: string;
  make: () => THREE.Object3D;
};

const e = (
  category: string,
  id: string,
  name: string,
  make: () => THREE.Object3D,
): AssetEntry => ({ id, name, category, make });

export const ASSETS: AssetEntry[] = [
  e("Papan", "papan-lengkap", "Dunia lengkap", fullBoard),
  e("Papan", "tinjauan-petak", "Tinjauan semua 40 petak", tileLineup),
  e("Papan", "petak-mulai", "Petak sudut: Mulai", () => tile(0)),
  e("Papan", "petak-musibah", "Petak Musibah", () => tile(2)),
  e("Papan", "petak-bencana", "Petak Bencana", () => tile(4)),
  e("Papan", "petak-kesempatan", "Petak Kesempatan", () => tile(7)),
  e("Papan", "petak-bursa", "Petak Bursa", () => tile(35)),
  e("Papan", "zona-selatan", "Zona Selatan (banjir)", dressSelatan),
  e("Papan", "zona-utara", "Zona Utara (erupsi)", dressUtara),
  e("Papan", "zona-barat", "Zona Barat (karhutla)", dressBarat),
  e("Papan", "zona-timur", "Zona Timur (pemerintahan)", dressTimur),
  e("Papan", "pojok", "Empat bangunan pojok", dressCorners),
  e("Papan", "jalan-raya", "Jalan raya + kerusakan", () =>
    routeReview(R.highway),
  ),
  e("Papan", "rel-kereta", "Rel kereta + terowongan", () =>
    routeReview(R.railway),
  ),
  e("Pojok", "pesawat", "Pesawat jet", () => K.planeModel()),
  e("Papan", "tanah-dunia", "Tanah dunia", R.terrain),
  e("Papan", "sungai", "Sungai + banjir menyatu", connectedWater),
  e("Selatan", "laut", "Laut berombak", () => S.seaWaves(8, 2.4)),
  e("Barat", "misi-helikopter", "Helikopter ambil air & siram", () =>
    B.helicopterMission(
      new THREE.Vector3(-3, -0.3, 0),
      new THREE.Vector3(3, 0, 0),
    ),
  ),
  e("Timur", "gedung-kota", "Gedung kota (acak)", () => T.cityBuilding(3)),
  e("Timur", "gedung-kota-2", "Gedung kota (kaca)", () =>
    T.cityBuilding(17, "kaca"),
  ),
  e("Timur", "gedung-mangkrak", "Gedung mangkrak + crane", T.unfinishedTower),

  e("Tengah", "monas", "Monas", monas),
  e("Tengah", "taman-monas", "Taman Monas", () => monasPark()),

  e("Pojok", "kantor-pajak", "Kantor Pajak (MULAI)", K.taxOffice),
  e("Pojok", "rumah-sakit", "RS Penuh", K.hospital),
  e("Pojok", "bandara-sepi", "Bandara #KaburAjaDulu", K.airport),
  e("Pojok", "lapas-vip", "Lapas VIP", K.vipPrison),

  e("Selatan", "rumah-terendam", "Rumah terendam", floodedHouseReview),
  e("Selatan", "air-banjir", "Air banjir + hujan", () => connectedWater(true)),
  e("Selatan", "kayu-gelondongan", "Kayu gelondongan", () => S.log()),
  e("Selatan", "tumpukan-kayu", "Tumpukan kayu hanyut", () => S.logJam()),
  e("Selatan", "perahu-karet", "Perahu karet relawan", S.rubberBoat),
  e("Selatan", "perahu-nelayan", "Perahu nelayan bercadik", () =>
    S.fishingBoat(),
  ),
  e("Selatan", "tenda-pengungsian", "Tenda pengungsian", () => S.refugeeTent()),
  e("Selatan", "pohon-kelapa", "Pohon kelapa", () => S.palm()),
  e("Selatan", "karung-pasir", "Karung pasir", S.sandbags),

  e("Utara", "gunung-meletus", "Gunung meletus", () => U.volcano()),
  e("Utara", "hujan-abu", "Hujan abu", () => effectReview(() => U.ashFall())),
  e("Utara", "rumah-roboh", "Rumah roboh", () => U.collapsedHouse()),
  e("Utara", "rumah-tertimbun-abu", "Rumah tertimbun abu", () =>
    U.ashedHouse(),
  ),
  e("Utara", "pos-pantau", "Pos pantau gunung", U.observationPost),
  e("Utara", "rambu-evakuasi", "Rambu evakuasi", () => U.evacSign()),
  e("Utara", "bebatuan", "Bebatuan", () => U.rocks()),

  e("Barat", "pohon", "Pohon", () => B.tree()),
  e("Barat", "pohon-sawit", "Pohon sawit", () => B.oilPalm()),
  e("Barat", "pohon-terbakar", "Pohon terbakar", () => B.burningTree()),
  e("Barat", "pohon-hangus", "Pohon hangus", () => B.burntTree()),
  e("Barat", "api", "Api", () => B.fire()),
  e("Barat", "kabut-asap", "Kabut asap", () => effectReview(() => B.haze())),
  e("Barat", "helikopter", "Helikopter water bombing", B.helicopter),
  e("Barat", "pemadam", "Pemadam kebakaran hutan", B.firefighter),
  e("Barat", "papan-konsesi", "Papan konsesi", B.concessionSign),
  e("Barat", "tunggul", "Tunggul", B.stump),

  e("Timur", "gedung-dewan", "Gedung Dewan", T.parliament),
  e("Timur", "demo", "Demo + aparat + water cannon", () => T.protest()),
  e("Timur", "dapur-gizi", "Dapur Gizi Gratis*", T.nutritionAgency),
  e("Timur", "ambulans", "Ambulans", T.ambulance),
  e("Timur", "kopdes", "Kopdes + gudang", T.cooperative),
  e("Timur", "bank-pelat-merah", "Bank Pelat Merah", T.stateBank),
  e("Timur", "gedung-bursa", "Gedung Bursa + layar IHSG", T.stockExchange),
  e("Timur", "water-cannon", "Truk water cannon", T.waterCannon),
  e("Timur", "tumpukan-uang", "Tumpukan uang", () => T.moneyPile()),
  e("Timur", "emas-batangan", "Emas batangan", T.goldBars),
  e("Timur", "peti-harta", "Peti harta", T.treasureChest),
  e("Timur", "bendera", "Bendera merah putih", T.flag),
  e("Timur", "gerbang-orang-dalam", "Gerbang orang dalam", T.insiderGate),

  e("Bidak", "bidak-buruh", "Buruh kena PHK", () => W.buruh()),
  e("Bidak", "bidak-ojol", "Driver ojol", () => W.ojol()),
  e("Bidak", "bidak-guru", "Guru honorer", () => W.guru()),
  e("Bidak", "bidak-petani", "Petani", () => W.petani()),
  e("Bidak", "bidak-mahasiswa", "Mahasiswa", () => W.mahasiswa()),
  e("Bidak", "bidak-pedagang", "Pedagang pasar", () => W.pedagang()),
  e("Bidak", "motor-ojol", "Motor ojol", W.ojolMotor),

  e("Properti", "dadu", "Dadu", () => P.die()),
  e("Properti", "kartu-kesempatan", "Kartu Kesempatan", () =>
    P.card("kesempatan"),
  ),
  e("Properti", "kartu-musibah", "Kartu Musibah", () => P.card("musibah")),
  e("Properti", "kotak-bansos", "Kotak bansos", P.aidBox),
  e("Properti", "karung-beras", "Karung beras", P.riceSack),
  e("Properti", "ompreng-makan", "Ompreng makan", P.mealTray),
  e("Properti", "hp-pinjol", "HP pinjol", P.pinjolPhone),
  e("Properti", "warga", "Warga", () => P.person()),
  e("Properti", "aparat", "Aparat bertameng", P.riotPolice),
  e("Properti", "barikade", "Barikade", P.barricade),
  e("Properti", "toa", "Toa", P.megaphone),
  e("Properti", "gas-air-mata", "Gas air mata", P.tearGas),

  ...SLOGANS.map((s, i) =>
    e("Spanduk", `spanduk-${i + 1}`, s.text.join(" "), () => P.banner(s)),
  ),
  ...SLOGANS.slice(0, 4).map((s, i) =>
    e("Spanduk", `baliho-${i + 1}`, `Baliho: ${s.text.join(" ")}`, () =>
      P.billboard(s),
    ),
  ),
  e("Tambahan", "rumah-kampung", "Rumah kampung (normal)", () =>
    kampungHouse(2),
  ),
  e("Tambahan", "posko-bantuan", "Posko bantuan warga", reliefPost),
  e("Tambahan", "warung-warga", "Warung & pasar warga", marketStall),
  e("Tambahan", "dermaga-warga", "Dermaga warga", dock),
  e("Tambahan", "pompa-banjir", "Pompa air banjir", waterPump),
  e("Tambahan", "ukur-air", "Penanda tinggi air", floodGauge),
  e("Tambahan", "rambu-kumpul", "Rambu titik kumpul", () => roadSign()),
  e("Tambahan", "rambu-jalan", "Rambu jalan rusak", () =>
    roadSign("JALAN RUSAK", "#a95a46"),
  ),
  e("Tambahan", "brankas-arsip", "Brankas & arsip", safeCabinet),
  e("Tambahan", "van-logistik", "Van logistik bantuan", () =>
    serviceVehicle("logistik"),
  ),
  e("Tambahan", "apartemen", "Apartemen warga", () =>
    T.cityBuilding(8, "apartemen"),
  ),
  e("Komponen", "mobil-biasa", "Mobil warga", () => P.car()),
  e("Komponen", "mobil-dinas", "Mobil dinas pelat merah", () =>
    P.car("#3b5268", true),
  ),
  e(
    "Komponen",
    "mobil-polisi",
    "Mobil polisi",
    () => model("mobilPolisi") ?? P.car(),
  ),
  e("Komponen", "lampu-jalan", "Lampu jalan", P.streetLamp),
  e(
    "Komponen",
    "lampu-lalin",
    "Lampu lalu lintas",
    () => model("lampuLalin") ?? roadSign("HATI-HATI"),
  ),
  e("Komponen", "bangku-taman", "Bangku taman", benchReview),
  e("Komponen", "semak", "Semak taman", () => model("semak") ?? B.tree()),
  e("Komponen", "kereta-krl", "KRL tiga gerbong", trainLineup),
  e("Komponen", "awan", "Awan diorama", cloudReview),
  e("Standar", "lineup-skala", "Perbandingan skala", scaleLineup),
  e("Standar", "lineup-rumah", "Empat keadaan rumah", houseLineup),
  e("Standar", "lineup-pohon", "Keadaan pohon tropis", treeLineup),
  e("Standar", "lineup-palet", "Palet material bersama", paletteLineup),
];
