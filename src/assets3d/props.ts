import * as THREE from "three";
import { C, ball, box, softBox, cyl, group, mat, onUpdate, rng, textTexture, texturedPlane } from "./kit";
import type { Slogan } from "./banners";
import { emitter } from "./fx";
import { model } from "./models";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { citizen } from "./characters";

// Properti kecil: orang kerumunan, aparat, spanduk, dadu, kartu, bantuan.

export function person(shirt: string = C.navy, seed = 1) { return citizen(shirt,seed); }

export function riotPolice() { const g=citizen(C.navy,1,"aparat");g.name="aparat";return g; }

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
    box(0.1,0.025,0.22,C.ink,[-0.3,0,0]),box(0.1,0.025,0.22,C.ink,[0.3,0,0]),
  );
}

export function megaphone() {
  const horn = cyl(0.1, 0.035, 0.22, C.white, [0, 0, 0], 10);
  horn.rotation.z = Math.PI / 2;
  horn.position.set(0.11, 0.1, 0);
  return group("toa", horn, cyl(0.082,0.082,0.006,C.ink,[-0.112,0.1,0],10,[0,0,Math.PI/2]), box(0.04, 0.1, 0.04, C.ink, [-0.02, 0, 0]));
}

export function tearGas() {
  const cloud = emitter("asap-gas", { count: 20, color: "#e9eef0", colorEnd: "#c9d6db", size: [0.12, 0.75], rise: 0.7, spread: 0.6, drift: [0.2, 0.1], speed: 0.15, opacity: 0.38, seed: 12 });
  return group("gas-air-mata", cloud, cyl(0.025, 0.025, 0.08, C.asphalt, [0, 0.02, 0], 8, [Math.PI / 2, 0, 0]));
}

/** Dadu dengan titik. value() membaca muka yang menghadap atas. */
export function die(color: string = C.white) {
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.3, 0.3, 1, 0.02), mat(color, { roughness: 0.4 }));
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
  const tex = textTexture([title, kind === "kesempatan" ? "?" : "!"], { bg, fg, w: 256, h: 384, border: fg });
  const face = texturedPlane(0.4, 0.6, tex, [0, 0.022, 0], [-Math.PI / 2, 0, 0], false);
  return group(`kartu-${kind}`, softBox(0.42, 0.02, 0.62, bg, [0,0,0], 0.008), face);
}

export function aidBox() {
  const tex = textTexture(["BANSOS"], { bg: "#d8b98a", fg: C.merah, w: 256, h: 128 });
  return group("kotak-bansos",
    softBox(0.4, 0.3, 0.3, "#bc9d72"),
    texturedPlane(0.34, 0.17, tex, [0, 0.15, 0.151], [0, 0, 0], false),
    box(0.41, 0.02, 0.06, "#b89a6a", [0, 0.3, 0]),
  );
}

export function riceSack() {
  const g=group("karung-beras");
  const sack=ball(0.23,C.paper,[0,0.23,0],1);sack.scale.set(0.8,1.1,0.67);
  g.add(sack,cyl(0.04,0.075,0.08,C.paper,[0,0.45,0],7),cyl(0.052,0.052,0.018,C.wood,[0,0.46,0],7));
  g.add(texturedPlane(0.2,0.2,textTexture(["BERAS","PREMIUM*"],{bg:C.paper,fg:C.navy,w:256,h:256}),[0,0.25,0.148],[0,0,0],false));return g;
}

/** Ompreng: nampan makan stainless berpetak. */
export function mealTray() {
  const steel=mat("#b2bec2",{metalness:0.65,roughness:0.5});
  const g=group("ompreng-makan",softBox(0.5,0.02,0.36,steel));
  for(const z of [-0.17,0.17])g.add(softBox(0.5,0.035,0.02,steel,[0,0.02,z],0.008));
  for(const x of [-0.24,0.05,0.24])g.add(softBox(0.02,0.035,0.34,steel,[x,0.02,0],0.008));
  g.add(softBox(0.19,0.035,0.018,steel,[0.145,0.02,0],0.008));
  const rice=ball(0.07,C.paper,[-0.1,0.055,0.02],1);rice.scale.y=0.6;
  g.add(rice,softBox(0.11,0.035,0.065,C.wood,[0.14,0.03,0.08]),ball(0.035,C.leaf,[0.15,0.055,-0.08],0));return g;
}

/** Mobil kecil. Plat merah untuk mobil dinas. */
const BURNT = "#2b2622";

/**
 * Mobil. Memakai model KayKit kalau sudah dimuat: mobil dinas = sedan dengan strobo, mobil gosong =
 * sedan yang dihitamkan, lainnya hatchback/station wagon/taksi dipilih dari warnanya (supaya stabil).
 */
export function car(color: string = "#3b6fb5", official = false) {
  const pool = ["hatchback", "stationwagon", "taksi"] as const;
  const kind = official || color === BURNT ? "sedan" : pool[[...color].reduce((a, ch) => a + ch.charCodeAt(0), 0) % pool.length];
  const m = model(kind);
  if (m) {
    m.name = official ? "mobil-dinas" : "mobil";
    if (color === BURNT) {
      m.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mt = (mesh.material as THREE.MeshStandardMaterial).clone();
        mt.userData.sharedResource = false;
        mt.color.set("#3a332d");
        mesh.material = mt;
      });
    }
    if (official) { m.add(box(0.014,0.035,0.1,C.merah,[0.31,0.08,0])); }
    if (official) m.add(box(0.06, 0.03, 0.06, mat("#2a6bff", { emissive: "#2a6bff", emissiveIntensity: 2 }), [0, 0.27, 0])); // strobo
    return m;
  }
  return proceduralCar(color, official);
}

function proceduralCar(color: string, official: boolean) {
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
  const m = model("lampuJalan", 1.45); // tinggi 0.96 KayKit -> ~1.1 seperti lampu lama
  if (m) {
    m.name = "lampu-jalan";
    return m;
  }
  return group("lampu-jalan",
    cyl(0.02, 0.03, 1.1, "#2b2f36", [0, 0, 0], 6),
    box(0.3, 0.02, 0.03, "#2b2f36", [0.13, 1.08, 0]),
    box(0.1, 0.03, 0.06, mat("#fff2c4", { emissive: "#ffd27a", emissiveIntensity: 2.5 }), [0.26, 1.05, 0]),
  );
}

export function pinjolPhone() {
  const tex = textTexture(["CAIR 5 MENIT", "BUNGA 5 TURUNAN"], { bg: "#0b0f14", fg: "#9cbb88", w: 256, h: 448 });
  return group("hp-pinjol",
    softBox(0.2, 0.36, 0.02, C.ink, [0,0,0], 0.012),
    texturedPlane(0.18, 0.32, tex, [0, 0.18, 0.011], [0, 0, 0], false),
  );
}
