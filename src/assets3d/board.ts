import * as THREE from "three";
import { TILES, type TileKind, type Zone } from "@/engine/data";
import {
  C,
  bakeStatic,
  ball,
  box,
  cone,
  cyl,
  gableRoof,
  group,
  label3d,
  mat,
  onUpdate,
  textTexture,
  texturedPlane,
} from "./kit";
import {
  fishingBoat,
  floodWater,
  floodedHouse,
  logJam,
  log,
  rubberBoat,
  refugeeTent,
  palm,
  seaWaves,
} from "./selatan";
import {
  volcano,
  ashFall,
  ashedHouse,
  collapsedHouse,
  evacSign,
  observationPost,
  rocks,
} from "./utara";
import {
  tree,
  oilPalm,
  burningTree,
  burntTree,
  haze,
  helicopterMission,
  concessionSign,
  stump,
  firefighter,
} from "./barat";
import {
  parliament,
  nutritionAgency,
  ambulance,
  cooperative,
  stateBank,
  stockExchange,
  moneyPile,
  goldBars,
  treasureChest,
  flag,
  insiderGate,
  protest,
  cityBuilding,
  unfinishedTower,
} from "./timur";
import {
  taxOffice,
  hospital,
  airport,
  airplaneFlight,
  vipPrison,
} from "./corners";
import { monasPark } from "./monas";
import { barricade, billboard, car, die, riotPolice } from "./props";
import { clouds } from "./fx";
import { PAWNS } from "./pawns";
import { SLOGANS } from "./banners";
import { ZONES } from "./style";
import {
  reliefPost,
  dock,
  waterPump,
  floodGauge,
  marketStall,
} from "./village";
import { safeCabinet, roadSign } from "./architecture";
import { connectedWater } from "./water";
import tileFont from "./tile-font-metrics.json";
import { TILE_TOP, stepTileSpring, loadTileButtons, supportPawns } from "./tileMotion";
import {
  SEA_Y,
  SEA_Z,
  VOLCANO,
  WATER_Y,
  WORLD as OUT,
  clearOfRoutes,
  heightAt,
  highway,
  railway,
  river,
  riverScoopPoint,
  shoreZ,
  terrain,
} from "./routes";

// Papan 40 petak: indeks 0 di sudut kanan bawah, berjalan searah jarum jam dilihat dari atas.
// Sisi: 0-9 Selatan (bawah), 10-19 Barat (kiri), 20-29 Utara (atas), 30-39 Timur (kanan).
// Di tengah papan hanya taman Monas. Zona bencana, jalan, rel, dan bangunan pojok berada di luar papan.

// Nama, zona, dan jenis petak berasal dari data mesin aturan (satu sumber untuk papan 3D dan aturan).
export type { Zone, TileKind } from "@/engine/data";

export const ZONE_COLOR: Record<Zone, string> = ZONES;

export const TILE_W = 1;
export const TILE_D = 1.6;
export const HALF = TILE_D + 4.5 * TILE_W; // 6.1
const CORNER = 10.6; // jarak pusat bangunan pojok dari tengah (x dan z)

export type TileInfo = {
  index: number;
  zone: Zone;
  kind: TileKind;
  name: string;
  position: THREE.Vector3;
  rotationY: number;
};

export function tileInfo(index: number): TileInfo {
  const side = Math.floor(index / 10);
  const k = index % 10;
  const { zone, kind, name } = TILES[index];
  const edge = HALF - TILE_D / 2;
  const along = k === 0 ? edge : HALF - TILE_D - (k - 0.5) * TILE_W;
  // Posisi di sisi Selatan, lalu diputar ke sisi lain.
  const rotationY = [0, -Math.PI / 2, Math.PI, Math.PI / 2][side];
  const p = new THREE.Vector3(along, 0, edge).applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    rotationY,
  );
  return { index, zone, kind, name, position: p, rotationY };
}

const emissive = (c: string, k = 0.8) =>
  mat(c, { emissive: c, emissiveIntensity: k });

/** Rumah kecil sederhana (dinding + atap pelana) untuk miniatur petak. */
function hut(
  wall: string = C.paper,
  roof: string = C.roofRed,
  pos: [number, number, number] = [0, 0, 0],
) {
  return group(
    "rumah-mini",
    box(0.26, 0.17, 0.22, wall, pos),
    gableRoof(0.3, 0.12, 0.27, roof, [pos[0], pos[1] + 0.17, pos[2]]),
  );
}

/** Tumpukan kartu dengan tanda ? atau ! (petak Kesempatan / Musibah). */
function cardStack(deck: "kesempatan" | "musibah") {
  const bg = deck === "kesempatan" ? "#f2c94c" : C.ink;
  const fg = deck === "kesempatan" ? C.ink : "#ff5a5a";
  const g = group("tumpukan-kartu");
  for (let i = 0; i < 4; i++)
    g.add(
      box(
        0.36,
        0.025,
        0.5,
        i % 2 ? "#efe6cf" : bg,
        [i * 0.012, i * 0.025, -i * 0.01],
        [0, i * 0.08, 0],
      ),
    );
  const face = texturedPlane(
    0.34,
    0.48,
    textTexture([deck === "kesempatan" ? "?" : "!"], {
      bg,
      fg,
      w: 128,
      h: 180,
    }),
    [0.036, 0.101, -0.03],
    [-Math.PI / 2, 0, 0.24],
    false,
  );
  g.add(face);
  return g;
}

