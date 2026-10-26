"use client";

import { CARDS, DISASTERS, RULES, TILES } from "@/engine/data";
import { describeTile, type GameState } from "@/engine/game";
import { PLAYER_COLORS } from "./World";
import { rpShort } from "./money";
import css from "./Game.module.css";

const ZONE_NAME = { selatan: "Selatan · pesisir banjir", barat: "Barat · hutan terbakar", utara: "Utara · gunung meletus", timur: "Timur · pusat kekuasaan" } as const;
const KIND_NAME = { sudut: "Pojok", biasa: "Petak", kesempatan: "Kartu Kesempatan", musibah: "Kartu Musibah", bencana: "Petak bencana", bursa: "Bursa saham" } as const;

/** Panel info petak yang diklik: aksi dan harga saat ini, siapa yang berdiri di sana, dan risikonya. */
export function TilePanel({ state, index, onClose }: { state: GameState; index: number; onClose: () => void }) {
  const tile = TILES[index];
  const me = Math.max(0, state.players.findIndex((p) => !p.bot));
  const lines = describeTile(state, me, index);
  const here = state.players.map((p, i) => ({ p, i })).filter(({ p }) => p.alive && p.pos === index);
  const d = DISASTERS[tile.zone];
  const k = 1 + (state.crisis - 1) * 0.3;
  const deckCount = tile.kind === "kesempatan" || tile.kind === "musibah" ? CARDS.filter((c) => c.deck === tile.kind).length : 0;

  return (
    <aside className={`${css.panel} ${css.tilePanel}`} aria-label={`Info petak ${tile.name}`} data-zone={tile.zone}>
      <header>
        <small>
          #{index} · {ZONE_NAME[tile.zone]}
        </small>
        <h2>{tile.name}</h2>
        <span className={css.tileKind}>{KIND_NAME[tile.kind]}</span>
        <button type="button" className={css.ghost} onClick={onClose} aria-label="Tutup info petak">
          Tutup
        </button>
      </header>

      {lines.length > 0 && (
        <ul className={css.tileLines}>
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}

      {deckCount > 0 && <p className={css.tileNote}>{deckCount} kartu di dek ini. Isinya bisa dilihat di Glosarium.</p>}

      {tile.kind === "bencana" && (
        <p className={css.tileNote}>
          Mendarat di sini: -{Math.round(d.health * 1.5 * k)} kesehatan{d.wallet ? `, -${rpShort(d.wallet * 1.5 * k)}` : ""}
          {d.food ? `, -${d.food} makanan` : ""} pada Level Krisis {state.crisis}.
        </p>
      )}

      {tile.special === "lapas" && <p className={css.tileNote}>Hukuman {RULES.jailTurns} giliran. Kamar VIP {rpShort(RULES.jailBribe)}.</p>}

      <p className={css.tileNote}>
        Bencana akhir ronde di zona ini: {d.name}, sekitar -{Math.round(d.health * k)} kesehatan per pemain yang berdiri di zona {tile.zone}.
      </p>

      <div className={css.tileHere}>
        <b>Di petak ini:</b>{" "}
        {here.length === 0 ? (
          <span>tidak ada pemain</span>
        ) : (
          here.map(({ p, i }) => (
            <span key={p.id} className={css.tileWho} style={{ background: PLAYER_COLORS[i] }}>
              {p.bot ? p.name : "Kamu"}
            </span>
          ))
        )}
      </div>
    </aside>
  );
}
