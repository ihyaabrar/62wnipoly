"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { CHARACTERS, RULES, TILES, type CardDef } from "@/engine/data";
import { CardArt } from "./CardArt";
import { effectLines } from "./cardText";
import { TilePanel } from "./TilePanel";
import { applyAction, createGame, type Action, type GameState, type LogEvent, type Option } from "@/engine/game";
import { chooseAction } from "@/engine/bot";
import { QUALITY_DPR, type Quality } from "@/scene/Stage";
import { World, PLAYER_COLORS, moveDuration, type CameraNav, type DeckScreen, type Draw, type Toast } from "./World";
import type { ThrowSpec } from "./Dice";
import { CINEMATIC_SECONDS, type Cinematic } from "./DisasterFX";
import type { Zone } from "@/engine/data";
import { rpShort, type GameSetup } from "./Setup";
import { isMuted, setMuted, sfx, unlockAudio } from "./sfx";
import css from "./Game.module.css";

const BOT_THINK_MS = 650;
const CHARGE_PERIOD = 1.1; // detik dari kosong ke penuh pada meteran tenaga

/** Meteran tenaga naik-turun selama tombol ditahan (harus melepas di waktu yang pas). */
const pingpong = (x: number) => 1 - Math.abs((x % 2) - 1);

/** Chip dampak sebuah pilihan (dari perkiraan mesin), hijau untung, merah rugi. */
function evChips(ev: Option["ev"]) {
  const chips: { text: string; good: boolean }[] = [];
  if (ev.wallet) chips.push({ text: `${ev.wallet > 0 ? "+" : "-"}${rpShort(Math.abs(ev.wallet))}`, good: ev.wallet > 0 });
  if (ev.health) chips.push({ text: `${ev.health > 0 ? "+" : ""}${ev.health} sehat`, good: ev.health > 0 });
  if (ev.food) chips.push({ text: `${ev.food > 0 ? "+" : ""}${ev.food} makan`, good: ev.food > 0 });
  if (ev.protect) chips.push({ text: "aman bencana", good: true });
  return chips;
}

const QUALITY_KEY = "wnipoly-kualitas";
const RULES_KEY = "wnipoly-aturan-dilihat";
const QUALITIES: Quality[] = ["rendah", "sedang", "tinggi"];

/**
 * Kualitas awal: pilihan tersimpan kalau ada; kalau tidak, perangkat sentuh atau prosesor <= 4 inti
 * mulai di "rendah" supaya HP kelas menengah tidak panas dan patah-patah.
 */
function initialQuality(): Quality {
  try {
    const saved = localStorage.getItem(QUALITY_KEY) as Quality | null;
    if (saved && QUALITIES.includes(saved)) return saved;
  } catch {
    /* penyimpanan diblokir */
  }
  if (typeof window === "undefined") return "sedang";
  const weak = window.matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
  return weak ? "rendah" : "sedang";
}

