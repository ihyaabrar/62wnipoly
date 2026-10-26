import * as THREE from "three";
import { C, ball, box, cyl, gableRoof, group, mat, onUpdate, rng, textTexture, texturedPlane, windows } from "./kit";
import { emitter, smoke, sparkles } from "./fx";
import { banner, barricade, person, riotPolice, tearGas } from "./props";
import { SLOGANS } from "./banners";
import { model } from "./models";

// Zona Timur: kompleks pemerintahan, uang, bursa, dan demo. Semua nama papan rekaan.

function sign(lines: string[], w: number, h: number, bg: string = C.white, fg: string = C.ink) {
  return texturedPlane(w, h, textTexture(lines, { bg, fg, w: 512, h: Math.round((512 * h) / w), border: fg }));
}

function steps(w: number, n: number, z: number) {
  const g = group("tangga");
  for (let i = 0; i < n; i++) g.add(box(w - i * 0.1, 0.05, 0.12, C.concrete, [0, i * 0.05, z - i * 0.1]));
  return g;
}

/** Gedung dewan: kubah hijau terbelah dua seperti cangkang, pilar, tangga, air mancur. */
export function parliament() {
  // Seperempat bola (setengah kubah) di sisi x >= 0; belahan kiri adalah cerminannya.
  const shell = new THREE.SphereGeometry(1, 24, 10, 0, Math.PI, 0, Math.PI / 2);
  shell.rotateY(Math.PI / 2); // potongan semula depan-belakang (z >= 0) jadi kanan (x >= 0)
  shell.scale(0.85, 0.72, 0.72);
  const domeMat = mat("#3e8f6e", { roughness: 0.45, metalness: 0.2 });
  domeMat.side = THREE.DoubleSide;
  const half = (side: number) => {
    const m = new THREE.Mesh(shell, domeMat);
    m.position.set(side * 0.06, 0.72, 0);
    // Rotasi Euler XYZ: Rz (miring keluar) lalu Ry (cermin untuk sisi kiri) -> simetris sempurna.
    m.rotation.set(0, side > 0 ? 0 : Math.PI, -0.1);
    m.castShadow = true;
    return m;
  };
  const g = group("gedung-dewan",
    box(2.8, 0.1, 2, C.concrete),
    box(2.4, 0.62, 1.5, C.white, [0, 0.1, 0]),
    windows(2.2, 0.5, 2, 9, 0.76, 0.12, "#2d4a5a"),
    box(2.5, 0.06, 1.6, "#d9d4c8", [0, 0.72, 0]),
    half(1), half(-1),
    steps(1.6, 4, 1.05),
  );
  for (let i = 0; i < 10; i++) g.add(cyl(0.045, 0.05, 0.6, C.white, [-1.1 + i * 0.244, 0.12, 0.82], 10));
  const s = sign(["GEDUNG DEWAN", "TUNJANGAN NAIK, RAPAT DITUNDA"], 1.6, 0.26);
  s.position.set(0, 0.48, 0.86);
  g.add(s);
  // Air mancur di depan.
  const fountain = emitter("air-mancur", { count: 14, color: "#cfe8f7", colorEnd: "#ffffff", size: [0.08, 0.3], rise: 0.4, spread: 0.25, drift: [0, 0], speed: 0.8, opacity: 0.6, seed: 3 });
  fountain.position.set(0, 0.12, 1.75);
  g.add(cyl(0.35, 0.38, 0.1, C.concrete, [0, 0, 1.75], 14), cyl(0.3, 0.3, 0.02, mat("#5fa8d3", { roughness: 0.1 }), [0, 0.09, 1.75], 14), fountain);
  for (const x of [-1.2, 1.2]) {
    const f = flag();
    f.position.set(x, 0, 1.3);
    g.add(f);
  }
  return g;
}

export function nutritionAgency() {
  const chimneySmoke = smoke({ count: 8, color: "#9aa66e", colorEnd: "#c9cfb0", size: [0.15, 0.7], rise: 1.4, spread: 0.25, speed: 0.2, opacity: 0.6, seed: 2 });
  chimneySmoke.position.set(0.45, 1.35, -0.2);
  const g = group("dapur-gizi",
    box(1.5, 0.85, 1.05, "#f1e3c2"),
    windows(1.3, 0.6, 1, 4, 0.53, 0.18, "#3a4a52"),
    gableRoof(1.65, 0.4, 1.2, C.roofRed, [0, 0.85, 0]),
    box(0.32, 0.5, 0.02, "#7a8a91", [-0.5, 0, 0.53]), // pintu gulung
    cyl(0.07, 0.07, 0.45, C.concrete, [0.45, 0.9, -0.2], 8),
    chimneySmoke,
  );
  const s = sign(["DAPUR GIZI GRATIS*", "*syarat & keracunan berlaku"], 1.2, 0.26, C.white, C.red);
  s.position.set(0.15, 0.6, 0.54);
  g.add(s);
  // Tumpukan ompreng menunggu dikirim.
  for (let i = 0; i < 4; i++) g.add(box(0.3, 0.03, 0.22, mat("#c9d1d6", { metalness: 0.8, roughness: 0.3 }), [0.9, i * 0.035, 0.7]));
  return g;
}

