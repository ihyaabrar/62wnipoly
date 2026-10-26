import * as THREE from "three";
import { C, ball, box, cyl, group, mat, onUpdate, rng, textTexture, texturedPlane } from "./kit";
import type { Slogan } from "./banners";
import { emitter } from "./fx";

// Properti kecil: orang kerumunan, aparat, spanduk, dadu, kartu, bantuan.

export function person(shirt: string = C.navy, seed = 1) {
  const r = rng(seed);
  const s = 0.9 + r() * 0.2;
  const skin = r() > 0.5 ? C.skin : C.skinDark;
  const raised = r() > 0.6; // tangan terkepal ke atas
  const g = group("warga",
    cyl(0.05, 0.06, 0.18, ["#24345c", "#3b3b3b", "#5a4a3a"][Math.floor(r() * 3)], [0, 0, 0], 6),
    cyl(0.06, 0.07, 0.2, shirt, [0, 0.18, 0], 7),
    ball(0.06, skin, [0, 0.45, 0], 1),
    cyl(0.018, 0.02, 0.18, shirt, [-0.08, 0.2, 0], 5, [0, 0, -0.15]),
    cyl(0.018, 0.02, 0.18, shirt, raised ? [0.06, 0.36, 0] : [0.08, 0.2, 0], 5, [0, 0, raised ? 0 : 0.15]),
  );
  if (r() > 0.6) g.add(cyl(0.062, 0.066, 0.04, ["#1d1f24", "#f2c94c", "#c8102e"][Math.floor(r() * 3)], [0, 0.5, 0], 8)); // topi
  g.scale.setScalar(s);
  return g;
}

export function riotPolice() {
  return group("aparat",
    cyl(0.06, 0.06, 0.2, C.ink),
    cyl(0.07, 0.08, 0.22, "#3a4250", [0, 0.2, 0]),
    ball(0.075, "#2b3038", [0, 0.48, 0], 1),
    box(0.22, 0.32, 0.02, mat("#bfd4e6", { opacity: 0.6 }), [0, 0.1, 0.12]),
  );
}

export function banner(s: Slogan) {
  const tex = textTexture(s.text, { bg: s.bg, fg: s.fg, w: 512, h: 192 });
  const cloth = texturedPlane(0.9, 0.34, tex, [0, 0.55, 0]);
  const g = group("spanduk",
    cyl(0.015, 0.015, 0.75, C.woodDark, [-0.46, 0, 0]),
    cyl(0.015, 0.015, 0.75, C.woodDark, [0.46, 0, 0]),
    cloth,
  );
  g.userData.inspirasi = s.inspirasi;
  return onUpdate(g, (t) => (cloth.rotation.x = Math.sin(t * 2 + g.id) * 0.06));
}

/** Baliho besar berkaki dua untuk tepi papan. */
export function billboard(s: Slogan) {
  const tex = textTexture(s.text, { bg: s.bg, fg: s.fg, w: 768, h: 320, border: s.fg });
  return group("baliho",
    box(0.06, 1.1, 0.06, C.asphalt, [-0.5, 0, 0]),
    box(0.06, 1.1, 0.06, C.asphalt, [0.5, 0, 0]),
    box(1.32, 0.58, 0.05, C.ink, [0, 0.98, -0.03]),
    texturedPlane(1.25, 0.52, tex, [0, 1.27, 0.0]),
  );
}

export function barricade() {
  return group("barikade",
    box(0.04, 0.3, 0.04, C.ink, [-0.3, 0, 0]),
    box(0.04, 0.3, 0.04, C.ink, [0.3, 0, 0]),
    box(0.7, 0.07, 0.03, C.red, [0, 0.2, 0]),
    box(0.7, 0.05, 0.03, C.white, [0, 0.12, 0]),
  );
}

export function megaphone() {
  const horn = cyl(0.1, 0.035, 0.22, C.white, [0, 0, 0], 10);
  horn.rotation.z = Math.PI / 2;
  horn.position.set(0.11, 0.1, 0);
  return group("toa", horn, box(0.04, 0.1, 0.04, C.ink, [-0.02, 0, 0]));
}

export function tearGas() {
  const cloud = emitter("asap-gas", { count: 20, color: "#e9eef0", colorEnd: "#c9d6db", size: [0.3, 1.6], rise: 0.9, spread: 1.4, drift: [0.2, 0.1], speed: 0.15, opacity: 0.6, seed: 12 });
  return group("gas-air-mata", cloud, cyl(0.025, 0.025, 0.08, C.asphalt, [0, 0.02, 0], 8, [Math.PI / 2, 0, 0]));
}

/** Dadu dengan titik. value() membaca muka yang menghadap atas. */
export function die(color: string = C.white) {
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat(color, { roughness: 0.4 }));
  body.castShadow = true;
  const g = group("dadu", body);
  const pip = new THREE.CylinderGeometry(0.028, 0.028, 0.01, 10);
  const pipMat = mat(C.ink);
  const o = 0.075;
  const faces: { n: THREE.Vector3; pts: [number, number][] }[] = [
    { n: new THREE.Vector3(0, 1, 0), pts: [[0, 0]] },
    { n: new THREE.Vector3(0, -1, 0), pts: [[-o, -o], [-o, 0], [-o, o], [o, -o], [o, 0], [o, o]] },
    { n: new THREE.Vector3(1, 0, 0), pts: [[-o, -o], [o, o]] },
    { n: new THREE.Vector3(-1, 0, 0), pts: [[-o, -o], [0, 0], [o, o], [-o, o], [o, -o]] },
    { n: new THREE.Vector3(0, 0, 1), pts: [[-o, -o], [0, 0], [o, o]] },
    { n: new THREE.Vector3(0, 0, -1), pts: [[-o, -o], [o, o], [-o, o], [o, -o]] },
  ];
  const up = new THREE.Vector3(0, 1, 0);
  for (const f of faces) {
    const q = new THREE.Quaternion().setFromUnitVectors(up, f.n);
    for (const [a, b] of f.pts) {
      const m = new THREE.Mesh(pip, pipMat);
      m.position.set(a, 0.151, b).applyQuaternion(q);
      m.quaternion.copy(q);
      g.add(m);
    }
  }
  g.position.y = 0.15;
  return g;
}

