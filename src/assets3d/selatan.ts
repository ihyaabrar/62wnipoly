import * as THREE from "three";
import {
  C,
  ball,
  box,
  cyl,
  cone,
  gableRoof,
  group,
  mat,
  onUpdate,
  rng,
  windows,
} from "./kit";
import { drift, rain } from "./fx";
import { person } from "./props";
import { kampungHouse, reliefTent } from "./village";
import { tropicalPalm } from "./vegetation";
import { citizen } from "./characters";

// Zona Selatan: pantai dan permukiman terendam banjir bandang.

/** Rumah setengah tenggelam. Kadang ada warga mengungsi di atap. */
export function floodedHouse(seed = 1) {
  const g = kampungHouse(seed, "banjir");
  g.name = "rumah-terendam";
  if (seed % 2) {
    const p = citizen(C.roofBlue, seed);
    p.scale.setScalar(0.7);
    p.position.set(0.12, 1.09, 0);
    g.add(p);
  }
  g.rotation.y = rng(seed)() * Math.PI;
  return g;
}

export function log(len = 1.4, seed = 1) {
  const r = rng(seed);
  const bark = mat(C.wood, { roughness: 1 });
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, len, 9, 3),
    bark,
  );
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
  const g = group(
    "kayu-gelondongan",
    trunk,
    ring(len / 2 + 0.001),
    ring(-len / 2 - 0.001),
  );
  // Sisa cabang terpotong rapi: tanda ditebang, bukan tumbang.
  g.add(
    cyl(0.025, 0.03, 0.12, C.woodDark, [len * 0.2, 0.17, 0], 6, [0.6, 0, 0]),
  );
  g.rotation.y = r() * Math.PI;
  return g;
}

export function logJam(seed = 3) {
  const r = rng(seed);
  const g = group("tumpukan-kayu");
  for (let i = 0; i < 9; i++) {
    const l = log(1 + r() * 0.9, seed + i);
    l.position.set(
      ((i % 3) - 1) * 0.36,
      Math.floor(i / 3) * 0.18,
      (r() - 0.5) * 0.3,
    );
    l.rotation.z = (r() - 0.5) * 0.06;
    g.add(l);
  }
  return g;
}

export function rubberBoat() {
  const tube = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.09, 8, 16),
    mat(C.orange, { roughness: 0.5 }),
  );
  tube.rotation.x = Math.PI / 2;
  tube.scale.set(1.5, 1, 1);
  tube.position.y = 0.09;
  tube.castShadow = true;
  const g = group(
    "perahu-karet",
    tube,
    box(0.8, 0.03, 0.4, C.ink, [0, 0.02, 0]),
    box(0.2, 0.08, 0.14, C.ink, [-0.45, 0.06, 0]), // mesin tempel
    box(0.06, 0.1, 0.5, C.wood, [0.1, 0.06, 0]),
  );
  const crew = citizen(C.orange, 1, "relawan", true);
  crew.scale.setScalar(0.72);
  crew.position.set(-0.2, 0.06, 0);
  crew.rotation.y = -Math.PI / 2;
  const passenger = citizen(C.navy, 2, "warga", true);
  passenger.scale.setScalar(0.72);
  passenger.position.set(0.24, 0.06, 0);
  g.add(crew, passenger);
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
export function seaWaves(
  w = 36,
  d = 2.4,
  shoreLocalZ: (x: number) => number = () => -d / 2,
) {
  const geo = new THREE.PlaneGeometry(
    w,
    d,
    Math.ceil(w * 2.5),
    Math.ceil(d * 6),
  );
  geo.rotateX(-Math.PI / 2);
  const base = Float32Array.from(geo.attributes.position.array);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  const shallow = new THREE.Color(C.water),
    deep = new THREE.Color(C.waterDeep),
    c = new THREE.Color();
  for (let i = 0; i < geo.attributes.position.count; i++) {
    c.copy(shallow).lerp(deep, (base[i * 3 + 2] + d / 2) / d); // dangkal di tepi pantai
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const sea = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.58,
      metalness: 0.02,
      transparent: true,
      opacity: 0.94,
      flatShading: true,
    }),
  );
  sea.receiveShadow = true;
  const foamGeo = new THREE.PlaneGeometry(w, 0.22, Math.ceil(w * 2), 1);
  foamGeo.rotateX(-Math.PI / 2);
  const foamBase = Float32Array.from(foamGeo.attributes.position.array);
  const foam = new THREE.Mesh(
    foamGeo,
    new THREE.MeshBasicMaterial({
      color: "#f2f4ef",
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    }),
  );
  const g = group("laut", sea, foam);
  return onUpdate(g, (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3],
        z = base[i * 3 + 2];
      // Gelombang bergerak ke pantai, lebih tinggi di laut dalam.
      p.setY(
        i,
        Math.sin(z * 3.2 + t * 2.4 + Math.sin(x * 0.4) * 0.8) *
          0.035 *
          (0.4 + (z + d / 2) / d) +
          Math.sin(x * 1.3 - t) * 0.012,
      );
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    // Buih maju-mundur di garis pantai.
    const fp = foamGeo.attributes.position;
    const surge = Math.sin(t * 1.2) * 0.12;
    for (let i = 0; i < fp.count; i++) {
      const x = foamBase[i * 3];
      fp.setZ(
        i,
        foamBase[i * 3 + 2] +
          shoreLocalZ(x) +
          0.12 +
          surge +
          Math.sin(x * 1.7 + t) * 0.05,
      );
    }
    fp.needsUpdate = true;
    foam.position.y = 0.02;
    (foam.material as THREE.MeshBasicMaterial).opacity =
      0.26 + Math.sin(t * 1.2) * 0.1;
  });
}

