import * as THREE from "three";
import {
  C,
  ball,
  box,
  cone,
  cyl,
  group,
  mat,
  onUpdate,
  rng,
  textTexture,
  texturedPlane,
} from "./kit";
import { embers, emitter, flames, smoke } from "./fx";
import { tropicalTree, tropicalPalm, tropicalStump } from "./vegetation";
import { citizen } from "./characters";

// Zona Barat: hutan, kebun sawit, kebakaran lahan, kabut asap, pemadaman dari udara.

export function tree(seed = 1) {
  return tropicalTree(seed);
}

/** Kelapa sawit: batang pendek bersisik, pelepah melengkung. */
export function oilPalm(seed = 1) {
  return tropicalPalm(seed, true);
}

/** Api hidup: lidah api sprite, inti kerucut menyala, bara, dan asap. */
// withLight: lampu titik itu mahal; di hutan besar hanya sebagian api yang diberi cahaya.
export function fire(scale = 1, seed = 1, withLight = true) {
  const core = cone(
    0.12,
    0.28,
    mat("#ffb000", { emissive: "#ff7a00", emissiveIntensity: 1.1 }),
    [0, 0, 0],
    6,
  );
  core.castShadow = false;
  const plume = smoke({
    count: 10,
    size: [0.25, 1.1],
    rise: 1.8,
    spread: 0.4,
    speed: 0.25,
    opacity: 0.6,
    seed,
  });
  plume.position.y = 0.4;
  const g = group(
    "api",
    core,
    flames({ seed }),
    embers(16, 1.2, 0.15, seed),
    plume,
  );
  const light = withLight ? new THREE.PointLight("#e7a25a", 0.9, 3, 2) : null;
  if (light) {
    light.position.y = 0.4;
    g.add(light);
  }
  g.scale.setScalar(scale);
  return onUpdate(g, (t) => {
    core.scale.set(1, 0.8 + Math.abs(Math.sin(t * 11 + seed)) * 0.5, 1);
    if (light) light.intensity = 0.65 + Math.sin(t * 17 + seed) * 0.15;
  });
}

export function burningTree(seed = 2, withLight = true) {
  const g = tropicalTree(seed, "terbakar");
  const f = fire(0.65, seed, withLight);
  f.position.set(0.1, 0.3, 0);
  g.add(f);
  return g;
}

export function burntTree(seed = 3) {
  return tropicalTree(seed, "hangus");
}

/** Kabut asap lembut berlapis sprite. setDensity(0..1). */
export function haze(w = 4, d = 3, seed = 2) {
  const r = rng(seed);
  const g = group("kabut-asap");
  const layers: THREE.Group[] = [];
  const n = Math.max(3, Math.round((w * d) / 6));
  for (let i = 0; i < n; i++) {
    const e = emitter("kabut", {
      count: 6,
      color: "#6f7066",
      colorEnd: "#a19a88",
      size: [2.4, 3.6],
      rise: 0.6,
      spread: 1.2,
      drift: [0.6, 0],
      speed: 0.03,
      opacity: 0.23,
      seed: seed + i,
    });
    e.position.set((r() - 0.5) * w, 0.3, (r() - 0.5) * d);
    layers.push(e);
    g.add(e);
  }
  g.userData.setDensity = (v: number) =>
    layers.forEach((l) =>
      l.userData.setIntensity?.(THREE.MathUtils.clamp(v, 0, 1)),
    );
  return g;
}

export function helicopter() {
  const rotor = group(
    "rotor",
    box(1.7, 0.02, 0.07, C.ink),
    box(0.07, 0.02, 1.7, C.ink),
    cyl(0.04, 0.04, 0.08, C.ink, [0, -0.06, 0]),
  );
  rotor.position.y = 0.42;
  const tailRotor = group(
    "rotor-ekor",
    box(0.02, 0.32, 0.04, C.ink),
    box(0.02, 0.04, 0.32, C.ink),
  );
  tailRotor.position.set(1.15, 0.32, 0.05);
  const body = ball(0.3, C.orange, [0, 0.2, 0], 2);
  body.scale.set(1.4, 0.85, 0.85);
  const glass = ball(
    0.2,
    mat("#2b4a63", { roughness: 0.15, metalness: 0.4 }),
    [-0.22, 0.25, 0],
    1,
  );
  glass.scale.set(1, 0.8, 1.1);
  const bucket = group(
    "ember",
    cyl(0.005, 0.005, 0.6, C.ink, [0, 0.06, 0]),
    cyl(0.13, 0.09, 0.18, C.red, [0, -0.12, 0], 10),
  );
  bucket.position.set(0.05, -0.62, 0);
  const water = emitter("siraman-air", {
    count: 28,
    color: C.water,
    colorEnd: C.paper,
    size: [0.06, 0.28],
    rise: -1.8,
    spread: 0.35,
    drift: [0, 0],
    speed: 0.9,
    opacity: 0.5,
    seed: 4,
  });
  water.position.set(0.05, -0.75, 0);
  // Isi ember: terlihat hanya saat membawa air.
  const fill = cyl(
    0.12,
    0.12,
    0.02,
    mat("#5fa8d3", { roughness: 0.1 }),
    [0, -0.05, 0],
    10,
  );
  bucket.add(fill);
  const inner = group(
    "badan-heli",
    body,
    glass,
    box(0.9, 0.08, 0.08, C.orange, [0.65, 0.2, 0]),
    box(0.04, 0.28, 0.04, C.orange, [1.12, 0.2, 0]),
    box(0.7, 0.03, 0.03, C.ink, [-0.05, -0.05, 0.18]),
    box(0.7, 0.03, 0.03, C.ink, [-0.05, -0.05, -0.18]),
    box(0.03, 0.12, 0.03, C.ink, [0.12, -0.05, 0.18]),
    box(0.03, 0.12, 0.03, C.ink, [0.12, -0.05, -0.18]),
    bucket,
    water,
    rotor,
    tailRotor,
  );
  const g = group("helikopter-water-bombing", inner);
  g.position.y = 2.2;
  g.userData.setSpray = (v: number) => water.userData.setIntensity?.(v);
  g.userData.setFull = (v: boolean) => (fill.visible = v);
  return onUpdate(g, (t) => {
    rotor.rotation.y = t * 25;
    tailRotor.rotation.z = t * 30;
    inner.position.y = Math.sin(t * 1.2) * 0.08;
    bucket.rotation.z = Math.sin(t * 1.4) * 0.1;
  });
}

