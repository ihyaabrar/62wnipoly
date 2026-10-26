"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { loadModels } from "@/assets3d/models";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { sfx } from "./sfx";
import { OrbitControls } from "@react-three/drei";
import { TILE_D, TILE_W, fullBoard, pawnSpot, tileInfo } from "@/assets3d/board";
import { TILE_TOP, loadTileButtons, supportPawns } from "@/assets3d/tileMotion";
import { PAWNS } from "@/assets3d/pawns";
import { budgetLights, cyl, group, textTexture, tickAll } from "@/assets3d/kit";
import { riotPolice } from "@/assets3d/props";
import { Dice, type ThrowSpec } from "./Dice";
import { DisasterFX, type Cinematic } from "./DisasterFX";
import { BOARD_SIZE, JAIL_INDEX } from "@/engine/data";
import type { GameState, Player } from "@/engine/game";
import { Stage, type Quality } from "@/scene/Stage";

export const PLAYER_COLORS = ["#d23a3a", "#2f6fdb", "#2fa84f", "#e3b341"];

const STEP_TIME = 0.2; // detik per petak saat bidak berjalan
const JUMP_TIME = 0.6; // lompatan langsung (kartu pindah, masuk lapas)
const PUNGLI_INDEX = 34;
const CAGE_UP = 2.6; // tinggi kurungan saat tersimpan di atas (tak terlihat)

/** Kurungan jeruji yang dijatuhkan ke bidak yang masuk Lapas VIP. */
function jailCage() {
  const steel = "#3a3d44";
  const bars = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return cyl(0.014, 0.014, 0.78, steel, [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3], 6);
  });
  const g = group("kurungan-lapas", ...bars, cyl(0.33, 0.33, 0.05, steel, [0, 0.78, 0], 16));
  g.visible = false;
  return g;
}

/** Lama animasi bidak untuk perpindahan dari a ke b, supaya UI dan bot menunggu bidak tiba. */
export function moveDuration(from: number, to: number) {
  const forward = (to - from + BOARD_SIZE) % BOARD_SIZE;
  if (forward === 0) return 0;
  return forward <= 12 ? forward * STEP_TIME : JUMP_TIME;
}

