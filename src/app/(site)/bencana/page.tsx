import type { Metadata } from "next";
import Link from "next/link";
import { CARDS, DISASTERS, RULES, TILES } from "@/engine/data";
import { rpShort } from "@/game/money";
import { ZONE_INFO } from "../zones";
import css from "../site.module.css";

export const metadata: Metadata = { title: "Bencana · +62WNIPOLY" };

// Sama dengan mesin aturan (game.ts endRound): level naik tiap 2 ronde, zona yang kena dan pengali ikut naik.
const level = (round: number) => RULES.crisisStart + Math.floor((round - 1) / 2);
const zonesHit = (crisis: number) => Math.min(4, 1 + Math.floor(crisis / 3));
const mult = (crisis: number) => 1 + (crisis - 1) * 0.3;
const ROUNDS = [1, 5, 9, 13, 17, 21];

export default function BencanaPage() {
  const national = CARDS.filter((c) => c.deck === "musibah" && c.effect.all);
  return (
    <main className={css.page}>
      <header className={css.pageHead}>
        <h1>Bencana</h1>
        <p>
          Di akhir setiap ronde, bencana menghantam zona acak. Pemain yang sedang berdiri di zona itu kena, kecuali sedang terlindungi (ikut evakuasi, jaga pos
          pantau, kabur lewat bandara, atau bayar orang dalam).
        </p>
      </header>

      <div className={css.disasters}>
        {ZONE_INFO.map((z) => {
          const d = DISASTERS[z.id];
          const tile = TILES.find((t) => t.zone === z.id && t.kind === "bencana")!;
          const cards = CARDS.filter((c) => c.effect.zone?.zone === z.id);
          return (
            <article key={z.id} id={z.id} className={css.disaster} style={{ ["--z" as string]: z.color }}>
              <header>
                <small>{z.wind}</small>
                <h2>{d.name}</h2>
              </header>
              <p>{z.long}</p>
              <p className={css.scene}>{z.scene}</p>
              <dl className={css.damage}>
                <div>
                  <dt>Kesehatan</dt>
                  <dd>-{d.health}</dd>
                </div>
                <div>
                  <dt>Makanan</dt>
                  <dd>{d.food ? `-${d.food}` : "0"}</dd>
                </div>
                <div>
                  <dt>Uang</dt>
                  <dd>{d.wallet ? `-${rpShort(d.wallet)}` : "0"}</dd>
                </div>
              </dl>
              <p className={css.small}>
                Angka dasar per ronde, dikali pengali Level Krisis. Mendarat di petak <b>{tile.name}</b> langsung kena, dengan potongan kesehatan dan uang 1,5 kali lipat.
              </p>
              {cards.length > 0 && (
                <p className={css.small}>
                  Kartu terkait: <b>{cards.map((c) => c.title).join(", ")}</b>
                </p>
              )}
            </article>
          );
        })}
      </div>

      <section className={css.crisis}>
        <div>
          <h2 className={css.h2}>Level Krisis</h2>
          <p className={css.lead}>Makin lama permainan berjalan, makin banyak zona yang kena tiap ronde dan makin parah dampaknya. Harga makanan juga ikut naik.</p>
        </div>
        <table>
          <caption className={css.srOnly}>Perkembangan Level Krisis per ronde</caption>
          <thead>
            <tr>
              <th scope="col">Ronde</th>
              <th scope="col">Level</th>
              <th scope="col">Zona kena</th>
              <th scope="col">Pengali</th>
            </tr>
          </thead>
          <tbody>
            {ROUNDS.map((r) => {
              const c = level(r);
              return (
                <tr key={r}>
                  <td>{r}</td>
                  <td>{c}</td>
                  <td>{zonesHit(c)} dari 4</td>
                  <td>×{mult(c).toFixed(1).replace(".", ",")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className={css.wrapFlat}>
        <h2 className={css.h2}>Musibah nasional</h2>
        <p className={css.lead}>Kartu Musibah yang tidak peduli kamu berdiri di mana. Semua pemain kena.</p>
        <ul className={css.nationalList}>
          {national.map((c) => (
            <li key={c.id}>
              <b>{c.title}</b>
              <span>{c.text}</span>
            </li>
          ))}
        </ul>
        <p className={css.pageCta}>
          <Link href="/glosarium" className={css.ghost}>
            Semua kartu di glosarium
          </Link>
        </p>
      </section>
    </main>
  );
}
