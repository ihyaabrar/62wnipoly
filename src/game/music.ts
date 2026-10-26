// Musik latar prosedural bergaya gamelan (laras slendro), disintesis dengan WebAudio: tanpa file audio.
// Makin tinggi Level Krisis, tempo makin cepat, kendang makin rapat, dan dengung rendah yang tidak enak masuk.

import { audio, isMuted } from "./sfx";

/** Slendro: lima nada per oktaf, kira-kira berjarak sama (240 sen). */
const CENTS = [0, 240, 480, 720, 960];
const BASE = 146.83; // D3

const hz = (deg: number) => BASE * Math.pow(2, (CENTS[((deg % 5) + 5) % 5] + 1200 * Math.floor(deg / 5)) / 1200);

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Balungan: 16 nada (seperempat) hasil jalan acak ber-seed, selalu berakhir di nada dasar. */
function phrase(index: number) {
  const r = rng(index * 7919 + 13);
  const out: number[] = [];
  let d = 5 + Math.floor(r() * 3);
  for (let i = 0; i < 15; i++) {
    d = Math.min(9, Math.max(1, d + Math.floor(r() * 5) - 2));
    out.push(d);
  }
  out.push(5); // gong jatuh di nada dasar oktaf tengah
  return out;
}
const PHRASES = [0, 1, 2, 3].map(phrase);

let timer: ReturnType<typeof setInterval> | null = null;
let nextTime = 0;
let step = 0;
let crisis = 1;
let duck: GainNode | null = null;
let drone: { g: GainNode; oscs: OscillatorNode[] } | null = null;
let ducked = false;

/** Satu pukulan logam: nada dasar, sebagian tak harmonis khas gamelan, dan pasangan yang sedikit sumbang (ombak). */
function bell(ctx: AudioContext, dest: AudioNode, f: number, t: number, v: number, decay: number) {
  for (const [ratio, gain, len] of [[1, 1, decay], [1.007, 0.7, decay], [2.76, 0.22, decay * 0.45], [5.4, 0.08, decay * 0.2]] as const) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = f * ratio;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v * gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + len + 0.05);
  }
}

function thump(ctx: AudioContext, dest: AudioNode, t: number, v: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(190, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + 0.2);
}

function gong(ctx: AudioContext, dest: AudioNode, t: number) {
  bell(ctx, dest, hz(-5) / 2, t, 0.22, 5);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = 49;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.16, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + 6.1);
}

function schedule(ctx: AudioContext, dest: AudioNode, s: number, t: number) {
  const mel = PHRASES[Math.floor(s / 32) % PHRASES.length];
  const quarter = s % 2 === 0;
  const deg = mel[Math.floor((s % 32) / 2)];
  if (quarter) bell(ctx, dest, hz(deg), t, 0.1, 1.7); // saron
  else if (crisis >= 3) bell(ctx, dest, hz(deg + 5), t, 0.04, 0.5); // peking mengisi di antara
  if (s % 8 === 0) thump(ctx, dest, t, 0.2); // kendang
  else if (s % 8 === 4) thump(ctx, dest, t, 0.1);
  else if (crisis >= 5 && s % 2 === 1) thump(ctx, dest, t, 0.05);
  if (s % 16 === 8) bell(ctx, dest, hz(deg - 5), t, 0.08, 2.4); // kenong
  if (s % 64 === 0) gong(ctx, dest, t); // gong ageng menutup siklus
}

const stepSeconds = () => 60 / (76 + Math.min(crisis, 10) * 5) / 2;
const droneLevel = () => Math.min(1, Math.max(0, (crisis - 3) / 6)) * 0.05;

function ensureDrone(ctx: AudioContext) {
  if (drone) return;
  const g = ctx.createGain();
  g.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 240;
  const oscs = [82.4, 87.3].map((f) => {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f; // sekon kecil: ketegangan yang tidak terselesaikan
    o.connect(lp);
    o.start();
    return o;
  });
  lp.connect(g).connect(duck!);
  drone = { g, oscs };
}

function tick() {
  const a = audio();
  if (!a) return;
  if (isMuted() || a.ctx.state !== "running") {
    nextTime = a.ctx.currentTime + 0.1; // tidak mengejar ketinggalan saat tertahan
    return;
  }
  if (crisis >= 4) ensureDrone(a.ctx);
  drone?.g.gain.setTargetAtTime(droneLevel(), a.ctx.currentTime, 1.5);
  while (nextTime < a.ctx.currentTime + 0.35) {
    schedule(a.ctx, duck!, step++, nextTime);
    nextTime += stepSeconds();
  }
}

/** Mulai musik latar. Aman dipanggil berulang. Butuh interaksi pengguna agar konteks audio berjalan. */
export function startMusic() {
  const a = audio();
  if (!a || timer) return;
  void a.ctx.resume();
  duck = a.ctx.createGain();
  duck.gain.value = ducked ? 0.3 : 1;
  duck.connect(a.musicBus);
  nextTime = a.ctx.currentTime + 0.3;
  step = 0;
  timer = setInterval(tick, 100);
  const wake = () => void a.ctx.resume();
  window.addEventListener("pointerdown", wake, { once: true });
  window.addEventListener("keydown", wake, { once: true });
}

/** Berhenti dengan memudar, lalu bersihkan. */
export function stopMusic(fade = 1.2) {
  const a = audio();
  if (timer) clearInterval(timer);
  timer = null;
  if (!a || !duck) return;
  const d = duck;
  const dr = drone;
  d.gain.setTargetAtTime(0, a.ctx.currentTime, fade / 3);
  setTimeout(() => {
    dr?.oscs.forEach((o) => o.stop());
    d.disconnect();
  }, fade * 1000 + 300);
  duck = null;
  drone = null;
}

export function setMusicCrisis(level: number) {
  crisis = level;
}

/** Turunkan musik saat sinematik bencana atau modal penting supaya efek suara terdengar. */
export function duckMusic(on: boolean) {
  ducked = on;
  const a = audio();
  if (a && duck) duck.gain.setTargetAtTime(on ? 0.3 : 1, a.ctx.currentTime, 0.25);
}
