import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Text } from "troika-three-text";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PALETTE } from "./style";

// Palet bersama. Semua aset low-poly memakai flat shading supaya satu gaya.
export const C = PALETTE;

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export function mat(
  color: string,
  opts: {
    emissive?: string;
    emissiveIntensity?: number;
    opacity?: number;
    roughness?: number;
    metalness?: number;
  } = {},
) {
  const key = JSON.stringify([color, opts]);
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: opts.roughness ?? 0.85,
      metalness: opts.metalness ?? 0,
      emissive: opts.emissive ?? "#000000",
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      transparent: opts.opacity !== undefined,
      opacity: opts.opacity ?? 1,
    });
    m.name = color;
    m.userData.sharedResource = true;
    matCache.set(key, m);
  }
  return m;
}

type Vec = [number, number, number];

function mesh(
  geo: THREE.BufferGeometry,
  color: string | THREE.Material,
  pos: Vec = [0, 0, 0],
  rot: Vec = [0, 0, 0],
) {
  const m = new THREE.Mesh(geo, typeof color === "string" ? mat(color) : color);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Kotak dengan alas di y = pos[1] (bukan di tengah), lebih mudah ditumpuk. */
export function box(
  w: number,
  h: number,
  d: number,
  color: string | THREE.Material,
  pos: Vec = [0, 0, 0],
  rot: Vec = [0, 0, 0],
) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return mesh(g, color, pos, rot);
}

/** Small bevel only for foreground props/vehicles; structural beams stay inexpensive boxes. */
export function softBox(
  w: number,
  h: number,
  d: number,
  color: string | THREE.Material,
  pos: Vec = [0, 0, 0],
  radius = 0.025,
) {
  const g = new RoundedBoxGeometry(
    w,
    h,
    d,
    1,
    Math.min(radius, w / 4, h / 4, d / 4),
  );
  g.translate(0, h / 2, 0);
  return mesh(g, color, pos);
}

/** Dispose owned resources only. Cached materials, atlases and source GLTF geometry outlive instances. */
export function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((o) => {
    if (o instanceof Text) {
      o.dispose();
      return;
    }
    const m = o as THREE.Mesh;
    if (m.geometry && !m.geometry.userData.sharedResource)
      geometries.add(m.geometry);
    for (const material of m.material
      ? Array.isArray(m.material)
        ? m.material
        : [m.material]
      : []) {
      if (material.userData.sharedResource) continue;
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture && !value.userData.sharedResource)
          textures.add(value);
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}

export function cyl(
  rTop: number,
  rBot: number,
  h: number,
  color: string | THREE.Material,
  pos: Vec = [0, 0, 0],
  seg = 8,
  rot: Vec = [0, 0, 0],
) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg);
  g.translate(0, h / 2, 0);
  return mesh(g, color, pos, rot);
}

export function cone(
  r: number,
  h: number,
  color: string | THREE.Material,
  pos: Vec = [0, 0, 0],
  seg = 6,
  rot: Vec = [0, 0, 0],
) {
  const g = new THREE.ConeGeometry(r, h, seg);
  g.translate(0, h / 2, 0);
  return mesh(g, color, pos, rot);
}

export function ball(
  r: number,
  color: string | THREE.Material,
  pos: Vec = [0, 0, 0],
  detail = 0,
) {
  return mesh(new THREE.IcosahedronGeometry(r, detail), color, pos);
}

