import * as THREE from "three";
import { C, ball, box, cyl, cone, gableRoof, group, mat, onUpdate, rng, windows } from "./kit";
import { drift, rain } from "./fx";
import { person } from "./props";

// Zona Selatan: pantai dan permukiman terendam banjir bandang.

/** Rumah setengah tenggelam. Kadang ada warga mengungsi di atap. */
export function floodedHouse(seed = 1) {
  const r = rng(seed);
  const wall = [C.white, C.paper, "#e8c9a0", "#cfe0e8", "#e3d1e8"][Math.floor(r() * 5)];
  const roof = [C.roofRed, C.roofBlue, "#8a6a4f"][Math.floor(r() * 3)];
  const g = group("rumah-terendam",
    box(1.1, 0.8, 0.85, wall),
    box(1.14, 0.06, 0.89, "#9a8d7a", [0, 0, 0]), // lis bawah
    gableRoof(1.25, 0.45, 1.05, roof, [0, 0.8, 0]),
    box(1.27, 0.04, 0.06, "#5a3a22", [0, 1.23, 0]), // bubungan
    windows(1, 0.5, 1, 2, 0.43, 0.2, "#33424f"),
    box(0.22, 0.45, 0.03, C.woodDark, [-0.3, 0, 0.43]),
    box(0.05, 0.35, 0.05, C.concrete, [0.35, 1.0, -0.2]),
    box(0.16, 0.1, 0.08, "#dcdcdc", [0.6, 0.45, 0.1]), // unit AC
  );
  // Pagar yang mencuat dari air.
  for (let i = 0; i < 6; i++) g.add(box(0.03, 0.35, 0.03, C.wood, [-0.6 + i * 0.24, -0.1, 0.75]));
  g.add(box(1.3, 0.03, 0.02, C.wood, [0, 0.15, 0.75]));
  if (r() > 0.5) {
    const p = person(["#c8102e", "#f2c94c", "#2fa84f"][Math.floor(r() * 3)], seed);
    p.position.set(0.1, 1.05, 0.2);
    g.add(onUpdate(p, (t) => (p.rotation.z = Math.sin(t * 6 + seed) * 0.15)));
  }
  g.rotation.set((r() - 0.5) * 0.1, r() * Math.PI, (r() - 0.5) * 0.1);
  g.position.y = -0.4;
  return g;
}

export function log(len = 1.4, seed = 1) {
  const r = rng(seed);
  const bark = mat(C.wood, { roughness: 1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, len, 9, 3), bark);
  const p = trunk.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (0.92 + r() * 0.16));
  trunk.geometry.computeVertexNormals();
  trunk.rotation.z = Math.PI / 2;
  trunk.position.y = 0.1;
  trunk.castShadow = trunk.receiveShadow = true;
  const ringMat = mat("#c79a63");
  const ring = (x: number) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.085, 9), ringMat);
    m.position.set(x, 0.1, 0);
    m.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2;
    return m;
  };
  const g = group("kayu-gelondongan", trunk, ring(len / 2 + 0.001), ring(-len / 2 - 0.001));
  // Sisa cabang terpotong rapi: tanda ditebang, bukan tumbang.
  g.add(cyl(0.025, 0.03, 0.12, C.woodDark, [len * 0.2, 0.17, 0], 6, [0.6, 0, 0]));
  g.rotation.y = r() * Math.PI;
  return g;
}

export function logJam(seed = 3) {
  const r = rng(seed);
  const g = group("tumpukan-kayu");
  for (let i = 0; i < 9; i++) {
    const l = log(1 + r() * 0.9, seed + i);
    l.position.set((r() - 0.5) * 1.4, i * 0.06, (r() - 0.5) * 0.9);
    l.rotation.z = (r() - 0.5) * 0.25;
    g.add(l);
  }
  return g;
}

export function rubberBoat() {
  const tube = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 8, 16), mat(C.orange, { roughness: 0.5 }));
  tube.rotation.x = Math.PI / 2;
  tube.scale.set(1.5, 1, 1);
  tube.position.y = 0.09;
  tube.castShadow = true;
  const g = group("perahu-karet",
    tube,
    box(0.8, 0.03, 0.4, C.ink, [0, 0.02, 0]),
    box(0.2, 0.08, 0.14, C.ink, [-0.45, 0.06, 0]), // mesin tempel
    box(0.06, 0.1, 0.5, C.wood, [0.1, 0.06, 0]),
    cyl(0.07, 0.08, 0.22, C.orange, [-0.2, 0.05, 0]),
    ball(0.07, C.skin, [-0.2, 0.33, 0], 1),
    cyl(0.075, 0.08, 0.04, C.white, [-0.2, 0.38, 0], 8), // helm relawan
    cyl(0.06, 0.07, 0.18, "#2f5d9e", [0.25, 0.05, 0.05]), // warga diselamatkan
    ball(0.06, C.skinDark, [0.25, 0.28, 0.05], 1),
  );
  g.userData.baseY = 0; // ketinggian permukaan air; diatur oleh yang menaruh perahu
  return onUpdate(g, (t) => {
    g.position.y = g.userData.baseY + Math.sin(t * 1.6) * 0.03;
    g.rotation.z = Math.sin(t * 1.1) * 0.05;
  });
}

