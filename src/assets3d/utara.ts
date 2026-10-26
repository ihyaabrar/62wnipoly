import * as THREE from "three";
import { C, ball, box, cone, cyl, gableRoof, group, mat, onUpdate, rng, textTexture, texturedPlane } from "./kit";
import { embers, lightning, smoke } from "./fx";
import { tree } from "./barat";

// Zona Utara: gunung meletus, hujan abu, rumah roboh, jalur evakuasi.

export function volcano(seed = 7, H = 3.2) {
  const r = rng(seed);
  const geo = new THREE.CylinderGeometry(0.55, 3, H, 18, 8, true);
  const p = geo.attributes.position;
  const colors: number[] = [];
  const cTop = new THREE.Color("#3a302b"), cMid = new THREE.Color(C.rock), cBase = new THREE.Color("#5f6b3c");
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = (y + H / 2) / H; // 0 kaki, 1 puncak
    if (k > 0.02 && k < 0.98) {
      const n = 0.88 + r() * 0.24;
      p.setX(i, p.getX(i) * n);
      p.setZ(i, p.getZ(i) * n);
      p.setY(i, y + (r() - 0.5) * 0.08);
    }
    // Warna: hijau di kaki, batu di tengah, gelap hangus di puncak.
    const c = k < 0.3 ? cBase.clone().lerp(cMid, k / 0.3) : cMid.clone().lerp(cTop, (k - 0.3) / 0.7);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.translate(0, H / 2, 0);
  geo.computeVertexNormals();
  const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  body.castShadow = body.receiveShadow = true;
  const lavaMat = mat(C.lava, { emissive: "#ff4a10", emissiveIntensity: 3 });
  const g = group("gunung-meletus", body, cyl(0.5, 0.5, 0.06, lavaMat, [0, H - 0.08, 0], 14));
  // Alur lava menempel di lereng: titik permukaan dicari dengan raycast ke arah sumbu gunung.
  body.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const flowMat = new THREE.MeshStandardMaterial({ color: C.lava, emissive: "#ff4a10", emissiveIntensity: 2.6, roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * Math.PI * 2 + r() * 0.6;
    const reach = 0.45 + r() * 0.4; // seberapa jauh turun (0..1 dari puncak ke kaki)
    const pos: number[] = [];
    const idx: number[] = [];
    const steps = 22;
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * reach;
      const y = H * (0.985 - t);
      const a = a0 + Math.sin(t * 9 + i) * 0.12; // berkelok
      const dir = new THREE.Vector3(-Math.cos(a), 0, -Math.sin(a));
      ray.set(new THREE.Vector3(Math.cos(a) * 6, y, Math.sin(a) * 6), dir);
      const hit = ray.intersectObject(body)[0];
      if (!hit) break;
      const n = hit.face!.normal.clone();
      const p = hit.point.clone().addScaledVector(n, 0.03);
      const side = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(0.16 * (1 - t * 0.7)); // menyempit ke bawah
      pos.push(p.x + side.x, p.y, p.z + side.z, p.x - side.x, p.y, p.z - side.z);
      if (s > 0) {
        const k = (s - 1) * 2;
        idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
    }
    if (pos.length < 12) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, flowMat));
  }
  // Hutan di kaki gunung, bebatuan hangus.
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2;
    const d = 2.8 + r() * 0.6;
    const t = tree(seed + i);
    t.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    t.scale.setScalar(0.8 + r() * 0.5);
    g.add(t);
  }
  for (let i = 0; i < 6; i++) {
    const a = r() * Math.PI * 2;
    g.add(cone(0.25 + r() * 0.3, 0.5 + r() * 0.6, C.rockDark, [Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6], 5));
  }
  const glow = new THREE.PointLight("#ff6a2a", 30, 9, 1.6);
  glow.position.set(0, H + 0.4, 0);
  g.add(glow);
  // Kolom erupsi: asap gelap tebal, abu terang di atas, petir, bara.
  const plume = smoke({ count: 34, color: "#2e2a27", colorEnd: "#9a948c", size: [0.8, 3.4], rise: 6, spread: 1.6, drift: [0.35, 0.15], speed: 0.07, opacity: 0.92, seed });
  plume.position.y = H - 0.1;
  const sparks = embers(60, 2.4, 0.4, seed);
  sparks.position.y = H - 0.1;
  const bolt = lightning(3, seed);
  bolt.position.set(1.2, H + 2.8, 0.3);
  g.add(plume, sparks, bolt);
  // Batu pijar terlempar.
  const bombs = Array.from({ length: 6 }, (_, i) => {
    const b = ball(0.07, lavaMat, [0, 0, 0]);
    b.userData = { a: (i / 6) * Math.PI * 2 + r(), v: 2.2 + r(), ph: r() };
    g.add(b);
    return b;
  });
  let activity = 1;
  g.userData.setActivity = (v: number) => {
    activity = v;
    plume.userData.setIntensity?.(v);
  };
  return onUpdate(g, (t) => {
    glow.intensity = (20 + Math.sin(t * 7) * 6 + Math.sin(t * 13) * 3) * activity;
    for (const b of bombs) {
      const k = (t * 0.45 + b.userData.ph) % 1;
      const d = k * b.userData.v;
      b.position.set(Math.cos(b.userData.a) * d, H - 0.05 + k * 3 - k * k * 3.6, Math.sin(b.userData.a) * d);
      b.visible = activity > 0.3;
    }
  });
}

