"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { die } from "@/assets3d/props";
import { sfx } from "./sfx";

// Dadu fisika sederhana yang hasilnya tetap jujur (ditentukan mesin aturan):
// 1) simulasikan lemparan sekali di belakang layar, lihat muka mana yang berakhir di atas;
// 2) putar orientasi awal dengan simetri kubus agar muka hasil mesin yang berakhir di atas;
// 3) mainkan simulasi yang sama di layar. Lintasan dan pantulan tidak berubah, hanya angkanya.

const SCALE = 1.8; // dadu diperbesar supaya terlihat dari kamera permainan
const HALF = 0.15 * SCALE; // setengah sisi dadu
const G = 22;
const DT = 1 / 120;
const AREA = 3.9; // batas lempar di taman Monas
const MONAS = 1.15; // setengah sisi pelataran Monas (dadu memantul)

// Normal lokal tiap muka bernilai (sesuai susunan titik di props.die).
const FACE: Record<number, THREE.Vector3> = {
  1: new THREE.Vector3(0, 1, 0), 6: new THREE.Vector3(0, -1, 0),
  2: new THREE.Vector3(1, 0, 0), 5: new THREE.Vector3(-1, 0, 0),
  3: new THREE.Vector3(0, 0, 1), 4: new THREE.Vector3(0, 0, -1),
};
const UP = new THREE.Vector3(0, 1, 0);

// Dikocok di sisi timur taman, dilempar ke halaman depan (selatan) yang menghadap kamera.
export const HAND: [number, number, number][] = [[3.1, 1.8, 0.35], [3.5, 1.85, 1.1]]; // berjarak > GAP

type Body = { p: THREE.Vector3; v: THREE.Vector3; q: THREE.Quaternion; w: THREE.Vector3; rest: number };
type Frame = { p: THREE.Vector3; q: THREE.Quaternion; hit: number };

function step(b: Body) {
  b.v.y -= G * DT;
  b.p.addScaledVector(b.v, DT);
  const ang = b.w.length() * DT;
  if (ang > 1e-6) b.q.premultiply(new THREE.Quaternion().setFromAxisAngle(b.w.clone().normalize(), ang));
  let hit = 0;
  if (b.p.y < HALF) {
    b.p.y = HALF;
    if (b.v.y < 0) {
      hit = -b.v.y;
      b.v.y = -b.v.y * 0.42;
      b.v.x *= 0.8;
      b.v.z *= 0.8;
      b.w.multiplyScalar(0.75);
      // Gesekan lantai memutar dadu ke arah gerak (menggelinding).
      b.w.x += b.v.z * 1.6;
      b.w.z -= b.v.x * 1.6;
    }
  }
  // Pantul di tepi taman dan pelataran Monas.
  for (const k of ["x", "z"] as const) {
    if (Math.abs(b.p[k]) > AREA) {
      b.p[k] = Math.sign(b.p[k]) * AREA;
      b.v[k] *= -0.55;
      hit = Math.max(hit, 2);
    }
  }
  if (Math.abs(b.p.x) < MONAS && Math.abs(b.p.z) < MONAS && b.p.y < 0.6) {
    const k = Math.abs(b.p.x) > Math.abs(b.p.z) ? "x" : "z";
    b.p[k] = Math.sign(b.p[k]) * MONAS;
    b.v[k] *= -0.55;
    hit = Math.max(hit, 2);
  }
  if (b.p.y <= HALF + 0.001) {
    const k = 1 - 2.6 * DT;
    b.v.x *= k;
    b.v.z *= k;
    b.w.multiplyScalar(1 - 2.4 * DT);
  }
  b.rest = b.v.length() < 0.08 && b.w.length() < 0.6 && b.p.y <= HALF + 0.01 ? b.rest + 1 : 0;
  return hit;
}

// Jarak minimum antar pusat dadu (sisi kubus, sedikit dilebihkan supaya sudutnya tidak saling tembus).
const GAP = HALF * 2.15;

/**
 * Tabrakan dua dadu (didekati sebagai bola): dorong keluar sampai tidak tumpang tindih,
 * pantulkan kecepatan sepanjang garis tumbukan, dan beri putaran tambahan.
 * Tidak bergantung orientasi, jadi trik simetri kubus tetap berlaku.
 */
function collide(a: Body, b: Body) {
  const n = b.p.clone().sub(a.p);
  const d = n.length();
  if (d >= GAP || d < 1e-6) return 0;
  n.divideScalar(d);
  const push = (GAP - d) / 2;
  a.p.addScaledVector(n, -push);
  b.p.addScaledVector(n, push);
  a.p.y = Math.max(a.p.y, HALF);
  b.p.y = Math.max(b.p.y, HALF);
  const rel = b.v.clone().sub(a.v).dot(n);
  if (rel >= 0) return 0; // sudah saling menjauh
  const j = -(1 + 0.5) * rel / 2; // restitusi 0.5, massa sama
  a.v.addScaledVector(n, -j);
  b.v.addScaledVector(n, j);
  const spin = new THREE.Vector3(n.z, 0, -n.x).multiplyScalar(j * 3);
  a.w.sub(spin);
  b.w.add(spin);
  return -rel;
}