/** Skala aset besar agar muat di petak (aset zona dipakai ulang sebagai miniatur). */
function mini(o: THREE.Object3D, s: number, y = 0) {
  o.scale.multiplyScalar(s);
  o.position.y += y;
  return o;
}

/** Purpose-built tile icons: no copied crowds, labels, lights or particle callbacks. */
function civicMini(
  kind:
    | "pajak"
    | "rs"
    | "bandara"
    | "lapas"
    | "dewan"
    | "bank"
    | "kopdes"
    | "dapur",
) {
  const color =
    kind === "rs"
      ? C.green
      : kind === "pajak"
        ? C.navy
        : kind === "lapas"
          ? C.rock
          : C.roofRed;
  const g = group(
    `mini-${kind}`,
    box(0.62, 0.025, 0.5, C.concrete),
    box(0.43, 0.22, 0.32, C.paper, [0, 0.025, 0]),
    box(0.48, 0.035, 0.36, color, [0, 0.245, 0]),
  );
  for (const x of [-0.13, 0.13])
    g.add(box(0.07, 0.08, 0.012, C.navy, [x, 0.12, 0.167]));
  g.add(box(0.07, 0.13, 0.012, C.woodDark, [0, 0.025, 0.169]));
  if (kind === "dewan")
    g.add(
      ball(0.16, C.greenDark, [-0.08, 0.27, 0], 1),
      ball(0.16, C.greenDark, [0.08, 0.27, 0], 1),
    );
  if (kind === "rs")
    g.add(
      box(0.12, 0.035, 0.012, C.red, [0, 0.29, 0.19]),
      box(0.035, 0.12, 0.012, C.red, [0, 0.25, 0.19]),
    );
  if (kind === "lapas")
    for (const x of [-0.25, 0.25])
      g.add(box(0.07, 0.32, 0.07, C.rock, [x, 0.025, 0.15]));
  if (kind === "bandara")
    g.add(
      box(0.64, 0.018, 0.12, C.asphalt, [0, 0.028, 0.2]),
      box(0.09, 0.33, 0.09, C.concrete, [0.26, 0.025, -0.1]),
    );
  return g;
}

