import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { C, ball, box, cone, cyl, group, mat, onUpdate, rng, textTexture, texturedPlane, windows } from "./kit";
import { fire } from "./barat";
import { car, streetLamp } from "./props";

// Dunia di luar papan: tanah yang warnanya membaur antar-zona, jalan raya dan rel kereta berliku
// yang menghubungkan empat zona, lengkap dengan kerusakan sesuai bencana di tiap zona.

export const WORLD = 17; // jari-jari dunia (setengah sisi)
const BOARD_EDGE = 6.3;
const EDGE = WORLD + 0.5;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const noise2 = (x: number, z: number) => Math.sin(x * 0.9 + z * 0.3) * 0.5 + Math.sin(x * 0.37 - z * 1.1) * 0.3 + Math.sin(x * 2.3 + z * 1.7) * 0.2;

type ZoneName = "selatan" | "barat" | "utara" | "timur";
export const zoneAt = (x: number, z: number): ZoneName => (Math.abs(z) > Math.abs(x) ? (z > 0 ? "selatan" : "utara") : x < 0 ? "barat" : "timur");

// Area banjir (sama dengan bidang air di dressSelatan).
// Jalan menjadi jembatan hanya di atas bagian lembah yang cukup dalam.
export const inFlood = (x: number, z: number) => basinAt(x, z) > 0.12;

// Permukaan air banjir: di bawah papan (-0.1), di atas dasar lembah.
export const WATER_Y = -0.6; // cukup rendah: hanya tengah lembah yang tergenang
export const SEA_Y = -0.07;
export const SEA_Z = 15.3; // garis pantai rata-rata; laut di z > shoreZ(x)

/** Garis pantai berkelok: teluk dan tanjung kecil. */
export const shoreZ = (x: number) => SEA_Z + Math.sin(x * 0.33 + 0.6) * 0.55 + Math.sin(x * 0.85 + 2) * 0.22;
/** Pita pasir 0..1 di daratan dekat garis pantai. */
const beachAt = (x: number, z: number) => smooth(shoreZ(x) - 1.6, shoreZ(x) - 0.9, z) * (1 - smooth(shoreZ(x) + 0.1, shoreZ(x) + 0.4, z));

// Sungai: dari tepi barat, berkelok di hutan, bermuara ke lembah banjir.
const RIVER_CURVE = new THREE.CatmullRomCurve3(
  [[-17.6, -6], [-14.5, -5.2], [-12.3, -2.6], [-11.2, 0.8], [-12.2, 4], [-10.2, 6.8], [-8.6, 8.4], [-7.4, 9.4]].map(([x, z]) => new THREE.Vector3(x, 0, z)),
);
export const RIVER = RIVER_CURVE.getSpacedPoints(220).map((v, i, a) => {
  const t = i / (a.length - 1);
  return { x: v.x, z: v.z, y: -0.18 + (WATER_Y + 0.02 + 0.18) * t * t, tx: 0, tz: 0 }; // permukaan turun ke muara
});

/** Jarak ke sungai terdekat dan tinggi permukaannya di titik itu. */
function nearestRiver(x: number, z: number) {
  let d = Infinity, y = 0;
  if (x > -6.5) return { d, y }; // sungai seluruhnya di barat; lewati hitungan untuk titik lain
  for (const p of RIVER) {
    const dd = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (dd < d) (d = dd), (y = p.y);
  }
  return { d: Math.sqrt(d), y };
}

// Cekungan banjir tak simetris [x, z, jari-jari]; yang paling barat menyambung ke muara sungai.
const BASIN_BLOBS: [number, number, number][] = [[-3.4, 10.4, 3.3], [0.6, 9.2, 2.5], [1.9, 11.9, 2.9], [5.2, 10.1, 2.0], [-6.6, 9.9, 1.9], [-0.8, 12.6, 1.8]];

/** Kedalaman lembah banjir 0..1: gabungan beberapa cekungan dengan tepi bergelombang. */
export function basinAt(x: number, z: number) {
  if (z < 6.3 || z > 14.8 || Math.abs(x) > 9.5) return 0;
  // Tepi berkelok dua skala (lekuk besar + gerigi kecil), bukan lingkaran sempurna.
  const warp = noise2(x * 0.75 + 4, z * 0.75 - 2) * 0.85 + noise2(x * 2.1 - 7, z * 1.9 + 3) * 0.3;
  let v = 0;
  // Cekungan sedikit memanjang ke arah barat-timur dan digabung halus (bukan max) supaya tidak bergelembung.
  for (const [bx, bz, br] of BASIN_BLOBS) {
    const d = Math.hypot((x - bx) * 0.8, (z - bz) * 1.15) + warp;
    const b = 1 - smooth(br * 0.3, br, d);
    v = v + b - v * b;
  }
  // Jangan menggerus tepi papan dan pantai.
  return v * smooth(6.4, 7.4, z) * (1 - smooth(13.6, 14.7, z));
}