export function Play({ setup, onExit, onRestart }: { setup: GameSetup; onExit: () => void; onRestart: () => void }) {
  const [state, setState] = useState<GameState>(() => createGame(setup.players, setup.seed));
  const [busy, setBusy] = useState(false);
  // Kartu yang sedang dibuka beserta pemiliknya (giliran sudah bisa pindah saat kartu tampil).
  const [shown, setShown] = useState<{ card: CardDef; owner: number; from: { x: number; y: number } } | null>(null);
  const [quality, setQualityState] = useState<Quality>(initialQuality);
  // Pilihan kualitas dari pemain disimpan; yang otomatis (turun karena fps rendah) tidak.
  const setQuality = useCallback((q: Quality) => {
    setQualityState(q);
    try {
      localStorage.setItem(QUALITY_KEY, q);
    } catch {
      /* penyimpanan diblokir: pilihan berlaku untuk sesi ini saja */
    }
  }, []);
  const [showRules, setShowRules] = useState(() => {
    try {
      return localStorage.getItem(RULES_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [follow, setFollow] = useState(true);
  const [fast, setFast] = useState(false);
  const [mute, setMute] = useState(isMuted);
  const [shakeKey, setShakeKey] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [banner, setBanner] = useState<string[] | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastId = useRef(0);
  const tagEls = useRef<(HTMLElement | null)[]>([]);
  const deckScreen = useRef<DeckScreen | null>({ kesempatan: { x: 0, y: 0 }, musibah: { x: 0, y: 0 } });
  const nav = useRef<CameraNav | null>(null);
  // Petak yang sedang dilihat infonya (klik/ketuk petak di papan).
  const [inspect, setInspect] = useState<number | null>(null);
  // Lemparan dadu: kocok (tahan) -> lempar (lepas) -> fisika -> baru keadaan game diperbarui.
  const [shaking, setShaking] = useState(false);
  const [charging, setCharging] = useState(false);
  const [power, setPower] = useState(0);
  const [throwSpec, setThrowSpec] = useState<ThrowSpec | null>(null);
  const [draw, setDraw] = useState<Draw | null>(null);
  const [cinematic, setCinematic] = useState<Cinematic | null>(null);
  const [fx, setFx] = useState<Zone[]>([]);
  const pending = useRef<{ prev: GameState; next: GameState } | null>(null);
  const chargeStart = useRef(0);

  useEffect(() => unlockAudio(), []);

  const me = state.players.find((p) => !p.bot);
  const cur = state.players[state.turn];
  const myTurn = !!cur && !cur.bot && state.phase !== "over";
  const card = shown?.card ?? null;
  const cardIsMine = shown ? !state.players[shown.owner].bot : false;

  /** Umpan balik setelah animasi selesai: angka melayang, suara, banner bencana, guncangan. */
  const feedback = useCallback((prev: GameState, next: GameState, owner: number) => {
    const fresh = next.log.slice(Math.max(0, next.log.length - (next.seq - prev.seq)));
    const add: Toast[] = [];
    next.players.forEach((p, i) => {
      const q = prev.players[i];
      const d = (text: string, good: boolean) => add.push({ id: ++toastId.current, slot: i, text, good });
      if (p.wallet !== q.wallet) d(`${p.wallet > q.wallet ? "+" : "-"}${rpShort(Math.abs(p.wallet - q.wallet))}`, p.wallet > q.wallet);
      if (p.health !== q.health) d(`${p.health > q.health ? "+" : ""}${p.health - q.health} sehat`, p.health > q.health);
      if (p.food !== q.food) d(`${p.food > q.food ? "+" : ""}${p.food - q.food} makan`, p.food > q.food);
    });
    if (add.length) {
      setToasts((t) => [...t, ...add]);
      setTimeout(() => setToasts((t) => t.filter((x) => !add.includes(x))), 1800);
    }
    const mine = next.players[owner], was = prev.players[owner];
    const disasters = fresh.filter((e) => e.kind === "disaster" && e.text.startsWith("Akhir ronde"));
    // Level Krisis naik: ikut diumumkan di banner supaya eskalasinya terasa.
    const crisisUp = next.crisis > prev.crisis ? [`Level Krisis naik ke ${next.crisis}: bencana makin sering, harga naik`] : [];
    if (disasters.length || crisisUp.length) {
      if (disasters.length) setShakeKey((k) => k + 1);
      setBanner([...disasters.map((e) => e.text.replace(/^Akhir ronde \d+: /, "")), ...crisisUp]);
      setTimeout(() => setBanner(null), 2600 + crisisUp.length * 800);
    }
    // Suara bencana diputar oleh sinematik; di luar itu, suara untung/rugi pemilik giliran.
    if (!disasters.length) {
      if (mine.health < was.health) sfx.hurt();
      else if (mine.wallet > was.wallet) sfx.coin();
    }
    if (fresh.some((e) => e.kind === "out")) sfx.out();
    if (next.phase === "over" && prev.phase !== "over") (next.winner !== null && !next.players[next.winner].bot ? sfx.win : sfx.out)();
  }, []);

  /** Terapkan keadaan baru, lalu tahan UI selama bidak berjalan dan kartu ditarik. */
  const commit = useCallback((prev: GameState, next: GameState, a: Action) => {
    stateRef.current = next;
    setState(next);
    let wait = 0;
    next.players.forEach((p, i) => (wait = Math.max(wait, moveDuration(prev.players[i].pos, p.pos))));
    if (a.type !== "roll") sfx.click();
    const reveal = () => {
      feedback(prev, next, prev.turn);
      const finish = () => {
        const c = a.type === "roll" ? next.lastCard : null;
        if (!c) return setBusy(false);
        // Kartu teratas terangkat dan berbalik di dek 3D, lalu kartu besar terbang keluar dari dek itu.
        setDraw({ key: Date.now(), deck: c.deck, title: c.title });
        sfx.card();
        setTimeout(() => {
          setShown({ card: c, owner: prev.turn, from: deckScreen.current?.[c.deck] ?? { x: 0, y: 0 } });
          setBusy(false);
        }, 380);
      };
      // Bencana baru (petak bencana atau akhir ronde): putar sinematik di dunia dulu.
      const fresh = next.log.slice(Math.max(0, next.log.length - (next.seq - prev.seq)));
      const zones = [...new Set(fresh.filter((e) => e.kind === "disaster" && e.zone).map((e) => e.zone!))];
      if (!zones.length) return finish();
      setCinematic({ key: Date.now(), zones });
      setFx(zones);
      setShakeKey((k) => k + 1);
      if (zones.includes("utara")) sfx.eruption();
      if (zones.includes("selatan")) sfx.flood();
      if (zones.includes("barat")) sfx.wildfire();
      if (zones.includes("timur")) sfx.siren();
      setTimeout(() => {
        setFx([]);
        finish();
      }, CINEMATIC_SECONDS * 1000);
    };
    setBusy(true);
    setTimeout(reveal, wait * 1000 + 150);
  }, [feedback]);

  /** Lempar dadu: mesin menentukan angka sekarang, layar menampilkannya setelah dadu diam. */
  const throwDice = useCallback((pow: number) => {
    const prev = stateRef.current;
    if (prev.phase !== "roll" || pending.current) return;
    const next = applyAction(prev, { type: "roll" });
    pending.current = { prev, next };
    setShaking(false);
    setBusy(true);
    sfx.throw();
    setThrowSpec({ key: Date.now(), power: pow, faces: next.dice! });
  }, []);

  const onSettled = useCallback(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    commit(p.prev, p.next, { type: "roll" });
  }, [commit]);

  const act = useCallback((a: Action) => {
    if (a.type === "roll") throwDice(0.3 + Math.random() * 0.6);
    else {
      const prev = stateRef.current;
      commit(prev, applyAction(prev, a), a);
    }
  }, [commit, throwDice]);

  const startCharge = useCallback(() => {
    const s0 = stateRef.current;
    if (charging || busy || shown || s0.phase !== "roll" || s0.players[s0.turn].bot) return;
    chargeStart.current = performance.now();
    setCharging(true);
    setShaking(true);
  }, [charging, busy, shown]);

  const release = useCallback(() => {
    if (!charging) return;
    setCharging(false);
    throwDice(Math.max(0.15, pingpong((performance.now() - chargeStart.current) / 1000 / CHARGE_PERIOD)));
  }, [charging, throwDice]);

  // Meteran tenaga bergerak selama tombol ditahan.
  useEffect(() => {
    if (!charging) return;
    let raf = 0;
    const tick = () => {
      setPower(pingpong((performance.now() - chargeStart.current) / 1000 / CHARGE_PERIOD));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [charging]);

  // Kartu milik bot menutup sendiri; kartu milik kamu menunggu tombol Lanjut.
  useEffect(() => {
    if (!shown || cardIsMine) return;
    const t = setTimeout(() => setShown(null), fast ? 1400 : 2600);
    return () => clearTimeout(t);
  }, [shown, cardIsMine, fast]);

  // Giliran bot: tunggu animasi dan kartu tertutup, lalu ambil keputusan.
  useEffect(() => {
    if (state.phase === "over" || busy || shown || !cur?.bot) return;
    const think = fast ? BOT_THINK_MS / 3 : BOT_THINK_MS;
    if (state.phase === "roll") {
      // Bot juga mengocok sebentar sebelum melempar.
      const t1 = setTimeout(() => setShaking(true), think);
      const t2 = setTimeout(() => throwDice(0.3 + Math.random() * 0.6), think + (fast ? 250 : 650));
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    const t = setTimeout(() => act(chooseAction(state, setup.difficulty)), think);
    return () => clearTimeout(t);
  }, [state, busy, shown, cur, act, throwDice, setup.difficulty, fast]);

  // Bunyi penanda saat giliranmu tiba.
  const yourTurnNow = myTurn && !busy && state.phase === "roll";
  useEffect(() => {
    if (yourTurnNow) sfx.turn();
  }, [yourTurnNow]);

  // Pintasan keyboard: tahan Spasi untuk mengocok lalu lepas untuk melempar, Enter lempar cepat,
  // Spasi/Enter menutup kartu, angka 1-9 memilih aksi.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "SELECT") return;
      // Kamera bisa diatur kapan saja: + perbesar, - perkecil, 0 kembali ke posisi awal.
      if (e.key === "+" || e.key === "=") return nav.current?.zoom(0.8);
      if (e.key === "-") return nav.current?.zoom(1.25);
      if (e.key === "0") return nav.current?.reset();
      if (showRules) {
        if (e.key === "Escape") setShowRules(false);
        return; // layar aturan terbuka: jangan lempar dadu atau pilih aksi di belakangnya
      }
      if (e.key === "Escape" && inspect !== null) return setInspect(null);
      if (shown && cardIsMine && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setShown(null);
        return;
      }
      if (!myTurn || busy || shown) return;
      if (state.phase === "roll" && e.key === " ") {
        e.preventDefault();
        if (!e.repeat) startCharge();
      } else if (state.phase === "roll" && e.key === "Enter") {
        e.preventDefault();
        throwDice(0.3 + Math.random() * 0.6);
      } else if (state.phase === "choose" && /^[1-9]$/.test(e.key)) {
        const o = state.options[Number(e.key) - 1];
        if (o) act({ type: "choose", id: o.id });
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === " ") release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [myTurn, busy, shown, cardIsMine, state, act, startCharge, release, throwDice, inspect, showRules]);

  const recent = useMemo(() => state.log.slice(-4).reverse(), [state.log]);
  const ranking = useMemo(
    () => [...state.players].sort((a, b) => (a.id === state.winner ? -1 : b.id === state.winner ? 1 : (b.outRound ?? 99) - (a.outRound ?? 99))),
    [state.players, state.winner],
  );
  const pct = state.ihsgChange;

  return (
    <div className={css.root}>
      <div className={css.canvas}>
        <Canvas shadows camera={{ position: [4, 15, 16], fov: 42 }} dpr={[1, QUALITY_DPR[quality]]} gl={{ antialias: true }}>
          {/* fps jatuh terus di bawah ~30: turunkan kualitas satu tingkat (tidak disimpan sebagai pilihan pemain). */}
          <PerformanceMonitor bounds={() => [30, 55]} flipflops={2} onDecline={() => setQualityState((q) => (q === "tinggi" ? "sedang" : "rendah"))} />
          <World state={state} quality={quality} follow={follow} shakeKey={shakeKey} tagEls={tagEls} shaking={shaking} throwSpec={throwSpec} onSettled={onSettled} draw={draw} cinematic={cinematic} deckScreen={deckScreen} nav={nav} inspect={inspect} onTile={setInspect} />
        </Canvas>
      </div>

      {inspect !== null && <TilePanel state={state} index={inspect} onClose={() => setInspect(null)} />}

      <div className={css.camCtl} role="group" aria-label="Kamera">
        <button type="button" onClick={() => nav.current?.zoom(0.8)} aria-label="Perbesar" title="Perbesar (+)">
          +
        </button>
        <button type="button" onClick={() => nav.current?.zoom(1.25)} aria-label="Perkecil" title="Perkecil (-)">
          −
        </button>
        <button type="button" className={css.camHome} onClick={() => nav.current?.reset()} title="Kembali ke posisi awal (0)">
          Posisi awal
        </button>
      </div>

      {fx.length > 0 && (
        <div className={css.fxLayer} aria-hidden="true">
          {fx.map((z) => (
            <div key={z} className={css[`fx_${z}`]} />
          ))}
        </div>
      )}

      {/* Label nama dan angka melayang di atas bidak; posisinya digeser oleh World setiap frame. */}
      <div className={css.tagLayer} aria-hidden="true">
        {state.players.map((p, i) => {
          // Hanya pemain yang sedang giliran yang diberi nama lengkap; lainnya titik warna berinisial,
          // supaya label tidak menumpuk dan menutupi petak saat bidak berkumpul.
          const active = i === state.turn && state.phase !== "over";
          const label = p.bot ? p.name : "Kamu";
          return (
            <div key={p.id} ref={(el) => void (tagEls.current[i] = el)} className={css.tagWrap}>
              {toasts
                .filter((t) => t.slot === i)
                .map((t) => (
                  <span key={t.id} className={`${css.toast} ${t.good ? css.toastGood : css.toastBad}`}>
                    {t.text}
                  </span>
                ))}
              <span className={active ? css.tag : css.tagDot} style={{ background: PLAYER_COLORS[i], opacity: p.alive ? 1 : 0.45 }}>
                {active ? label : label[0]}
              </span>
            </div>
          );
        })}
      </div>

      <header className={`${css.panel} ${css.topbar}`}>
        <div className={css.brand}>
          <span>+62</span>WNI<span>POLY</span>
        </div>
        <div className={css.stat}>
          Ronde
          <b>
            {state.round}/{state.maxRounds}
          </b>
        </div>
        <div className={css.stat} aria-label={`Level Krisis ${state.crisis}`} title="Level Krisis naik tiap 2 ronde: makin banyak zona kena bencana, dampaknya makin parah, harga makin mahal.">
          <span>
            <span className={css.wide}>Level </span>Krisis {state.crisis}
          </span>
          <div className={css.crisisBar}>
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} className={i < state.crisis ? css.on : undefined} />
            ))}
          </div>
        </div>
        <div className={css.stat} title="IHSG: indeks saham. Kalau anjlok, rupiah melemah dan harga makanan ikut naik. Saham bisa dibeli di petak Gedung Bursa.">
          IHSG
          <b className={pct < 0 ? css.down : css.up}>
            {Math.round(state.ihsg * 51.85).toLocaleString("id-ID")} {pct < 0 ? "▼" : "▲"}
            <span className={css.wide}>{Math.abs(pct).toFixed(1)}%</span>
          </b>
        </div>
        {state.halted && <span className={css.halt}>TRADING HALT</span>}
        <div className={css.spacer} />
        <button type="button" className={css.ghost} onClick={() => setShowRules(true)} aria-label="Cara bertahan (aturan)" title="Cara bertahan">
          ?
        </button>
        <details className={css.menu}>
          <summary className={css.ghost}>
            <span className={css.wide}>Pengaturan</span>
            <span className={css.narrow}>Menu</span>
          </summary>
          <div className={`${css.panel} ${css.menuBody}`}>
            <button type="button" className={css.ghost} aria-pressed={follow} onClick={() => setFollow((v) => !v)}>
              {follow ? "Kamera: ikuti pemain" : "Kamera: bebas"}
            </button>
            <button type="button" className={css.ghost} aria-pressed={fast} onClick={() => setFast((v) => !v)}>
              {fast ? "Bot: cepat" : "Bot: normal"}
            </button>
            <button
              type="button"
              className={css.ghost}
              aria-pressed={!mute}
              onClick={() => {
                setMuted(!mute);
                setMute(!mute);
              }}
            >
              {mute ? "Suara: mati" : "Suara: nyala"}
            </button>
            <select className={css.select} aria-label="Kualitas grafis" value={quality} onChange={(e) => setQuality(e.target.value as Quality)}>
              <option value="tinggi">Grafis tinggi</option>
              <option value="sedang">Grafis sedang</option>
              <option value="rendah">Grafis rendah</option>
            </select>
            <small className={css.hint}>Tahan Spasi: kocok, lepas: lempar · Enter: lempar cepat · 1-9: pilih aksi · +/-: zoom · 0: posisi awal · klik petak: info</small>
          </div>
        </details>
        <button type="button" className={css.ghost} onClick={onExit}>
          Keluar
        </button>
      </header>

      <aside className={css.players} aria-label="Status pemain">
        {state.players.map((p, i) => {
          const hp = Math.max(0, p.health);
          const color = hp > 60 ? "#2fa84f" : hp > 30 ? "#e3b341" : "#e5484d";
          return (
            <div
              key={p.id}
              className={`${css.panel} ${css.player} ${i === state.turn && state.phase !== "over" ? css.active : ""} ${p.alive ? "" : css.out}`}
              style={{ ["--c" as string]: PLAYER_COLORS[i] }}
            >
              <div className={css.pname}>
                <span>
                  {p.name}
                  {p.bot ? "" : " (kamu)"}
                </span>
                <small>{CHARACTERS[p.character].name}</small>
              </div>
              <div className={css.bar} role="meter" aria-label="Kesehatan" aria-valuemin={0} aria-valuemax={RULES.maxHealth} aria-valuenow={hp}>
                <i style={{ width: `${(hp / RULES.maxHealth) * 100}%`, background: color }} />
              </div>
              {/* Angka berdenyut merah saat mendekati salah satu cara gugur. */}
              <div className={css.nums}>
                <span>
                  Sehat <b className={p.alive && hp <= 30 ? css.danger : undefined}>{hp}</b>
                </span>
                <span>
                  <span className={css.wide}>Dompet </span>
                  <b className={p.alive && p.wallet < RULES.debtLimit / 2 ? css.danger : p.wallet < 0 ? css.down : undefined}>{rpShort(p.wallet)}</b>
                </span>
                <span>
                  Makan <b className={p.alive && p.food <= 1 ? css.danger : undefined}>{p.food}</b>
                </span>
              </div>
              <div className={css.badges}>
                {!p.alive && <span className={css.badge}>Gugur: {p.cause}</span>}
                {p.jailed > 0 && <span className={css.badge}>Lapas {p.jailed}</span>}
                {p.skip > 0 && <span className={css.badge}>Lewati {p.skip}</span>}
                {p.protect && <span className={css.badge}>Aman ronde ini</span>}
                {p.loans.length > 0 && <span className={css.badge}>Cicilan {p.loans.length}</span>}
                {p.stocks > 0 && <span className={css.badge}>Saham {rpShort(p.stocks * state.ihsg)}</span>}
              </div>
            </div>
          );
        })}
      </aside>

      {state.phase !== "over" && cur && (
        <section className={`${css.panel} ${css.action} ${myTurn && !busy && state.phase === "roll" ? css.yourTurn : ""}`} aria-live="polite">
          <div className={css.turn}>
            <span>
              Giliran <b>{cur.name}</b> di <b>{TILES[cur.pos].name}</b>
            </span>
            {state.dice && (
              <span>
                Dadu <b>{state.dice[0] + state.dice[1]}</b>
              </span>
            )}
          </div>
          {busy && !charging ? (
            <div className={css.thinking}>…</div>
          ) : !myTurn ? (
            <div className={css.thinking}>{cur.name} sedang berpikir…</div>
          ) : state.phase === "roll" ? (
            <button
              type="button"
              className={`${css.primary} ${css.rollBtn}`}
              onPointerDown={startCharge}
              onPointerUp={release}
              onPointerLeave={release}
              onContextMenu={(e) => e.preventDefault()}
              style={{ ["--p" as string]: charging ? power : 0 }}
            >
              <span className={css.rollFill} aria-hidden="true" />
              <span className={css.rollText}>{charging ? "Lepas untuk melempar!" : "Tahan untuk mengocok dadu"}</span>
            </button>
          ) : (
            <div className={css.options}>
              {state.options.map((o, i) => (
                <button key={o.id} type="button" className={css.option} onClick={() => act({ type: "choose", id: o.id })} disabled={!!card}>
                  <kbd className={css.kbd}>{i + 1}</kbd>
                  {o.label}
                  <small>{o.detail}</small>
                  <span className={css.evRow}>
                    {evChips(o.ev).map((c) => (
                      <span key={c.text} className={c.good ? css.evGood : css.evBad}>
                        {c.text}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <footer className={`${css.panel} ${css.ticker}`} aria-label="Berita">
        <span className={css.tickerLabel}>BERITA DUKA</span>
        <span className={css.tickerText}>
          {recent.map((e: LogEvent, i) => (
            <span key={`${state.log.length}-${i}`} className={css[`k_${e.kind}`]}>
              {e.text}
              {i < recent.length - 1 ? "  •  " : ""}
            </span>
          ))}
        </span>
      </footer>

      {showRules && (
        <div className={css.overlay} role="dialog" aria-modal="true" aria-labelledby="judul-aturan">
          <div className={`${css.panel} ${css.rules}`}>
            <h2 id="judul-aturan">Cara bertahan</h2>
            <p>Bukan siapa yang paling kaya. Siapa yang paling lama bertahan.</p>
            <dl>
              <div>
                <dt>Jaga tiga hal</dt>
                <dd>
                  <b>Sehat</b>, <b>Dompet</b>, dan <b>Makan</b>. Satu porsi makan habis tiap giliran. Angka yang hampir habis akan berdenyut merah.
                </dd>
              </div>
              <div>
                <dt>Kamu gugur kalau</dt>
                <dd>
                  Sehat habis, kelaparan {RULES.starveTurnsToDie} giliran berturut-turut, atau utang lewat {rpShort(-RULES.debtLimit)} (diburu pinjol).
                </dd>
              </div>
              <div>
                <dt>Menang</dt>
                <dd>Jadi WNI terakhir yang masih hidup, atau yang paling kuat bertahan saat ronde {RULES.maxRounds} habis.</dd>
              </div>
              <div>
                <dt>Tiap giliran</dt>
                <dd>Tahan tombol untuk mengocok dadu, lepas untuk melempar. Di petak tujuan, pilih aksi: kerja, makan, istirahat, atau aksi khas petak itu. Klik petak mana pun untuk melihat isinya.</dd>
              </div>
              <div>
                <dt>Level Krisis</dt>
                <dd>Naik tiap 2 ronde. Bencana akhir ronde makin sering dan makin parah, harga makanan makin mahal.</dd>
              </div>
              <div>
                <dt>IHSG</dt>
                <dd>Kalau anjlok, rupiah melemah dan harga ikut naik. Saham bisa dibeli dan dijual di petak Gedung Bursa.</dd>
              </div>
            </dl>
            <button
              type="button"
              className={css.primary}
              autoFocus
              onClick={() => {
                setShowRules(false);
                try {
                  localStorage.setItem(RULES_KEY, "1");
                } catch {
                  /* penyimpanan diblokir: layar aturan muncul lagi di game berikutnya */
                }
              }}
            >
              Paham, mulai bertahan
            </button>
          </div>
        </div>
      )}

      {banner && (
        <div className={css.banner} role="status">
          <b>Akhir ronde: bencana!</b>
          {banner.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}

      {card && (
        <div className={css.overlay} role="dialog" aria-modal="true" aria-label={`Kartu ${card.title}`}>
          <div className={css.cardFly} key={card.id + shown!.owner} style={{ ["--fx" as string]: `${shown!.from.x}px`, ["--fy" as string]: `${shown!.from.y}px` }}>
          <div className={css.cardFlip}>
          <div className={css.cardBack + " " + (card.deck === "kesempatan" ? css.deckK : css.deckM)} aria-hidden="true">
            <span>{card.deck === "kesempatan" ? "?" : "!"}</span>
            <b>{card.deck === "kesempatan" ? "KESEMPATAN" : "MUSIBAH"}</b>
          </div>
          <div className={css.card + " " + (card.deck === "kesempatan" ? css.deckK : css.deckM)}>
            <span className={css.deck}>{card.deck === "kesempatan" ? "? KESEMPATAN" : "! MUSIBAH"}</span>
            <h2>{card.title}</h2>
            <CardArt art={card.art} deck={card.deck} />
            <p>{card.text}</p>
            <ul className={css.effect}>
              {effectLines(card).map((l) => (
                <li key={l.who}>
                  <b>{l.who}</b> {l.what}
                </li>
              ))}
            </ul>
            {card.fakta && (
              <div className={css.fact}>
                <b>Di dunia nyata</b>
                {card.fakta}{" "}
                {card.sumber && (
                  <a href={card.sumber} target="_blank" rel="noopener noreferrer">
                    Sumber
                  </a>
                )}
              </div>
            )}
            {cardIsMine && (
              <button type="button" className={css.cardBtn} onClick={() => setShown(null)} autoFocus>
                Lanjut
              </button>
            )}
          </div>
          </div>
          </div>
        </div>
      )}

      {state.phase === "over" && (
        <div className={css.overlay} role="dialog" aria-modal="true" aria-label="Permainan selesai">
          <div className={`${css.panel} ${css.over}`}>
            <h2>{state.winner === me?.id ? "Kamu bertahan!" : state.winner !== null ? `${state.players[state.winner].name} bertahan` : "Tidak ada yang bertahan"}</h2>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              {state.winner === me?.id ? "WNI terakhir yang masih berdiri." : me?.alive ? "" : `Kamu gugur di ronde ${me?.outRound}: ${me?.cause}.`}
            </p>
            <div className={css.rank}>
              {ranking.map((p, i) => (
                <div key={p.id}>
                  <span>
                    {i + 1}. {p.name} ({CHARACTERS[p.character].name})
                  </span>
                  <span>{p.alive ? "Bertahan" : `Gugur ronde ${p.outRound}`}</span>
                </div>
              ))}
            </div>
            <div className={css.row}>
              <button type="button" className={css.primary} onClick={onRestart}>
                Main lagi
              </button>
              <button type="button" className={css.ghost} onClick={onExit}>
                Ganti karakter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