/** Miniatur 3D sesuai arti tiap petak (di bagian putih petak). */
function tileMini(index: number): THREE.Object3D | null {
  const t = TILES[index];
  if (t.kind === "kesempatan" || t.kind === "musibah") return cardStack(t.kind);
  switch (index) {
    case 0:
      return civicMini("pajak");
    case 10:
      return civicMini("rs");
    case 20:
      return civicMini("bandara");
    case 30:
      return civicMini("lapas");
    case 1:
      return group(
        "kampung-pesisir",
        hut(C.paper, C.roofBlue, [-0.08, 0, 0.02]),
        mini(palm(3), 0.32).translateX(0.2),
      );
    case 3:
      return group(
        "dermaga",
        box(0.6, 0.03, 0.14, C.wood, [0, 0.03, 0.12]),
        ...[-0.25, 0, 0.25].map((x) =>
          box(0.03, 0.06, 0.03, C.woodDark, [x, 0, 0.12]),
        ),
        cyl(
          0.3,
          0.3,
          0.01,
          mat("#3d86b5", { roughness: 0.2 }),
          [0, 0.005, -0.12],
          16,
        ),
        mini(fishingBoat("#e94b3c"), 0.3, 0.02).translateZ(-0.12),
      );
    case 4:
      return group(
        "banjir",
        cyl(
          0.36,
          0.36,
          0.06,
          mat("#3d86b5", { roughness: 0.15, metalness: 0.1 }),
          [0, 0, 0],
          20,
        ),
        hut(C.paper, C.roofRed, [-0.06, -0.03, 0]),
        mini(log(0.7, 4), 0.5, 0.05).translateX(0.15),
      );
    case 5:
      return group(
        "jalan-rusak",
        box(0.7, 0.02, 0.3, "#3b3d43"),
        cyl(0.07, 0.07, 0.021, "#151517", [0.05, 0.001, 0], 10),
        box(0.08, 0.021, 0.02, C.white, [-0.25, 0.001, 0]),
        cone(0.05, 0.14, C.orange, [0.22, 0.02, 0.08], 8),
      );
    case 6:
      return mini(refugeeTent(C.orange), 0.45);
    case 8:
      return group(
        "pasar-ikan",
        cyl(
          0.36,
          0.36,
          0.04,
          mat("#3d86b5", { roughness: 0.2 }),
          [0, 0, 0],
          20,
        ),
        box(0.4, 0.12, 0.2, C.wood, [0, 0.02, 0]),
        box(0.46, 0.02, 0.28, "#e94b3c", [0, 0.3, 0]),
        ...[-0.2, 0.2].map((x) =>
          box(0.02, 0.28, 0.02, C.woodDark, [x, 0.02, 0.12]),
        ),
        ...[-0.12, 0, 0.12].map((x) => ball(0.035, "#9fb4bd", [x, 0.16, 0])),
      );
    case 9:
      return group(
        "tanggul",
        box(0.7, 0.14, 0.12, C.concrete, [0, 0, 0.05]),
        box(0.7, 0.02, 0.14, "#9a958c", [0, 0.14, 0.05]),
        box(0.03, 0.55, 0.03, "#e8b21f", [0.24, 0, -0.18]),
        box(0.4, 0.03, 0.03, "#e8b21f", [0.1, 0.55, -0.18]),
        cyl(
          0.3,
          0.3,
          0.01,
          mat("#3d86b5", { roughness: 0.2 }),
          [0, 0.005, -0.2],
          16,
        ),
      );
    case 11:
      return group(
        "kebun-sawit",
        mini(oilPalm(2), 0.45).translateX(-0.15),
        mini(oilPalm(5), 0.4).translateX(0.17),
      );
    case 13:
      return group(
        "desa-berasap",
        hut("#e8c9a0", C.roofRed, [-0.05, 0, 0]),
        ...[0, 1, 2].map((i) =>
          ball(0.07 + i * 0.03, mat("#8d8a86", { opacity: 0.7 }), [
            0.12 + i * 0.03,
            0.32 + i * 0.1,
            0,
          ]),
        ),
      );
    case 14:
      return group(
        "titik-api",
        cyl(0.3, 0.3, 0.01, "#2a2420", [0, 0.002, 0], 14),
        mini(burntTree(4), 0.6).translateX(-0.12),
        cone(0.08, 0.22, emissive(C.lava, 0.9), [0.12, 0, 0.02], 6),
        cone(0.05, 0.16, emissive(C.ember, 0.9), [0.16, 0, -0.05], 6),
      );
    case 15:
      return group(
        "jalan-lintas",
        box(0.7, 0.02, 0.3, "#3b3d43"),
        ...[-0.2, 0, 0.2].map((x) =>
          box(0.1, 0.021, 0.02, C.white, [x, 0.001, 0]),
        ),
        mini(car("#c8102e"), 0.7, 0.02),
      );
    case 16:
      return group(
        "konsesi",
        mini(concessionSign(), 0.5),
        ...[
          [-0.2, -0.15],
          [0.2, -0.12],
          [0, -0.25],
        ].map(([x, z]) => mini(stump(), 0.8).translateX(x).translateZ(z)),
      );
    case 18:
      return group(
        "puskesmas",
        box(0.42, 0.2, 0.28, C.white),
        box(0.46, 0.03, 0.32, "#3fa66b", [0, 0.2, 0]),
        box(0.12, 0.035, 0.01, emissive("#ff2a2a", 1.5), [0, 0.12, 0.141]),
        box(0.035, 0.12, 0.01, emissive("#ff2a2a", 1.5), [0, 0.08, 0.141]),
      );
    case 19:
      return group(
        "hutan-dulu",
        ...[
          [-0.2, 0],
          [0.15, 0.1],
          [0, -0.18],
          [0.22, -0.15],
        ].map(([x, z]) => mini(stump(), 0.9).translateX(x).translateZ(z)),
        mini(tree(8), 0.45).translateX(-0.12).translateZ(0.15),
      );
    case 21:
      return group(
        "lereng-subur",
        box(0.64, 0.03, 0.5, "#6b4f35"),
        ...[-0.18, -0.06, 0.06, 0.18].map((z) =>
          box(0.58, 0.05, 0.05, C.leaf, [0, 0.03, z]),
        ),
      );
    case 23:
      return mini(ashedHouse(2), 0.3);
    case 24:
      return group(
        "erupsi",
        cone(0.32, 0.38, "#5c524b", [0, 0, 0], 9),
        cyl(0.07, 0.07, 0.02, emissive(C.lava, 0.9), [0, 0.37, 0], 9),
        box(
          0.04,
          0.01,
          0.3,
          emissive(C.lava, 0.8),
          [0.06, 0.18, 0.12],
          [-0.85, 0.3, 0],
        ),
        ball(0.09, mat("#3d3833", { opacity: 0.85 }), [0.02, 0.5, 0]),
        ball(0.12, mat("#5b5a58", { opacity: 0.7 }), [0.06, 0.64, 0.02]),
      );
    case 25:
      return mini(evacSign(), 0.6);
    case 26:
      return mini(observationPost(), 0.3);
    case 28:
      return group(
        "ladang-abu",
        box(0.64, 0.03, 0.5, "#a8a29a"),
        mini(rocks(6), 0.5),
        hut("#d8d1c0", "#8f8a83", [0.15, 0.03, -0.1]),
      );
    case 29:
      return group(
        "bibir-kawah",
        cyl(0.32, 0.36, 0.08, "#3f3833", [0, 0, 0], 12),
        cyl(0.2, 0.2, 0.082, emissive(C.lava, 0.8), [0, 0, 0], 12),
        ...[
          [-0.25, 0.2],
          [0.27, 0.15],
          [0.1, -0.28],
        ].map(([x, z]) => ball(0.05, "#e8d23a", [x, 0.03, z])),
      );
    case 31:
      return civicMini("kopdes");
    case 33:
      return civicMini("dapur");
    case 34:
      return group(
        "pungli",
        mini(riotPolice(), 0.8).translateX(-0.12),
        mini(barricade(), 0.6).translateZ(0.15),
        box(0.18, 0.28, 0.18, "#d9d4c8", [0.2, 0, -0.1]),
        box(0.2, 0.03, 0.2, C.red, [0.2, 0.28, -0.1]),
      );
    case 35:
      return group(
        "bursa",
        box(
          0.26,
          0.5,
          0.22,
          mat("#3c5a78", { roughness: 0.1, metalness: 0.6 }),
        ),
        box(0.3, 0.16, 0.02, emissive("#0b0f14", 0), [0, 0.3, 0.12]),
        ...[0, 1, 2, 3].map((i) =>
          box(
            0.04,
            0.03 + i * 0.025 * (i % 2 ? 0.5 : 1.4),
            0.005,
            emissive(i === 3 ? "#ff3b3b" : "#2fe07a", 2),
            [-0.09 + i * 0.06, 0.32, 0.131],
          ),
        ),
      );
    case 36:
      return civicMini("bank");
    case 38:
      return civicMini("dewan");
    case 39:
      return group(
        "mini-gerbang",
        box(0.04, 0.28, 0.04, C.concrete, [-0.22, 0, 0]),
        box(0.04, 0.28, 0.04, C.concrete, [0.22, 0, 0]),
        box(0.44, 0.035, 0.025, C.red, [0, 0.15, 0]),
      );
    default:
      return null;
  }
}

