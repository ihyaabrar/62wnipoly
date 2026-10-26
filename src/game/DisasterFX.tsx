"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Zone } from "@/engine/data";
import { ashFall } from "@/assets3d/utara";
import { emitter, smoke } from "@/assets3d/fx";
import { box, cyl, tickAll } from "@/assets3d/kit";
import { car } from "@/assets3d/props";
import { AVENUE_Z } from "@/assets3d/routes";
import { sfx } from "./sfx";

// Sinematik bencana di dunia 3D. Satu "cinematic" bisa memuat beberapa zona sekaligus
// (akhir ronde bisa memicu 2-4 bencana). Panjang tiap sinematik ~5,5 detik.

export type Cinematic = { key: number; zones: Zone[] };
export const CINEMATIC_SECONDS = 5.5;

const WORLD = 18.5;
const FLOOD_LOW = -1.0; // tersembunyi di bawah tanah
const FLOOD_HIGH = -0.06; // tepat di bawah bingkai papan: papan tersisa seperti pulau

const ease = (x: number) => x * x * (3 - 2 * x);

/** Bidang air raksasa yang naik merendam dunia, ditahan, lalu surut. */
function makeFlood() {
  const geo = new THREE.PlaneGeometry(WORLD * 2, WORLD * 2, 60, 60);
  geo.rotateX(-Math.PI / 2);
  const base = Float32Array.from(geo.attributes.position.array);
  const mat = new THREE.MeshStandardMaterial({ color: "#4a7f9e", roughness: 0.3, metalness: 0.05, transparent: true, opacity: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.visible = false;
  // Lubang di tengah tidak perlu: air berhenti di bawah bingkai papan, papan tetap kering.
  const wave = (t: number) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      p.setY(i, Math.sin(x * 0.9 + t * 2.2) * 0.05 + Math.cos(z * 1.1 + t * 1.7) * 0.04);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  };
  return { mesh, wave };
}

type Hooks = { volcano?: THREE.Object3D; haze?: THREE.Object3D; board?: THREE.Object3D };

const LAVA_BLOBS = 46;
const BOMBS = 26;
const lavaHot = new THREE.Color("#ff6a1f"), lavaCold = new THREE.Color("#3a2c25");

/** Tinggi permukaan teratas (papan, rumput, atap) di titik x,z: lahar dan batu mendarat di situ. */
function surfaceY(board: THREE.Object3D | undefined, x: number, z: number) {
  if (!board) return 0.15;
  const ray = new THREE.Raycaster(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0));
  const hit = ray.intersectObject(board, true).find((h) => (h.object as THREE.Mesh).isMesh && (h.object as THREE.Mesh).visible);
  return hit ? hit.point.y : 0.15;
}

/** Lidah lahar dari kaki gunung, menyeberangi rel dan papan, sampai ke lapangan Monas. */
function makeLava() {
  const mat = new THREE.MeshStandardMaterial({ color: lavaHot.clone(), emissive: "#ff2200", emissiveIntensity: 1.7, roughness: 0.55 });
  const geo = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const g = new THREE.Group();
  g.name = "lahar";
  const rnd = (i: number) => (Math.sin(i * 91.7) * 43758.5) % 1;
  for (let i = 0; i < LAVA_BLOBS; i++) {
    const t = i / (LAVA_BLOBS - 1);
    const m = new THREE.Mesh(geo, mat);
    m.userData = { t, x: 0.4 + Math.sin(t * 5.5) * 0.9 - t * 0.9 + rnd(i) * 0.3, z: -9.9 + t * 7.6, r: 0.45 + Math.abs(rnd(i + 7)) * 0.45 + (1 - t) * 0.25 };
    m.scale.setScalar(0.001);
    g.add(m);
  }
  g.visible = false;
  return { g, mat };
}

