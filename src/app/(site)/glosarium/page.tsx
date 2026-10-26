import type { Metadata } from "next";
import { TILES } from "@/engine/data";
import { createGame, describeTile } from "@/engine/game";
import { Glossary, type TileRow } from "./Glossary";
import css from "../site.module.css";

export const metadata: Metadata = { title: "Glosarium kartu dan petak · +62WNIPOLY" };

const KIND: Record<string, string> = { sudut: "Pojok", biasa: "Petak", kesempatan: "Kartu Kesempatan", musibah: "Kartu Musibah", bencana: "Petak bencana", bursa: "Bursa saham" };

export default function GlosariumPage() {
  // Deskripsi petak diambil dari mesin aturan; harga dihitung untuk karakter acuan (buruh) di ronde pertama.
  const s = createGame([{ name: "A", character: "buruh" }, { name: "B", character: "guru" }]);
  const tiles: TileRow[] = TILES.map((t) => ({ index: t.index, name: t.name, zone: t.zone, kind: KIND[t.kind], lines: describeTile(s, 0, t.index) }));
  return (
    <main className={css.page}>
      <header className={css.pageHead}>
        <h1>Glosarium</h1>
        <p>Semua kartu Kesempatan dan Musibah, lengkap dengan dampaknya dan berita aslinya, plus 40 petak di papan.</p>
      </header>
      <Glossary tiles={tiles} />
    </main>
  );
}