/** Strong contrast for print; zone colours stay on the narrow outer strip. */
const TILE_LOOK = {
  biasa: { face: C.paper, panel: "#fff8e8", text: "#20252b" },
  sudut: {
    face: "#2a2d34",
    panel: "#fff0cb",
    text: "#20252b",
  },
  kesempatan: {
    face: "#f2c94c",
    panel: "#ffe38b",
    text: "#000000",
  },
  musibah: {
    face: "#1d1f24",
    panel: "#292c32",
    text: "#fff4dc",
  },
};

/** Intentional line breaks: every name fits without automatic mid-word wrapping. */
export const TILE_TITLES = [
  "MULAI",
  "KAMPUNG\nPESISIR",
  "MUSIBAH",
  "DERMAGA\nNELAYAN",
  "BANJIR\nBANDANG",
  "JALAN\nRUSAK",
  "HUNTARA\nKAYU\nHANYUT",
  "KESEMPATAN",
  "PASAR IKAN\nTERENDAM",
  "TANGGUL\nABADI",
  "RS PENUH",
  "KEBUN\nSAWIT",
  "MUSIBAH",
  "DESA\nBERASAP",
  "TITIK API",
  "JALAN\nLINTAS",
  "KAWASAN\nKONSESI",
  "KESEMPATAN",
  "PUSKESMAS\nISPA",
  "HUTAN\nLINDUNG\n(DULU)",
  "BANDARA",
  "LERENG\nSUBUR",
  "MUSIBAH",
  "DESA\nLERENG",
  "ERUPSI",
  "JALUR\nEVAKUASI",
  "POS\nPANTAU",
  "KESEMPATAN",
  "LADANG\nABU",
  "BIBIR\nKAWAH",
  "LAPAS VIP",
  "KOPDES",
  "MUSIBAH",
  "DAPUR\nGIZI",
  "PUNGLI",
  "GEDUNG\nBURSA",
  "BANK\nPELAT\nMERAH",
  "KESEMPATAN",
  "GEDUNG\nDEWAN",
  "PINTU\nORANG\nDALAM",
] as const;

/** Font advances come from the bundled TTF; leave a margin for SDF glyph edges. */
export function tileTitleLayout(index: number) {
  const text = TILE_TITLES[index];
  const lines = text.split("\n");
  const advances = tileFont.advances as Record<string, number>;
  const longest = Math.max(
    ...lines.map(
      (line) =>
        [...line].reduce((sum, char) => sum + advances[char], 0) /
        tileFont.unitsPerEm,
    ),
  );
  const width = (index % 10 === 0 ? TILE_D : TILE_W) - 0.16;
  const size = Math.min(
    index % 10 === 0 ? 0.3 : 0.24,
    (width * 0.97) / longest,
    0.7 / (lines.length * 1.05),
  );
  return { text, size, width, lineHeight: 1.05, measuredWidth: longest * size };
}