/**
 * Laut biru: ombak bergulung ke arah pantai (-z) dan buih di garis pantai.
 * shoreLocalZ(x): z lokal garis pantai (bagian laut di darat tertutup tanah pantai yang lebih tinggi).
 */
export function seaWaves(w = 36, d = 2.4, shoreLocalZ: (x: number) => number = () => -d / 2) {
  const geo = new THREE.PlaneGeometry(w, d, Math.ceil(w * 2.5), Math.ceil(d * 6));
  geo.rotateX(-Math.PI / 2);
  const base = Float32Array.from(geo.attributes.position.array);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  const shallow = new THREE.Color("#4fb3c9"), deep = new THREE.Color("#1f5f93"), c = new THREE.Color();
  for (let i = 0; i < geo.attributes.position.count; i++) {
    c.copy(shallow).lerp(deep, (base[i * 3 + 2] + d / 2) / d); // dangkal di tepi pantai
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const sea = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.94, flatShading: true }));
  sea.receiveShadow = true;
  const foamGeo = new THREE.PlaneGeometry(w, 0.22, Math.ceil(w * 2), 1);
  foamGeo.rotateX(-Math.PI / 2);
  const foamBase = Float32Array.from(foamGeo.attributes.position.array);
  const foam = new THREE.Mesh(foamGeo, new THREE.MeshBasicMaterial({ color: "#f2f4ef", transparent: true, opacity: 0.8, depthWrite: false }));
  const g = group("laut", sea, foam);
  return onUpdate(g, (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      // Gelombang bergerak ke pantai, lebih tinggi di laut dalam.
      p.setY(i, Math.sin(z * 3.2 + t * 2.4 + Math.sin(x * 0.4) * 0.8) * 0.035 * (0.4 + (z + d / 2) / d) + Math.sin(x * 1.3 - t) * 0.012);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    // Buih maju-mundur di garis pantai.
    const fp = foamGeo.attributes.position;
    const surge = Math.sin(t * 1.2) * 0.12;
    for (let i = 0; i < fp.count; i++) {
      const x = foamBase[i * 3];
      fp.setZ(i, foamBase[i * 3 + 2] + shoreLocalZ(x) + 0.12 + surge + Math.sin(x * 1.7 + t) * 0.05);
    }
    fp.needsUpdate = true;
    foam.position.y = 0.02;
    (foam.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 1.2) * 0.25;
  });
}

export function refugeeTent(color: string = C.roofBlue) {
  const t = cone(0.55, 0.6, color, [0, 0, 0], 4);
  t.rotation.y = Math.PI / 4;
  return group("tenda-pengungsian",
    t,
    box(0.2, 0.32, 0.02, C.ink, [0, 0, 0.38]),
    cyl(0.01, 0.01, 0.75, C.concrete, [0, 0, 0]),
    box(0.3, 0.12, 0.2, "#d8b98a", [0.55, 0, 0.2]), // kardus bantuan
  );
}

export function palm(seed = 1) {
  const r = rng(seed);
  const h = 1.3 + r() * 0.6;
  const g = group("pohon-kelapa");
  let x = 0;
  for (let i = 0; i < 6; i++) {
    x += 0.035 + i * 0.008;
    g.add(cyl(0.05 - i * 0.004, 0.06 - i * 0.004, h / 6, i % 2 ? C.wood : "#7a4f2e", [x, (i * h) / 6, 0], 7));
  }
  const top = group("daun");
  top.position.set(x, h, 0);
  for (let i = 0; i < 8; i++) {
    const leaf = box(0.75, 0.015, 0.18, i % 2 ? C.leaf : "#4f9a40", [0, 0, 0]);
    leaf.geometry.translate(0.37, 0, 0);
    leaf.rotation.set(0, (i / 8) * Math.PI * 2, -0.45 - r() * 0.2);
    top.add(leaf);
  }
  for (let i = 0; i < 3; i++) top.add(ball(0.06, "#6b4a2b", [Math.cos(i * 2) * 0.07, -0.06, Math.sin(i * 2) * 0.07]));
  g.add(top);
  g.rotation.y = r() * Math.PI * 2;
  return onUpdate(g, (t) => (top.rotation.z = Math.sin(t * 0.9 + seed) * 0.05));
}

