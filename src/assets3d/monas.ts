import * as THREE from "three";
import { C, ball, box, cone, cyl, group, mat, onUpdate, rng } from "./kit";
import { sparkles } from "./fx";
import { tree } from "./barat";

// Pusat papan: hanya Monas di taman. Demo dipindah ke depan gedung dewan (zona Timur).

export function monas() {
  const goldMat = mat(C.gold, {
    metalness: 0.78,
    roughness: 0.3,
    emissive: "#ffb000",
    emissiveIntensity: 0.45,
  });
  const marble = mat("#f4f1ea", { roughness: 0.5 });
  const flame = group("lidah-api-emas");
  for (let i = 0; i < 5; i++) {
    const f = cone(
      0.09 - i * 0.008,
      0.36 - i * 0.03,
      goldMat,
      [Math.sin(i * 2.4) * 0.03, 0, Math.cos(i * 2.4) * 0.03],
      6,
    );
    f.rotation.z = Math.sin(i * 1.7) * 0.25;
    flame.add(f);
  }
  flame.position.y = 4.12;
  const g = group(
    "monas",
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
    sparkles(3, 0.18, 0.3, 7),
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
  // Tangga dan relief berulang memberi skala pada museum di bawah cawan.
  for (let i = 0; i < 4; i++) {
    const facade = group("relief-dan-tangga");
    for (let step = 0; step < 3; step++) {
      facade.add(
        box(0.46, 0.04, 0.12, "#d9d3c4", [0, step * 0.04, 1.08 - step * 0.1]),
      );
    }
    for (const x of [-0.62, -0.44, 0.44, 0.62]) {
      facade.add(box(0.1, 0.17, 0.025, "#c4b69a", [x, 0.29, 0.81]));
    }
    facade.rotation.y = (i * Math.PI) / 2;
    g.add(facade);
  }
  const light = new THREE.PointLight("#dfb96d", 0.65, 3, 2);
  light.name = "utama-monas";
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
  const g = group("taman-monas", box(size, 0.04, size, "#7fa65a"));
  // Jalan setapak menyilang dan melingkar.
  g.add(
    box(size, 0.01, 0.5, "#d9cfb8", [0, 0.04, 0]),
    box(0.5, 0.01, size, "#d9cfb8", [0, 0.04, 0]),
  );
  const ringGeo = new THREE.RingGeometry(2.1, 2.55, 40);
  ringGeo.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, mat("#d9cfb8"));
  ring.position.y = 0.051;
  ring.receiveShadow = true;
  g.add(ring);
  // Empat kebun geometris: ruang kosong di tengah tetap menjaga siluet tugu.
  for (let q = 0; q < 4; q++) {
    const garden = group("kebun-formal");
    garden.rotation.y = (q * Math.PI) / 2;
    const outer = Math.min(3.25, h - 0.65);
    if (outer > 2.7) {
      garden.add(
        box(1.12, 0.065, 0.62, "#d9cfb8", [1.65, 0.04, outer]),
        box(1.02, 0.075, 0.52, "#526d3a", [1.65, 0.1, outer]),
      );
      for (let i = 0; i < 7; i++) {
        garden.add(
          ball(
            0.065,
            i % 2 ? "#e4b45b" : "#d68b76",
            [1.23 + i * 0.14, 0.2, outer],
            0,
          ),
        );
      }
      // Bangku menghadap pelataran; satu material kayu dan rangka gelap bersama.
      for (const x of [-0.2, 0.2])
        garden.add(box(0.045, 0.16, 0.21, C.ink, [x + outer, 0.05, 1.65]));
      garden.add(
        box(0.6, 0.055, 0.24, C.wood, [outer, 0.21, 1.65]),
        box(0.6, 0.16, 0.045, C.wood, [outer, 0.25, 1.76]),
      );
    }
    g.add(garden);
  }
  const m = monas();
  m.position.y = 0.05;
  g.add(m);
  // Pohon di tiap kuadran taman.
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < 4; i++) {
      const sx = q % 2 ? 1 : -1,
        sz = q < 2 ? 1 : -1;
      const t = tree(seed + q * 10 + i);
      t.position.set(sx * (2.9 + r() * 1.1), 0.04, sz * (2.9 + r() * 1.1));
      t.scale.setScalar(0.7 + r() * 0.3);
      g.add(t);
    }
  }
  // Lampu taman di sepanjang jalan.
  const lampMat = mat("#fff2c4", { emissive: "#ffd27a", emissiveIntensity: 2 });
  for (const [x, z] of [
    [1.6, 0.4],
    [-1.6, -0.4],
    [0.4, -1.6],
    [-0.4, 1.6],
    [3, 0.4],
    [-3, -0.4],
    [0.4, 3],
    [-0.4, -3],
  ])
    g.add(
      cyl(0.015, 0.02, 0.55, C.ink, [x, 0.04, z], 6),
      ball(0.05, lampMat, [x, 0.62, z], 1),
    );
  // Pagar rendah keliling.
  for (let i = 0; i < 4; i++) {
    const side = group("pagar");
    // Gerbang di sumbu jalan: pagar tidak lagi melintang menutup akses.
    for (const sign of [-1, 1]) {
      const span = h - 0.65;
      side.add(
        box(span, 0.02, 0.02, "#2b2f36", [
          sign * (0.45 + span / 2),
          0.18,
          h - 0.1,
        ]),
      );
      for (let k = 0; k < 9; k++)
        side.add(
          box(0.03, 0.18, 0.03, "#2b2f36", [
            sign * (0.45 + (k * span) / 8),
            0.04,
            h - 0.1,
          ]),
        );
      side.add(box(0.12, 0.28, 0.12, "#d9d3c4", [sign * 0.43, 0.04, h - 0.1]));
    }
    side.rotation.y = (i * Math.PI) / 2;
    g.add(side);
  }
  return g;
}