// Konvoi keluar dari gedung dewan lewat jalan utama timur, menuju lapangan Monas.
const CONVOY_Z = AVENUE_Z;
const CONVOY_FROM = 11.6, CONVOY_TO = 2.4, CONVOY_GAP = 1.25;

/** Konvoi kerusuhan: mobil polisi bersirene mengawal mobil pejabat masuk ke lapangan Monas. */
function makeConvoy() {
  const g = new THREE.Group();
  g.name = "konvoi-pejabat";
  const lights: THREE.MeshStandardMaterial[] = [];
  const police = () => {
    const c = car("#e9ecef");
    const red = new THREE.MeshStandardMaterial({ color: "#ff2a2a", emissive: "#ff2a2a", emissiveIntensity: 3 });
    const blue = new THREE.MeshStandardMaterial({ color: "#2a6bff", emissive: "#2a6bff", emissiveIntensity: 3 });
    lights.push(red, blue);
    c.add(box(0.05, 0.04, 0.1, red, [-0.04, 0.35, 0.06]), box(0.05, 0.04, 0.1, blue, [-0.04, 0.35, -0.06]), box(0.6, 0.03, 0.302, "#1f3a8a", [0, 0.1, 0]));
    return c;
  };
  const vip = car("#111317", true);
  vip.add(cyl(0.006, 0.006, 0.18, "#c9c9c9", [0.28, 0.14, 0.13], 4), box(0.002, 0.05, 0.08, "#c8102e", [0.28, 0.29, 0.17]), box(0.002, 0.05, 0.08, "#ffffff", [0.28, 0.24, 0.17]));
  for (const c of [police(), vip, police()]) {
    c.scale.setScalar(1.7);
    g.add(c);
  }
  g.visible = false;
  return { g, lights };
}

/** Bom vulkanik: batu pijar dilempar dari kawah dengan lintasan parabola. */
function makeBombs() {
  const mat = new THREE.MeshStandardMaterial({ color: lavaHot.clone(), emissive: "#ff4a10", emissiveIntensity: 3, roughness: 0.8, flatShading: true });
  const geo = new THREE.IcosahedronGeometry(0.17, 0);
  const g = new THREE.Group();
  g.name = "bom-vulkanik";
  for (let i = 0; i < BOMBS; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const r1 = a - Math.floor(a), r2 = (a * 7.13) % 1, r3 = (a * 3.71) % 1;
    // Dua pertiga jatuh di papan dan lapangan, sisanya di lereng antara gunung dan papan.
    const onBoard = i % 3 !== 2;
    const tx = onBoard ? (r1 - 0.5) * 12 : (r1 - 0.5) * 9;
    const tz = onBoard ? -6 + Math.abs(r2) * 10 : -10 + Math.abs(r2) * 3.5;
    m.userData = { launch: 0.5 + i * 0.1, dur: 1.3 + Math.abs(r3) * 0.7, target: new THREE.Vector3(tx, 0, tz), spin: new THREE.Vector3(r1, r2, r3).multiplyScalar(14), landed: false };
    m.scale.setScalar(0.7 + Math.abs(r3) * 0.8);
    m.visible = false;
    g.add(m);
  }
  return { g, mat };
}

