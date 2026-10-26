// Efek suara disintesis dengan WebAudio: tanpa file audio, ukuran unduhan nol.
// Semua bunyi lewat satu kompresor + volume utama supaya keras-lemahnya stabil.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = (() => {
  try {
    return localStorage.getItem("weenipoly-mute") === "1";
  } catch {
    return false;
  }
})();

export const isMuted = () => muted;
export function setMuted(v: boolean) {
  muted = v;
  try {
    localStorage.setItem("weenipoly-mute", v ? "1" : "0");
  } catch {
    // penyimpanan diblokir: preferensi hanya berlaku sesi ini
  }
}

function init() {
  if (ctx || typeof window === "undefined") return;
  ctx = new AudioContext();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(comp).connect(ctx.destination);
}

/**
 * Browser memblokir audio sampai ada interaksi pengguna. Panggil sekali saat halaman dimuat:
 * sentuhan/klik/tombol pertama membuat dan membangunkan AudioContext.
 */
export function unlockAudio() {
  const go = () => {
    init();
    void ctx?.resume();
  };
  for (const ev of ["pointerdown", "keydown", "touchstart"]) window.addEventListener(ev, go, { once: true, passive: true });
}

function out() {
  if (muted || typeof window === "undefined") return null;
  init();
  if (ctx!.state === "suspended") void ctx!.resume();
  return ctx!.state === "running" ? ctx : null;
}

/** Satu nada dengan amplop naik-turun cepat, melewati filter supaya tidak tajam. */
function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15, delay = 0, slideTo?: number) {
  const a = out();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  f.type = "lowpass";
  f.frequency.value = Math.min(8000, freq * 6);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f).connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Desis noise berfilter (kocokan, benturan, gemuruh, desir). */
function noise(dur: number, vol = 0.12, delay = 0, freq = 2000, type: BiquadFilterType = "lowpass", q = 1) {
  const a = out();
  if (!a) return;
  const t = a.currentTime + delay;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master!);
  src.start(t);
}

export const sfx = {
  /**
   * Satu ayunan kocokan: 2-3 klik dadu beradu (bunyi plastik/tulang pendek, bernada) dalam
   * jeda acak, ditambah desir lembut genggaman. Dipanggil berulang mengikuti irama kocokan.
   */
  rattle() {
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const d = i * (0.018 + Math.random() * 0.03);
      const f = 2400 + Math.random() * 2200;
      noise(0.012, 0.16, d, f, "bandpass", 8); // klik
      tone(f * 0.55, 0.03, "sine", 0.035, d); // resonansi dadu
    }
    noise(0.12, 0.035, 0, 700, "lowpass", 0.7); // desir genggaman
  },
  throw() {
    noise(0.22, 0.08, 0, 1100, "bandpass", 0.9);
  },
  /** Dadu membentur papan atau dadu lain; kekuatan 0..1. Ketukan rendah seperti di meja kayu. */
  clack(power = 0.5) {
    const v = 0.05 + power * 0.18;
    tone(170 + Math.random() * 60, 0.07, "sine", v, 0, 120); // badan meja
    noise(0.018, v * 0.9, 0, 1400 + power * 1200, "bandpass", 3); // klik permukaan
    tone(1900 + Math.random() * 500, 0.025, "sine", v * 0.25); // denting dadu
  },
  step() {
    tone(520 + Math.random() * 60, 0.06, "triangle", 0.05);
  },
  /** Kartu ditarik dari dek: desir lalu bunyi balik. */
  card() {
    noise(0.22, 0.14, 0, 5000, "highpass", 0.7);
    tone(700, 0.14, "sine", 0.07, 0.16, 980);
  },
  coin() {
    tone(988, 0.08, "square", 0.05);
    tone(1319, 0.2, "square", 0.05, 0.07);
  },
  hurt() {
    tone(240, 0.28, "sawtooth", 0.07, 0, 120);
  },
  disaster() {
    noise(1.4, 0.35, 0, 260);
    tone(70, 1.1, "sine", 0.22, 0, 42);
  },
  /** Letusan: dentuman berat lalu gemuruh panjang. */
  eruption() {
    tone(55, 1.6, "sine", 0.3, 0, 30);
    noise(2.5, 0.4, 0, 180);
    noise(0.4, 0.3, 0, 900, "lowpass");
  },
  /** Air bah: desau deras yang membesar. */
  flood() {
    noise(3.5, 0.25, 0, 1200, "bandpass", 0.5);
    noise(3.5, 0.18, 0.3, 300);
  },
  /** Api dan asap: gemeretak. */
  wildfire() {
    for (let i = 0; i < 24; i++) noise(0.03, 0.08 + Math.random() * 0.1, i * 0.12 + Math.random() * 0.1, 2500 + Math.random() * 2500, "bandpass", 2);
    noise(3, 0.12, 0, 400);
  },
  /** Sirene dua nada. */
  siren() {
    for (let i = 0; i < 6; i++) tone(i % 2 ? 660 : 880, 0.45, "triangle", 0.07, i * 0.45);
  },
  /** Batu vulkanik menghantam tanah; kekuatan 0..1. */
  thud(power = 1) {
    tone(80 + Math.random() * 30, 0.35, "sine", 0.12 * power, 0, 38);
    noise(0.18, 0.16 * power, 0, 500, "lowpass");
  },
  /** Jeruji besi menghantam lantai; kekuatan 0..1. */
  clang(power = 1) {
    const v = 0.05 + power * 0.1;
    tone(310, 0.7, "triangle", v);
    tone(847, 0.5, "sine", v * 0.6);
    tone(1393, 0.35, "sine", v * 0.35);
    noise(0.05, v * 1.4, 0, 3200, "bandpass", 3);
  },
  /** Peluit polisi: getaran cepat dua nada. */
  whistle() {
    for (let i = 0; i < 10; i++) tone(i % 2 ? 2650 : 2950, 0.05, "sine", 0.07, i * 0.045);
    for (let i = 0; i < 4; i++) tone(i % 2 ? 2650 : 2950, 0.05, "sine", 0.07, 0.55 + i * 0.045);
  },
  out() {
    [440, 392, 349, 262].forEach((f, i) => tone(f, 0.28, "triangle", 0.09, i * 0.18));
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.32, "triangle", 0.1, i * 0.12));
  },
  turn() {
    tone(587, 0.12, "triangle", 0.09);
    tone(880, 0.22, "triangle", 0.09, 0.1);
  },
  click() {
    tone(800, 0.03, "square", 0.025);
  },
};