function Pawn({ player, slot, register }: { player: Player; slot: number; register: (slot: number, o: THREE.Object3D) => void }) {
  const obj = useMemo(() => {
    const p = PAWNS[player.character](PLAYER_COLORS[slot]);
    p.scale.setScalar(0.9);
    p.position.copy(pawnSpot(player.pos, slot));
    return p;
  }, [player.character, slot]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    register(slot, obj);
  }, [register, slot, obj]);
  const shown = useRef(player.pos);
  const landed = useRef(player.pos);
  const queue = useRef<{ tile: number; time: number }[]>([]);
  const hop = useRef({ t: 1, dur: 1, from: new THREE.Vector3(), to: new THREE.Vector3(), fromTile: player.pos, toTile: player.pos });
  // Animasi petak: kurungan Lapas jatuh menutup bidak, polisi Pungli muncul di samping bidak.
  const cage = useMemo(() => jailCage(), []);
  const cop = useMemo(() => {
    const c = riotPolice();
    c.visible = false;
    return c;
  }, []);
  const fx = useRef({ moving: false, cageY: CAGE_UP, cageV: 0, copT: -1 });

  // Saat posisi di mesin berubah: jalan petak demi petak (dadu) atau melompat langsung (kartu, lapas).
  useEffect(() => {
    const forward = (player.pos - shown.current + BOARD_SIZE) % BOARD_SIZE;
    if (forward === 0) return;
    if (forward <= 12) for (let i = 1; i <= forward; i++) queue.current.push({ tile: (shown.current + i) % BOARD_SIZE, time: STEP_TIME });
    else queue.current.push({ tile: player.pos, time: JUMP_TIME });
    shown.current = player.pos;
  }, [player.pos]);

  useFrame((st, dt) => {
    const lastSupport = obj.userData.supportOffset ?? 0;
    obj.position.y -= lastSupport;
    obj.userData.supportOffset = 0;
    tickAll(obj, st.clock.elapsedTime, dt);
    const h = hop.current;
    if (h.t >= 1 && queue.current.length) {
      const next = queue.current.shift()!;
      h.fromTile = landed.current;
      h.toTile = next.tile;
      h.from.copy(obj.position);
      h.to.copy(pawnSpot(next.tile, slot));
      h.t = 0;
      h.dur = next.time;
      obj.rotation.y = Math.atan2(h.to.x - h.from.x, h.to.z - h.from.z);
      sfx.step();
    }
    if (h.t < 1) {
      h.t = Math.min(1, h.t + dt / h.dur);
      obj.position.lerpVectors(h.from, h.to, h.t);
      obj.position.y += Math.sin(h.t * Math.PI) * (h.dur > STEP_TIME ? 1.2 : 0.35);
      if (h.t >= 1) landed.current = h.toTile;
    }
    obj.userData.tileContacts = h.t >= 1
      ? [{ index: landed.current, weight: 1 }]
      : [
          { index: h.fromTile, weight: 1 - THREE.MathUtils.smoothstep(h.t, 0, 0.25) },
          { index: h.toTile, weight: THREE.MathUtils.smoothstep(h.t, 0.65, 1) },
        ];
    // Pemain gugur: bidak rebah.
    const fallen = !player.alive;
    obj.rotation.z += ((fallen ? Math.PI / 2 : 0) - obj.rotation.z) * 0.1;

    const f = fx.current;
    const moving = h.t < 1 || queue.current.length > 0;
    if (f.moving && !moving && shown.current === PUNGLI_INDEX && player.alive) {
      f.copT = 0;
      sfx.whistle();
    }
    f.moving = moving;

    // Kurungan: jatuh dengan pantulan saat bidak tiba di lapas, terangkat lagi saat bebas.
    const jailed = player.jailed > 0 && player.alive && !moving && shown.current === JAIL_INDEX;
    if (jailed) {
      f.cageV -= 18 * dt;
      f.cageY += f.cageV * dt;
      if (f.cageY <= 0) {
        if (f.cageV < -2) sfx.clang(Math.min(1, -f.cageV / 8));
        f.cageY = 0;
        f.cageV = -f.cageV * 0.3;
      }
    } else {
      f.cageV = 0;
      f.cageY = Math.min(CAGE_UP, f.cageY + dt * 2.5);
    }
    cage.visible = f.cageY < CAGE_UP;
    if (cage.visible) cage.position.copy(pawnSpot(JAIL_INDEX, slot)).setY(pawnSpot(JAIL_INDEX, slot).y + f.cageY + lastSupport);

    // Polisi: muncul memantul di samping bidak, menagih sebentar, lalu tenggelam.
    if (f.copT >= 0) {
      f.copT += dt;
      const t = f.copT;
      const pop = t < 0.45 ? 1 - Math.pow(1 - t / 0.45, 3) * Math.cos((t / 0.45) * Math.PI * 2.5) : t < 3 ? 1 : Math.max(0, 1 - (t - 3) / 0.35);
      cop.visible = pop > 0.01;
      cop.scale.setScalar(0.85 * pop);
      const side = new THREE.Vector3(0.36, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), tileInfo(PUNGLI_INDEX).rotationY);
      cop.position.copy(obj.position).add(side);
      cop.lookAt(obj.position.x, cop.position.y, obj.position.z);
      // Tangan menagih: badan bergoyang.
      cop.rotation.z = Math.sin(t * 9) * 0.06;
      if (t > 3.35) f.copT = -1;
    }
  }, -2);
  return (
    <>
      <primitive object={obj} />
      <primitive object={cage} />
      <primitive object={cop} />
    </>
  );
}

/**
 * Kamera mengikuti bidak pemain yang sedang jalan: titik pandang dan kamera bergeser bersama,
 * jadi sudut orbit pilihan pemain tetap. shakeKey berubah = guncangan (bencana akhir ronde).
 */
export type CameraNav = { zoom: (factor: number) => void; reset: () => void };

export const CAM_MIN = 5, CAM_MAX = 52;

