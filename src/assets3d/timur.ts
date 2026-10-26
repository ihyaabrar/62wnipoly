import * as THREE from "three";
import {
  C,
  ball,
  box,
  softBox,
  cyl,
  gableRoof,
  group,
  mat,
  onUpdate,
  rng,
  textTexture,
  texturedPlane,
  windows,
} from "./kit";
import { emitter, smoke, sparkles } from "./fx";
import { banner, barricade, person, riotPolice, tearGas } from "./props";
import { SLOGANS } from "./banners";
import { serviceVehicle } from "./vehicles";
import { facadeSides } from "./architecture";

// Zona Timur: kompleks pemerintahan, uang, bursa, dan demo. Semua nama papan rekaan.

function sign(
  lines: string[],
  w: number,
  h: number,
  bg: string = C.white,
  fg: string = C.ink,
) {
  return texturedPlane(
    w,
    h,
    textTexture(lines, {
      bg,
      fg,
      w: 512,
      h: Math.round((512 * h) / w),
      border: fg,
    }),
  );
}

function steps(w: number, n: number, z: number) {
  const g = group("tangga");
  for (let i = 0; i < n; i++)
    g.add(box(w - i * 0.1, 0.05, 0.12, C.concrete, [0, i * 0.05, z - i * 0.1]));
  return g;
}

/** Gedung dewan: kubah hijau terbelah dua seperti cangkang, pilar, tangga, air mancur. */
export function parliament() {
  // Seperempat bola (setengah kubah) di sisi x >= 0; belahan kiri adalah cerminannya.
  const shell = new THREE.SphereGeometry(1, 24, 10, 0, Math.PI, 0, Math.PI / 2);
  shell.rotateY(Math.PI / 2); // potongan semula depan-belakang (z >= 0) jadi kanan (x >= 0)
  shell.scale(0.85, 0.72, 0.72);
  const domeMat = mat(C.greenDark, { roughness: 0.65, metalness: 0.1 }).clone();
  domeMat.userData.sharedResource = false;
  domeMat.side = THREE.DoubleSide;
  const half = (side: number) => {
    const m = new THREE.Mesh(shell, domeMat);
    m.position.set(side * 0.018, 0.72, 0);
    // Rotasi Euler XYZ: Rz (miring keluar) lalu Ry (cermin untuk sisi kiri) -> simetris sempurna.
    m.rotation.set(0, side > 0 ? 0 : Math.PI, -0.1);
    m.castShadow = true;
    return m;
  };
  const g = group(
    "gedung-dewan",
    box(2.8, 0.1, 2, C.concrete),
    box(2.4, 0.62, 1.5, C.white, [0, 0.1, 0]),
    windows(2.2, 0.5, 2, 9, 0.76, 0.12, "#2d4a5a"),
    box(2.5, 0.06, 1.6, "#d9d4c8", [0, 0.72, 0]),
    half(1),
    half(-1),
    steps(1.6, 4, 1.05),
  );
  for (let i = 0; i < 8; i++)
    g.add(cyl(0.055, 0.06, 0.6, C.white, [-1.1 + i * 0.314, 0.12, 0.82], 10));
  const s = sign(["GEDUNG DEWAN"], 1.6, 0.26);
  s.position.set(0, 0.66, 0.88);
  g.add(s);
  g.add(facadeSides(2.4, 0.62, 1.5, 1));
  // Air mancur di depan.
  const fountain = emitter("air-mancur", {
    count: 14,
    color: "#cfe8f7",
    colorEnd: "#ffffff",
    size: [0.035, 0.14],
    rise: 0.4,
    spread: 0.25,
    drift: [0, 0],
    speed: 0.8,
    opacity: 0.42,
    seed: 3,
  });
  fountain.position.set(0, 0.12, 1.75);
  g.add(
    cyl(0.35, 0.38, 0.1, C.concrete, [0, 0, 1.75], 14),
    cyl(
      0.3,
      0.3,
      0.02,
      mat("#5fa8d3", { roughness: 0.1 }),
      [0, 0.09, 1.75],
      14,
    ),
    fountain,
  );
  for (const x of [-1.2, 1.2]) {
    const f = flag();
    f.position.set(x, 0, 1.3);
    g.add(f);
  }
  return g;
}