/** One tile: zone accent at the outer edge, a readable title panel, then a fitted miniature. */
export function tile(index: number) {
  const info = tileInfo(index);
  const corner = info.kind === "sudut";
  const w = corner ? TILE_D : TILE_W;
  const panelD = 0.8;
  const panelZ = 0.3;
  // Petak kartu diwarnai penuh seperti kartunya: Kesempatan kuning, Musibah hitam.
  const look =
    info.kind === "kesempatan"
      ? TILE_LOOK.kesempatan
      : info.kind === "musibah"
        ? TILE_LOOK.musibah
        : corner
          ? TILE_LOOK.sudut
          : TILE_LOOK.biasa;
  const accent =
    info.kind === "musibah"
      ? "#d2644d"
      : info.kind === "kesempatan"
        ? "#c79a2f"
        : ZONE_COLOR[info.zone];
  const g = group(
    `petak-${index}`,
    box(w - 0.1, TILE_TOP - 0.04, TILE_D - 0.1, "#3a332b"),
    box(w - 0.14, 0.04, TILE_D - 0.14, look.face, [0, TILE_TOP - 0.04, 0]),
    box(
      w - 0.16,
      0.018,
      panelD,
      new THREE.MeshBasicMaterial({ color: look.panel, toneMapped: false }),
      [0, TILE_TOP + 0.002, panelZ],
    ),
    box(w - 0.14, 0.025, 0.055, accent, [0, TILE_TOP, 0.6925]),
  );
  // Judul petak: teks SDF supaya tajam dari jauh dan dari sudut miring.
  const typography = tileTitleLayout(index);
  const title = label3d(typography.text, {
    size: typography.size,
    color: look.text,
    maxWidth: typography.width,
    lineHeight: typography.lineHeight,
  });
  title.name = `judul-petak-${index}`;
  title.position.set(0, TILE_TOP + 0.033, panelZ);
  g.add(title);
  const m = tileMini(index);
  if (m) {
    // Fit actual bounds, including roofs, debris and smoke; keep the title area clear.
    m.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(m);
    const size = bounds.getSize(new THREE.Vector3());
    const fit = Math.min(1, (w - 0.22) / size.x, 0.48 / size.z, 0.46 / size.y);
    m.scale.multiplyScalar(fit);
    const center = bounds.getCenter(new THREE.Vector3());
    m.position.set(
      (m.position.x - center.x) * fit,
      TILE_TOP + (m.position.y - bounds.min.y) * fit,
      -0.43 + (m.position.z - center.z) * fit,
    );
    m.name = `miniatur-petak-${index}`;
    g.add(m);
  }
  g.name = `tombol-petak-${index}`;
  const button = group(`petak-${index}`, g);
  button.position.copy(info.position);
  button.rotation.y = info.rotationY;
  button.userData.tile = info;
  const spring = { offset: 0, velocity: 0 };
  let load = 0;
  button.userData.pressOffset = 0;
  button.userData.setLoad = (value: number) => { load = value; };
  return onUpdate(button, (_t, dt) => {
    stepTileSpring(spring, load, dt);
    g.position.y = spring.offset;
    button.userData.pressOffset = spring.offset;
  });
}

/** All forty tiles face the same way so their typography can be reviewed together. */
export function tileLineup() {
  const g = group("tinjauan-40-petak");
  for (let i = 0; i < 40; i++) {
    const t = tile(i);
    t.rotation.set(0, 0, 0);
    t.position.set(((i % 10) - 4.5) * 1.78, 0, (Math.floor(i / 10) - 1.5) * 2);
    g.add(t);
  }
  return g;
}

/** Bingkai kayu papan dengan taman Monas di dalamnya. */
function boardBase() {
  const park = monasPark((HALF - TILE_D) * 2 - 0.1);
  park.position.y = -0.02; // rumput sedikit di bawah permukaan petak (y 0..0.12)
  return group(
    "alas-papan",
    box(HALF * 2 + 0.3, 0.3, HALF * 2 + 0.3, C.woodDark, [0, -0.32, 0]),
    box(HALF * 2 + 0.36, 0.04, HALF * 2 + 0.36, C.goldDark, [0, -0.04, 0]),
    park,
  );
}

function at<T extends THREE.Object3D>(
  o: T,
  x: number,
  z: number,
  ry = 0,
  s = 1,
) {
  o.position.x = x;
  o.position.z = z;
  if (o.position.y === 0) o.position.y = heightAt(x, z); // duduk di permukaan tanah yang berkontur
  o.rotation.y += ry;
  o.scale.multiplyScalar(s);
  return o;
}

/** Seperti at(), tapi dekor yang tertabrak jalan/rel tidak dipasang. */
function free(
  g: THREE.Object3D,
  make: () => THREE.Object3D,
  x: number,
  z: number,
  ry = 0,
  s = 1,
  margin = 0.9,
) {
  if (clearOfRoutes(x, z, margin)) g.add(at(make(), x, z, ry, s));
}