/** Ambulans dengan lampu berkedip (menunggu di depan dapur). */
export function ambulance() {
  const lightMat = mat("#ff2a2a", { emissive: "#ff2a2a", emissiveIntensity: 3 });
  const lightMat2 = mat("#2a6bff", { emissive: "#2a6bff", emissiveIntensity: 3 });
  const tex = textTexture(["AMBULANS"], { bg: C.white, fg: C.red, w: 256, h: 64 });
  const wheel = (x: number, z: number) => cyl(0.08, 0.08, 0.06, C.ink, [x, 0.08, z], 10, [Math.PI / 2, 0, 0]);
  const g = group("ambulans",
    box(0.9, 0.42, 0.42, C.white, [0, 0.08, 0]),
    box(0.25, 0.28, 0.4, C.white, [0.55, 0.08, 0]),
    box(0.02, 0.14, 0.34, "#2b3a4a", [0.68, 0.22, 0]),
    box(0.9, 0.05, 0.43, C.red, [0, 0.28, 0]),
    texturedPlane(0.5, 0.12, tex, [0, 0.38, 0.215], [0, 0, 0], false),
    box(0.1, 0.05, 0.08, lightMat, [0.1, 0.5, 0.1]),
    box(0.1, 0.05, 0.08, lightMat2, [0.1, 0.5, -0.1]),
    wheel(-0.3, 0.2), wheel(-0.3, -0.2), wheel(0.45, 0.2), wheel(0.45, -0.2),
  );
  return onUpdate(g, (t) => {
    const on = Math.sin(t * 10) > 0;
    lightMat.emissiveIntensity = on ? 4 : 0.2;
    lightMat2.emissiveIntensity = on ? 0.2 : 4;
  });
}

export function cooperative() {
  const g = group("kopdes",
    box(1.2, 0.65, 0.85, C.white),
    box(1.2, 0.14, 0.85, C.merah, [0, 0.65, 0]),
    box(1.2, 0.14, 0.85, C.white, [0, 0.79, 0]),
    box(0.26, 0.42, 0.02, C.woodDark, [-0.35, 0, 0.43]),
    windows(0.5, 0.3, 1, 2, 0.43, 0.25, "#33424f"),
    // Gudang di belakang (dibiayai pinjaman).
    box(1.0, 0.55, 0.7, "#c9c2b3", [0.2, 0, -0.85]),
    gableRoof(1.05, 0.25, 0.75, "#7f8c8d", [0.2, 0.55, -0.85]),
  );
  const s = sign(["KOPDES", "PINJAM 3 M, BAYAR KAPAN-KAPAN"], 0.95, 0.24, C.white, C.merah);
  s.position.set(0.2, 0.34, 0.44);
  g.add(s);
  return g;
}

export function stateBank() {
  const g = group("bank-pelat-merah",
    box(1.6, 0.12, 1.2, C.concrete),
    box(1.3, 0.75, 0.8, "#e7e1d3", [0, 0.12, -0.15]),
    gableRoof(1.5, 0.32, 1.15, "#d8d1c0", [0, 0.87, -0.05]),
    box(1.5, 0.06, 1.15, "#cfc7b4", [0, 0.82, -0.05]),
    steps(1, 3, 0.6),
    windows(1.1, 0.5, 1, 4, 0.26, 0.25, "#2d4a5a"),
  );
  for (let i = 0; i < 6; i++) g.add(cyl(0.045, 0.05, 0.7, C.white, [-0.55 + i * 0.22, 0.12, 0.4], 10));
  const s = sign(["BANK PELAT MERAH"], 1, 0.13, C.merah, C.white);
  s.position.set(0, 0.95, 0.53);
  g.add(s);
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
  tctx.fillText("BBCA ▼  BMRI ▼  BBRI ▼  TLKM ▼  ASING JUAL BERSIH ▼  RUPIAH 18.000 ▼  ", 10, 34);
  ttex.needsUpdate = true;
  let value = 5185;
  let pct = -8.01;
  const draw = (t: number) => {
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, 512, 320);
    ctx.strokeStyle = "#1c2633";
    ctx.lineWidth = 1;
    for (let y = 100; y < 280; y += 30) (ctx.beginPath(), ctx.moveTo(0, y), ctx.lineTo(512, y), ctx.stroke());
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
  const screenMat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: "#ffffff", emissiveIntensity: 1.4, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.94), screenMat);
  screen.position.set(0, 1.62, 0.5);
  const ticker = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.08), new THREE.MeshStandardMaterial({ map: ttex, emissiveMap: ttex, emissive: "#ffffff", emissiveIntensity: 1.6, toneMapped: false }));
  ticker.position.set(0, 0.72, 0.461);
  const glass = mat("#3c5a78", { roughness: 0.08, metalness: 0.7 });
  const g = group("gedung-bursa",
    box(1.2, 3.2, 0.9, glass),
    windows(1.1, 3.1, 14, 6, 0.455, 0.05, "#1d2a38", 0.6),
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
    if (acc > 0.25) (acc = 0), draw(t);
  });
}