export function nutritionAgency() {
  const chimneySmoke = smoke({
    count: 8,
    color: "#9aa66e",
    colorEnd: "#c9cfb0",
    size: [0.15, 0.7],
    rise: 1.4,
    spread: 0.25,
    speed: 0.2,
    opacity: 0.42,
    seed: 2,
  });
  chimneySmoke.position.set(0.45, 1.35, -0.2);
  const g = group(
    "dapur-gizi",
    box(1.5, 0.85, 1.05, "#f1e3c2"),
    windows(1.3, 0.6, 1, 4, 0.53, 0.18, "#3a4a52"),
    gableRoof(1.65, 0.4, 1.2, C.roofRed, [0, 0.85, 0]),
    box(0.32, 0.5, 0.02, "#7a8a91", [-0.5, 0, 0.53]), // pintu gulung
    cyl(0.07, 0.07, 0.45, C.concrete, [0.45, 0.9, -0.2], 8),
    chimneySmoke,
  );
  const s = sign(["DAPUR GIZI GRATIS*"], 1.2, 0.26, C.white, C.red);
  s.position.set(0, 0.76, 0.56);
  g.add(s);
  g.add(
    facadeSides(1.5, 0.8, 1.05, 1),
    box(0.38, 0.5, 0.025, C.navy, [-0.5, 0.02, 0.55]),
  );
  for (let i = 0; i < 3; i++)
    g.add(box(0.3, 0.025, 0.035, C.concrete, [0.35, 0.64 + i * 0.06, 0.54]));
  g.add(box(0.45, 0.04, 0.32, C.concrete, [0.9, 0.12, 0.7]));
  // Tumpukan ompreng menunggu dikirim.
  for (let i = 0; i < 4; i++)
    g.add(
      box(0.3, 0.03, 0.22, mat("#c9d1d6", { metalness: 0.8, roughness: 0.3 }), [
        0.9,
        i * 0.035,
        0.7,
      ]),
    );
  return g;
}

/** Ambulans dengan lampu berkedip (menunggu di depan dapur). */
export function ambulance() {
  return serviceVehicle("ambulans");
}

export function cooperative() {
  const g = group(
    "kopdes",
    box(1.2, 0.65, 0.85, C.white),
    box(1.2, 0.14, 0.85, C.merah, [0, 0.65, 0]),
    box(1.2, 0.14, 0.85, C.white, [0, 0.79, 0]),
    box(0.26, 0.42, 0.02, C.woodDark, [-0.35, 0, 0.43]),
    windows(0.5, 0.3, 1, 2, 0.43, 0.25, "#33424f"),
    // Gudang di belakang (dibiayai pinjaman).
    box(1.0, 0.55, 0.7, "#c9c2b3", [0.2, 0, -0.85]),
    gableRoof(1.05, 0.25, 0.75, "#7f8c8d", [0.2, 0.55, -0.85]),
  );
  const s = sign(["KOPDES WARGA"], 0.95, 0.24, C.white, C.merah);
  s.position.set(0, 0.69, 0.45);
  g.add(s);
  g.add(
    box(1.3, 0.04, 0.34, C.roofRed, [0, 0.6, 0.59]),
    box(0.45, 0.4, 0.035, C.woodDark, [0.2, 0, -1.21]),
  );
  for (let i = 0; i < 3; i++)
    g.add(box(0.21, 0.17, 0.2, C.wood, [0.8, 0.17 * (i % 2), -0.4 - i * 0.21]));
  return g;
}