/** Simulasi dua dadu bersama sampai keduanya diam, lalu luruskan agar satu muka tepat menghadap atas. */
function simulate(starts: Body[]) {
  const bodies: Body[] = starts.map((s) => ({ p: s.p.clone(), v: s.v.clone(), q: s.q.clone(), w: s.w.clone(), rest: 0 }));
  const frames: Frame[][] = bodies.map(() => []);
  for (let i = 0; i < 120 * 5 && bodies.some((b) => b.rest < 20); i++) {
    const hits = bodies.map(step);
    const knock = collide(bodies[0], bodies[1]);
    bodies.forEach((b, k) => frames[k].push({ p: b.p.clone(), q: b.q.clone(), hit: Math.max(hits[k], knock * 1.5) }));
  }
  const tops = bodies.map((b, k) => {
    // Muka yang paling menghadap atas, lalu rotasi kecil agar tepat tegak.
    let best = 1, bestDot = -2;
    for (const [n, normal] of Object.entries(FACE)) {
      const d = normal.clone().applyQuaternion(b.q).dot(UP);
      if (d > bestDot) (bestDot = d), (best = Number(n));
    }
    const align = new THREE.Quaternion().setFromUnitVectors(FACE[best].clone().applyQuaternion(b.q), UP);
    const settled = b.q.clone().premultiply(align);
    for (let i = 1; i <= 24; i++) frames[k].push({ p: b.p.clone(), q: b.q.clone().slerp(settled, i / 24), hit: 0 });
    return best;
  });
  return { frames, tops };
}

/** Lemparan dua dadu yang berakhir di muka `targets`, dari titik tangan dengan tenaga tertentu. */
function plan(targets: [number, number], power: number, rnd: () => number) {
  const starts: Body[] = HAND.map((h) => ({
    p: new THREE.Vector3(...h),
    v: new THREE.Vector3(-(1.2 + power * 2.8) * (0.8 + rnd() * 0.4), 2 + power * 3, (1.6 + power * 3.2) * (0.8 + rnd() * 0.4)),
    q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6.3, rnd() * 6.3, rnd() * 6.3)),
    w: new THREE.Vector3((rnd() - 0.5) * 30, (rnd() - 0.5) * 20, (rnd() - 0.5) * 30),
    rest: 0,
  }));
  const dry = simulate(starts);
  // Simetri kubus: muka target dipetakan ke posisi muka yang tadi berakhir di atas.
  starts.forEach((s, k) => s.q.multiply(new THREE.Quaternion().setFromUnitVectors(FACE[targets[k]], FACE[dry.tops[k]])));
  return simulate(starts).frames;
}

export type ThrowSpec = { key: number; power: number; faces: [number, number] };

/**
 * Dua dadu. shaking: melayang dan bergetar di "tangan" sambil dikocok.
 * throwSpec berubah: dilempar dengan fisika, lalu onSettled dipanggil sekali saat keduanya diam.
 */
export function Dice({ shaking, throwSpec, onSettled }: { shaking: boolean; throwSpec: ThrowSpec | null; onSettled: () => void }) {
  const objs = useMemo(
    () =>
      [die(), die("#d23a3a")].map((d) => {
        // die() menaruh badan di y=0.15 dalam grup; bungkus supaya titik putar ada di tengah dadu.
        d.position.y = 0;
        const g = new THREE.Group();
        g.add(d);
        g.scale.setScalar(SCALE);
        return g;
      }),
    [],
  );
  const run = useRef<{ frames: Frame[][]; i: number; done: boolean } | null>(null);
  const settled = useRef(onSettled);
  settled.current = onSettled;
  const rattle = useRef(0);

  useEffect(() => {
    objs[0].position.set(1.6, HALF, 2.5);
    objs[1].position.set(2.1, HALF, 2.75);
  }, [objs]);

  useEffect(() => {
    if (!throwSpec) return;
    const rnd = Math.random;
    run.current = { frames: plan(throwSpec.faces, throwSpec.power, rnd), i: 0, done: false };
  }, [throwSpec, objs]);

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    if (shaking) {
      objs.forEach((o, i) => {
        o.position.set(HAND[i][0] + Math.sin(t * 40 + i) * 0.06, HAND[i][1] + Math.sin(t * 33 + i * 2) * 0.05, HAND[i][2] + Math.cos(t * 37) * 0.05);
        o.rotation.set(t * 9 + i, t * 7, t * 11 + i);
      });
      rattle.current -= dt;
      if (rattle.current <= 0) {
        sfx.rattle();
        rattle.current = 0.12 + Math.random() * 0.06; // irama tangan mengocok (~6-8 kali per detik)
      }
      return;
    }
    const r = run.current;
    if (!r || r.done) return;
    // Mainkan rekaman fisika pada laju tetap (dua langkah fisika per frame 60 fps).
    const steps = Math.max(1, Math.round(dt / DT));
    r.i += steps;
    let finished = true;
    objs.forEach((o, k) => {
      const fr = r.frames[k];
      const idx = Math.min(fr.length - 1, r.i);
      if (r.i < fr.length) finished = false;
      o.position.copy(fr[idx].p);
      o.quaternion.copy(fr[idx].q);
      for (let j = Math.max(0, r.i - steps + 1); j <= idx; j++) if (fr[j].hit > 1.2) sfx.clack(Math.min(1, fr[j].hit / 8));
    });
    if (finished) {
      r.done = true;
      settled.current();
    }
  });

  return (
    <>
      {objs.map((o, i) => (
        <primitive key={i} object={o} />
      ))}
    </>
  );
}