export function moneyPile(seed = 1) {
  const r = rng(seed);
  const g = group("tumpukan-uang");
  for (let i = 0; i < 24; i++) {
    const red = i % 3 !== 0;
    const b = box(0.3, 0.05, 0.14, red ? "#d9a0a8" : "#7fb2d9", [(r() - 0.5) * 0.5, Math.floor(i / 8) * 0.05, (r() - 0.5) * 0.4], [0, r() * 3, 0]);
    g.add(b, box(0.31, 0.052, 0.025, C.white, [b.position.x, b.position.y, b.position.z], [0, b.rotation.y, 0]));
  }
  return g;
}

export function goldBars() {
  const gm = mat(C.gold, { metalness: 0.9, roughness: 0.25, emissive: C.goldDark, emissiveIntensity: 0.25 });
  const g = group("emas-batangan");
  const pos: [number, number, number][] = [[-0.13, 0, 0], [0.13, 0, 0], [0, 0.07, 0], [-0.13, 0, 0.13], [0.13, 0, 0.13]];
  for (const p of pos) g.add(box(0.22, 0.07, 0.1, gm, p));
  g.add(sparkles(6, 0.25, 0.25, 2));
  return g;
}

export function treasureChest() {
  const gm = mat(C.gold, { metalness: 0.9, roughness: 0.25, emissive: C.gold, emissiveIntensity: 0.8 });
  const lid = box(0.6, 0.12, 0.4, C.woodDark, [0, 0, -0.2]);
  lid.geometry.translate(0, 0, 0.2);
  const lidG = group("tutup", lid);
  lidG.position.set(0, 0.35, -0.2);
  lidG.rotation.x = -1.1;
  const g = group("peti-harta",
    box(0.6, 0.35, 0.4, C.wood),
    box(0.62, 0.05, 0.42, C.goldDark, [0, 0.15, 0]),
    box(0.05, 0.36, 0.42, C.goldDark, [0.25, 0, 0]),
    box(0.05, 0.36, 0.42, C.goldDark, [-0.25, 0, 0]),
    ball(0.12, gm, [-0.1, 0.36, 0]), ball(0.1, gm, [0.12, 0.36, 0.05]), ball(0.09, gm, [0.02, 0.4, -0.08]),
    lidG,
    sparkles(10, 0.3, 0.5, 4),
  );
  const glow = new THREE.PointLight(C.gold, 1.5, 1.5, 2);
  glow.position.y = 0.5;
  g.add(glow);
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
  const cloth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }));
  cloth.position.set(0.3, 1.3, 0);
  cloth.castShadow = true;
  const g = group("bendera", cyl(0.02, 0.025, 1.5, C.concrete), ball(0.04, C.gold, [0, 1.52, 0]), cloth);
  return onUpdate(g, (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3];
      p.setZ(i, Math.sin(x * 8 - t * 5) * 0.05 * (x + 0.3));
    }
    p.needsUpdate = true;
  });
}

export function insiderGate() {
  const s = sign(["DILARANG MASUK", "KECUALI ORANG DALAM"], 1, 0.26, C.white, C.red);
  s.position.set(0, 0.85, 0.07);
  const arm = box(1.1, 0.04, 0.04, C.red, [0, 0, 0]);
  arm.geometry.translate(0.55, 0, 0);
  arm.position.set(-0.55, 0.5, 0.1);
  const g = group("gerbang-orang-dalam",
    box(0.14, 1.05, 0.14, C.concrete, [-0.6, 0, 0]),
    box(0.14, 1.05, 0.14, C.concrete, [0.6, 0, 0]),
    box(0.3, 0.4, 0.3, "#d9d4c8", [-0.9, 0, 0]), // pos satpam
    arm,
    s,
  );
  // Palang naik turun: sesekali terbuka (untuk yang kenal orang dalam).
  return onUpdate(g, (t) => (arm.rotation.z = Math.max(0, Math.sin(t * 0.6)) * 1.2));
}

