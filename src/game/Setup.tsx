"use client";

import Link from "next/link";
import { useState } from "react";
import { CHARACTERS, type CharacterId } from "@/engine/data";
import type { Difficulty } from "@/engine/bot";
import type { PlayerConfig } from "@/engine/game";
import css from "./Game.module.css";

export type GameSetup = { players: PlayerConfig[]; difficulty: Difficulty; seed: number };

const BOT_NAMES = ["Bang Udin", "Mbak Sari", "Pak Ujang"];

import { rpShort } from "./money";
export { rpShort };

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
      <div className={css.setupInner}>
        <Link href="/" className={css.backLink}>
          ← Kembali ke beranda
        </Link>
        <h1 className={css.hero}>
          <span>+62</span>WNI<span>POLY</span>
        </h1>
        <p className={css.tagline}>Bukan siapa yang paling kaya. Siapa yang paling kuat bertahan jadi WNI.</p>

        <div className={css.field}>
          <label htmlFor="nama">Nama kamu</label>
          <input id="nama" className={css.input} value={name} maxLength={16} onChange={(e) => setName(e.target.value)} />
        </div>

        <fieldset className={css.field}>
          <legend>Pilih WNI</legend>
          <div className={css.chars}>
            {Object.values(CHARACTERS).map((c) => (
              <button key={c.id} type="button" className={css.char} aria-pressed={character === c.id} onClick={() => setCharacter(c.id)}>
                <b>{c.name}</b>
                <p>{c.blurb}</p>
                <div className={css.chips}>
                  <span className={css.chip}>Sehat {c.health}</span>
                  <span className={css.chip}>{rpShort(c.wallet)}</span>
                  <span className={css.chip}>Makan {c.food}</span>
                  <span className={css.chip}>Kerja {rpShort(c.workPay)}</span>
                </div>
              </button>
            ))}
          </div>
        </fieldset>

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
        </fieldset>

        <button type="button" className={`${css.primary} ${css.start}`} onClick={start}>
          Mulai bertahan hidup
        </button>
      </div>
    </main>
  );
}