/** Perahu nelayan bercadik, terdampar atau hanyut. */
export function fishingBoat(color: string = "#2f8fd0") {
  const s = new THREE.Shape();
  s.moveTo(-0.8, 0.15);
  s.quadraticCurveTo(-0.6, -0.05, 0, -0.08);
  s.quadraticCurveTo(0.6, -0.05, 0.85, 0.2);
  s.lineTo(-0.8, 0.15);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: false });
  geo.translate(0, 0.08, -0.14);
  const hull = new THREE.Mesh(geo, mat(color));
  hull.castShadow = true;
  return group("perahu-nelayan",
    hull,
    box(1.5, 0.03, 0.03, C.white, [0, 0.21, 0.141]),
    box(0.03, 0.03, 1.2, C.woodDark, [0.3, 0.18, 0]),
    box(0.03, 0.03, 1.2, C.woodDark, [-0.3, 0.18, 0]),
    box(1.2, 0.05, 0.05, C.wood, [0, 0.08, 0.6]), // cadik
    box(1.2, 0.05, 0.05, C.wood, [0, 0.08, -0.6]),
    cyl(0.015, 0.02, 0.8, C.wood, [0.1, 0.18, 0]),
  );
}

/** Air banjir keruh berombak halus dengan sedikit sampah hanyut. Hujan opsional. setLevel(0..1). */
export function floodWater(w = 4, d = 3, withRain = false) {
  const geo = new THREE.PlaneGeometry(w, d, Math.ceil(w * 3), Math.ceil(d * 3));
  geo.rotateX(-Math.PI / 2);
  const base = Float32Array.from(geo.attributes.position.array);
  // Biru seperti sungai: banjir ini luapan sungai. Permukaan halus memantul.
  // Kekasaran sedang: pantulan matahari yang terlalu tajam diperbesar efek glow jadi silau putih.
  const waterMat = new THREE.MeshStandardMaterial({ color: "#3d86b5", roughness: 0.32, metalness: 0.02, transparent: true, opacity: 0.9 });
  const water = new THREE.Mesh(geo, waterMat);
  water.receiveShadow = true;
  const g = group("air-banjir", water);
  const r = rng(21);
  const n = Math.round(w * d * 0.14);
  for (let i = 0; i < n; i++) {
    const kind = r();
    const o = kind < 0.25 ? box(0.14, 0.05, 0.1, ["#c4473a", "#3a7bd5", "#e2c044"][i % 3]) : kind < 0.4 ? cyl(0.04, 0.04, 0.14, "#9fb4bd", [0, 0, 0], 6, [0, 0, Math.PI / 2]) : log(0.6 + r() * 0.6, i + 40);
    o.position.set((r() - 0.5) * w * 0.85, 0.02, (r() - 0.5) * d * 0.8);
    water.add(drift(o, 0.4 + r() * 0.6, 0.06 + r() * 0.1, i));
  }
  if (withRain) g.add(rain(w, d, 5, Math.round(w * d * 6)));
  let level = 0.35;
  g.userData.setLevel = (v: number) => (level = v);
  // Buih di sekeliling benda yang tergenang; koordinat lokal terhadap pusat air.
  const foamMat = new THREE.MeshBasicMaterial({ color: "#e9e2d0", transparent: true, opacity: 0.45, depthWrite: false });
  const foams: THREE.Mesh[] = [];
  g.userData.addFoam = (x: number, z: number, radius: number) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.12, 20), foamMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.05, z);
    ring.userData.ph = foams.length;
    foams.push(ring);
    water.add(ring);
  };
  return onUpdate(g, (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      p.setY(i, Math.sin(x * 1.8 + t * 0.9) * 0.018 + Math.cos(z * 2.6 + t * 0.7) * 0.012); // riak pelan, bukan ombak
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    water.position.y += (level * 0.6 - water.position.y) * 0.05;
    for (const f of foams) f.scale.setScalar(1 + Math.sin(t * 2 + f.userData.ph) * 0.06);
  });
}

export function sandbags() {
  const g = group("karung-pasir");
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 4 - row; i++) {
      const b = ball(0.13, C.sand, [i * 0.28 + row * 0.14 - 0.42, 0.06 + row * 0.11, 0], 1);
      b.scale.set(1.1, 0.5, 0.75);
      g.add(b);
    }
  return g;
}
