import * as THREE from "three";
import { C, ball, box, cone, cyl, group, mat, onUpdate, rng } from "./kit";
import { sparkles } from "./fx";
import { tree } from "./barat";

// Pusat papan: hanya Monas di taman. Demo dipindah ke depan gedung dewan (zona Timur).

export function monas() {
  const goldMat = mat(C.gold, { metalness: 0.85, roughness: 0.25, emissive: "#ffb000", emissiveIntensity: 1.8 });
  const marble = mat("#f4f1ea", { roughness: 0.5 });
  const flame = group("lidah-api-emas");
  for (let i = 0; i < 5; i++) {
    const f = cone(0.09 - i * 0.008, 0.36 - i * 0.03, goldMat, [Math.sin(i * 2.4) * 0.03, 0, Math.cos(i * 2.4) * 0.03], 6);
    f.rotation.z = Math.sin(i * 1.7) * 0.25;
    flame.add(f);
  }
  flame.position.y = 4.12;
  const g = group("monas",
    // Pelataran bertingkat.
    box(2.2, 0.1, 2.2, "#d9d3c4"),
    box(1.9, 0.08, 1.9, "#e6e1d4", [0, 0.1, 0]),
    // Badan cawan (ruang museum).
    box(1.6, 0.42, 1.6, marble, [0, 0.18, 0]),
    box(1.66, 0.04, 1.66, "#cfc8b8", [0, 0.6, 0]),
    // Cawan: melebar ke atas.
    cyl(0.95, 0.42, 0.34, marble, [0, 0.64, 0], 4),
    cyl(0.97, 0.97, 0.04, "#cfc8b8", [0, 0.98, 0], 4),
    // Tugu meruncing.
    cyl(0.1, 0.2, 2.75, marble, [0, 1.02, 0], 4),
    // Pelataran puncak dan wadah api.
    box(0.36, 0.06, 0.36, marble, [0, 3.77, 0]),
    cyl(0.1, 0.07, 0.18, "#b8963a", [0, 3.83, 0], 8),
    cyl(0.07, 0.12, 0.12, goldMat, [0, 4.0, 0], 8),
    flame,
    sparkles(8, 0.25, 0.5, 7),
  );
  g.children.slice(4, 7).forEach((c) => (c.rotation.y = Math.PI / 4));
  g.children[g.children.length - 1].position.y = 4.1;
  // Pintu masuk di keempat sisi badan.
  for (let i = 0; i < 4; i++) {
    const d = box(0.3, 0.3, 0.02, "#5a4a3a", [0, 0.18, 0.81]);
    const side = group("pintu", d);
    side.rotation.y = (i * Math.PI) / 2;
    g.add(side);
  }
  const light = new THREE.PointLight("#ffc04a", 4, 4, 2);
  light.position.y = 4.4;
  g.add(light);
  return onUpdate(g, (t) => {
    flame.scale.set(1, 1 + Math.sin(t * 5) * 0.06, 1);
    flame.rotation.y = t * 0.3;
  });
}

/** Taman Monas: rumput, jalan setapak, pohon, pagar, lampu taman. */
export function monasPark(size = 8.6, seed = 4) {
  const r = rng(seed);
  const h = size / 2;
  const g = group("taman-monas", box(size, 0.04, size, "#6aa14f"));
  // Jalan setapak menyilang dan melingkar.
  g.add(box(size, 0.01, 0.5, "#d9cfb8", [0, 0.04, 0]), box(0.5, 0.01, size, "#d9cfb8", [0, 0.04, 0]));
  const ringGeo = new THREE.RingGeometry(2.1, 2.55, 40);
  ringGeo.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, mat("#d9cfb8"));
  ring.position.y = 0.051;
  ring.receiveShadow = true;
  g.add(ring);
  const m = monas();
  m.position.y = 0.05;
  g.add(m);
  // Pohon di tiap kuadran taman.
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < 4; i++) {
      const sx = q % 2 ? 1 : -1, sz = q < 2 ? 1 : -1;
      const t = tree(seed + q * 10 + i);
      t.position.set(sx * (2.9 + r() * 1.1), 0.04, sz * (2.9 + r() * 1.1));
      t.scale.setScalar(0.7 + r() * 0.3);
      g.add(t);
    }
  }
  // Lampu taman di sepanjang jalan.
  const lampMat = mat("#fff2c4", { emissive: "#ffd27a", emissiveIntensity: 2 });
  for (const [x, z] of [[1.6, 0.4], [-1.6, -0.4], [0.4, -1.6], [-0.4, 1.6], [3, 0.4], [-3, -0.4], [0.4, 3], [-0.4, -3]])
    g.add(cyl(0.015, 0.02, 0.55, C.ink, [x, 0.04, z], 6), ball(0.05, lampMat, [x, 0.62, z], 1));
  // Pagar rendah keliling.
  for (let i = 0; i < 4; i++) {
    const side = group("pagar");
    for (let k = 0; k < 18; k++) side.add(box(0.03, 0.18, 0.03, "#2b2f36", [-h + 0.25 + k * ((size - 0.5) / 17), 0.04, h - 0.1]));
    side.add(box(size - 0.4, 0.02, 0.02, "#2b2f36", [0, 0.18, h - 0.1]));
    side.rotation.y = (i * Math.PI) / 2;
    g.add(side);
  }
  return g;
}