export function DisasterFX({ cinematic, hooks, crisis }: { cinematic: Cinematic | null; hooks: Hooks; crisis: number }) {
  const flood = useMemo(makeFlood, []);
  // Abu dan asap tambahan yang menutupi seluruh peta saat erupsi / karhutla.
  const ash = useMemo(() => {
    const a = ashFall(WORLD * 2, WORLD * 2, 1600, 9);
    a.visible = false;
    return a;
  }, []);
  const burst = useMemo(() => {
    const b = smoke({ count: 40, color: "#1e1a18", colorEnd: "#6f6862", size: [1.5, 7], rise: 11, spread: 3.5, drift: [0.6, 0.3], speed: 0.16, opacity: 0.95, seed: 77 });
    b.visible = false;
    return b;
  }, []);
  const smog = useMemo(() => {
    const s = emitter("asap-global", { count: 40, color: "#8a7560", colorEnd: "#b09a7d", size: [5, 9], rise: 2, spread: 14, drift: [0.4, 0.1], speed: 0.05, opacity: 0.32, seed: 9 });
    s.visible = false;
    return s;
  }, []);
  const flash = useMemo(() => new THREE.PointLight("#ff5a1f", 0, 40, 1.4), []);
  const lava = useMemo(makeLava, []);
  const bombs = useMemo(makeBombs, []);
  const convoy = useMemo(makeConvoy, []);  // Profil tinggi jalan konvoi: jalan raya di luar, naik ke bingkai papan, turun ke lapangan.
  const road = useRef<{ out: number; lawn: number } | null>(null);
  const run = useRef<{ t: number; zones: Set<Zone> } | null>(null);

  useEffect(() => {
    if (!cinematic) return;
    run.current = { t: 0, zones: new Set(cinematic.zones) };
    if (cinematic.zones.includes("timur") && !road.current) road.current = { out: surfaceY(hooks.board, 11, CONVOY_Z), lawn: surfaceY(hooks.board, 3.4, CONVOY_Z - 1.6) };
    if (!cinematic.zones.includes("utara")) return;
    // Tinggi pendaratan dihitung sekali (raycast ke papan), lalu dipakai ulang tiap letusan.
    if (!lava.g.userData.placed) {
      lava.g.userData.placed = true;
      for (const m of lava.g.children) {
        const u = m.userData;
        m.position.set(u.x, surfaceY(hooks.board, u.x, u.z) - 0.02, u.z);
      }
      for (const m of bombs.g.children) {
        const tg = m.userData.target as THREE.Vector3;
        tg.y = surfaceY(hooks.board, tg.x, tg.z) + 0.08;
      }
    }
    for (const m of bombs.g.children) (m.userData.landed = false), (m.visible = false);
    for (const m of lava.g.children) m.scale.setScalar(0.001);
  }, [cinematic, hooks.board, lava, bombs]);

  useFrame((st, dt) => {
    const r = run.current;
    const time = st.clock.elapsedTime;
    if (!r) return;
    r.t += dt;
    const t = r.t;
    const k = t < 1.8 ? ease(t / 1.8) : t < CINEMATIC_SECONDS - 1.8 ? 1 : ease(Math.max(0, (CINEMATIC_SECONDS - t) / 1.8));
    const done = t >= CINEMATIC_SECONDS;

    // Banjir: air meluap dari laut dan sungai, merendam semua kecuali papan.
    flood.mesh.visible = r.zones.has("selatan") && !done;
    if (flood.mesh.visible) {
      flood.mesh.position.y = FLOOD_LOW + (FLOOD_HIGH - FLOOD_LOW) * k;
      flood.wave(time);
    }

    // Erupsi: letusan besar, batu pijar, kilatan merah, abu menutupi peta.
    const erupt = r.zones.has("utara") && !done;
    burst.visible = erupt;
    ash.visible = erupt || (r.zones.has("barat") && !done);
    flash.intensity = erupt ? (120 + Math.sin(time * 18) * 40) * k : 0;
    hooks.volcano?.userData.setActivity?.(erupt ? 1 + 3 * k : 0.5 + Math.min(1, (crisis - 1) / 8));

    // Lahar merambat turun lalu mendingin jadi batu gelap; bom vulkanik jatuh ke papan.
    lava.g.visible = erupt;
    bombs.g.visible = erupt;
    if (erupt) {
      const cool = Math.max(0, Math.min(1, (t - (CINEMATIC_SECONDS - 1.6)) / 1.4));
      const front = Math.min(1, Math.max(0, (t - 0.7) / 3));
      for (const m of lava.g.children) {
        const u = m.userData;
        const grow = Math.min(1, Math.max(0, (front - u.t) * 6));
        const r = u.r * grow * (1 - cool * 0.35);
        m.scale.set(r * (1 + Math.sin(time * 3 + u.t * 20) * 0.04), 0.14 * grow + 0.001, r);
      }
      lava.mat.emissiveIntensity = (1.7 + Math.sin(time * 6) * 0.25) * (1 - cool);
      lava.mat.color.lerpColors(lavaHot, lavaCold, cool);
      bombs.mat.emissiveIntensity = 3 * (1 - cool);
      bombs.mat.color.lerpColors(lavaHot, lavaCold, cool);
      const crater = burst.position;
      for (const m of bombs.g.children) {
        const u = m.userData;
        const p = (t - u.launch) / u.dur;
        if (p < 0) continue;
        m.visible = true;
        if (p < 1) {
          m.position.lerpVectors(crater, u.target, p);
          m.position.y += Math.sin(p * Math.PI) * 6.5 - 1.2 * p;
          m.rotation.x += u.spin.x * dt;
          m.rotation.z += u.spin.z * dt;
        } else if (!u.landed) {
          u.landed = true;
          m.position.copy(u.target);
          sfx.thud(0.6 + Math.random() * 0.4);
        }
      }
    }

    // Kerusuhan: konvoi polisi menggiring mobil pejabat ke lapangan, lampu sirene berkedip.
    const riot = r.zones.has("timur") && !done;
    convoy.g.visible = riot;
    if (riot && road.current) {
      const lead = CONVOY_TO + (CONVOY_FROM - CONVOY_TO) * Math.pow(1 - Math.min(1, t / 3.8), 2);
      convoy.g.children.forEach((c, i) => {
        const x = lead + i * CONVOY_GAP;
        // Di atas petak (bingkai papan) mobil sedikit lebih tinggi daripada jalan dan lapangan.
        const onTiles = x > 5.1 && x < 7.1 ? 0.13 : x >= 7.1 ? road.current!.out + (0.13 - road.current!.out) * Math.max(0, 1 - (x - 7.1) / 1.2) : road.current!.lawn;
        c.position.set(x, onTiles + Math.abs(Math.sin(time * 14 + i)) * 0.015, CONVOY_Z);
        c.rotation.y = Math.PI; // moncong menghadap barat (ke Monas)
      });
      const on = Math.sin(time * 16) > 0;
      convoy.lights.forEach((m, i) => (m.emissiveIntensity = (i % 2 === 0) === on ? 4 : 0.2));
    }

    // Karhutla: asap pekat menyebar ke seluruh peta.
    const fire = r.zones.has("barat") && !done;
    smog.visible = fire;
    hooks.haze?.userData.setDensity?.(fire ? 0.6 + 1.4 * k : 0.3 + Math.min(1, (crisis - 1) / 8) * 0.7);

    if (burst.visible || ash.visible || smog.visible) {
      tickAll(burst, time, dt);
      tickAll(ash, time, dt);
      tickAll(smog, time, dt);
    }
    if (done) run.current = null;
  });

  useEffect(() => {
    // Posisi efek mengikuti gunung (letusan) dan menutupi peta (abu, asap).
    const v = hooks.volcano;
    if (v) {
      const top = new THREE.Vector3(0, 0, 0);
      v.getWorldPosition(top);
      burst.position.set(top.x, top.y + 5.2, top.z);
      flash.position.set(top.x, top.y + 6.5, top.z);
    }
    smog.position.set(0, 0.3, 0);
  }, [hooks.volcano, burst, flash, smog]);

  return (
    <>
      <primitive object={flood.mesh} />
      <primitive object={ash} />
      <primitive object={burst} />
      <primitive object={smog} />
      <primitive object={flash} />
      <primitive object={lava.g} />
      <primitive object={bombs.g} />
      <primitive object={convoy.g} />
    </>
  );
}