/** Tinggi tanah alami (sebelum dipotong untuk jalan dan rel). */
function baseHeight(x: number, z: number) {
  const r = Math.max(Math.abs(x), Math.abs(z));
  if (r < BOARD_EDGE + 0.2) return -0.1;
  const k = smooth(BOARD_EDGE + 0.2, BOARD_EDGE + 2.5, r) * (1 - smooth(EDGE - 1.4, EDGE - 0.2, r));
  let h = noise2(x * 0.6, z * 0.6) * 0.12 * k * (1 - beachAt(x, z)); // pantai rata supaya laut tidak tembus pasir
  h += Math.max(0, -z - 8) * 0.07 * Math.max(0, 1 - Math.abs(x) / 14) * k; // lereng gunung
  h -= 0.8 * basinAt(x, z); // lembah banjir
  h += 0.1 * beachAt(x, z); // pantai sedikit di atas muka laut
  h -= 0.55 * smooth(shoreZ(x) - 0.05, shoreZ(x) + 0.6, z); // dasar laut
  let y = -0.1 + h;
  // Alur sungai: dasar sedikit di bawah permukaan airnya, tepian landai.
  const r2 = nearestRiver(x, z);
  if (r2.d < 1.2) y = Math.min(y, y + (r2.y - 0.22 - y) * (1 - smooth(0.3, 1.1, r2.d)));
  return y;
}

const grassA = new THREE.Color("#4a8a2c");
const grassB = new THREE.Color("#79b443");
const mud = new THREE.Color("#5a4a37");
const scorched = new THREE.Color("#3a3127");
const ash = new THREE.Color("#7d776f");
const urban = new THREE.Color("#8b8c79");
const dirt = new THREE.Color("#7a6a4c");
const sand = new THREE.Color("#e3cf9a");
const seabed = new THREE.Color("#3c6f7a");

/** Warna tanah: rumput di mana-mana, coklat/kelabu hanya di pusat bencana, membaur halus. */
function groundColor(x: number, z: number, out: THREE.Color) {
  const n = noise2(x * 1.3, z * 1.3);
  out.copy(grassA).lerp(grassB, 0.5 + n * 0.5);
  const len = Math.hypot(x, z) || 1;
  const toward = (dx: number, dz: number) => smooth(0.3, 0.75, (x * dx + z * dz) / len); // keanggotaan zona yang lembut
  // Lumpur di lembah dan tepinya.
  out.lerp(mud, Math.min(1, basinAt(x, z) * 1.4));
  // Tanah hangus di jalur api barat (dekat papan), hutan sisa di luar tetap hijau.
  out.lerp(scorched, toward(-1, 0) * smooth(6.8, 7.8, -x) * (1 - smooth(10.5, 12.5, -x)) * 0.9);
  // Abu di sekitar gunung.
  out.lerp(ash, (1 - smooth(3.5, 8, Math.hypot(x, z + 12.8))) * 0.85 + toward(0, -1) * 0.15);
  // Timur: rumput kota yang kusam.
  out.lerp(urban, toward(1, 0) * smooth(7, 9.5, x) * 0.45);
  // Bercak tanah terbuka acak.
  out.lerp(dirt, smooth(0.55, 0.9, noise2(x * 2.7 + 3, z * 2.1 - 1)) * 0.5);
  // Pasir pantai, dan dasar laut dangkal kebiruan di bawah air.
  out.lerp(sand, beachAt(x, z));
  out.lerp(seabed, smooth(shoreZ(x) + 0.1, shoreZ(x) + 0.5, z));
  return out;
}

/** Tanah dunia: satu bidang dengan warna per-vertex yang membaur, di atas balok tanah berlapis. */
export function terrain() {
  const size = EDGE * 2;
  const geo = new THREE.PlaneGeometry(size, size, 150, 150);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, heightAt(x, z));
    groundColor(x, z, c);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  ground.receiveShadow = true;
  // Dinding tepi berlapis (bukan balok penuh: balok penuh menutup lembah, sungai, dan laut yang lebih rendah).
  const g = group("tanah-dunia", ground);
  for (let i = 0; i < 4; i++) {
    const side = group("dinding-tepi",
      box(size + 0.02, 0.18, 0.04, "#57553a", [0, -0.28, size / 2]), // lapisan tanah atas
      box(size + 0.02, 1.0, 0.04, "#5a4636", [0, -1.28, size / 2]),
      box(size + 0.02, 0.45, 0.04, "#3d3229", [0, -1.73, size / 2]), // batuan dasar
    );
    side.rotation.y = (i * Math.PI) / 2;
    g.add(side);
  }
  g.userData.noFit = true;
  return g;
}

// ---------- Jalur ----------

type Pt = { x: number; z: number; y: number; tx: number; tz: number };

