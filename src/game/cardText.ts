import { CHARACTERS, TILES, type CardDef, type CharacterId, type Delta } from "@/engine/data";
import { rpShort } from "./money";

export function deltaText(d: Delta) {
  const parts: string[] = [];
  if (d.health) parts.push(`${d.health > 0 ? "+" : ""}${d.health} kesehatan`);
  if (d.wallet) parts.push(`${d.wallet > 0 ? "+" : "-"}${rpShort(Math.abs(d.wallet))}`);
  if (d.food) parts.push(`${d.food > 0 ? "+" : ""}${d.food} makanan`);
  return parts.join(", ");
}

/** Dampak kartu per baris: siapa kena apa. Dipakai di modal kartu dan Glosarium. */
export function effectLines(c: CardDef) {
  const e = c.effect;
  const lines: { who: string; what: string }[] = [];
  const main = [deltaText(e)];
  if (e.move) main.push(`${e.move > 0 ? "maju" : "mundur"} ${Math.abs(e.move)} petak`);
  if (e.goto !== undefined) main.push(`pindah ke ${TILES[e.goto].name}`);
  if (e.skip) main.push(`lewati ${e.skip} giliran`);
  if (e.jail) main.push("masuk Lapas VIP");
  if (e.ihsg) main.push(`IHSG ${e.ihsg > 0 ? "+" : ""}${e.ihsg}%`);
  const m = main.filter(Boolean).join(", ");
  if (m) lines.push({ who: e.all ? "Semua WNI" : "Penarik kartu", what: m });
  if (e.others) lines.push({ who: "Pemain lain", what: deltaText(e.others) });
  if (e.richest) lines.push({ who: "Paling kaya", what: deltaText(e.richest) });
  for (const [id, d] of Object.entries(e.chars ?? {})) lines.push({ who: CHARACTERS[id as CharacterId].name, what: deltaText(d!) });
  if (e.zone) lines.push({ who: `Zona ${e.zone.zone}`, what: deltaText(e.zone.delta) });
  return lines;
}
