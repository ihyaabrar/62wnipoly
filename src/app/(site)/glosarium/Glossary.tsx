"use client";

import { useMemo, useState } from "react";
import { CARDS, type CardDef, type Zone } from "@/engine/data";
import { CardArt } from "@/game/CardArt";
import { effectLines } from "@/game/cardText";
import { ZONE_INFO } from "../zones";
import css from "../site.module.css";

export type TileRow = { index: number; name: string; zone: Zone; kind: string; lines: string[] };

type Filter = "semua" | "kesempatan" | "musibah" | "massal";
const FILTERS: { id: Filter; label: string; test: (c: CardDef) => boolean }[] = [
  { id: "semua", label: "Semua", test: () => true },
  { id: "kesempatan", label: "Kesempatan", test: (c) => c.deck === "kesempatan" },
  { id: "musibah", label: "Musibah", test: (c) => c.deck === "musibah" },
  { id: "massal", label: "Kena semua pemain", test: (c) => !!(c.effect.all || c.effect.others) },
];

export function Glossary({ tiles }: { tiles: TileRow[] }) {
  const [tab, setTab] = useState<"kartu" | "petak">("kartu");
  const [filter, setFilter] = useState<Filter>("semua");
  const [q, setQ] = useState("");

  const cards = useMemo(() => {
    const test = FILTERS.find((f) => f.id === filter)!.test;
    const needle = q.trim().toLowerCase();
    return CARDS.filter((c) => test(c) && (!needle || `${c.title} ${c.text} ${c.fakta ?? ""}`.toLowerCase().includes(needle)));
  }, [filter, q]);

  return (
    <>
      <div className={css.tabs} role="tablist" aria-label="Isi glosarium">
        <button type="button" role="tab" id="tab-kartu" aria-selected={tab === "kartu"} aria-controls="panel-kartu" onClick={() => setTab("kartu")}>
          Kartu <span>{CARDS.length}</span>
        </button>
        <button type="button" role="tab" id="tab-petak" aria-selected={tab === "petak"} aria-controls="panel-petak" onClick={() => setTab("petak")}>
          Petak <span>{tiles.length}</span>
        </button>
      </div>

      {tab === "kartu" ? (
        <section id="panel-kartu" role="tabpanel" aria-labelledby="tab-kartu">
          <div className={css.toolbar}>
            <div className={css.chips} role="group" aria-label="Saring kartu">
              {FILTERS.map((f) => (
                <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <label className={css.search}>
              <span>Cari kartu</span>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="mis. beras, ojol, demo" />
            </label>
          </div>
          <p className={css.count} aria-live="polite">
            {cards.length} kartu
          </p>
          {cards.length === 0 ? (
            <div className={css.empty}>
              <p>Tidak ada kartu yang cocok dengan &quot;{q}&quot;.</p>
              <button
                type="button"
                className={css.ghost}
                onClick={() => {
                  setQ("");
                  setFilter("semua");
                }}
              >
                Tampilkan semua kartu
              </button>
            </div>
          ) : (
            <div className={css.cardGrid}>
              {cards.map((c) => (
                <article key={c.id} className={c.deck === "kesempatan" ? css.cardK : css.cardM}>
                  <small>{c.deck === "kesempatan" ? "? KESEMPATAN" : "! MUSIBAH"}</small>
                  <h3>{c.title}</h3>
                  <CardArt art={c.art} deck={c.deck} />
                  <p>{c.text}</p>
                  <ul className={css.effects}>
                    {effectLines(c).map((l) => (
                      <li key={l.who}>
                        <b>{l.who}</b> {l.what}
                      </li>
                    ))}
                  </ul>
                  {c.fakta && (
                    <p className={css.fact}>
                      <b>Di dunia nyata.</b> {c.fakta}{" "}
                      {c.sumber && (
                        <a href={c.sumber} target="_blank" rel="noopener noreferrer">
                          Baca sumber
                        </a>
                      )}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section id="panel-petak" role="tabpanel" aria-labelledby="tab-petak">
          {ZONE_INFO.map((z) => (
            <div key={z.id} className={css.tileZone} style={{ ["--z" as string]: z.color }}>
              <h2>
                {z.wind}: {z.title}
              </h2>
              <ol>
                {tiles
                  .filter((t) => t.zone === z.id)
                  .map((t) => (
                    <li key={t.index}>
                      <span className={css.tileNo}>{t.index}</span>
                      <div>
                        <b>{t.name}</b>
                        <small>{t.kind}</small>
                        {t.lines.map((l) => (
                          <p key={l}>{l}</p>
                        ))}
                      </div>
                    </li>
                  ))}
              </ol>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
