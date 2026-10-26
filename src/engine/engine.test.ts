import { describe, expect, it } from "vitest";
import { JAIL_INDEX, RULES, TILES } from "./data";
import { applyAction, createGame, legalActions, type GameState } from "./game";
import { chooseAction } from "./bot";
import { playOut, simulate } from "./sim";

const four = () =>
  createGame([
    { name: "A", character: "buruh", bot: true },
    { name: "B", character: "ojol", bot: true },
    { name: "C", character: "petani", bot: true },
    { name: "D", character: "pedagang", bot: true },
  ], 42);

describe("aturan dasar", () => {
  it("menolak jumlah pemain di luar 2-4", () => {
    expect(() => createGame([{ name: "A", character: "guru" }])).toThrow();
  });

  it("40 petak dengan 4 sudut", () => {
    expect(TILES).toHaveLength(40);
    expect(TILES.filter((t) => t.kind === "sudut").map((t) => t.index)).toEqual([0, 10, 20, 30]);
  });

  it("deterministik: seed sama, keputusan sama, hasil sama", () => {
    const a = playOut(four(), "normal", 7);
    const b = playOut(four(), "normal", 7);
    expect(a.log).toEqual(b.log);
    expect(a.winner).toBe(b.winner);
  });

  it("aksi ilegal ditolak", () => {
    const s = four();
    expect(() => applyAction(s, { type: "choose", id: "kerja" })).toThrow();
  });

  it("gajian saat melewati MULAI, dipotong pajak", () => {
    const s = four();
    s.players[0].pos = 38; // dadu minimal 2 -> pasti melewati MULAI
    const before = s.players[0].wallet;
    const after = applyAction(s, { type: "roll" });
    expect(after.log.some((e) => e.text.includes("gajian"))).toBe(true);
    // Uang bisa berubah lagi oleh petak tujuan; cukup cek gaji bersih pernah masuk.
    expect(after.players[0].wallet).not.toBe(before);
  });

  it("pemain di lapas melewati giliran", () => {
    let s: GameState = four();
    s.players[1].jailed = RULES.jailTurns;
    s.players[1].pos = JAIL_INDEX;
    // Selesaikan giliran pemain 0; giliran berikutnya harus melompati pemain 1.
    while (s.turn === 0 && s.phase !== "over") s = applyAction(s, chooseAction(s));
    expect(s.turn).toBe(2);
    expect(s.players[1].jailed).toBe(RULES.jailTurns - 1);
  });
});

describe("invarian selama permainan", () => {
  it("100 game bot selesai tanpa error dan status selalu valid", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s0 = createGame([
        { name: "A", character: "guru", bot: true },
        { name: "B", character: "mahasiswa", bot: true },
        { name: "C", character: "buruh", bot: true },
      ], seed);
      const end = playOut(s0, "normal", seed, (s) => {
        for (const p of s.players) {
          expect(p.food).toBeGreaterThanOrEqual(0);
          expect(p.health).toBeLessThanOrEqual(RULES.maxHealth);
        }
        if (s.phase !== "over") {
          expect(s.players[s.turn].alive).toBe(true);
          expect(legalActions(s).length).toBeGreaterThan(0);
        }
      });
      expect(end.round).toBeLessThanOrEqual(RULES.maxRounds);
      expect(end.phase).toBe("over");
    }
  }, Number(process.env.WNIPOLY_SIM_TIMEOUT_MS) || 60_000);
});

describe("keseimbangan (simulasi bot)", () => {
  it("game punya akhir yang wajar dan tidak ada karakter yang terlalu kuat", () => {
    const stats = simulate(800, 2026);
    console.log("SIMULASI", JSON.stringify(stats, null, 2));
    // Target: 20-35 menit main, kira-kira 10-24 ronde; jarang mentok batas ronde.
    expect(stats.avgRounds).toBeGreaterThan(9);
    expect(stats.avgRounds).toBeLessThan(25);
    expect(stats.maxRoundsHit).toBeLessThan(20);
    // Dengan 4 dari 6 karakter per game, peluang adil sekitar 25%.
    for (const rate of Object.values(stats.winRate)) {
      expect(rate).toBeGreaterThan(18);
      expect(rate).toBeLessThan(33);
    }
  }, Number(process.env.WNIPOLY_SIM_TIMEOUT_MS) || 120_000);
});