/** Lingkar persegi-membulat (superellips) yang berkelok. */
function loopPath(R: number, n: number, amp: number, freq: number, phase: number, samples: number) {
  // Sampel per sudut menumpuk di pojok superelips dan bolong di tengah sisi (bisa 5 unit tanpa titik),
  // jadi buat kurva rapat dulu lalu ambil ulang titik dengan jarak yang sama.
  const dense: { x: number; z: number }[] = [];
  const N = samples * 40;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const cs = Math.cos(th), sn = Math.sin(th);
    dense.push({ x: R * Math.sign(cs) * Math.pow(Math.abs(cs), 2 / n), z: R * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n) });
  }
  const cum = [0];
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(dense[i % N].x - dense[i - 1].x, dense[i % N].z - dense[i - 1].z));
  const total = cum[N];
  const pts: Pt[] = [];
  let j = 0;
  for (let k = 0; k < samples; k++) {
    const s = (k / samples) * total;
    while (cum[j + 1] < s) j++;
    const a = dense[j], b = dense[(j + 1) % N];
    const t = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
    let x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
    // Kelokan per jarak tempuh (bukan per sudut) supaya merata di tengah sisi dan di pojok.
    const len = Math.hypot(x, z);
    const w = amp * Math.sin(freq * 4 * (k / samples) * Math.PI * 2 + phase);
    x += (x / len) * w;
    z += (z / len) * w;
    pts.push({ x, z, y: 0, tx: 0, tz: 0 });
  }
  return withTangents(pts, true);
}

function withTangents(pts: Pt[], closed: boolean) {
  const n = pts.length;
  pts.forEach((p, i) => {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    p.tx = (b.x - a.x) / l;
    p.tz = (b.z - a.z) / l;
  });
  return pts;
}

/** Pecah jalur menjadi ruas-ruas berurutan yang lolos predikat (untuk celah / ruas rusak). */
function sections(pts: Pt[], keep: (p: Pt, i: number) => boolean, closed: boolean) {
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  pts.forEach((p, i) => {
    if (keep(p, i)) cur.push(p);
    else if (cur.length) (out.push(cur), (cur = []));
  });
  if (cur.length) {
    // Sambungkan ruas terakhir dengan ruas pertama kalau jalurnya tertutup dan tidak terputus di titik nol.
    if (closed && out.length && keep(pts[0], 0)) out[0] = cur.concat(out[0]);
    else out.push(closed && cur.length === pts.length ? cur.concat([cur[0]]) : cur);
  }
  return out;
}