/** Posisi awal yang nyaman: seluruh papan terlihat agak miring dari selatan, gunung di latar belakang. */
function homeView(aspect: number) {
  const portrait = aspect < 0.85;
  return {
    // Desktop: pusat digeser ke kiri-bawah supaya papan tidak tertutup kartu pemain (kiri) dan panel aksi (bawah).
    // HP tegak: lebih jauh dan lebih tinggi supaya lebar papan muat di layar sempit.
    pos: portrait ? new THREE.Vector3(0, 36, 27) : new THREE.Vector3(1.6, 17, 19.6),
    target: portrait ? new THREE.Vector3(0, 0, 2.2) : new THREE.Vector3(-1.2, 0, 1.8),
    follow: portrait ? 0.12 : 0.35,
  };
}

function CameraRig({ pawns, turn, follow, shakeKey, nav }: { pawns: RefObject<THREE.Object3D[]>; turn: number; follow: boolean; shakeKey: number; nav: RefObject<CameraNav | null> }) {
  const { camera, controls, size } = useThree();
  const shake = useRef(0);
  const want = useMemo(() => new THREE.Vector3(), []);
  const delta = useMemo(() => new THREE.Vector3(), []);
  // Animasi kamera ke posisi tujuan (zoom bertahap, kembali ke posisi awal).
  const anim = useRef<{ t: number; dur: number; p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3 } | null>(null);
  useEffect(() => {
    if (shakeKey) shake.current = 1;
  }, [shakeKey]);
  useEffect(() => {
    const c = controls as unknown as { target: THREE.Vector3 } | null;
    if (!c) return;
    const go = (p1: THREE.Vector3, t1: THREE.Vector3, dur: number) => (anim.current = { t: 0, dur, p0: camera.position.clone(), t0: c.target.clone(), p1, t1 });
    // Pertama kali kontrol siap: langsung ke posisi awal.
    const home = homeView(size.width / size.height);
    camera.position.copy(home.pos);
    c.target.copy(home.target);
    nav.current = {
      zoom: (factor) => {
        const off = camera.position.clone().sub(c.target);
        const d = THREE.MathUtils.clamp(off.length() * factor, CAM_MIN, CAM_MAX);
        go(c.target.clone().add(off.setLength(d)), c.target.clone(), 0.3);
      },
      reset: () => {
        const h = homeView(size.width / size.height);
        go(h.pos, h.target, 0.7);
      },
    };
    return () => {
      nav.current = null;
    };
  }, [controls]); // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((_, dt) => {
    const c = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    if (!c) return;
    const a = anim.current;
    if (a) {
      a.t = Math.min(1, a.t + dt / a.dur);
      const e = 1 - Math.pow(1 - a.t, 3);
      camera.position.lerpVectors(a.p0, a.p1, e);
      c.target.lerpVectors(a.t0, a.t1, e);
      if (a.t >= 1) anim.current = null;
      c.update();
      return;
    }
    const pawn = pawns.current?.[turn];
    if (follow && pawn) {
      // Condong ke pusat posisi awal agar seluruh papan tetap terlihat di sela panel HUD.
      const home = homeView(size.width / size.height);
      want.set(home.target.x + pawn.position.x * home.follow, 0, home.target.z + pawn.position.z * home.follow);
      delta.copy(want).sub(c.target).multiplyScalar(Math.min(1, dt * 2.5));
      c.target.add(delta);
      camera.position.add(delta);
    }
    if (shake.current > 0) {
      shake.current = Math.max(0, shake.current - dt * 1.4);
      const k = shake.current * 0.25;
      camera.position.x += (Math.random() - 0.5) * k;
      camera.position.y += (Math.random() - 0.5) * k;
    }
    c.update();
  });
  return null;
}

export type Toast = { id: number; slot: number; text: string; good: boolean };

/**
 * Memproyeksikan posisi bidak ke layar setiap frame dan menggeser elemen HTML label (dirender di Play).
 * Lebih ringan daripada drei Html (yang membuat React root per label). Label bidak yang berdekatan ditumpuk.
 */
function TagProjector({ pawns, tagEls }: { pawns: RefObject<THREE.Object3D[]>; tagEls: RefObject<(HTMLElement | null)[]> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const objs = pawns.current ?? [];
    objs.forEach((p, i) => {
      const el = tagEls.current?.[i];
      if (!p || !el) return;
      let stack = 0;
      for (let j = 0; j < i; j++) if (objs[j] && objs[j].position.distanceTo(p.position) < 0.7) stack++;
      v.set(p.position.x, p.position.y + 0.95, p.position.z).project(camera);
      const hidden = v.z > 1;
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height - stack * 20;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      el.style.visibility = hidden ? "hidden" : "visible";
    });
  });
  return null;
}