const ROOF_SIGNS = [["APARTEMEN", "MULAI 2 M"], ["RUKO DIJUAL"], ["KANTOR PUSAT", "BUMN"], ["MALL", "SEPI"], ["HOTEL", "BINTANG 5"], ["CO-WORKING", "TANPA KERJA"]];

/** Gedung kota acak: menara kaca, perkantoran beton, atau apartemen. */
const KAYKIT_BUILDINGS = ["gedungA", "gedungB", "gedungC", "gedungD", "gedungE", "gedungF", "gedungG", "gedungH"] as const;

export function cityBuilding(seed = 1) {
  // Gedung KayKit (CC0) dengan papan nama satire di atapnya; gedung prosedural lama sebagai cadangan.
  const m = model(KAYKIT_BUILDINGS[seed % KAYKIT_BUILDINGS.length], 0.7);
  if (m) {
    const b = new THREE.Box3().setFromObject(m);
    const w = b.max.x - b.min.x, top = b.max.y, front = b.max.z;
    const rs = rng(seed + 7);
    const s = ROOF_SIGNS[Math.floor(rs() * ROOF_SIGNS.length)];
    const signTex = textTexture(s, { bg: C.ink, fg: ["#f2b92e", "#ff8a6b", "#9fd3e8"][Math.floor(rs() * 3)], w: 256, h: 96 });
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: "#ffffff", emissiveIntensity: 0.7 });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.8, 1.1), 0.25), signMat);
    sign.position.set(0, top + 0.2, front - 0.15);
    return group("gedung-kota", m, sign, box(0.03, 0.2, 0.03, C.ink, [-0.35, top, front - 0.18]), box(0.03, 0.2, 0.03, C.ink, [0.35, top, front - 0.18]));
  }
  const r = rng(seed);
  const kind = Math.floor(r() * 3);
  const w = 0.8 + r() * 0.5, d = 0.8 + r() * 0.4;
  const h = kind === 0 ? 2.2 + r() * 1.6 : kind === 1 ? 1.3 + r() * 0.8 : 1.6 + r() * 1;
  const body = kind === 0 ? mat(["#3c5a78", "#466b7d", "#2f4a63"][Math.floor(r() * 3)], { roughness: 0.1, metalness: 0.6 }) : mat(["#d9d1c1", "#c9c2b3", "#e6dccb", "#b9b2a3"][Math.floor(r() * 4)]);
  const rows = Math.round(h / 0.22);
  const g = group("gedung-kota",
    box(w + 0.1, 0.1, d + 0.1, C.concrete),
    box(w, h, d, body, [0, 0.1, 0]),
    windows(w - 0.1, h - 0.2, rows, Math.max(3, Math.round(w / 0.18)), d / 2 + 0.005, 0.18, "#2b3a4a", r() > 0.4 ? 0.5 : 0),
  );
  // Jendela juga di sisi samping.
  const side = windows(d - 0.1, h - 0.2, rows, Math.max(3, Math.round(d / 0.18)), w / 2 + 0.005, 0.18, "#2b3a4a");
  side.rotation.y = Math.PI / 2;
  g.add(side);
  if (kind === 2) for (let y = 0.5; y < h; y += 0.44) g.add(box(w + 0.08, 0.03, d + 0.08, "#f2eee6", [0, y, 0])); // balkon
  // Atap: tandon air, AC, antena, papan nama.
  g.add(cyl(0.1, 0.1, 0.18, "#8f9aa3", [w * 0.25, h + 0.1, -d * 0.2], 8), box(0.18, 0.08, 0.14, "#d0d0d0", [-w * 0.25, h + 0.1, d * 0.15]));
  if (r() > 0.5) g.add(cyl(0.01, 0.01, 0.5, C.ink, [-w * 0.3, h + 0.1, -d * 0.3], 4));
  const s = ROOF_SIGNS[Math.floor(r() * ROOF_SIGNS.length)];
  const signTex = textTexture(s, { bg: C.ink, fg: ["#ffcc00", "#ff6b6b", "#7fe0ff"][Math.floor(r() * 3)], w: 256, h: 96 });
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: "#ffffff", emissiveIntensity: 0.9 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, 0.25), signMat);
  sign.position.set(0, h + 0.3, d / 2 - 0.05);
  g.add(sign, box(0.03, 0.2, 0.03, C.ink, [-w * 0.35, h + 0.1, d / 2 - 0.08]), box(0.03, 0.2, 0.03, C.ink, [w * 0.35, h + 0.1, d / 2 - 0.08]));
  return g;
}