/** Putar objek agar bagian depannya (+z) menghadap pusat papan. */
function faceCenter<T extends THREE.Object3D>(
  o: T,
  x: number,
  z: number,
  s = 1,
) {
  return at(o, x, z, Math.atan2(-x, -z), s);
}

/** Taruh objek pada ketinggian y tertentu (tanah, air, pantai). */
function atY<T extends THREE.Object3D>(o: T, y: number) {
  o.position.y = y;
  return o;
}

export function dressSelatan(withWater = true) {
  const g = group("dekor-selatan");
  if (withWater) g.add(connectedWater());
  const houses: [number, number][] = [
    [-6, 9.1],
    [-4, 10.4],
    [-1.6, 9.4],
    [1.2, 10.6],
    [3.6, 9.2],
    [5.8, 10.5],
    [-5.2, 12.8],
    [-2.4, 13.4],
    [2.6, 12.9],
    [5, 13.2],
  ];
  houses.forEach(([x, z], i) => {
    if (!clearOfRoutes(x, z, 1)) return;
    const h = at(floodedHouse(i + 1), x, z);
    // Duduk di tanah lembah. Hanya rumah di bagian terendah yang terendam; yang di pinggir tetap kering.
    h.position.y = heightAt(x, z) - 0.02;
    g.add(h);
  });
  // Kayu mengapung kalau di air; kalau di daratan, tergeletak di tanah sebagai sisa banjir.
  const floating = (
    make: () => THREE.Object3D,
    x: number,
    z: number,
    ry = 0,
    s = 1,
  ) => {
    if (clearOfRoutes(x, z))
      g.add(
        atY(at(make(), x, z, ry, s), Math.max(heightAt(x, z), WATER_Y - 0.1)),
      );
  };
  floating(() => logJam(5), 0.6, 12.2, 0.4);
  floating(() => logJam(9), -7.4, 10.6, 1.1, 0.8);
  floating(() => log(1.4, 9), -3, 11.8);
  floating(() => log(1.2, 12), 3.4, 11.6);
  floating(() => log(1.6, 15), 7.4, 12.6);
  for (const [x, z, ry] of [
    [-0.6, 10.8, 0.6],
    [3.6, 11.2, -0.8],
  ]) {
    if (heightAt(x, z) > WATER_Y - 0.1) continue; // perahu hanya di air
    const b = at(rubberBoat(), x, z, ry);
    b.userData.baseY = WATER_Y;
    g.add(b);
  }
  // Pantai berkelok (pasirnya bagian dari tanah) dan laut biru berombak; rel melintas di tanggul laut.
  const seaFrom = SEA_Z - 1.1;
  const seaD = OUT + 0.5 - seaFrom;
  const seaZ = seaFrom + seaD / 2;
  g.add(
    atY(
      at(
        seaWaves(OUT * 2 + 1, seaD, (x) => shoreZ(x) - seaZ),
        0,
        seaZ,
      ),
      SEA_Y,
    ),
  );
  const onBeach = (x: number, back: number) => [x, shoreZ(x) - back] as const;
  [-8.5, 5.5].forEach((x, i) => {
    const [bx, bz] = onBeach(x, 0.45);
    free(
      g,
      () => fishingBoat(["#2f8fd0", "#e94b3c"][i]),
      bx,
      bz,
      0.3 + i,
      1.1,
      0.5,
    );
  });
  [-4, 10].forEach((x, i) =>
    free(
      g,
      () => atY(fishingBoat(["#f2c94c", "#2fa84f"][i]), SEA_Y - 0.06),
      x,
      17,
      0.2,
      1,
      0.5,
    ),
  );
  [-12, -9.8, -6, -1.5, 3, 8, 12.5].forEach((x, i) => {
    const [px, pz] = onBeach(x, 1.0);
    free(g, () => palm(i + 1), px, pz, 0, 1, 0.45);
  });
  [-5, -3.6, 1.8].forEach((x, i) => {
    const [tx, tz] = onBeach(x, 0.75);
    free(
      g,
      () => refugeeTent(i % 2 ? C.orange : C.roofBlue),
      tx,
      tz,
      0,
      0.8,
      0.45,
    );
  });
  free(g, reliefPost, -8.3, 12.7, 0.2, 0.8, 0.8);
  free(g, marketStall, 7.5, 13.5, -0.4, 0.75, 0.65);
  free(g, waterPump, 0.7, 8.0, 0, 1, 0.4);
  g.add(at(floodGauge(), -4.8, 10.7));
  const pier = at(dock(), -7.7, 12.0);
  pier.position.y = WATER_Y - 0.26;
  g.add(pier);
  return g;
}

