import { CHARACTERS, type CharacterId } from "./data";
import { applyAction, createGame, type GameState } from "./game";
import { chooseAction, type Difficulty } from "./bot";

/** RNG kecil untuk keputusan bot di simulasi (terpisah dari RNG game). */
function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mainkan satu game penuh bot-lawan-bot sampai selesai. */
export function playOut(s: GameState, difficulty: Difficulty = "normal", botSeed = 1, onStep?: (s: GameState) => void) {
  const rng = mulberry(botSeed);
  for (let i = 0; i < 20_000 && s.phase !== "over"; i++) {
    s = applyAction(s, chooseAction(s, difficulty, rng));
    onStep?.(s);
  }
  if (s.phase !== "over") throw new Error("Game tidak selesai dalam 20.000 langkah");
  return s;
}

export type SimStats = {
  games: number;
  avgRounds: number;
  maxRoundsHit: number; // persen game yang selesai karena batas ronde
  winRate: Record<CharacterId, number>; // persen menang saat karakter ikut main
  causes: Record<string, number>; // persen penyebab gugur
  avgOutRound: number;
};

/** Simulasikan banyak game 4 bot dengan karakter acak, untuk mengecek keseimbangan angka. */
export function simulate(games: number, seed = 1, difficulty: Difficulty = "normal"): SimStats {
  const rng = mulberry(seed);
  const ids = Object.keys(CHARACTERS) as CharacterId[];
  const played = Object.fromEntries(ids.map((i) => [i, 0])) as Record<CharacterId, number>;
  const won = Object.fromEntries(ids.map((i) => [i, 0])) as Record<CharacterId, number>;
  const causes: Record<string, number> = {};
  let rounds = 0, capped = 0, outs = 0, outSum = 0;
  for (let g = 0; g < games; g++) {
    const pool = [...ids].sort(() => rng() - 0.5).slice(0, 4);
    let s = createGame(pool.map((c, i) => ({ name: `Bot${i + 1}`, character: c, bot: true })), Math.floor(rng() * 2 ** 31));
    s = playOut(s, difficulty, Math.floor(rng() * 2 ** 31));
    rounds += s.round;
    if (s.log.some((e) => e.text.includes("Batas"))) capped++;
    for (const p of s.players) {
      played[p.character]++;
      if (s.winner === p.id) won[p.character]++;
      if (p.cause) {
        causes[p.cause] = (causes[p.cause] ?? 0) + 1;
        outs++;
        outSum += p.outRound ?? 0;
      }
    }
  }
  const pct = (a: number, b: number) => Math.round((a / Math.max(1, b)) * 1000) / 10;
  return {
    games,
    avgRounds: Math.round((rounds / games) * 10) / 10,
    maxRoundsHit: pct(capped, games),
    winRate: Object.fromEntries(ids.map((i) => [i, pct(won[i], played[i])])) as Record<CharacterId, number>,
    causes: Object.fromEntries(Object.entries(causes).map(([k, v]) => [k, pct(v, outs)])),
    avgOutRound: Math.round((outSum / Math.max(1, outs)) * 10) / 10,
  };
}