export function stateBank() {
  const g = group(
    "bank-pelat-merah",
    box(1.6, 0.12, 1.2, C.concrete),
    box(1.3, 0.75, 0.8, "#e7e1d3", [0, 0.12, -0.15]),
    gableRoof(1.5, 0.32, 1.15, "#d8d1c0", [0, 0.87, -0.05]),
    box(1.5, 0.06, 1.15, "#cfc7b4", [0, 0.82, -0.05]),
    steps(1, 3, 0.6),
    windows(1.1, 0.5, 1, 4, 0.26, 0.25, "#2d4a5a"),
  );
  for (let i = 0; i < 6; i++)
    g.add(cyl(0.045, 0.05, 0.7, C.white, [-0.55 + i * 0.22, 0.12, 0.4], 10));
  const s = sign(["BANK PELAT MERAH"], 1, 0.13, C.merah, C.white);
  s.position.set(0, 0.95, 0.53);
  g.add(s);
  g.add(
    softBox(0.22, 0.44, 0.16, C.navy, [0.53, 0.12, 0.48]),
    box(0.14, 0.11, 0.018, C.water, [0.53, 0.38, 0.57]),
  );
  return g;
}

/** Gedung bursa: menara kaca, layar indeks besar, pita berjalan. setIndex(nilai, persen). */
export function stockExchange() {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 320;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const tcv = document.createElement("canvas");
  tcv.width = 1024;
  tcv.height = 64;
  const ttex = new THREE.CanvasTexture(tcv);
  ttex.colorSpace = THREE.SRGBColorSpace;
  ttex.wrapS = THREE.RepeatWrapping;
  const tctx = tcv.getContext("2d")!;
  tctx.fillStyle = "#050607";
  tctx.fillRect(0, 0, 1024, 64);
  tctx.font = "900 40px Impact, sans-serif";
  tctx.textBaseline = "middle";
  tctx.fillStyle = "#ff3b3b";
  tctx.fillText(
    "BBCA ▼  BMRI ▼  BBRI ▼  TLKM ▼  ASING JUAL BERSIH ▼  RUPIAH 18.000 ▼  ",
    10,
    34,
  );
  ttex.needsUpdate = true;
  let value = 5185;
  let pct = -8.01;
  const draw = (t: number) => {
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, 512, 320);
    ctx.strokeStyle = "#1c2633";
    ctx.lineWidth = 1;
    for (let y = 100; y < 280; y += 30)
      (ctx.beginPath(), ctx.moveTo(0, y), ctx.lineTo(512, y), ctx.stroke());
    const down = pct < 0;
    const col = down ? "#ff3b3b" : "#2fe07a";
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let x = 0; x <= 40; x++) {
      const y = 110 + x * (down ? 3.6 : -2) + Math.sin(x * 1.3 + t) * 9;
      x === 0 ? ctx.moveTo(20 + x * 11.8, y) : ctx.lineTo(20 + x * 11.8, y);
    }
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = "900 64px Impact, sans-serif";
    ctx.fillText(`IHSG ${value.toLocaleString("id-ID")}`, 20, 70);
    ctx.font = "900 48px Impact, sans-serif";
    ctx.fillText(`${down ? "▼" : "▲"} ${pct.toFixed(2)}%`, 20, 305);
    if (pct <= -8 && Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = "#ffcc00";
      ctx.fillText("TRADING HALT", 230, 305);
    }
    tex.needsUpdate = true;
  };
  draw(0);
  const screenMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissiveMap: tex,
    emissive: "#ffffff",
    emissiveIntensity: 0.6,
    toneMapped: false,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.94), screenMat);
  screen.position.set(0, 1.62, 0.5);
  const ticker = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.08),
    new THREE.MeshStandardMaterial({
      map: ttex,
      emissiveMap: ttex,
      emissive: "#ffffff",
      emissiveIntensity: 0.6,
      toneMapped: false,
    }),
  );
  ticker.position.set(0, 0.72, 0.461);
  const glass = mat("#3c5a78", { roughness: 0.43, metalness: 0.15 });
  const g = group(
    "gedung-bursa",
    box(1.2, 3.2, 0.9, glass),
    windows(1.1, 3.1, 9, 4, 0.455, 0.05, "#78949d", 0),
    box(1.3, 0.12, 1, "#1d2530", [0, 3.2, 0]),
    box(0.06, 0.6, 0.06, C.concrete, [0.4, 3.32, 0.2]), // antena
    box(1.62, 1.04, 0.08, C.ink, [0, 1.1, 0.42]),
    screen,
    box(1.25, 0.12, 0.04, C.ink, [0, 0.66, 0.44]),
    ticker,
    box(1.4, 0.08, 1.1, C.concrete),
  );
  g.userData.setIndex = (v: number, p: number) => ((value = v), (pct = p));
  let acc = 0;
  return onUpdate(g, (t, dt) => {
    ttex.offset.x = (t * 0.08) % 1;
    acc += dt;
    if (acc > 0.25) ((acc = 0), draw(t));
  });
}

