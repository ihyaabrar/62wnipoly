import { RULES } from "./data";
import { foodPrice, type Action, type Ev, type GameState, type Player } from "./game";

export type Difficulty = "mudah" | "normal" | "sulit";

/**
 * Nilai "seberapa aman" kondisi seorang pemain. Cekung: tambahan saat kritis jauh lebih berharga
 * daripada saat berlebih, dan mendekati batas gugur dihukum keras.
 */
function worth(s: GameState, p: Player, health: number, wallet: number, food: number) {
  const hv = health <= 0 ? -200 : Math.log1p(health / 8) * 14 - (health < 30 ? (30 - health) * 0.8 : 0);
  const fv = food <= 0 ? -18 : Math.log1p(food) * 9;
  const price = foodPrice(s, p);
  const wv = wallet <= RULES.debtLimit ? -200 : wallet < 0 ? (wallet / 100_000) * 2.2 : Math.log1p(wallet / (price * 3)) * 7;
  return hv + fv + wv;
}

/** Bahaya bencana di zona tempat pemain berdiri saat akhir ronde (untuk menilai pilihan "aman"). */
function danger(s: GameState, p: Player) {
  const zoneHits = Math.min(4, 1 + Math.floor(s.crisis / 3)) / 4;
  return zoneHits * (8 + s.crisis * 2.5);
}

function score(s: GameState, p: Player, ev: Ev) {
  const base = worth(s, p, p.health, p.wallet, p.food);
  const after = worth(s, p, p.health + ev.health, p.wallet + ev.wallet, p.food + ev.food);
  const safety = ev.protect ? danger(s, p) * 0.6 : 0;
  return after - base + safety;
}

/** Pilih aksi untuk pemain yang sedang jalan. rng opsional supaya bot "mudah" sedikit acak. */
export function chooseAction(s: GameState, difficulty: Difficulty = "normal", rng: () => number = Math.random): Action {
  if (s.phase === "roll") return { type: "roll" };
  const p = s.players[s.turn];
  const noise = difficulty === "mudah" ? 6 : difficulty === "normal" ? 1.5 : 0;
  let best = s.options[0];
  let bestScore = -Infinity;
  for (const o of s.options) {
    // Bursa: bot normal/sulit hanya membeli kalau IHSG sedang murah, menjual kalau sedang tinggi.
    let v = score(s, p, o.ev);
    if (o.id === "beli") v = s.ihsg < 85 && p.wallet > 1_500_000 ? 3 : -2;
    if (o.id === "jual") v = s.ihsg > 95 || p.wallet < 300_000 ? 4 : -1;
    v += (rng() - 0.5) * noise;
    if (v > bestScore) (bestScore = v), (best = o);
  }
  return { type: "choose", id: best.id };
}