/**
 * Misi pemadaman: terbang ke sungai, turun mencelupkan ember, naik, terbang ke garis api, menyiram. Berulang.
 * scoop: titik permukaan air; drop: titik api di tanah.
 */
export function helicopterMission(scoop: THREE.Vector3, drop: THREE.Vector3) {
  const heli = helicopter();
  const splash = emitter("cipratan", {
    count: 16,
    color: "#e6f4fb",
    colorEnd: "#ffffff",
    size: [0.1, 0.5],
    rise: 0.6,
    spread: 0.6,
    drift: [0, 0],
    speed: 1.1,
    opacity: 0.8,
    seed: 9,
  });
  splash.position.copy(scoop);
  const g = group("misi-helikopter", heli, splash);
  const T = 18;
  const cruise = Math.max(scoop.y, drop.y) + 2.4;
  const dipY = scoop.y + 0.8; // ember menyentuh air
  const sprayY = drop.y + 2.0;
  const ease = (x: number) => x * x * (3 - 2 * x);
  const pos = new THREE.Vector3();
  let yaw = 0;
  const seg = (t: number, a: number, b: number) =>
    ease(Math.min(1, Math.max(0, (t - a) / (b - a))));
  return onUpdate(g, (time) => {
    const t = time % T;
    let from = drop,
      to = scoop,
      k = 0,
      y = cruise,
      spray = 0,
      dipping = 0;
    if (t < 4)
      k = seg(t, 0, 4); // ke sungai
    else if (t < 8.5) {
      k = 1;
      y =
        t < 5.5
          ? cruise + (dipY - cruise) * seg(t, 4, 5.5)
          : t < 7
            ? dipY
            : dipY + (cruise - dipY) * seg(t, 7, 8.5);
      dipping = t > 5.3 && t < 7.2 ? 1 : 0;
    } else if (t < 12.5) {
      from = scoop;
      to = drop;
      k = seg(t, 8.5, 12.5); // kembali ke api
    } else {
      from = scoop;
      to = drop;
      k = 1;
      y = cruise + (sprayY - cruise) * seg(t, 12.5, 13.5);
      spray = t > 13 && t < 16 ? 1 : 0;
    }
    pos.lerpVectors(from, to, k);
    // Hadapkan moncong (sumbu -x lokal) ke arah terbang.
    if (k > 0 && k < 1) yaw = Math.atan2(to.z - from.z, -(to.x - from.x));
    heli.rotation.y += (yaw - heli.rotation.y) * 0.05;
    heli.position.set(pos.x, y, pos.z);
    heli.userData.setSpray(spray);
    heli.userData.setFull(t > 6 && t < 15.8);
    splash.userData.setIntensity?.(dipping);
  });
}

export function concessionSign() {
  const tex = textTexture(["KAWASAN KONSESI", "DILARANG BERTANYA"], {
    bg: C.white,
    fg: C.red,
    w: 512,
    h: 200,
    border: C.red,
  });
  return group(
    "papan-konsesi",
    cyl(0.025, 0.025, 0.85, C.woodDark, [-0.32, 0, 0]),
    cyl(0.025, 0.025, 0.85, C.woodDark, [0.32, 0, 0]),
    texturedPlane(0.85, 0.34, tex, [0, 0.78, 0.03]),
  );
}

export function stump() {
  return tropicalStump();
}

/** Pemadam kebakaran hutan dengan selang. */
export function firefighter() {
  const g = citizen(C.orange, 8, "pemadam");
  g.name = "pemadam";
  const spray = emitter("semprot", {
    count: 12,
    color: C.water,
    colorEnd: C.paper,
    size: [0.025, 0.14],
    rise: 0.15,
    spread: 0.1,
    drift: [2.5, 0],
    speed: 1.2,
    opacity: 0.48,
    seed: 8,
  });
  spray.position.set(0.27, 0.3, 0);
  g.add(
    cyl(0.015, 0.02, 0.3, C.ink, [0.02, 0.3, 0], 6, [0, 0, -Math.PI / 2]),
    spray,
  );
  return g;
}