export function moneyPile(seed = 1) {
  const r = rng(seed);
  const g = group("tumpukan-uang");
  for (let i = 0; i < 24; i++) {
    const red = i % 3 !== 0;
    const b = box(
      0.3,
      0.05,
      0.14,
      red ? "#b87b7c" : "#6e95ac",
      [(r() - 0.5) * 0.5, Math.floor(i / 8) * 0.05, (r() - 0.5) * 0.4],
      [0, r() * 3, 0],
    );
    g.add(
      b,
      box(
        0.31,
        0.052,
        0.015,
        C.white,
        [b.position.x, b.position.y, b.position.z],
        [0, b.rotation.y, 0],
      ),
    );
  }
  return g;
}

export function goldBars() {
  const gm = mat(C.gold, { metalness: 0.72, roughness: 0.42 });
  const g = group("emas-batangan");
  const pos: [number, number, number][] = [
    [-0.13, 0, 0],
    [0.13, 0, 0],
    [0, 0.07, 0],
    [-0.13, 0, 0.13],
    [0.13, 0, 0.13],
  ];
  for (const p of pos) g.add(softBox(0.22, 0.07, 0.1, gm, p, 0.012));

  return g;
}

export function treasureChest() {
  const gm = mat(C.gold, { metalness: 0.72, roughness: 0.42 });
  const lid = box(0.6, 0.12, 0.4, C.woodDark, [0, 0, -0.2]);
  lid.geometry.translate(0, 0, 0.2);
  const lidG = group("tutup", lid);
  lidG.position.set(0, 0.35, -0.2);
  lidG.rotation.x = -1.1;
  const g = group(
    "peti-harta",
    box(0.6, 0.35, 0.4, C.wood),
    box(0.62, 0.05, 0.42, C.goldDark, [0, 0.15, 0]),
    box(0.05, 0.36, 0.42, C.goldDark, [0.25, 0, 0]),
    box(0.05, 0.36, 0.42, C.goldDark, [-0.25, 0, 0]),
    ball(0.12, gm, [-0.1, 0.36, 0]),
    ball(0.1, gm, [0.12, 0.36, 0.05]),
    ball(0.09, gm, [0.02, 0.4, -0.08]),
    lidG,
  );
  g.add(box(0.1, 0.09, 0.025, C.ink, [0, 0.24, 0.22]));
  return g;
}

export function flag() {
  const geo = new THREE.PlaneGeometry(0.6, 0.4, 12, 4);
  const base = Float32Array.from(geo.attributes.position.array);
  const cv = document.createElement("canvas");
  cv.width = 64;
  cv.height = 64;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = C.merah;
  ctx.fillRect(0, 0, 64, 32);
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 32, 64, 32);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const cloth = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }),
  );
  cloth.position.set(0.3, 1.3, 0);
  cloth.castShadow = true;
  const g = group(
    "bendera",
    cyl(0.02, 0.025, 1.5, C.concrete),
    ball(0.04, C.gold, [0, 1.52, 0]),
    cloth,
  );
  return onUpdate(g, (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3];
      p.setZ(i, Math.sin(x * 8 - t * 5) * 0.05 * (x + 0.3));
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  });
}

export function insiderGate() {
  const s = sign(
    ["DILARANG MASUK", "KECUALI ORANG DALAM"],
    1,
    0.26,
    C.white,
    C.red,
  );
  s.position.set(0, 0.85, 0.07);
  const arm = box(1.1, 0.055, 0.055, C.red, [0, 0, 0]);
  arm.geometry.translate(0.55, 0, 0);
  arm.position.set(-0.55, 0.5, 0.1);
  const g = group(
    "gerbang-orang-dalam",
    box(0.14, 1.05, 0.14, C.concrete, [-0.6, 0, 0]),
    box(0.14, 1.05, 0.14, C.concrete, [0.6, 0, 0]),
    box(0.3, 0.4, 0.3, "#d9d4c8", [-0.9, 0, 0]), // pos satpam
    arm,
    s,
  );
  // Palang naik turun: sesekali terbuka (untuk yang kenal orang dalam).
  return onUpdate(
    g,
    (t) => (arm.rotation.z = Math.max(0, Math.sin(t * 0.6)) * 1.2),
  );
}