/** Atap pelana: prisma segitiga memanjang di sumbu x. */
export function gableRoof(
  w: number,
  h: number,
  d: number,
  color: string,
  pos: Vec = [0, 0, 0],
  rot: Vec = [0, 0, 0],
) {
  const s = new THREE.Shape();
  s.moveTo(-d / 2, 0);
  s.lineTo(d / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
  g.translate(0, 0, -w / 2);
  g.rotateY(Math.PI / 2);
  return mesh(g, color, pos, rot);
}

export function group(name: string, ...children: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.name = name;
  if (children.length) g.add(...children);
  return g;
}

/** Fungsi animasi per aset, dipanggil tiap frame oleh viewer/game. */
export type Updater = (t: number, dt: number) => void;

/**
 * `movers`: bagian yang benar-benar digerakkan fn. Sisanya tetap statis dan boleh digabung bakeStatic.
 * Tanpa `movers`, seluruh subtree dianggap bergerak.
 */
export function onUpdate<T extends THREE.Object3D>(
  obj: T,
  fn: Updater,
  movers?: THREE.Object3D[],
): T {
  if (movers) obj.userData.movers = [...(obj.userData.movers ?? []), ...movers];
  const prev = obj.userData.update as Updater | undefined;
  obj.userData.update = prev
    ? (t: number, dt: number) => (prev(t, dt), fn(t, dt))
    : fn;
  return obj;
}

export function tickAll(root: THREE.Object3D, t: number, dt: number) {
  root.traverse((o) => (o.userData.update as Updater | undefined)?.(t, dt));
}

/** Keep a bounded number of local lights; emissive surfaces still communicate fire on low quality. */
export function budgetLights(root: THREE.Object3D, max: number) {
  const lights: THREE.Light[] = [];
  root.traverse((o) => {
    if (
      (o as THREE.PointLight).isPointLight ||
      (o as THREE.SpotLight).isSpotLight
    )
      lights.push(o as THREE.Light);
  });
  lights.sort(
    (a, b) =>
      Number(!a.name.startsWith("utama-")) -
      Number(!b.name.startsWith("utama-")),
  );
  lights.forEach((light, i) => {
    light.visible = i < max;
  });
}

/**
 * Gabungkan semua mesh statis (tanpa animasi di diri atau leluhurnya) per material.
 * Ribuan mesh kecil jadi beberapa puluh draw call. Subtree bertanda userData.keep/noFit dilewati.
 */
export function bakeStatic<T extends THREE.Object3D>(root: T): T {
  root.updateWorldMatrix(true, true);
  const inv = root.matrixWorld.clone().invert();
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const baked: THREE.Mesh[] = [];
  const movers = new Set<THREE.Object3D>();
  root.traverse((o) => (o.userData.movers as THREE.Object3D[] | undefined)?.forEach((m) => movers.add(m)));
  // Bagian yang bergerak digabung di ruang lokalnya sendiri, jadi tetap satu benda yang bisa digerakkan.
  movers.forEach((m) => {
    if (!(m as THREE.Mesh).isMesh) bakeStatic(m);
  });
  const walk = (o: THREE.Object3D, animated: boolean) => {
    if (o.userData.keep || o.userData.noFit) return;
    const anim = animated || movers.has(o) || (!!o.userData.update && !o.userData.movers);
    const m = o as THREE.Mesh;
    if (
      m.isMesh &&
      !anim &&
      !Array.isArray(m.material) &&
      !m.material.transparent &&
      !(m.material as THREE.MeshStandardMaterial).vertexColors
    ) {
      const g = m.geometry.index
        ? m.geometry.toNonIndexed()
        : m.geometry.clone();
      for (const name of Object.keys(g.attributes))
        if (!["position", "normal", "uv"].includes(name))
          g.deleteAttribute(name);
      if (!g.attributes.uv)
        g.setAttribute(
          "uv",
          new THREE.Float32BufferAttribute(
            new Float32Array(g.attributes.position.count * 2),
            2,
          ),
        );
      g.applyMatrix4(inv.clone().multiply(m.matrixWorld));
      const list = buckets.get(m.material) ?? [];
      list.push(g);
      buckets.set(m.material, list);
      baked.push(m);
    }
    o.children.forEach((c) => walk(c, anim));
  };
  walk(root, false);
  // Mesh dengan vertex color (gunung) tidak boleh kehilangan atribut warnanya.
  for (const m of baked)
    if ((m.material as THREE.MeshStandardMaterial).vertexColors) {
      const key = m.material as THREE.Material;
      buckets.get(key)?.forEach((g) => g.dispose());
      buckets.delete(key);
    }
  const merged = group("statis");
  const done = new Set<THREE.Material>();
  for (const [material, geos] of buckets) {
    const geo = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!geo) {
      // Gagal gabung (atribut tak cocok): biarkan mesh aslinya, jangan dihapus.
      console.warn(
        "bakeStatic: gagal menggabung material",
        material.name,
        geos.map((g) => Object.keys(g.attributes).join("+")),
      );
      continue;
    }
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = mesh.receiveShadow = true;
    merged.add(mesh);
    done.add(material);
  }
  for (const m of baked)
    if (done.has(m.material as THREE.Material)) m.removeFromParent();
  root.add(merged);
  return root;
}

/** RNG ber-seed supaya aset acak (pohon, puing) selalu sama tiap dimuat. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Teks tajam (SDF, troika-three-text) untuk tulisan yang harus terbaca dari jauh dan dari sudut miring,
 * mis. judul petak. Rebah di bidang XZ (menghadap ke atas). Ditandai keep supaya tidak ikut digabung bakeStatic.
 */
