import * as THREE from "three";
import { scooter } from "./vehicles";
import { C, ball, box, cone, cyl, group, mat, onUpdate } from "./kit";

// Bidak pemain: enam tipe WNI rekaan. Tinggi sekitar 0.6, berdiri di alas warna pemain.

function base(color: string) {
  const glow = mat(color, { emissive: color, emissiveIntensity: 0.15 });
  return group(
    "alas",
    cyl(
      0.2,
      0.23,
      0.045,
      mat(color, { roughness: 0.35, metalness: 0.3 }),
      [0, 0, 0],
      20,
    ),
    cyl(0.205, 0.205, 0.015, glow, [0, 0.045, 0], 20),
    cyl(0.17, 0.17, 0.012, C.white, [0, 0.05, 0], 20),
  );
}

function body(shirt: string, pants: string, skin: string = C.skin) {
  return group(
    "badan",
    cyl(0.03, 0.035, 0.14, pants, [0.04, 0.07, 0], 6),
    cyl(0.03, 0.035, 0.14, pants, [-0.04, 0.07, 0], 6),
    box(0.06, 0.03, 0.09, C.ink, [0.04, 0.065, 0.02]), // sepatu
    box(0.06, 0.03, 0.09, C.ink, [-0.04, 0.065, 0.02]),
    cyl(0.08, 0.1, 0.2, shirt, [0, 0.2, 0], 10),
    cyl(0.022, 0.026, 0.17, shirt, [0.11, 0.22, 0], 6, [0, 0, 0.2]),
    cyl(0.022, 0.026, 0.17, shirt, [-0.11, 0.22, 0], 6, [0, 0, -0.2]),
    ball(0.025, skin, [0.13, 0.22, 0], 1),
    ball(0.025, skin, [-0.13, 0.22, 0], 1),
    ball(0.095, skin, [0, 0.5, 0], 2),
    ball(0.013, C.ink, [0.035, 0.52, 0.085], 1),
    ball(0.013, C.ink, [-0.035, 0.52, 0.085], 1),
    box(0.04, 0.008, 0.01, "#7a3b2e", [0, 0.47, 0.09]), // mulut datar: hidup berat
  );
}

function pawn(name: string, playerColor: string, ...parts: THREE.Object3D[]) {
  const g = group(name, base(playerColor), ...parts);
  // Idle: bernapas pelan.
  return onUpdate(
    g,
    (t) => (g.children[1].scale.y = 1 + Math.sin(t * 2 + g.id) * 0.02),
  );
}

export function buruh(color: string = C.red) {
  return pawn(
    "bidak-buruh",
    color,
    body(C.navy, C.navy),
    cyl(0.1, 0.11, 0.06, "#f2c94c", [0, 0.56, 0], 10), // helm proyek
    box(0.24, 0.015, 0.06, "#f2c94c", [0, 0.56, 0.06]),
    box(0.12, 0.1, 0.04, C.white, [0, 0.22, 0.08]), // surat PHK di dada
  );
}

export function ojol(color: string = C.green) {
  return pawn(
    "bidak-ojol",
    color,
    body(C.ojol, C.ink),
    ball(0.11, C.ojol, [0, 0.53, -0.01], 1), // helm
    box(0.18, 0.05, 0.02, mat("#1d1f24", { opacity: 0.7 }), [0, 0.5, 0.09]), // visor
    box(0.14, 0.14, 0.08, C.ojol, [0, 0.2, -0.12]), // tas
  );
}

export function guru(color: string = C.gold) {
  return pawn(
    "bidak-guru-honorer",
    color,
    body("#8b5a2b", C.navy),
    box(0.14, 0.008, 0.018, C.ink, [0, 0.53, 0.09]), // kacamata
    box(0.12, 0.16, 0.03, C.red, [0.12, 0.2, 0.04], [0, 0, 0.2]), // buku
  );
}

export function petani(color: string = C.purple) {
  return pawn(
    "bidak-petani",
    color,
    body(C.green, C.ink, C.skinDark),
    cone(0.2, 0.1, "#d8b46a", [0, 0.57, 0], 12), // caping
    cyl(0.012, 0.012, 0.42, C.wood, [0.23, 0.07, 0.08]), // cangkul
    box(0.1, 0.07, 0.025, C.concrete, [0.23, 0.06, 0.13]),
  );
}

export function mahasiswa(color: string = C.orange) {
  return pawn(
    "bidak-mahasiswa",
    color,
    body(C.gold, C.navy), // jaket almamater
    box(0.14, 0.18, 0.08, C.navy, [0, 0.2, -0.11]), // ransel
    cyl(0.1, 0.09, 0.04, C.ink, [0, 0.58, 0], 10), // topi
  );
}

export function pedagang(color: string = "#2db4c8") {
  return pawn(
    "bidak-pedagang",
    color,
    body(C.paper, C.woodDark),
    box(0.145, 0.17, 0.012, C.roofBlue, [0, 0.16, 0.09]), // celemek
    cyl(0.12, 0.1, 0.04, "#d8b46a", [0, 0.6, 0], 10), // tampah di kepala
    ball(0.035, C.red, [0.03, 0.65, 0]),
    ball(0.035, C.leaf, [-0.04, 0.65, 0.03]),
  );
}

export function ojolMotor() {
  return scooter();
}

export const PAWNS = { buruh, ojol, guru, petani, mahasiswa, pedagang };