export function ashFall(w = 4, d = 3, count = 400, h = 4) {
  const pos = new Float32Array(count * 3);
  const r = rng(11);
  for (let i = 0; i < count; i++) pos.set([(r() - 0.5) * w, r() * h, (r() - 0.5) * d], i * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: "#b9b3aa", size: 0.06, transparent: true, opacity: 0.85, depthWrite: false }));
  const g = group("hujan-abu", pts);
  return onUpdate(g, (t, dt) => {
    const a = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      let y = a.getY(i) - dt * 0.45;
      if (y < 0) y = h;
      a.setY(i, y);
      a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.05);
    }
    a.needsUpdate = true;
  });
}

const ashMat = () => mat("#a8a29a", { roughness: 1 });

export function collapsedHouse(seed = 2) {
  const r = rng(seed);
  const g = group("rumah-roboh",
    box(1.1, 0.55, 0.08, C.paper, [0, 0, -0.4], [-0.3, 0, 0]),
    box(0.08, 0.4, 0.8, C.paper, [-0.5, 0, 0], [0, 0, 0.45]),
    box(0.08, 0.65, 0.8, C.paper, [0.5, 0, 0]),
    gableRoof(1.2, 0.38, 1.05, "#7d7a75", [0.05, 0.05, 0.1], [0.15, 0.2, 0.5]), // atap tertutup abu
    box(1.4, 0.06, 1.1, ashMat()),
  );
  for (let i = 0; i < 9; i++) g.add(box(0.1 + r() * 0.1, 0.05 + r() * 0.05, 0.08, i % 2 ? C.concrete : C.roofRed, [(r() - 0.5) * 1.2, 0.05, (r() - 0.5) * 0.9], [r(), r() * 3, r()]));
  return g;
}

/** Rumah yang masih berdiri tapi atapnya tertimbun abu tebal. */
export function ashedHouse(seed = 3) {
  const r = rng(seed);
  const g = group("rumah-tertimbun-abu",
    box(1, 0.7, 0.8, [C.paper, "#e8c9a0", "#cfe0e8"][Math.floor(r() * 3)]),
    gableRoof(1.12, 0.42, 0.98, "#8f8a83", [0, 0.7, 0]),
    box(0.22, 0.42, 0.03, C.woodDark, [-0.25, 0, 0.41]),
    box(0.26, 0.2, 0.03, "#33424f", [0.22, 0.32, 0.41]),
    box(1.3, 0.05, 1.1, ashMat()),
  );
  g.rotation.y = r() * Math.PI;
  return g;
}

export function evacSign(text = ["JALUR", "EVAKUASI →"]) {
  const tex = textTexture(text, { bg: "#1f8a4c", fg: C.white, w: 256, h: 160, border: C.white });
  return group("rambu-evakuasi",
    cyl(0.025, 0.025, 1, C.concrete),
    texturedPlane(0.55, 0.34, tex, [0, 0.9, 0.03]),
  );
}

/** Pos pantau gunung dengan sirene. */
export function observationPost() {
  const sirenMat = mat("#ff2a2a", { emissive: "#ff2a2a", emissiveIntensity: 2 });
  const siren = cyl(0.08, 0.08, 0.1, sirenMat, [0, 1.95, 0], 10);
  const tex = textTexture(["POS PANTAU", "STATUS: AWAS"], { bg: C.white, fg: C.red, w: 256, h: 128, border: C.red });
  const g = group("pos-pantau",
    ...[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(([x, z]) => box(0.05, 1.3, 0.05, C.woodDark, [x, 0, z])),
    box(0.8, 0.06, 0.8, C.wood, [0, 1.3, 0]),
    box(0.7, 0.45, 0.7, "#e6e0d2", [0, 1.36, 0]),
    gableRoof(0.85, 0.25, 0.85, C.roofRed, [0, 1.81, 0]),
    texturedPlane(0.5, 0.25, tex, [0, 1.58, 0.36]),
    siren,
  );
  return onUpdate(g, (t) => (sirenMat.emissiveIntensity = Math.sin(t * 8) > 0 ? 3 : 0.2));
}

export function rocks(seed = 5) {
  const r = rng(seed);
  const g = group("bebatuan");
  for (let i = 0; i < 6; i++) g.add(ball(0.08 + r() * 0.16, r() > 0.5 ? C.rock : C.rockDark, [(r() - 0.5) * 0.9, 0.05, (r() - 0.5) * 0.9]));
  return g;
}