const ROOF_SIGNS = [
  ["APARTEMEN", "MULAI 2 M"],
  ["RUKO DIJUAL"],
  ["KANTOR PUSAT", "BUMN"],
  ["MALL", "SEPI"],
  ["HOTEL", "BINTANG 5"],
  ["CO-WORKING", "TANPA KERJA"],
];

/** Gedung kota acak: menara kaca, perkantoran beton, atau apartemen. */
const KAYKIT_BUILDINGS = [
  "gedungA",
  "gedungB",
  "gedungC",
  "gedungD",
  "gedungE",
  "gedungF",
  "gedungG",
  "gedungH",
] as const;

export function cityBuilding(
  seed = 1,
  kind: "ruko" | "kaca" | "apartemen" = "ruko",
) {
  const r = rng(seed),
    glass = kind === "kaca",
    floors = glass ? 6 : kind === "apartemen" ? 4 : 2;
  const w = glass ? 1.05 : 1.15,
    d = 0.88,
    storey = 0.38,
    h = floors * storey;
  const wall = glass
    ? mat(C.navy, { roughness: 0.43, metalness: 0.15 })
    : mat([C.paper, "#c6c4ad", "#b4b6a5"][seed % 3]);
  const g = group(
    "gedung-kota",
    softBox(w, h, d, wall, [0, 0.08, 0]),
    box(w + 0.13, 0.08, d + 0.12, C.concrete),
  );
  for (let row = 0; row < floors; row++) {
    const y = 0.18 + row * storey;
    g.add(box(w + 0.04, 0.035, d + 0.04, C.concrete, [0, y + 0.27, 0]));
    for (const x of [-0.34, 0, 0.34])
      g.add(box(0.23, 0.23, 0.018, glass ? "#78949d" : C.navy, [x, y, 0.45]));
    for (const side of [-1, 1])
      for (const z of [-0.23, 0.13])
        g.add(
          box(0.018, 0.23, 0.25, glass ? "#78949d" : C.navy, [
            side * (w / 2 + 0.01),
            y,
            z,
          ]),
        );
    if (kind === "apartemen")
      g.add(box(w + 0.15, 0.045, 0.23, C.paper, [0, y + 0.02, 0.5]));
  }
  g.add(
    box(0.25, 0.35, 0.035, C.woodDark, [0, 0.08, 0.46]),
    box(w + 0.1, 0.07, d + 0.1, C.paper, [0, h + 0.08, 0]),
  );
  const title = glass
    ? "KANTOR PUSAT"
    : kind === "apartemen"
      ? "APARTEMEN"
      : "WARUNG & RUKO";
  g.add(
    texturedPlane(
      w * 0.86,
      0.19,
      textTexture([title], { bg: C.ink, fg: C.paper, w: 384, h: 96 }),
      [0, h + 0.26, 0.44],
      [0, 0, 0],
      false,
    ),
  );
  if (r() > 0.35)
    g.add(cyl(0.1, 0.1, 0.18, C.roofBlue, [0.28, h + 0.15, -0.16], 10));
  return g;
}