export function refugeeTent(color: string = C.roofBlue) {
  return reliefTent(color);
}

export function palm(seed = 1) {
  return tropicalPalm(seed);
}

/** Perahu nelayan bercadik, terdampar atau hanyut. */
export function fishingBoat(color: string = C.roofBlue) {
  const s = new THREE.Shape();
  s.moveTo(-0.8, 0.15);
  s.quadraticCurveTo(-0.6, -0.05, 0, -0.08);
  s.quadraticCurveTo(0.6, -0.05, 0.85, 0.2);
  s.lineTo(-0.8, 0.15);
  // The inner contour cuts the hull open instead of leaving a solid triangular slab.
  const hole = new THREE.Path();
  hole.moveTo(-0.61, 0.14);
  hole.quadraticCurveTo(0, -0.015, 0.65, 0.17);
  hole.lineTo(-0.61, 0.14);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.28,
    bevelEnabled: false,
  });
  geo.translate(0, 0.08, -0.14);
  const hull = new THREE.Mesh(geo, mat(color));
  hull.castShadow = true;
  return group(
    "perahu-nelayan",
    hull,
    box(0.08, 0.035, 0.26, C.wood, [-0.3, 0.15, 0]),
    box(0.08, 0.035, 0.26, C.wood, [0.3, 0.15, 0]),
    box(0.13, 0.12, 0.13, C.ink, [-0.72, 0.08, 0]),
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
  const waterMat = new THREE.MeshStandardMaterial({
    color: "#608c9c",
    roughness: 0.6,
    metalness: 0.02,
    transparent: true,
    opacity: 0.9,
  });
  const water = new THREE.Mesh(geo, waterMat);
  water.receiveShadow = true;
  const g = group("air-banjir", water);
  const r = rng(21);
  const n = Math.round(w * d * 0.14);
  for (let i = 0; i < n; i++) {
    const kind = r();
    const o =
      kind < 0.25
        ? box(0.14, 0.05, 0.1, ["#c4473a", "#3a7bd5", "#e2c044"][i % 3])
        : kind < 0.4
          ? cyl(0.04, 0.04, 0.14, "#9fb4bd", [0, 0, 0], 6, [0, 0, Math.PI / 2])
          : log(0.6 + r() * 0.6, i + 40);
    o.position.set((r() - 0.5) * w * 0.85, 0.02, (r() - 0.5) * d * 0.8);
    water.add(drift(o, 0.4 + r() * 0.6, 0.06 + r() * 0.1, i));
  }
  if (withRain) g.add(rain(w, d, 5, Math.round(w * d * 6)));
  let level = 0.35;
  g.userData.setLevel = (v: number) => {
    level = THREE.MathUtils.clamp(v, 0, 1);
    water.position.y = level * 0.6;
  };
  // Buih di sekeliling benda yang tergenang; koordinat lokal terhadap pusat air.
  const foamMat = new THREE.MeshBasicMaterial({
    color: "#e9e2d0",
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const foams: THREE.Mesh[] = [];
  g.userData.addFoam = (x: number, z: number, radius: number) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius, radius + 0.12, 20),
      foamMat,
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.05, z);
    ring.userData.ph = foams.length;
    foams.push(ring);
    water.add(ring);
  };
  return onUpdate(g, (t, dt) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3],
        z = base[i * 3 + 2];
      p.setY(
        i,
        Math.sin(x * 1.8 + t * 0.9) * 0.018 +
          Math.cos(z * 2.6 + t * 0.7) * 0.012,
      ); // riak pelan, bukan ombak
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    water.position.y +=
      (level * 0.6 - water.position.y) * (1 - Math.exp(-3 * Math.min(0.1, dt)));
    for (const f of foams)
      f.scale.setScalar(1 + Math.sin(t * 2 + f.userData.ph) * 0.06);
  });
}

export function sandbags() {
  const g = group("karung-pasir");
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 4 - row; i++) {
      const bag = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 8, 5),
        mat(C.sand),
      );
      bag.scale.set(1.12, 0.55, 0.8);
      bag.position.set(i * 0.26 + row * 0.13 - 0.4, 0.07 + row * 0.13, 0);
      bag.castShadow = true;
      g.add(bag);
      g.add(
        box(0.17, 0.009, 0.012, C.wood, [
          bag.position.x,
          bag.position.y + 0.058,
          0.05,
        ]),
      );
    }
  return g;
}