/** Proyek mangkrak: rangka beton setengah jadi, besi mencuat, crane yang tak bergerak. */
export function unfinishedTower() {
  const g = group("gedung-mangkrak", box(1.3, 0.1, 1.1, C.concrete));
  const floors = 6;
  for (let f = 0; f < floors; f++) {
    const y = 0.1 + f * 0.35;
    g.add(box(1.1, 0.05, 0.9, "#b8b2a6", [0, y + 0.3, 0]));
    for (const [x, z] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4], [0, 0.4], [0, -0.4]]) if (f < floors - 1 || x !== 0) g.add(box(0.07, 0.3, 0.07, "#c9c2b3", [x, y, z]));
  }
  const top = 0.1 + floors * 0.35;
  for (let i = 0; i < 8; i++) g.add(box(0.012, 0.25, 0.012, "#7a4a2a", [-0.5 + (i % 4) * 0.33, top, i < 4 ? -0.4 : 0.4])); // besi mencuat
  // Crane menara.
  const crane = group("crane",
    box(0.1, 3.4, 0.1, "#e8b21f", [0, 0, 0]),
    box(2.2, 0.08, 0.08, "#e8b21f", [-0.5, 3.4, 0]),
    box(0.3, 0.2, 0.2, "#4a4a4a", [0.5, 3.3, 0]),
    cyl(0.005, 0.005, 1.2, C.ink, [-1.3, 2.2, 0], 4),
    box(0.15, 0.12, 0.15, "#7a4a2a", [-1.3, 2.1, 0]),
  );
  crane.position.set(0.85, 0, -0.5);
  g.add(crane);
  const tex = textTexture(["PROYEK STRATEGIS", "(MANGKRAK)"], { bg: C.white, fg: C.red, w: 512, h: 160, border: C.red });
  g.add(texturedPlane(1.1, 0.34, tex, [0, 0.5, 0.56]));
  return g;
}

/** Truk water cannon aparat. */
export function waterCannon() {
  const spray = emitter("semprotan", { count: 18, color: "#d8eefc", colorEnd: "#ffffff", size: [0.1, 0.5], rise: 0.6, spread: 0.2, drift: [3, 0], speed: 0.9, opacity: 0.7, seed: 6 });
  spray.position.set(0.55, 0.62, 0);
  const wheel = (x: number, z: number) => cyl(0.1, 0.1, 0.08, C.ink, [x, 0.1, z], 10, [Math.PI / 2, 0, 0]);
  return group("water-cannon",
    box(1.1, 0.45, 0.5, "#3a4250", [0, 0.1, 0]),
    box(0.3, 0.3, 0.48, "#3a4250", [0.65, 0.1, 0]),
    box(0.02, 0.14, 0.4, "#1d2a38", [0.81, 0.22, 0]),
    cyl(0.06, 0.06, 0.1, C.ink, [0.2, 0.55, 0], 8),
    cyl(0.025, 0.03, 0.4, C.ink, [0.2, 0.63, 0], 6, [0, 0, -Math.PI / 2 + 0.2]),
    wheel(-0.35, 0.26), wheel(-0.35, -0.26), wheel(0.6, 0.26), wheel(0.6, -0.26),
    spray,
  );
}

/** Demo di depan gedung dewan: kerumunan, spanduk, barisan aparat, gas air mata. */
export function protest(seed = 4) {
  const r = rng(seed);
  const crowd = group("kerumunan");
  const colors = ["#2fa84f", "#f2c94c", "#24345c", "#c8102e", "#f7f7f2", "#1d1f24", "#7f5af0", "#ff8fb1"];
  for (let i = 0; i < 46; i++) {
    const p = person(colors[Math.floor(r() * colors.length)], seed + i);
    p.position.set(-0.4 - r() * 1.8, 0, (r() - 0.5) * 3.2);
    p.rotation.y = Math.PI / 2 + (r() - 0.5) * 0.6;
    crowd.add(p);
  }
  const g = group("demo", crowd);
  [0, 5, 9, 10, 4].forEach((idx, i) => {
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
  return onUpdate(g, (t) => crowd.children.forEach((p, i) => (p.position.y = Math.max(0, Math.sin(t * 5 + i)) * 0.05)));
}
