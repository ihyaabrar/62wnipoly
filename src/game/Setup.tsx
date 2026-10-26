"use client";

import Link from "next/link";
import { useState } from "react";
import { CARDS, CHARACTERS, RULES, type CharacterId } from "@/engine/data";
import type { Difficulty } from "@/engine/bot";
import type { PlayerConfig } from "@/engine/game";
import css from "./Game.module.css";

export type GameSetup = { players: PlayerConfig[]; difficulty: Difficulty; seed: number };

const BOT_NAMES = ["Bang Udin", "Mbak Sari", "Pak Ujang"];

import { rpShort } from "./money";
export { rpShort };

const HARD: Record<Difficulty, string> = {
  mudah: "Bot sering salah memilih aksi, cocok untuk belajar.",
  normal: "Bot bermain wajar: kadang meleset, kadang jitu.",
  sulit: "Bot selalu memilih aksi yang paling aman menurut hitungan.",
};

const ALL = Object.values(CHARACTERS);
const MAX = { health: Math.max(...ALL.map((c) => c.health)), wallet: Math.max(...ALL.map((c) => c.wallet)), food: Math.max(...ALL.map((c) => c.food)) };

/** Fakta khas peran, diturunkan dari data: kerja, harga makan, pemulihan, dan kartu yang paling menyiksanya. */
function traits(id: CharacterId) {
  const c = CHARACTERS[id];
  const list = [`Kerja serabutan ${rpShort(c.workPay)}, menguras ${c.workCost} sehat`];
  if (c.foodPrice < 1) list.push(`Makan ${Math.round((1 - c.foodPrice) * 100)}% lebih murah`);
  if (c.restBonus > 0) list.push(`Istirahat memulihkan ${RULES.restHeal + c.restBonus}, bukan ${RULES.restHeal}`);
  const rawan = CARDS.filter((k) => {
    const d = k.effect.chars?.[id];
    return d && (d.wallet ?? 0) + (d.health ?? 0) * 50_000 + (d.food ?? 0) * 100_000 < 0;
  }).map((k) => k.title);
  return { list, rawan };
}

function Meter({ label, value, max, text }: { label: string; value: number; max: number; text: string }) {
  return (
    <span className={css.meter}>
      <span className={css.meterLabel}>{label}</span>
      <span className={css.meterTrack} aria-hidden="true">
        <i style={{ width: `${(value / max) * 100}%` }} />
      </span>
      <span className={css.meterValue}>{text}</span>
    </span>
  );
}

export function Setup({ onStart }: { onStart: (s: GameSetup) => void }) {
  const [name, setName] = useState("Kamu");
  const [character, setCharacter] = useState<CharacterId>("ojol");
  const [bots, setBots] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");

  const start = () => {
    // Bot memakai karakter lain secara acak, supaya tiap game berbeda.
    const others = (Object.keys(CHARACTERS) as CharacterId[]).filter((c) => c !== character).sort(() => Math.random() - 0.5);
    onStart({
      players: [{ name: name.trim() || "Kamu", character }, ...others.slice(0, bots).map((c, i) => ({ name: BOT_NAMES[i], character: c, bot: true }))],
      difficulty,
      seed: Math.floor(Math.random() * 2 ** 31),
    });
  };

  return (
    <main className={css.setup}>
      <form
        className={css.setupInner}
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <Link href="/" className={css.backLink}>
          ← Kembali ke beranda
        </Link>
        <h1 className={css.hero}>
          <span>+62</span>WNI<span>POLY</span>
        </h1>
        <p className={css.tagline}>Bukan siapa yang paling kaya. Siapa yang paling kuat bertahan jadi WNI.</p>

        <div className={css.field}>
          <label htmlFor="nama">Nama kamu</label>
          <input id="nama" className={css.input} value={name} maxLength={16} autoComplete="nickname" onChange={(e) => setName(e.target.value)} />
        </div>

        <fieldset className={css.field}>
          <legend>Pilih WNI</legend>
          <div className={css.chars}>
            {ALL.map((c) => {
              const t = traits(c.id);
              return (
                <button key={c.id} type="button" className={css.char} aria-pressed={character === c.id} onClick={() => setCharacter(c.id)}>
                  <span className={css.charName}>{c.name}</span>
                  <span className={css.charBlurb}>{c.blurb}</span>
                  <span className={css.meters}>
                    <Meter label="Sehat" value={c.health} max={MAX.health} text={String(c.health)} />
                    <Meter label="Dompet" value={c.wallet} max={MAX.wallet} text={rpShort(c.wallet)} />
                    <Meter label="Makan" value={c.food} max={MAX.food} text={`${c.food} porsi`} />
                  </span>
                  <span className={css.traits}>
                    {t.list.map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                    {t.rawan.length > 0 && <span className={css.rawan}>Rawan: {t.rawan.join(", ")}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className={css.pair}>
          <fieldset className={css.field}>
            <legend>Lawan bot</legend>
            <div className={css.seg}>
              {[1, 2, 3].map((n) => (
                <button key={n} type="button" aria-pressed={bots === n} onClick={() => setBots(n)}>
                  {n} bot
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={css.field}>
            <legend>Tingkat kesulitan</legend>
            <div className={css.seg}>
              {(["mudah", "normal", "sulit"] as Difficulty[]).map((d) => (
                <button key={d} type="button" aria-pressed={difficulty === d} onClick={() => setDifficulty(d)}>
                  {d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <p className={css.hint2} aria-live="polite">
              {HARD[difficulty]}
            </p>
          </fieldset>
        </div>

        <div className={css.startBar}>
          <p>
            <b>{name.trim() || "Kamu"}</b> sebagai {CHARACTERS[character].name}, melawan {bots} bot ({difficulty})
          </p>
          <button type="submit" className={`${css.primary} ${css.start}`}>
            Mulai bertahan hidup
          </button>
        </div>
      </form>
    </main>
  );
}