/** Proyek mangkrak: rangka beton setengah jadi, besi mencuat, crane yang tak bergerak. */
export function unfinishedTower() {
  const g = group("gedung-mangkrak", box(1.3, 0.1, 1.1, C.concrete));
  const floors = 6;
  for (let f = 0; f < floors; f++) {
    const y = 0.1 + f * 0.35;
    g.add(box(1.1, 0.05, 0.9, "#b8b2a6", [0, y + 0.3, 0]));
    for (const [x, z] of [
      [-0.5, -0.4],
      [0.5, -0.4],
      [-0.5, 0.4],
      [0.5, 0.4],
      [0, 0.4],
      [0, -0.4],
    ])
      if (f < floors - 1 || x !== 0)
        g.add(box(0.07, 0.3, 0.07, "#c9c2b3", [x, y, z]));
  }
  const top = 0.1 + floors * 0.35;
  for (let i = 0; i < 8; i++)
    g.add(
      box(0.012, 0.25, 0.012, "#7a4a2a", [
        -0.5 + (i % 4) * 0.33,
        top,
        i < 4 ? -0.4 : 0.4,
      ]),
    ); // besi mencuat
  // Crane menara.
  const crane = group(
    "crane",
    box(0.1, 3.4, 0.1, "#e8b21f", [0, 0, 0]),
    box(2.2, 0.08, 0.08, "#e8b21f", [-0.5, 3.4, 0]),
    box(0.3, 0.2, 0.2, "#4a4a4a", [0.5, 3.3, 0]),
    cyl(0.005, 0.005, 1.2, C.ink, [-1.3, 2.2, 0], 4),
    box(0.15, 0.12, 0.15, "#7a4a2a", [-1.3, 2.1, 0]),
  );
  crane.position.set(0.85, 0, -0.5);
  crane.add(box(0.45, 0.1, 0.45, C.concrete));
  for (let y = 0.2; y < 3.3; y += 0.4)
    crane.add(box(0.055, 0.37, 0.055, C.gold, [0, y, 0], [0, 0, 0.4]));
  g.add(crane);
  for (const x of [-0.75, 0.75])
    g.add(box(0.04, 0.35, 1.4, C.woodDark, [x, 0, 0]));
  const tex = textTexture(["PROYEK STRATEGIS", "(MANGKRAK)"], {
    bg: C.white,
    fg: C.red,
    w: 512,
    h: 160,
    border: C.red,
  });
  g.add(texturedPlane(1.1, 0.34, tex, [0, 0.5, 0.56]));
  return g;
}

/** Truk water cannon aparat. */
export function waterCannon() {
  const g = serviceVehicle("water-cannon");
  const spray = emitter("semprotan", {
    count: 16,
    color: C.water,
    colorEnd: C.paper,
    size: [0.035, 0.22],
    rise: 0.16,
    spread: 0.14,
    drift: [3, 0],
    speed: 0.9,
    opacity: 0.42,
    seed: 6,
  });
  spray.position.set(0.5, 0.65, 0);
  g.add(spray);
  return g;
}

/** Demo di depan gedung dewan: kerumunan, spanduk, barisan aparat, gas air mata. */
export function protest(seed = 4) {
  const r = rng(seed);
  const crowd = group("kerumunan");
  const colors = [C.ojol, C.gold, C.navy, C.red, C.paper, C.ink];
  for (let i = 0; i < 28; i++) {
    const p = person(colors[Math.floor(r() * colors.length)], seed + i);
    p.position.set(-0.4 - r() * 1.8, 0, (r() - 0.5) * 3.2);
    p.rotation.y = Math.PI / 2 + (r() - 0.5) * 0.6;
    crowd.add(p);
  }
  const g = group("demo", crowd);
  [0, 5, 11].forEach((idx, i) => {
    const b = banner(SLOGANS[idx]);
    b.position.set(-0.6 - (i % 2) * 0.8, 0, -1.4 + i * 0.7);
    b.rotation.y = Math.PI / 2;
    g.add(b);
  });
  for (let i = 0; i < 5; i++) {
    const bar = barricade();
    bar.position.set(0.2, 0, -1.4 + i * 0.7);
    bar.rotation.y = Math.PI / 2;
    const pol = riotPolice();
    pol.position.set(0.5, 0, -1.4 + i * 0.7);
    pol.rotation.y = -Math.PI / 2;
    g.add(bar, pol);
  }
  const gas = tearGas();
  gas.position.set(-0.9, 0, 0.6);
  const truck = waterCannon();
  truck.position.set(1.4, 0, -0.4);
  truck.rotation.y = Math.PI;
  g.add(gas, truck);
  return onUpdate(g, (t) =>
    crowd.children.forEach(
      (p, i) => (p.position.y = Math.max(0, Math.sin(t * 5 + i)) * 0.05),
    ),
    crowd.children,
  );
}