export function card(kind: "kesempatan" | "musibah", title = kind === "kesempatan" ? "KESEMPATAN" : "MUSIBAH") {
  const bg = kind === "kesempatan" ? "#f2c94c" : C.ink;
  const fg = kind === "kesempatan" ? C.ink : "#ff5a5a";
  const tex = textTexture([title, "?"], { bg, fg, w: 256, h: 384, border: fg });
  const face = texturedPlane(0.4, 0.6, tex, [0, 0.011, 0], [-Math.PI / 2, 0, 0], false);
  return group(`kartu-${kind}`, box(0.42, 0.02, 0.62, bg), face);
}

export function aidBox() {
  const tex = textTexture(["BANSOS"], { bg: "#d8b98a", fg: C.merah, w: 256, h: 128 });
  return group("kotak-bansos",
    box(0.4, 0.3, 0.3, "#d8b98a"),
    texturedPlane(0.34, 0.17, tex, [0, 0.15, 0.151], [0, 0, 0], false),
    box(0.41, 0.02, 0.06, "#b89a6a", [0, 0.3, 0]),
  );
}

export function riceSack() {
  const tex = textTexture(["BERAS", "PREMIUM*", "*harga juga"], { bg: C.white, fg: C.navy, w: 256, h: 256 });
  const body = cyl(0.17, 0.2, 0.42, C.white, [0, 0, 0], 8);
  return group("karung-beras", body, cyl(0.08, 0.15, 0.08, C.white, [0, 0.42, 0], 8), texturedPlane(0.26, 0.26, tex, [0, 0.2, 0.19], [0, 0, 0], false));
}

/** Ompreng: nampan makan stainless berpetak. */
export function mealTray() {
  const steel = mat("#c9d1d6", { metalness: 0.8, roughness: 0.3 });
  return group("ompreng-makan",
    box(0.5, 0.04, 0.36, steel),
    box(0.5, 0.05, 0.02, steel, [0, 0.04, 0]),
    box(0.02, 0.05, 0.36, steel, [0.05, 0.04, 0]),
    ball(0.07, C.white, [-0.12, 0.06, 0.08]), // nasi
    box(0.12, 0.03, 0.07, "#b5651d", [0.15, 0.04, 0.08]), // lauk
    ball(0.04, C.leaf, [0.15, 0.06, -0.08]), // sayur
    ball(0.04, "#9acd32", [-0.14, 0.05, -0.08]), // lauk mencurigakan
  );
}

/** Mobil kecil. Plat merah untuk mobil dinas. */
export function car(color: string = "#3b6fb5", official = false) {
  const wheel = (x: number, z: number) => cyl(0.07, 0.07, 0.05, C.ink, [x, 0.07, z], 10, [Math.PI / 2, 0, 0]);
  const glass = mat("#2b3a4a", { roughness: 0.1, metalness: 0.5 });
  const g = group(official ? "mobil-dinas" : "mobil",
    box(0.62, 0.16, 0.3, mat(color, { roughness: 0.35, metalness: 0.4 }), [0, 0.06, 0]),
    box(0.34, 0.13, 0.27, mat(color, { roughness: 0.35, metalness: 0.4 }), [-0.04, 0.22, 0]),
    box(0.35, 0.1, 0.275, glass, [-0.04, 0.23, 0]),
    box(0.02, 0.04, 0.12, mat("#fff2c4", { emissive: "#fff2c4", emissiveIntensity: 1.5 }), [0.31, 0.13, 0]),
    box(0.02, 0.03, 0.1, official ? C.merah : C.white, [-0.315, 0.1, 0]), // plat nomor
    wheel(-0.2, 0.15), wheel(-0.2, -0.15), wheel(0.2, 0.15), wheel(0.2, -0.15),
  );
  if (official) g.add(box(0.06, 0.03, 0.06, mat("#2a6bff", { emissive: "#2a6bff", emissiveIntensity: 2 }), [-0.04, 0.35, 0])); // strobo
  return g;
}

export function streetLamp() {
  return group("lampu-jalan",
    cyl(0.02, 0.03, 1.1, "#2b2f36", [0, 0, 0], 6),
    box(0.3, 0.02, 0.03, "#2b2f36", [0.13, 1.08, 0]),
    box(0.1, 0.03, 0.06, mat("#fff2c4", { emissive: "#ffd27a", emissiveIntensity: 2.5 }), [0.26, 1.05, 0]),
  );
}

export function pinjolPhone() {
  const tex = textTexture(["CAIR 5 MENIT", "BUNGA 5 TURUNAN"], { bg: "#0b0f14", fg: "#2fe07a", w: 256, h: 448 });
  return group("hp-pinjol",
    box(0.2, 0.36, 0.02, C.ink),
    texturedPlane(0.18, 0.32, tex, [0, 0.18, 0.011], [0, 0, 0], false),
  );
}