export function label3d(
  text: string,
  o: {
    size: number;
    color: string;
    maxWidth: number;
    outline?: string;
    lineHeight?: number;
  },
) {
  const t = new Text();
  t.material = new THREE.MeshBasicMaterial({ toneMapped: false, fog: false });
  t.sdfGlyphSize = 128;
  t.text = text;
  // Alamat absolut: troika memuat font dari web worker (blob:) yang tidak mengenal alamat relatif.
  t.font = new URL("/fonts/BarlowCondensed-Bold.ttf", location.href).href;
  t.fontSize = o.size;
  t.color = o.color;
  t.maxWidth = o.maxWidth;
  t.textAlign = "center";
  t.anchorX = "center";
  t.anchorY = "middle";
  t.lineHeight = o.lineHeight ?? 0.95;
  t.outlineWidth = 0;
  if (o.outline) {
    t.outlineWidth = "6%"; // garis tepi tipis menjaga kontras di atas warna pita
    t.outlineColor = o.outline;
  }
  t.rotation.x = -Math.PI / 2;
  t.userData.keep = true;
  t.sync();
  return t;
}

/** Tekstur teks dari canvas: spanduk, papan nama, layar IHSG. */
const textCache = new Map<string, THREE.Texture>();
export function textTexture(
  lines: string[],
  o: {
    bg?: string;
    fg?: string;
    w?: number;
    h?: number;
    font?: string;
    border?: string;
  } = {},
) {
  const key = JSON.stringify([lines, o]);
  const cached = textCache.get(key);
  if (cached) return cached;
  const w = Math.min(1536, (o.w ?? 512) * 2);
  const h = Math.min(1024, (o.h ?? 128) * 2);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = o.bg ?? C.white;
  ctx.fillRect(0, 0, w, h);
  if (o.border) {
    ctx.strokeStyle = o.border;
    ctx.lineWidth = h * 0.06;
    ctx.strokeRect(h * 0.04, h * 0.04, w - h * 0.08, h - h * 0.08);
  }
  ctx.fillStyle = o.fg ?? C.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lh = h / (lines.length + 0.6);
  lines.forEach((line, i) => {
    let size = lh * 0.78;
    ctx.font = `900 ${size}px ${o.font ?? "'Barlow Condensed', 'Arial Narrow', sans-serif"}`;
    // Kecilkan font kalau teks kepanjangan.
    while (ctx.measureText(line).width > w * 0.9 && size > 8) {
      size -= 2;
      ctx.font = `900 ${size}px ${o.font ?? "'Barlow Condensed', 'Arial Narrow', sans-serif"}`;
    }
    ctx.fillText(line, w / 2, lh * (i + 0.8));
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.sharedResource = true;
  textCache.set(key, tex);
  tex.anisotropy = 8; // tetap terbaca saat dilihat miring
  return tex;
}

/** Deretan jendela tipis di satu muka bangunan (muka +z, alas di y0). */
export function windows(
  w: number,
  h: number,
  rows: number,
  cols: number,
  z: number,
  y0 = 0,
  color: string = "#2b3a4a",
  lit = 0,
) {
  const g = group("jendela");
  const m = lit
    ? mat(color, { emissive: "#ffd89a", emissiveIntensity: lit })
    : mat(color, { roughness: 0.3, metalness: 0.3 });
  const cw = w / cols;
  const rh = h / rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      g.add(
        box(cw * 0.6, rh * 0.55, 0.02, m, [
          -w / 2 + cw * (c + 0.5),
          y0 + rh * (r + 0.22),
          z,
        ]),
      );
  return g;
}

let softTex: THREE.Texture | null = null;
/** Tekstur bulat lembut untuk asap, api, dan cahaya (sprite). */
export function softTexture() {
  if (softTex) return softTex;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const ctx = cv.getContext("2d")!;
  const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.4, "rgba(255,255,255,0.55)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 128, 128);
  softTex = new THREE.CanvasTexture(cv);
  softTex.userData.sharedResource = true;
  return softTex;
}

export function texturedPlane(
  w: number,
  h: number,
  tex: THREE.Texture,
  pos: Vec = [0, 0, 0],
  rot: Vec = [0, 0, 0],
  doubleSide = true,
) {
  const material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  // Sisi belakang dibuat sebagai bidang kedua yang diputar, bukan DoubleSide: DoubleSide membuat teks terbaca terbalik.
  if (doubleSide) {
    const back = new THREE.Mesh(m.geometry, material);
    back.rotation.y = Math.PI;
    m.add(back);
  }
  return m;
}