export function dressUtara() {
  const ash = ashFall(18, 9, 900, 5);
  ash.position.set(0, 0, -11.5);
  const vol = at(
    volcano(7, VOLCANO.height),
    VOLCANO.x,
    VOLCANO.z,
    0,
    VOLCANO.scale,
  );
  // Pohon di kaki gunung jangan menutupi rel dan mulut terowongan.
  vol.updateMatrixWorld(true);
  const wp = new THREE.Vector3();
  vol.children
    .filter((c) => c.name === "pohon")
    .forEach((t) => {
      t.getWorldPosition(wp);
      if (!clearOfRoutes(wp.x, wp.z, 1.1)) t.removeFromParent();
    });
  const g = group("dekor-utara", vol, ash);
  free(g, () => roadSign("TITIK KUMPUL"), -6.8, -8.1, 0, 0.8, 0.4);
  const houses: [number, number, "roboh" | "abu"][] = [
    [-6, -9],
    [-4, -10.2],
    [-2, -8.9],
    [2.2, -9.1],
    [4.3, -10],
    [6.3, -8.9],
    [-6.8, -11.3],
    [7, -11.4],
  ].map(([x, z], i): [number, number, "roboh" | "abu"] => [
    x,
    z,
    i % 3 === 1 ? "roboh" : "abu",
  ]);
  houses.forEach(([x, z, k], i) =>
    free(
      g,
      () => (k === "abu" ? ashedHouse(i + 1) : collapsedHouse(i + 1)),
      x,
      z,
    ),
  );
  g.add(
    faceCenter(observationPost(), 8.4, -11.5),
    at(evacSign(), -3.4, -8.5),
    at(evacSign(["JALUR", "EVAKUASI ↓"]), 3.6, -8.5),
  );
  free(g, () => rocks(3), -8.5, -13);
  free(g, () => rocks(8), 8.8, -13.5);
  free(g, () => rocks(11), -1.5, -9.8);
  return g;
}

export function dressBarat(withWater = true) {
  const h = haze(9, 18, 5);
  h.position.set(-11.5, 0, 0);
  // Helikopter mengambil air di sungai lalu menyiram garis api.
  const drop = new THREE.Vector3(-9.9, heightAt(-9.9, 1.2), 1.2);
  const g = group(
    "dekor-barat",
    h,
    helicopterMission(riverScoopPoint(), drop),
    at(concessionSign(), -8.6, -1.4, Math.PI / 2),
  );
  if (withWater) g.add(connectedWater());
  // Dari tepi papan ke luar: tunggul dan hangus, garis api, lalu hutan yang tersisa dan kebun sawit.
  for (let ix = 0; ix < 9; ix++) {
    for (let iz = 0; iz < 14; iz++) {
      const x = -7.4 - ix * 1.05 + (iz % 2) * 0.5;
      const z = -7 + iz * 1.05;
      if (Math.abs(z) > -x - 0.6) continue; // tetap di dalam wilayah zona barat
      const seed = ix * 31 + iz;
      if ((ix + iz) % 4 === 0) continue; // Clearings keep the burned/healthy boundary legible.
      free(
        g,
        () =>
          ix < 2
            ? seed % 3
              ? stump()
              : burntTree(seed)
            : ix < 4
              ? seed % 2
                ? burningTree(seed, seed % 5 === 0)
                : burntTree(seed)
              : z > 0.5
                ? oilPalm(seed) // sisi selatan: sudah jadi kebun sawit
                : tree(seed),
        x,
        z,
        0,
        1,
        0.6,
      );
    }
  }
  g.add(
    faceCenter(firefighter(), -9.2, -2.8),
    faceCenter(firefighter(), -9.4, 3.6),
  );
  return g;
}

export function dressTimur() {
  const g = group(
    "dekor-timur",
    at(parliament(), 13.6, 0, -Math.PI / 2, 1.1),
    at(protest(), 10.5, -2.6, 0, 0.85), // demo di bahu jalan utama, menghadap gedung dewan
    at(stockExchange(), 12.6, -5.4, -Math.PI / 2, 1.1),
    at(stateBank(), 12.6, 5.4, -Math.PI / 2, 1.1),
    at(cooperative(), 8.6, 5.2, -Math.PI / 2, 1),
    at(nutritionAgency(), 8.6, -5.2, -Math.PI / 2, 1),
    at(ambulance(), 8.0, -3.6, Math.PI / 2),
    at(insiderGate(), 11.8, 2.6, -Math.PI / 2, 0.9),
    // Harta di samping gedung dewan.
    at(treasureChest(), 14.4, 2.6, -Math.PI / 2, 1.4),
    at(moneyPile(1), 14.2, 3.5),
    at(moneyPile(2), 14.7, 1.8),
    at(goldBars(), 14.3, -2.4),
    at(goldBars(), 14.6, -3),
    at(safeCabinet(), 14.6, 4.0, -Math.PI / 2),
    at(flag(), 11.2, -3),
    at(flag(), 11.2, 3.4),
    at(billboard(SLOGANS[1]), 14.9, -4.2, -Math.PI / 2, 1.2),
    at(billboard(SLOGANS[2]), 14.9, 4.4, -Math.PI / 2, 1.2),
    at(billboard(SLOGANS[0]), 9.4, -8.1, -Math.PI / 2 + 0.6, 1.1),
    at(unfinishedTower(), 13.9, 9.4, -Math.PI / 2),
  );
  // Gedung-gedung kota di sela kantor pemerintahan.
  const spots: [number, number][] = [
    [10.7, 6.9],
    [13.6, 7.4],
    [11.3, -6.5],
    [13.7, -7.5],
    [13.9, -9.6],
    [10.4, 8.6],
    [12.3, -8.6],
  ];
  spots.forEach(([x, z], i) =>
    free(
      g,
      () =>
        cityBuilding(
          i * 7 + 3,
          i % 3 === 0 ? "kaca" : i % 3 === 1 ? "apartemen" : "ruko",
        ),
      x,
      z,
      -Math.PI / 2,
      1,
      0.8,
    ),
  );
  return g;
}

