import type { Metadata } from "next";
import Link from "next/link";
import { CARDS, CHARACTERS, RULES } from "@/engine/data";
import { deltaText } from "@/game/cardText";
import { rpShort } from "@/game/money";
import css from "../site.module.css";

export const metadata: Metadata = { title: "Peran · +62WNIPOLY" };

const MAX = { health: 120, wallet: 2_000_000, food: 8 };

export default function PeranPage() {
  return (
    <main className={css.page}>
      <header className={css.pageHead}>
        <h1>Peran</h1>
        <p>
          Enam WNI dengan kelebihan dan beban masing-masing. Angka di bawah adalah angka asli di mesin permainan. Kartu tertentu paling keras menghantam satu
          profesi.
        </p>
      </header>
      <div className={css.roles}>
        {Object.values(CHARACTERS).map((c) => {
          const hits = CARDS.filter((k) => k.effect.chars?.[c.id]).map((k) => ({ card: k, d: k.effect.chars![c.id]! }));
          const bar = (v: number, max: number) => ({ ["--w" as string]: `${Math.min(100, (v / max) * 100)}%` });
          return (
            <article key={c.id} id={c.id} className={css.role}>
              <h2>{c.name}</h2>
              <p className={css.roleBlurb}>{c.blurb}</p>
              <dl className={css.bars}>
                <div style={bar(c.health, MAX.health)}>
                  <dt>Sehat awal</dt>
                  <dd>{c.health}</dd>
                </div>
                <div style={bar(c.wallet, MAX.wallet)}>
                  <dt>Dompet awal</dt>
                  <dd>{rpShort(c.wallet)}</dd>
                </div>
                <div style={bar(c.food, MAX.food)}>
                  <dt>Makanan awal</dt>
                  <dd>{c.food} porsi</dd>
                </div>
              </dl>
              <ul className={css.roleFacts}>
                <li>
                  Kerja serabutan: <b>{rpShort(c.workPay)}</b>, menguras <b>{c.workCost}</b> kesehatan
                </li>
                <li>
                  Harga makan: <b>{c.foodPrice === 1 ? "normal" : `${Math.round((1 - c.foodPrice) * 100)}% lebih murah`}</b>
                </li>
                {c.restBonus > 0 && (
                  <li>
                    Istirahat: <b>+{c.restBonus}</b> pemulihan ekstra (dasar {RULES.restHeal})
                  </li>
                )}
              </ul>
              {hits.length > 0 && (
                <div className={css.roleCards}>
                  <h3>Kartu yang paling terasa</h3>
                  <ul>
                    {hits.map(({ card, d }) => {
                      const good = (d.wallet ?? 0) + (d.health ?? 0) + (d.food ?? 0) > 0;
                      return (
                        <li key={card.id} className={good ? css.good : css.bad}>
                          <b>{card.title}</b> {deltaText(d)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className={css.pageCta}>
        <Link href="/main" className={css.cta}>
          Pilih peran dan main
        </Link>
      </p>
    </main>
  );
}