/** Cincin bercahaya yang berdenyut di bawah bidak pemain yang sedang jalan. */
function TurnRing({ pawns, turn }: { pawns: RefObject<THREE.Object3D[]>; turn: number }) {
  const mesh = useMemo(() => {
    const geo = new THREE.RingGeometry(0.26, 0.36, 32);
    geo.rotateX(-Math.PI / 2);
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, toneMapped: false }));
  }, []);
  useEffect(() => {
    (mesh.material as THREE.MeshBasicMaterial).color.set(PLAYER_COLORS[turn]).multiplyScalar(2.2); // >1 supaya ikut bersinar (bloom)
  }, [turn, mesh]);
  useFrame((st) => {
    const p = pawns.current?.[turn];
    if (!p) return;
    mesh.position.set(p.position.x, p.position.y + 0.02, p.position.z);
    const k = 1 + Math.sin(st.clock.elapsedTime * 4) * 0.12;
    mesh.scale.set(k, 1, k);
  });
  return <primitive object={mesh} />;
}

export type Draw = { key: number; deck: "kesempatan" | "musibah"; title: string };

// Di kiri dan kanan Monas, terlihat dari kamera (sisi utara tertutup tugu).
const DECK_POS: Record<Draw["deck"], [number, number, number]> = { kesempatan: [-1.85, 0.04, 0.2], musibah: [1.85, 0.04, -0.6] };
const DECK_LOOK: Record<Draw["deck"], { bg: string; fg: string; label: string; mark: string }> = {
  kesempatan: { bg: "#f2c94c", fg: "#1d1f24", label: "KESEMPATAN", mark: "?" },
  musibah: { bg: "#1d1f24", fg: "#ff5a5a", label: "MUSIBAH", mark: "!" },
};
const CARD_W = 0.42, CARD_H = 0.6;
const DECK_SCALE = 1.7;

/** Kartu dua sisi: punggung bergambar dek, muka berisi judul kartu. */
function cardMesh(deck: Draw["deck"], title?: string) {
  const look = DECK_LOOK[deck];
  const back = textTexture([look.label, look.mark], { bg: look.bg, fg: look.fg, w: 256, h: 368, border: look.fg });
  const face = textTexture(title ? [look.label, ...title.toUpperCase().split(" ").reduce<string[]>((rows, w) => {
    const last = rows[rows.length - 1];
    if (last && (last + " " + w).length <= 11) rows[rows.length - 1] = `${last} ${w}`;
    else rows.push(w);
    return rows;
  }, [])] : [look.label], { bg: "#f7f1e1", fg: "#1d1f24", w: 256, h: 368, border: look.bg });
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const top = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: back, roughness: 0.6 }));
  top.rotation.x = -Math.PI / 2;
  const bottom = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: face, roughness: 0.6 }));
  bottom.rotation.x = Math.PI / 2;
  bottom.rotation.z = Math.PI;
  g.add(top, bottom);
  return g;
}

/**
 * Dua dek kartu di samping Monas. Saat kartu ditarik (draw berubah), kartu teratas terangkat,
 * berbalik memperlihatkan judulnya, lalu terbang ke depan kamera sebelum kartu besar (HTML) muncul.
 */
export type DeckScreen = Record<Draw["deck"], { x: number; y: number }>;