/** Bangunan pojok, masing-masing menghadap papan. */
export function dressCorners() {
  const port = faceCenter(airport(false), -CORNER, -CORNER);
  port.updateMatrixWorld(true);
  // Ujung landasan dalam koordinat dunia (landasan di z lokal 1.35, panjang 3.2, permukaan y lokal 0.17).
  const a = port.localToWorld(new THREE.Vector3(1.3, 0.17, 1.35));
  const b = port.localToWorld(new THREE.Vector3(-1.3, 0.17, 1.35));
  return group(
    "pojok",
    faceCenter(taxOffice(), CORNER, CORNER),
    faceCenter(hospital(), -CORNER, CORNER),
    port,
    airplaneFlight(a, b),
    faceCenter(vipPrison(), CORNER, -CORNER),
  );
}

/** Posisi dunia bidak pemain ke-slot (0..3) di sebuah petak: empat titik agar tidak bertumpuk. */
export function pawnSpot(index: number, slot: number) {
  const info = tileInfo(index);
  const off = new THREE.Vector3(
    slot % 2 ? 0.22 : -0.22,
    TILE_TOP,
    slot < 2 ? -0.05 : -0.5,
  ).applyAxisAngle(new THREE.Vector3(0, 1, 0), info.rotationY);
  return info.position.clone().add(off);
}

/**
 * Dunia lengkap: tanah, papan, taman Monas, jalan, rel, empat zona, bangunan pojok, awan.
 * withPieces menambahkan bidak dan dadu pajangan (untuk katalog); game memasang bidak dan dadunya sendiri.
 */
export function fullBoard(withPieces = true) {
  const tiles = group("petak");
  for (let i = 0; i < 40; i++) {
    const button = tile(i);
    // Merge each moving cap independently so its geometry can still move as one piece.
    bakeStatic(button.children[0]);
    tiles.add(button);
  }
  const pieces = group("bidak-dan-dadu");
  if (withPieces) {
    Object.values(PAWNS)
      .slice(0, 4)
      .forEach((make, i) => {
        const p = make();
        p.position.copy(pawnSpot(0, i));
        p.scale.setScalar(0.9);
        pieces.add(p);
      });
    const d1 = die();
    const d2 = die(C.red);
    d1.position.set(2.2, 0.15, 3.2);
    d2.position.set(2.6, 0.15, 3.4);
    d2.rotation.set(0.3, 0.8, 0);
    pieces.add(d1, d2);
  }
  pieces.userData.keep = true; // digerakkan, jadi tidak ikut digabung
  const world = bakeStatic(
    group(
      "papan-lengkap",
      terrain(),
      boardBase(),
      tiles,
      highway(),
      railway(),
      connectedWater(),
      dressSelatan(false),
      dressUtara(),
      dressBarat(false),
      dressTimur(),
      dressCorners(),
      clouds(3),
      pieces,
    ),
  );
  if (withPieces) {
    const buttons = tiles.children;
    const pawns = pieces.children.slice(0, 4);
    onUpdate(world, (t) => {
      const step = Math.floor(Math.max(0, t)) % 40;
      const phase = Math.max(0, t) % 1;
      const hop = THREE.MathUtils.clamp((phase - 0.55) / 0.45, 0, 1);
      pawns.forEach((pawn, i) => {
        pawn.userData.supportOffset = 0;
        if (i === 0) {
          pawn.position.lerpVectors(pawnSpot(step, i), pawnSpot((step + 1) % 40, i), hop);
          pawn.position.y += Math.sin(hop * Math.PI) * 0.35;
          pawn.userData.tileContacts = [
            { index: step, weight: 1 - THREE.MathUtils.smoothstep(hop, 0, 0.25) },
            { index: (step + 1) % 40, weight: THREE.MathUtils.smoothstep(hop, 0.65, 1) },
          ];
        } else {
          pawn.position.copy(pawnSpot(0, i));
          pawn.userData.tileContacts = [{ index: 0, weight: 1 }];
        }
      });
      loadTileButtons(buttons, pawns);
    });
    onUpdate(pieces, () => supportPawns(buttons, pawns));
  }
  return world;
}