/** Pita datar mengikuti titik-titik (permukaan jalan, ballast rel). */
function ribbon(pts: Pt[], width: number, lift = 0) {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  pts.forEach((p, i) => {
    const sx = -p.tz * (width / 2), sz = p.tx * (width / 2);
    pos.push(p.x + sx, p.y + lift, p.z + sz, p.x - sx, p.y + lift, p.z - sz);
    nor.push(0, 1, 0, 0, 1, 0);
    uv.push(0, i, 1, i);
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); // urutan berlawanan jarum jam dilihat dari atas
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Salin satu geometri kecil di sepanjang jalur dengan jarak tetap, lalu gabungkan jadi satu mesh. */
function alongPath(pts: Pt[], spacing: number, make: (p: Pt, k: number) => THREE.BufferGeometry | null) {
  const geos: THREE.BufferGeometry[] = [];
  let acc = 0, k = 0;
  for (let i = 1; i < pts.length; i++) {
    acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    if (acc >= spacing) {
      acc = 0;
      const g = make(pts[i], k++);
      if (g) geos.push(g.index ? g.toNonIndexed() : g);
    }
  }
  return geos.length ? mergeGeometries(geos) : null;
}

/** Geometri kotak yang sudah diputar mengikuti arah jalur di titik p. */
function boxAt(p: Pt, w: number, h: number, d: number, dy = 0, side = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.rotateY(Math.atan2(-p.tz, p.tx));
  g.translate(p.x + -p.tz * side, p.y + dy + h / 2, p.z + p.tx * side);
  return g;
}

const yaw = (p: Pt) => Math.atan2(-p.tz, p.tx);

function placeAlong<T extends THREE.Object3D>(o: T, p: Pt, side = 0, dy = 0) {
  o.position.set(p.x - p.tz * side, p.y + dy, p.z + p.tx * side);
  o.rotation.y = yaw(p);
  return o;
}

/** Haluskan tinggi titik supaya tanjakan jembatan tidak patah. */
function smoothY(pts: Pt[], passes: number) {
  for (let k = 0; k < passes; k++) {
    const ys = pts.map((p) => p.y);
    pts.forEach((p, i) => (p.y = (ys[(i - 1 + ys.length) % ys.length] + ys[i] * 2 + ys[(i + 1) % ys.length]) / 4));
  }
}

const BRIDGE_Y = 0.48;

/** Haluskan tinggi jalur terbuka (ujung-ujungnya tetap). */
function smoothYOpen(pts: Pt[], passes: number) {
  for (let k = 0; k < passes; k++) {
    const ys = pts.map((p) => p.y);
    for (let i = 1; i < pts.length - 1; i++) pts[i].y = (ys[i - 1] + ys[i] * 2 + ys[i + 1]) / 4;
  }
}

/** Ruas jalan lurus dari a ke b. Di atas lembah banjir jalan naik jadi jembatan. */
function straightRoad(ax: number, az: number, bx: number, bz: number) {
  const n = Math.max(8, Math.round(Math.hypot(bx - ax, bz - az) / 0.12));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    pts.push({ x, z, y: inFlood(x, z) ? BRIDGE_Y : baseHeight(x, z) + 0.03, tx: 0, tz: 0 });
  }
  smoothYOpen(pts, 10);
  return withTangents(pts, false);
}

// Jalan raya: satu ruas lurus dari tepi papan ke tiap zona, bukan lingkar penuh.
const ROAD_START = 7.2; // tepat di luar bingkai papan
export const AVENUE_Z = 0; // jalan utama timur: dari papan ke gedung dewan (dipakai konvoi pejabat)
const ROADS = {
  timur: straightRoad(ROAD_START, AVENUE_Z, 12.1, AVENUE_Z),
  selatan: straightRoad(-0.2, ROAD_START, -0.2, 13.4),
  utara: straightRoad(-2.6, -ROAD_START, -2.6, -10.4),
  barat: straightRoad(-ROAD_START, 0, -12.8, 0),
};
const MAIN_ROADS = Object.values(ROADS);

// Rel kereta: lingkar luar dekat tepi dunia, lebih berliku.
const RAIL = loopPath(16, 8, 0.7, 4, 0.6, 720);
// Rel tidak ikut turun ke laut atau alur sungai: di sana berdiri di atas tanggul.
RAIL.forEach((p) => (p.y = Math.max(baseHeight(p.x, p.z), -0.04) + 0.08));
smoothY(RAIL, 4);

// Jalan pendek lurus dari pojok papan ke empat bangunan pojok.
const CORNER = 10.6;
const SPURS: Pt[][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const d = 6.9 + (i / 24) * (CORNER - 1.7 - 6.9);
    pts.push({ x: sx * d, z: sz * d, y: 0, tx: 0, tz: 0 });
  }
  // Di area banjir jalan cabang berupa jembatan yang turun ke pelataran bangunan pojok (tinggi 0.15).
  pts.forEach((p, i) => (p.y = inFlood(p.x, p.z) ? BRIDGE_Y + (0.16 - BRIDGE_Y) * smooth(0.6, 1, i / 24) : baseHeight(p.x, p.z) + 0.03));
  return withTangents(pts, false);
});

// Titik jalur dalam grid 1x1 untuk memotong tanah di bawah jalan dan rel dengan cepat.
type Cut = { x: number; z: number; y: number; hw: number };
const CUT_GRID = new Map<string, Cut[]>();
const addCut = (p: Pt, hw: number) => {
  const k = `${Math.floor(p.x)},${Math.floor(p.z)}`;
  const list = CUT_GRID.get(k) ?? [];
  list.push({ x: p.x, z: p.z, y: p.y, hw });
  CUT_GRID.set(k, list);
};
MAIN_ROADS.forEach((r) => r.forEach((p) => addCut(p, 0.42)));
RAIL.forEach((p) => addCut(p, 0.46));
SPURS.forEach((s) => s.forEach((p) => addCut(p, 0.42)));

/**
 * Tinggi tanah final: tanah alami yang digali turun di bawah dan sekitar jalan/rel, supaya
 * permukaan jalur tidak pernah tertutup tanah. Di jembatan dan tanggul tanah tetap (lebih rendah).
 */
export function heightAt(x: number, z: number) {
  let h = baseHeight(x, z);
  const cx = Math.floor(x), cz = Math.floor(z);
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const list = CUT_GRID.get(`${cx + i},${cz + j}`);
      if (!list) continue;
      for (const c of list) {
        const w = 1 - smooth(c.hw + 0.1, c.hw + 0.8, Math.hypot(c.x - x, c.z - z));
        const cut = c.y - 0.06;
        if (w > 0 && h > cut) h += (cut - h) * w;
      }
    }
  return h;
}

/** Apakah titik (x, z) cukup jauh dari jalan, rel, dan jalan cabang? Dipakai untuk menaruh dekor. */
export function clearOfRoutes(x: number, z: number, margin = 0.9) {
  const near = (pts: Pt[], m: number) => pts.some((p) => Math.abs(p.x - x) < m && Math.abs(p.z - z) < m && Math.hypot(p.x - x, p.z - z) < m);
  return !MAIN_ROADS.some((r) => near(r, margin)) && !near(RAIL, margin + 0.1) && !SPURS.some((s) => near(s, margin)) && !near(RIVER, margin + 0.2);
}