function CardDecks({ draw, deckScreen }: { draw: Draw | null; deckScreen: RefObject<DeckScreen | null> }) {
  const decks = useMemo(() => {
    const out: THREE.Group[] = [];
    (["kesempatan", "musibah"] as const).forEach((deck) => {
      const g = new THREE.Group();
      const look = DECK_LOOK[deck];
      for (let i = 0; i < 9; i++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(CARD_W, 0.012, CARD_H), new THREE.MeshStandardMaterial({ color: i % 2 ? "#efe6cf" : look.bg, roughness: 0.7 }));
        c.position.set((Math.random() - 0.5) * 0.02, 0.006 + i * 0.012, (Math.random() - 0.5) * 0.02);
        c.rotation.y = (Math.random() - 0.5) * 0.06;
        c.castShadow = c.receiveShadow = true;
        g.add(c);
      }
      const topCard = cardMesh(deck);
      topCard.position.y = 0.115;
      g.add(topCard);
      g.position.set(...DECK_POS[deck]);
      g.rotation.y = deck === "kesempatan" ? 0.25 : -0.25;
      g.scale.setScalar(DECK_SCALE);
      out.push(g);
    });
    return out;
  }, []);
  const fly = useRef<{ obj: THREE.Group; t: number; from: THREE.Vector3 } | null>(null);
  const { camera, scene } = useThree();
  useEffect(() => {
    if (!draw) return;
    const obj = cardMesh(draw.deck, draw.title);
    const from = new THREE.Vector3(...DECK_POS[draw.deck]).add(new THREE.Vector3(0, 0.13 * DECK_SCALE, 0));
    obj.position.copy(from);
    obj.scale.setScalar(DECK_SCALE);
    scene.add(obj);
    fly.current = { obj, t: 0, from };
    return () => {
      scene.remove(obj);
      fly.current = null;
    };
  }, [draw, scene]);
  useFrame((_, dt) => {
    const f = fly.current;
    if (!f) return;
    f.t += dt;
    const o = f.obj;
    if (f.t < 0.35) {
      // Terangkat dan berbalik di atas dek.
      const k = f.t / 0.35;
      o.position.copy(f.from).add(new THREE.Vector3(0, Math.sin(k * Math.PI * 0.5) * 0.7, 0));
      o.rotation.set(0, 0, k * Math.PI);
    } else {
      // Kartu 3D berhenti di sini; kartu HTML melanjutkan dari posisi dek di layar (lihat Play).
      o.visible = false;
    }
  });
  // Posisi dek di layar (piksel dari tengah kanvas) supaya kartu besar terbang keluar dari dek.
  const { size } = useThree();
  useFrame(() => {
    if (!deckScreen.current) return;
    for (const deck of ["kesempatan", "musibah"] as const) {
      const v = new THREE.Vector3(...DECK_POS[deck]).add(new THREE.Vector3(0, 0.6, 0)).project(camera);
      deckScreen.current[deck] = { x: (v.x * size.width) / 2, y: (-v.y * size.height) / 2 };
    }
  });
  return (
    <>
      {decks.map((d, i) => (
        <primitive key={i} object={d} />
      ))}
    </>
  );
}

/** Bingkai kuning berdenyut di petak yang sedang dilihat infonya. */
function TileHighlight({ index, buttons }: { index: number; buttons: THREE.Object3D[] }) {
  const frame = useMemo(() => {
    const info = tileInfo(index);
    const w = info.kind === "sudut" ? TILE_D : TILE_W;
    const m = new THREE.MeshStandardMaterial({ color: "#f2b92e", emissive: "#f2b92e", emissiveIntensity: 0.9 });
    const t = 0.06;
    const g = new THREE.Group();
    for (const [sx, sz, px, pz] of [[w, t, 0, TILE_D / 2], [w, t, 0, -TILE_D / 2], [t, TILE_D, w / 2, 0], [t, TILE_D, -w / 2, 0]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.05, sz), m);
      b.position.set(px, TILE_TOP + 0.05, pz);
      g.add(b);
    }
    g.position.copy(info.position);
    g.rotation.y = info.rotationY;
    return { g, m };
  }, [index]);
  useFrame((st) => {
    frame.m.emissiveIntensity = 0.6 + Math.sin(st.clock.elapsedTime * 5) * 0.4;
    frame.g.position.y = buttons[index]?.userData.pressOffset ?? 0;
  });
  return <primitive object={frame.g} />;
}

