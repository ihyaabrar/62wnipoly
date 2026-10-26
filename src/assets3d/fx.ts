import * as THREE from "three";
import { ball, group, mat, onUpdate, rng, softTexture } from "./kit";

// Efek partikel ringan untuk bencana. Satu draw call per emitor; efek ini runtime, bukan bagian model GLB.

type SmokeOpts = {
  count?: number;
  color?: string;
  colorEnd?: string;
  size?: [number, number]; // awal, akhir
  rise?: number; // tinggi total
  spread?: number; // sebaran horizontal di akhir umur
  drift?: [number, number]; // angin x, z
  speed?: number; // siklus per detik
  opacity?: number;
  additive?: boolean;
  seed?: number;
};

const VERT = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
uniform float uScale;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vAlpha = aAlpha;
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}`;

/**
 * Kumpulan partikel lembut dalam satu draw call. Ukuran dalam satuan dunia.
 * Kembalikan atribut supaya pemanggil mengisi posisi/ukuran/alpha/warna tiap frame.
 */
export function particles(name: string, count: number, additive = false) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const alpha = new Float32Array(count);
  const color = new Float32Array(count * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 400 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const pts = new THREE.Points(geo, material);
  pts.name = name;
  pts.frustumCulled = false;
  const v = new THREE.Vector2();
  // Skala piksel = tinggi layar / (2 tan(fov/2)), agar ukuran partikel setara satuan dunia.
  pts.onBeforeRender = (renderer, _s, camera) => {
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 50;
    material.uniforms.uScale.value = renderer.getDrawingBufferSize(v).y / (2 * Math.tan((fov * Math.PI) / 360));
  };
  const flush = () => {
    for (const k of ["position", "aSize", "aAlpha", "aColor"]) geo.attributes[k].needsUpdate = true;
  };
  return { pts, pos, size, alpha, color, flush };
}

/** Emitor partikel berulang: dipakai untuk asap, api, kabut, gas air mata, semprotan air. */
export function emitter(name: string, o: SmokeOpts = {}) {
  const r = rng(o.seed ?? 1);
  const count = o.count ?? 24;
  const [s0, s1] = o.size ?? [0.4, 1.6];
  const c0 = new THREE.Color(o.color ?? "#5b5a58");
  const c1 = new THREE.Color(o.colorEnd ?? o.color ?? "#5b5a58");
  const p = particles(name, count, o.additive);
  const g = group(name, p.pts);
  const meta = Array.from({ length: count }, (_, i) => ({ phase: i / count + r() * 0.05, dx: (r() - 0.5) * 2, dz: (r() - 0.5) * 2 }));
  const rise = o.rise ?? 3;
  const spread = o.spread ?? 0.8;
  const [wx, wz] = o.drift ?? [0.4, 0.2];
  const speed = o.speed ?? 0.12;
  const op = o.opacity ?? 0.8;
  const c = new THREE.Color();
  let intensity = 1;
  g.userData.setIntensity = (v: number) => (intensity = THREE.MathUtils.clamp(v, 0, 1.5));
  return onUpdate(g, (t) => {
    meta.forEach((m, i) => {
      const k = (t * speed + m.phase) % 1;
      p.pos.set([m.dx * spread * k + wx * k * rise, k * rise, m.dz * spread * k + wz * k * rise], i * 3);
      p.size[i] = (s0 + (s1 - s0) * k) * (0.6 + intensity * 0.4);
      p.alpha[i] = Math.sin(k * Math.PI) * op * intensity;
      c.copy(c0).lerp(c1, k);
      p.color.set([c.r, c.g, c.b], i * 3);
    });
    p.flush();
  });
}

export function smoke(o: SmokeOpts = {}) {
  return emitter("asap", { color: "#4d4a46", colorEnd: "#8a857e", ...o });
}

export function flames(o: SmokeOpts = {}) {
  return emitter("lidah-api", { count: 18, color: "#eebc70", colorEnd: "#c66b3b", size: [0.35, 0.08], rise: 0.7, spread: 0.15, drift: [0, 0], speed: 1.4, opacity: 0.8, additive: false, ...o });
}

/** Bara api: titik kecil menyala yang naik berkelok. */
export function embers(count = 40, height = 2, radius = 0.4, seed = 3) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3);
  const meta = Array.from({ length: count }, () => ({ a: r() * Math.PI * 2, rad: r() * radius, phase: r(), sp: 0.3 + r() * 0.4 }));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: "#ffb347", size: 0.05, map: softTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  const g = group("bara", pts);
  return onUpdate(g, (t) => {
    meta.forEach((m, i) => {
      const k = (t * m.sp + m.phase) % 1;
      pos[i * 3] = Math.cos(m.a + k * 4) * (m.rad + k * 0.3);
      pos[i * 3 + 1] = k * height;
      pos[i * 3 + 2] = Math.sin(m.a + k * 4) * (m.rad + k * 0.3);
    });
    geo.attributes.position.needsUpdate = true;
  });
}

/** Hujan deras: garis-garis jatuh miring. */
export function rain(w = 6, d = 6, h = 5, count = 500, seed = 4) {
  const r = rng(seed);
  const pos = new Float32Array(count * 6);
  const base = Array.from({ length: count }, () => [(r() - 0.5) * w, r() * h, (r() - 0.5) * d]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: "#8fa6b8", transparent: true, opacity: 0.2, depthWrite: false }));
  const g = group("hujan", lines);
  return onUpdate(g, (t) => {
    base.forEach(([x, y, z], i) => {
      const yy = ((y - t * 7) % h + h) % h;
      pos.set([x, yy, z, x - 0.04, yy + 0.25, z], i * 6);
    });
    geo.attributes.position.needsUpdate = true;
  });
}

/** Petir vulkanik: kilat bergerigi dan cahaya yang menyala sesekali. */
export function lightning(height = 3, seed = 9) {
  const r = rng(seed);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(8 * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#d9e8ff", transparent: true }));
  const light = new THREE.PointLight("#b9d4ff", 0, 12, 1.5);
  const g = group("petir", line, light);
  let next = 1 + r() * 3;
  let flash = 0;
  return onUpdate(g, (t, dt) => {
    if (t > next) {
      next = t + 1.5 + r() * 4;
      flash = 0.18;
      let x = 0, z = 0;
      for (let i = 0; i < 8; i++) {
        x += (r() - 0.5) * 0.5;
        z += (r() - 0.5) * 0.5;
        pos.set([x, height - (i / 7) * height * 0.7, z], i * 3);
      }
      geo.attributes.position.needsUpdate = true;
    }
    flash = Math.max(0, flash - dt);
    const on = flash > 0 && Math.sin(flash * 90) > -0.3;
    line.visible = on;
    light.intensity = on ? 3 : 0;
    light.position.set(pos[6], height * 0.7, pos[8]);
  });
}

/** Membuat objek hanyut pelan bolak-balik dan terombang-ambing. */
export function drift(obj: THREE.Object3D, amp = 0.6, speed = 0.15, seed = 1) {
  const r = rng(seed);
  const x0 = obj.position.x, z0 = obj.position.z, y0 = obj.position.y, ry = obj.rotation.y;
  const ph = r() * 10;
  return onUpdate(obj, (t) => {
    obj.position.x = x0 + Math.sin(t * speed + ph) * amp;
    obj.position.z = z0 + Math.cos(t * speed * 0.7 + ph) * amp * 0.4;
    obj.position.y = y0 + Math.sin(t * 1.3 + ph) * 0.03;
    obj.rotation.y = ry + Math.sin(t * speed * 0.5 + ph) * 0.4;
  });
}

/** Guncangan gempa: panggil userData.quake(kekuatan, detik) pada objek. */
export function quakeable(obj: THREE.Object3D, seed = 5) {
  const r = rng(seed);
  const p0 = obj.position.clone();
  let left = 0, power = 0;
  obj.userData.quake = (p: number, sec: number) => ((power = p), (left = sec));
  return onUpdate(obj, (_t, dt) => {
    if (left <= 0) return;
    left -= dt;
    const k = left > 0 ? power * Math.min(1, left) : 0;
    obj.position.set(p0.x + (r() - 0.5) * k, p0.y + (r() - 0.5) * k * 0.3, p0.z + (r() - 0.5) * k);
  });
}

/** Awan low-poly yang melayang pelan melintasi dunia dan menjatuhkan bayangan bergerak. */
export function clouds(count = 6, span = 20, seed = 13) {
  const r = rng(seed);
  const m = mat("#f4f1ea", { roughness: 1 });
  const g = group("awan");
  const items = Array.from({ length: count }, () => {
    const c = group("awan-satu");
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const b = ball(0.5 + r() * 0.6, m, [(i - n / 2) * 0.6 + r() * 0.3, r() * 0.25, (r() - 0.5) * 0.7], 1);
      b.scale.y = 0.55;
      b.receiveShadow = false;
      c.add(b);
    }
    // Hanya di langit belakang (utara): awan di depan kamera menutupi papan.
    c.position.set((r() - 0.5) * span * 2, 9 + r() * 3, -15 - r() * 9);
    c.userData.speed = 0.2 + r() * 0.25;
    g.add(c);
    return c;
  });
  items.forEach(c => {c.userData.startX=c.position.x;c.userData.noFit=true;});
  g.userData.noFit=true;
  return onUpdate(g, (t) => {
    for (const c of items) c.position.x = ((c.userData.startX + t*c.userData.speed + span+4) % (2*span+8)) - span-4;
  });
}

/** Kilau kecil berkedip (harta, emas). */
export function sparkles(count = 12, radius = 0.4, height = 0.5, seed = 6) {
  const r = rng(seed);
  const p = particles("kilau", count, true);
  const ph = Array.from({ length: count }, () => r() * 10);
  for (let i = 0; i < count; i++) {
    p.pos.set([(r() - 0.5) * radius * 2, r() * height, (r() - 0.5) * radius * 2], i * 3);
    p.color.set([1, 0.95, 0.7], i * 3);
    p.alpha[i] = 1;
  }
  const g = group("kilau", p.pts);
  return onUpdate(g, (t) => {
    for (let i = 0; i < count; i++) p.size[i] = Math.max(0, Math.sin(t * 3 + ph[i])) * 0.14;
    p.flush();
  });
}