/** Sungai mengalir: pita air biru dengan tekstur arus yang bergerak. */
export function river() {
  const pts = withTangents(RIVER.map((p) => ({ ...p })), false);
  const cv = document.createElement("canvas");
  cv.width = 64;
  cv.height = 256;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#3d86b5";
  ctx.fillRect(0, 0, 64, 256);
  const r = rng(5);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(220,240,255,${0.15 + r() * 0.25})`;
    ctx.fillRect(r() * 64, r() * 256, 2 + r() * 6, 8 + r() * 20);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 0.08);
  const water = new THREE.Mesh(ribbon(pts, 0.95, 0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0.02, transparent: true, opacity: 0.92 }));
  water.receiveShadow = true;
  const g = group("sungai", water);
  return onUpdate(g, (t) => (tex.offset.y = -t * 0.25));
}

/** Titik air sungai di sekitar tengah alurnya: tempat helikopter mengambil air. */
export function riverScoopPoint() {
  const p = RIVER[Math.floor(RIVER.length * 0.18)];
  return new THREE.Vector3(p.x, p.y, p.z);
}

/** Tiang jembatan dari dasar lembah sampai lantai jembatan. */
function pillarAt(p: Pt) {
  const ground = heightAt(p.x, p.z) - 0.05;
  return boxAt(p, 0.16, p.y - ground, 0.6, ground - p.y);
}

const asphalt = () => mat("#3b3d43", { roughness: 0.9 });
const deckMat = () => mat("#8f8a80", { roughness: 0.8 });

// Ruas jalan dengan kerusakan: jembatan selatan ambruk di tengah lembah, jalur evakuasi utara retak kena gempa.
const BRIDGE = ROADS.selatan.filter((p) => p.y > 0.2);
const GAP_FROM = BRIDGE.length ? BRIDGE[Math.floor(BRIDGE.length * 0.42)].z : 0;
const GAP_TO = BRIDGE.length ? BRIDGE[Math.floor(BRIDGE.length * 0.6)].z : 0;
const gapSouth = (p: Pt) => p.y > 0.2 && p.z > GAP_FROM && p.z < GAP_TO;
const quakeSplit = (p: Pt) => p.z < -7.9 && p.z > -8.5 && p.x < 0;

function roadSurface(pts: Pt[]) {
  const g = group("permukaan-jalan");
  if (pts.length < 2) return g;
  const surf = new THREE.Mesh(ribbon(pts, 0.72, 0.005), asphalt());
  surf.receiveShadow = true;
  const curb = new THREE.Mesh(ribbon(pts, 0.82, 0), deckMat());
  curb.receiveShadow = true;
  g.add(curb, surf);
  // Marka putus-putus di tengah.
  const dash = alongPath(pts, 0.45, (p) => boxAt(p, 0.22, 0.012, 0.05, 0.006));
  if (dash) g.add(new THREE.Mesh(dash, mat("#e8e2cf")));
  return g;
}

export function highway() {
  const g = group("jalan-raya");
  const { timur, selatan, utara, barat } = ROADS;
  // Ruas yang turun sedikit karena gempa (ditampilkan terpisah, lebih rendah).
  const sunk = utara.filter(quakeSplit).map((p) => ({ ...p, y: p.y - 0.14 }));
  for (const r of MAIN_ROADS) for (const s of sections(r, (p) => !gapSouth(p) && !quakeSplit(p), false)) g.add(roadSurface(s));
  if (sunk.length > 2) {
    const mid = sunk[Math.floor(sunk.length / 2)];
    g.add(roadSurface(sunk.slice(1, -1)));
    // Retakan dan kerucut peringatan.
    g.add(placeAlong(box(0.06, 0.02, 0.8, "#15161a"), sunk[1], 0, 0.0), placeAlong(box(0.06, 0.02, 0.8, "#15161a"), sunk[sunk.length - 2], 0, 0.0));
    for (const side of [-0.5, 0.5]) g.add(placeAlong(cone(0.07, 0.2, C.orange, [0, 0, 0], 8), mid, side, 0.14));
  }
  // Jembatan di atas banjir: tiang, pagar, dan bentang tengah yang ambruk.
  const pillars = alongPath(BRIDGE, 1.1, (p) => (gapSouth(p) ? null : pillarAt(p)));
  if (pillars) g.add(new THREE.Mesh(pillars, deckMat()));
  const rails = alongPath(BRIDGE, 0.25, (p) => (gapSouth(p) ? null : mergeGeometries([boxAt(p, 0.04, 0.16, 0.04, 0, 0.42), boxAt(p, 0.04, 0.16, 0.04, 0, -0.42)])));
  if (rails) g.add(new THREE.Mesh(rails, mat("#c9c3b6")));
  const gap = selatan.filter(gapSouth);
  if (gap.length) {
    const a = gap[0], b = gap[gap.length - 1];
    // Dua lempeng jembatan patah menukik ke air.
    const slabA = box(1.1, 0.1, 0.8, deckMat(), [0, -0.05, 0]);
    slabA.position.set(a.x + a.tx * 0.5, 0.15, a.z + a.tz * 0.5);
    slabA.rotation.set(0, yaw(a), -0.55);
    const slabB = box(0.9, 0.1, 0.8, deckMat(), [0, -0.05, 0]);
    slabB.position.set(b.x - b.tx * 0.45, 0.12, b.z - b.tz * 0.45);
    slabB.rotation.set(0, yaw(b), 0.6);
    g.add(slabA, slabB);
    // Rambu darurat di ujung yang tersisa.
    const tex = textTexture(["JEMBATAN", "PUTUS"], { bg: "#ffcc00", fg: C.ink, w: 256, h: 160, border: C.ink });
    const sign = group("rambu-putus", cyl(0.02, 0.02, 0.5, C.concrete), texturedPlane(0.4, 0.25, tex, [0, 0.45, 0.02]));
    const before = selatan[selatan.indexOf(a) - 6] ?? a;
    g.add(placeAlong(sign, before, 0.5, 0));
  }
  // Utara (jalur evakuasi): timbunan abu dan batu besar menutup ujung jalan, retak gempa di awal.
  [0.62, 0.8, 0.95].forEach((f, i) => {
    const p = utara[Math.floor((utara.length - 1) * f)];
    const mound = ball(0.55, mat("#9b958c", { roughness: 1 }), [0, 0, 0], 1);
    mound.scale.set(1.3, 0.35, 1);
    g.add(placeAlong(mound, p, (i - 1) * 0.15, 0));
  });
  g.add(placeAlong(ball(0.32, C.rockDark, [0, 0.25, 0], 0), utara[Math.floor(utara.length * 0.72)], 0.15, 0));
  // Barat: pohon terbakar tumbang melintang, bekas hangus, mobil gosong.
  const west = barat;
  const pt = west[Math.floor(west.length * 0.55)];
  const trunk = cyl(0.08, 0.1, 1.4, "#2a211b", [0, 0, 0], 7);
  trunk.rotation.x = Math.PI / 2;
  trunk.position.set(0, 0.1, -0.7);
  const fallen = group("pohon-tumbang", trunk);
  const f = fire(0.8, 21, true);
  f.position.set(0, 0.12, 0.1);
  fallen.add(f);
  g.add(placeAlong(fallen, pt));
  const burntCar = car("#2b2622");
  g.add(placeAlong(burntCar, west[Math.floor(west.length * 0.3)], 0.15, 0));
  for (const k of [0.25, 0.4, 0.7]) {
    const scorch = cyl(0.3, 0.3, 0.008, "#16120f", [0, 0, 0], 10);
    g.add(placeAlong(scorch, west[Math.floor(west.length * k)], 0.1, 0.01));
  }
  // Timur: jalan paling mulus, lampu jalan rapat di kedua sisi, mobil dinas parkir di bahu jalan.
  timur.forEach((p, i) => {
    if (i % 9 !== 4) return;
    for (const side of [0.55, -0.55]) {
      const lamp = placeAlong(streetLamp(), p, side, 0);
      if (side > 0) lamp.rotation.y += Math.PI;
      g.add(lamp);
    }
  });
  [0.3, 0.7].forEach((k, i) => g.add(placeAlong(car(i ? "#1d1f24" : "#f2f2f2", i === 1), timur[Math.floor(timur.length * k)], 0.62, 0)));
  // Jalan cabang ke bangunan pojok (bertiang kalau melintasi banjir).
  for (const s of SPURS) {
    g.add(roadSurface(s));
    const pl = alongPath(s.filter((p) => p.y > 0.2), 1.1, pillarAt);
    if (pl) g.add(new THREE.Mesh(pl, deckMat()));
  }
  return g;
}

// ---------- Rel kereta ----------

const washout = (p: Pt) => zoneAt(p.x, p.z) === "selatan" && p.x > -3.2 && p.x < -0.6; // rel tergerus banjir
// Gunung: pusat dan jari-jari kaki (dipakai dressUtara juga). Rel di dalam kaki gunung = terowongan.
export const VOLCANO = { x: 0, z: -13, r: 3.75, height: 4.4, scale: 1.25 };
const tunnel = (p: Pt) => Math.hypot(p.x - VOLCANO.x, p.z - VOLCANO.z) < VOLCANO.r * 0.86;
const burnt = (p: Pt) => zoneAt(p.x, p.z) === "barat" && Math.abs(p.z) < 3.5;

function railTrack(pts: Pt[], sleeperColor: string, withBallast = true) {
  const g = group("rel");
  if (pts.length < 2) return g; // ruas sependek ini tidak bisa jadi kurva
  if (withBallast) {
    const ballast = new THREE.Mesh(ribbon(pts, 0.78, 0), mat("#7a7268", { roughness: 1 }));
    ballast.receiveShadow = true;
    // Tanggul di bawah ballast, setinggi jarak ke tanah (tinggi di atas laut dan sungai).
    const bed = alongPath(pts, 0.5, (p) => {
      const h = Math.max(0.06, p.y - heightAt(p.x, p.z) + 0.04);
      return boxAt(p, 0.55, h, 0.86, -h);
    });
    if (bed) g.add(new THREE.Mesh(bed, mat("#6b6359")));
    g.add(ballast);
  }
  const sleepers = alongPath(pts, 0.28, (p) => boxAt(p, 0.09, 0.05, 0.62, 0.0));
  if (sleepers) g.add(new THREE.Mesh(sleepers, mat(sleeperColor)));
  for (const side of [-0.2, 0.2]) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x - p.tz * side, p.y + 0.08, p.z + p.tx * side)));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, pts.length), 0.025, 4, false), mat("#a3a7ab", { metalness: 0.8, roughness: 0.35 }));
    tube.castShadow = true;
    g.add(tube);
  }
  return g;
}

function tunnelPortal(p: Pt, buried: boolean) {
  const stone = mat("#4a4440");
  const g = group("mulut-terowongan",
    box(0.18, 0.9, 0.18, stone, [0, 0, 0.42]),
    box(0.18, 0.9, 0.18, stone, [0, 0, -0.42]),
    box(0.22, 0.2, 1.05, stone, [0, 0.85, 0]),
    box(0.02, 0.85, 0.7, "#0b0a09", [0.02, 0, 0]),
    // Dinding batu penahan lereng di sekitar mulut terowongan (ke arah gunung = +x lokal).
    box(0.25, 1.3, 0.6, stone, [0.18, 0, 0.82]),
    box(0.25, 1.3, 0.6, stone, [0.18, 0, -0.82]),
    box(0.25, 0.45, 1.05, stone, [0.18, 1.0, 0]),
  );
  if (buried) {
    // Timbunan abu menutup separuh mulut terowongan; kereta masih bisa lewat pelan.
    const pile = ball(0.9, mat("#9b958c", { roughness: 1 }), [0.3, 0, 0.8], 1);
    pile.scale.set(1, 0.6, 1.2);
    g.add(pile, ball(0.25, C.rockDark, [0.5, 0.2, 0.55], 0), ball(0.18, C.rockDark, [0.6, 0.1, -0.7], 0));
  }
  return placeAlong(g, p);
}

// Panjang lintasan kumulatif untuk menggerakkan kereta dengan kecepatan tetap per satuan jarak.
const RAIL_S: number[] = [0];
for (let i = 1; i <= RAIL.length; i++) {
  const a = RAIL[i - 1], b = RAIL[i % RAIL.length];
  RAIL_S.push(RAIL_S[i - 1] + Math.hypot(b.x - a.x, b.z - a.z));
}
const RAIL_LEN = RAIL_S[RAIL.length];

/** Titik rel pada jarak s (berulang), diinterpolasi antar sampel. */
function railAt(s: number): Pt {
  s = ((s % RAIL_LEN) + RAIL_LEN) % RAIL_LEN;
  let lo = 0, hi = RAIL.length;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (RAIL_S[mid] <= s) lo = mid;
    else hi = mid;
  }
  const a = RAIL[lo], b = RAIL[(lo + 1) % RAIL.length];
  const t = (s - RAIL_S[lo]) / (RAIL_S[lo + 1] - RAIL_S[lo] || 1);
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, y: a.y + (b.y - a.y) * t, tx: a.tx, tz: a.tz };
}

/** Kereta yang berjalan memutari papan: melambat di ruas rusak, hilang di terowongan, berhenti di stasiun. */
function train(stationS: number) {
  const g = group("kereta");
  const carLen = 1.1;
  const gapLen = 1.2;
  const cars: THREE.Group[] = [];
  [0, 1, 2].forEach((k) => {
    const loco = k === 0;
    const body = group(loco ? "lokomotif" : "gerbong",
      box(carLen, 0.42, 0.5, loco ? "#d9d4c8" : "#e8e4da", [0, 0.12, 0]),
      box(carLen + 0.02, 0.06, 0.52, loco ? C.merah : "#2a5d8f", [0, 0.32, 0]),
      windows(carLen - 0.2, 0.18, 1, 5, 0.255, 0.3, "#2b3a4a"),
      box(carLen * 0.9, 0.05, 0.4, "#9aa0a6", [0, 0.54, 0]),
      ...[-0.35, 0.35].map((x) => box(0.2, 0.1, 0.42, C.ink, [x, 0.03, 0])),
    );
    if (loco) body.add(box(0.08, 0.06, 0.3, mat("#fff2c4", { emissive: "#fff2c4", emissiveIntensity: 2 }), [carLen / 2, 0.3, 0]));
    cars.push(body);
    g.add(body);
  });
  let s = stationS - 30;
  let wait = 0;
  let lastLap = -1;
  return onUpdate(g, (_t, dt) => {
    const head = railAt(s);
    // Berhenti 3 detik setiap kali lokomotif tiba di stasiun.
    const lap = Math.floor((s - stationS) / RAIL_LEN);
    if (lap !== lastLap && ((s - stationS) % RAIL_LEN + RAIL_LEN) % RAIL_LEN < 0.3) {
      lastLap = lap;
      wait = 3;
    }
    if (wait > 0) wait -= dt;
    else {
      const slow = washout(head) || burnt(head) ? 0.35 : tunnel(head) ? 0.7 : 1;
      s += dt * 1.4 * slow;
    }
    cars.forEach((c, k) => {
      const p = railAt(s - k * (carLen + gapLen * 0.1));
      placeAlong(c, p, 0, 0.02);
      c.visible = !tunnel(p);
    });
  });
}

export function railway() {
  const g = group("rel-kereta");
  const segs = sections(RAIL, (p) => !washout(p) && !tunnel(p), true);
  for (const s of segs) {
    const parts = sections(s, (p) => !burnt(p), false);
    for (const part of parts) g.add(railTrack(part, "#6b4a2f"));
  }
  g.add(railTrack(RAIL.filter(burnt), "#1b1714"));
  // Ruas hangus: api kecil di samping rel.
  const west = RAIL.filter(burnt);
  const f = fire(0.7, 33, false);
  g.add(placeAlong(f, west[Math.floor(west.length * 0.4)], 0.7, 0));
  // Ruas tergerus banjir: rel menggantung melengkung ke air, bantalan berserakan.
  const gap = RAIL.filter(washout);
  if (gap.length > 2) {
    // Jembatan kayu darurat di atas ruas yang tergerus, supaya kereta masih bisa lewat pelan.
    g.add(railTrack(gap, "#b08a5a", false));
    const trestle = alongPath(gap, 0.55, (p) => mergeGeometries([boxAt(p, 0.06, p.y + 0.4, 0.06, -p.y - 0.4, 0.28), boxAt(p, 0.06, p.y + 0.4, 0.06, -p.y - 0.4, -0.28), boxAt(p, 0.05, 0.05, 0.7, -0.05)]));
    if (trestle) g.add(new THREE.Mesh(trestle, mat("#8a6a45")));
    for (const side of [-0.2, 0.2]) {
      const curve = new THREE.CatmullRomCurve3(gap.map((p, i) => {
        const t = i / (gap.length - 1);
        return new THREE.Vector3(p.x - p.tz * side, p.y + 0.08 - Math.sin(t * Math.PI) * 0.55, p.z + p.tx * side);
      }));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, gap.length, 0.025, 4, false), mat("#7d6f63", { metalness: 0.6, roughness: 0.6 })));
    }
    const r = rng(17);
    gap.forEach((p, i) => {
      if (i % 4) return;
      const t = i / (gap.length - 1);
      const s = box(0.09, 0.05, 0.62, "#6b4a2f", [0, 0, 0]);
      s.position.set(p.x + (r() - 0.5) * 0.6, p.y - Math.sin(t * Math.PI) * 0.55 + 0.02, p.z + (r() - 0.5) * 0.6);
      s.rotation.set(r() * 0.5, yaw(p) + (r() - 0.5) * 1.2, r() * 0.4);
      g.add(s);
    });
  }
  // Terowongan di kaki gunung; mulut barat tertimbun abu.
  const tun = RAIL.filter(tunnel);
  if (tun.length) {
    const west = tun.reduce((a, b) => (b.x < a.x ? b : a));
    const east = tun.reduce((a, b) => (b.x > a.x ? b : a));
    g.add(tunnelPortal(west, true), tunnelPortal(east, false));
    g.children[g.children.length - 1].rotation.y += Math.PI;
  }
  // Stasiun kecil di sisi timur; kereta memutari papan dan berhenti di sini.
  const eastPts = RAIL.filter((p) => zoneAt(p.x, p.z) === "timur");
  const st = eastPts[Math.floor(eastPts.length * 0.42)];
  g.add(train(RAIL_S[RAIL.indexOf(st)]));
  const stasiun = group("stasiun",
    box(1.6, 0.12, 0.5, C.concrete, [0, 0, 0]),
    box(1.4, 0.04, 0.55, "#b5523b", [0, 0.62, 0]),
    ...[-0.6, 0, 0.6].map((x) => cyl(0.025, 0.025, 0.5, C.ink, [x, 0.12, -0.15])),
    texturedPlane(0.8, 0.18, textTexture(["STASIUN TIMUR"], { bg: "#24345c", fg: C.white, w: 512, h: 112 }), [0, 0.5, 0.2]),
  );
  g.add(placeAlong(stasiun, st, -0.85, 0));
  return g;
}