/** Bidang tak terlihat di atas papan: klik (bukan seret) menunjuk petak terdekat. */
function TilePicker({ onTile }: { onTile: (index: number) => void }) {
  const spots = useMemo(() => Array.from({ length: BOARD_SIZE }, (_, i) => tileInfo(i).position), []);
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position-y={TILE_TOP + 0.02}
      onClick={(e) => {
        if (e.delta > 6) return; // geser kamera, bukan klik
        let best = -1, bestD = 1.1;
        spots.forEach((s, i) => {
          const d = Math.hypot(s.x - e.point.x, s.z - e.point.z);
          if (d < bestD) (bestD = d), (best = i);
        });
        if (best >= 0) {
          e.stopPropagation();
          onTile(best);
        }
      }}
    >
      <planeGeometry args={[12.6, 12.6]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

/** Dunia 3D game: papan, zona yang bereaksi pada krisis, bidak, dadu, kamera. */
type WorldProps = {
  state: GameState;
  quality: Quality;
  follow: boolean;
  shakeKey: number;
  tagEls: RefObject<(HTMLElement | null)[]>;
  onTile?: (index: number) => void;
  shaking: boolean;
  throwSpec: ThrowSpec | null;
  onSettled: () => void;
  draw: Draw | null;
  cinematic: Cinematic | null;
  deckScreen: RefObject<DeckScreen | null>;
  nav: RefObject<CameraNav | null>;
  inspect: number | null;
};

/** Muat model .glb dulu (beberapa ratus KB), baru bangun dunia yang memakainya. */
export function World(props: WorldProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    loadModels().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  return ready ? <WorldScene {...props} /> : <Stage quality={props.quality} fogNear={30} fogFar={80} />;
}

function WorldScene({ state, quality, follow, shakeKey, tagEls, onTile, shaking, throwSpec, onSettled, draw, cinematic, deckScreen, nav, inspect }: WorldProps) {
  const pawnObjs = useRef<THREE.Object3D[]>([]);
  const register = useCallback((slot: number, o: THREE.Object3D) => {
    pawnObjs.current[slot] = o;
  }, []);
  const board = useMemo(() => fullBoard(false), []);
  const buttons = useMemo(() => Array.from({ length: BOARD_SIZE }, (_, i) => board.getObjectByName(`petak-${i}`)!), [board]);
  useEffect(()=>{budgetLights(board,quality==="rendah"?0:quality==="sedang"?2:4);},[board,quality]);
  const hooks = useMemo(
    () => ({
      bursa: board.getObjectByName("gedung-bursa"),
      volcano: board.getObjectByName("gunung-meletus"),
      flood: board.getObjectByName("air-banjir"),
      haze: board.getObjectByName("kabut-asap"),
      board,
    }),
    [board],
  );
  // Dunia mengikuti keadaan game: layar IHSG, erupsi, tinggi banjir, dan asap makin parah saat krisis naik.
  useEffect(() => {
    const crisis = Math.min(1, (state.crisis - 1) / 8);
    hooks.bursa?.userData.setIndex?.(Math.round(state.ihsg * 51.85), state.halted ? Math.min(-8.01, state.ihsgChange) : state.ihsgChange);
    hooks.volcano?.userData.setActivity?.(0.5 + crisis);
    hooks.flood?.userData.setLevel?.(0.3 + crisis * 0.45);
    hooks.haze?.userData.setDensity?.(0.3 + crisis * 0.7);
  }, [state.crisis, state.ihsg, state.ihsgChange, state.halted, hooks]);

  useFrame((st, dt) => {
    loadTileButtons(buttons, pawnObjs.current);
    tickAll(board, st.clock.elapsedTime, dt);
    supportPawns(buttons, pawnObjs.current);
  }, -1);
  return (
    <>
      <Stage quality={quality} fogNear={30} fogFar={80} />
      <primitive object={board} />
      {state.players.map((p, i) => (
        <Pawn key={p.id} player={p} slot={i} register={register} />
      ))}
      <TagProjector pawns={pawnObjs} tagEls={tagEls} />
      {onTile && <TilePicker onTile={onTile} />}
      {inspect !== null && <TileHighlight index={inspect} buttons={buttons} />}
      {state.phase !== "over" && <TurnRing pawns={pawnObjs} turn={state.turn} />}
      <Dice shaking={shaking} throwSpec={throwSpec} onSettled={onSettled} />
      <DisasterFX cinematic={cinematic} hooks={hooks} crisis={state.crisis} />
      <CardDecks draw={draw} deckScreen={deckScreen} />
      <OrbitControls makeDefault target={[0, 0, 0.8]} maxPolarAngle={Math.PI / 2.25} minDistance={CAM_MIN} maxDistance={CAM_MAX} enableDamping />
      <CameraRig pawns={pawnObjs} turn={state.turn} follow={follow} shakeKey={shakeKey} nav={nav} />
    </>
  );
}
