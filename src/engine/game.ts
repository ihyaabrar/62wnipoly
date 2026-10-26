import { BOARD_SIZE, CARDS, CHARACTERS, DISASTERS, JAIL_INDEX, RULES, TILES, type CardDef, type CardEffect, type CharacterId, type Zone } from "./data";

// Mesin aturan Weenipoly. Fungsi murni: applyAction(state, action) -> state baru.
// Semua acak memakai RNG ber-seed di dalam state, jadi game bisa diulang persis (bot, online, tes).

export type PlayerConfig = { name: string; character: CharacterId; bot?: boolean };

export type Loan = { perRound: number; left: number; from: string };

export type Player = {
  id: number;
  name: string;
  character: CharacterId;
  bot: boolean;
  pos: number;
  health: number;
  wallet: number;
  food: number;
  stocks: number; // unit saham; nilai = stocks * ihsg
  loans: Loan[];
  hungry: number; // giliran berturut-turut tanpa makan
  skip: number; // giliran yang harus dilewati
  jailed: number;
  protect: boolean; // aman dari bencana di akhir ronde ini
  alive: boolean;
  cause?: string;
  outRound?: number;
};

/** Perkiraan dampak sebuah pilihan, untuk UI dan bot (nilai harapan, bukan hasil pasti). */
export type Ev = { health: number; wallet: number; food: number; protect?: boolean };
export type Option = { id: string; label: string; detail: string; ev: Ev };

export type LogKind = "info" | "good" | "bad" | "disaster" | "card" | "out" | "market";
export type LogEvent = { round: number; player?: number; text: string; kind: LogKind; zone?: Zone };

export type Phase = "roll" | "choose" | "over";

export type GameState = {
  seed: number;
  rng: number;
  round: number;
  turn: number; // indeks pemain yang sedang jalan
  phase: Phase;
  players: Player[];
  crisis: number;
  ihsg: number;
  ihsgRoundStart: number;
  ihsgChange: number; // perubahan IHSG (persen) sejak awal ronde sebelumnya, termasuk efek kartu
  halted: boolean; // trading halt: saham tidak bisa dijual ronde ini
  dice: [number, number] | null;
  options: Option[];
  lastCard: CardDef | null;
  decks: { kesempatan: number[]; musibah: number[] };
  log: LogEvent[];
  seq: number; // jumlah total kejadian (log dipotong, seq tidak) untuk mendeteksi kejadian baru
  winner: number | null;
  maxRounds: number;
};

export type Action = { type: "roll" } | { type: "choose"; id: string };

// ---------- RNG ----------

function rand(s: GameState) {
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  let x = s.rng;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}

function shuffled(s: GameState, n: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Utilitas ----------

const rp = (n: number) => `Rp${Math.round(n).toLocaleString("id-ID")}`;

function log(s: GameState, text: string, kind: LogKind = "info", player?: number, zone?: Zone) {
  s.log.push({ round: s.round, player, text, kind, zone });
  s.seq += 1;
  if (s.log.length > 300) s.log.splice(0, s.log.length - 300);
}

const current = (s: GameState) => s.players[s.turn];

/** Pengali harga: naik mengikuti Level Krisis dan saat IHSG jatuh (rupiah melemah). */
export function inflation(s: GameState) {
  return 1 + (s.crisis - 1) * 0.06 + Math.max(0, (RULES.ihsgStart - s.ihsg) / 200);
}

export function foodPrice(s: GameState, p: Player, mult = 1) {
  return Math.round((RULES.foodPrice * CHARACTERS[p.character].foodPrice * inflation(s) * mult) / 1000) * 1000;
}

function change(p: Player, d: { health?: number; wallet?: number; food?: number }) {
  if (d.health) p.health = Math.min(RULES.maxHealth, Math.round(p.health + d.health));
  if (d.wallet) p.wallet = Math.round(p.wallet + d.wallet);
  if (d.food) p.food = Math.max(0, Math.round(p.food + d.food));
}

/** Skor bertahan untuk penentuan pemenang saat batas ronde tercapai. */
export function survivalScore(s: GameState, p: Player) {
  if (!p.alive) return -Infinity;
  return p.health + p.food * 10 + (p.wallet + p.stocks * s.ihsg) / 100_000;
}

// ---------- Membuat game ----------

export function createGame(configs: PlayerConfig[], seed = 1, maxRounds = RULES.maxRounds): GameState {
  if (configs.length < 2 || configs.length > 4) throw new Error("Weenipoly dimainkan 2-4 pemain");
  const s: GameState = {
    seed,
    rng: seed >>> 0,
    round: 1,
    turn: 0,
    phase: "roll",
    players: configs.map((c, id) => {
      const ch = CHARACTERS[c.character];
      return { id, name: c.name, character: c.character, bot: !!c.bot, pos: 0, health: ch.health, wallet: ch.wallet, food: ch.food, stocks: 0, loans: [], hungry: 0, skip: 0, jailed: 0, protect: false, alive: true };
    }),
    crisis: RULES.crisisStart,
    ihsg: RULES.ihsgStart,
    ihsgRoundStart: RULES.ihsgStart,
    ihsgChange: 0,
    halted: false,
    dice: null,
    options: [],
    lastCard: null,
    decks: { kesempatan: [], musibah: [] },
    log: [],
    seq: 0,
    winner: null,
    maxRounds,
  };
  log(s, "Ronde 1 dimulai. Selamat bertahan hidup, WNI.");
  return s;
}

export function legalActions(s: GameState): Action[] {
  if (s.phase === "roll") return [{ type: "roll" }];
  if (s.phase === "choose") return s.options.map((o) => ({ type: "choose", id: o.id }));
  return [];
}

export function applyAction(prev: GameState, a: Action): GameState {
  const s = structuredClone(prev);
  if (s.phase === "over") throw new Error("Game sudah selesai");
  if (a.type === "roll") {
    if (s.phase !== "roll") throw new Error("Bukan saatnya lempar dadu");
    roll(s);
  } else {
    if (s.phase !== "choose") throw new Error("Bukan saatnya memilih");
    const opt = s.options.find((o) => o.id === a.id);
    if (!opt) throw new Error(`Pilihan tidak tersedia: ${a.id}`);
    s.options = [];
    choose(s, current(s), opt.id);
    endTurn(s);
  }
  return s;
}

// ---------- Giliran ----------

function roll(s: GameState) {
  const p = current(s);
  const d1 = 1 + Math.floor(rand(s) * 6);
  const d2 = 1 + Math.floor(rand(s) * 6);
  s.dice = [d1, d2];
  s.lastCard = null;
  log(s, `${p.name} melempar ${d1} + ${d2}.`, "info", p.id);
  moveBy(s, p, d1 + d2);
  land(s, p, 0);
  if (s.phase !== "choose") endTurn(s);
}

function moveBy(s: GameState, p: Player, steps: number) {
  const next = (((p.pos + steps) % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
  if (steps > 0 && p.pos + steps >= BOARD_SIZE) payday(s, p);
  p.pos = next;
}

function payday(s: GameState, p: Player) {
  const tax = RULES.salary * RULES.salaryTax;
  change(p, { wallet: RULES.salary - tax });
  log(s, `${p.name} gajian ${rp(RULES.salary)}, langsung dipotong pajak ${rp(tax)}.`, "good", p.id);
}

function goJail(s: GameState, p: Player) {
  p.pos = JAIL_INDEX;
  p.jailed = RULES.jailTurns;
  log(s, `${p.name} masuk Lapas VIP selama ${RULES.jailTurns} giliran.`, "bad", p.id);
}

/** Selesaikan petak tempat pemain mendarat. depth mencegah rantai kartu tak berujung. */
function land(s: GameState, p: Player, depth: number) {
  const tile = TILES[p.pos];
  log(s, `${p.name} tiba di ${tile.name}.`, "info", p.id);
  switch (tile.kind) {
    case "kesempatan":
    case "musibah":
      drawCard(s, p, tile.kind, depth);
      return;
    case "bencana":
      personalDisaster(s, p, tile.zone);
      return;
    case "bursa":
      offer(s, bursaOptions(s, p));
      return;
  }
  if (tile.special === "lapas") {
    offer(s, [
      { id: "suap", label: `Kamar VIP (${rp(RULES.jailBribe)})`, detail: "Bayar, langsung bebas. Fasilitas lengkap.", ev: { health: 0, wallet: -RULES.jailBribe, food: 0 } },
      { id: "jalani", label: "Jalani hukuman", detail: `Lewati ${RULES.jailTurns} giliran. Makan tetap jalan.`, ev: { health: -4, wallet: 0, food: -RULES.jailTurns } },
    ]);
    return;
  }
  // Efek otomatis saat mendarat.
  if (tile.special === "asap") {
    change(p, { health: -5 });
    log(s, `Asap tebal. ${p.name} batuk-batuk (-5 kesehatan).`, "bad", p.id);
  }
  if (tile.special === "jalanRusak") {
    change(p, { health: -4 });
    log(s, `Jalan rusak, motor masuk lubang (-4 kesehatan).`, "bad", p.id);
  }
  offer(s, [...specialOptions(s, p, tile.special), ...baseOptions(s, p, tile.special)]);
}

function offer(s: GameState, options: Option[]) {
  s.options = options;
  s.phase = "choose";
}

function baseOptions(s: GameState, p: Player, special?: string): Option[] {
  const ch = CHARACTERS[p.character];
  const pay = Math.round(ch.workPay * (1 + (s.crisis - 1) * 0.03));
  const price = foodPrice(s, p, special === "pasarMurah" ? 0.6 : 1);
  const n = Math.max(0, Math.min(RULES.maxFoodBuy, Math.floor(Math.max(0, p.wallet) / price)));
  const heal = RULES.restHeal + ch.restBonus + (special === "huntara" ? 8 : 0);
  const opts: Option[] = [{ id: "kerja", label: "Kerja serabutan", detail: `+${rp(pay)}, -${ch.workCost} kesehatan`, ev: { health: -ch.workCost, wallet: pay, food: 0 } }];
  if (n > 0) opts.push({ id: "makan", label: `Beli makan (${n} porsi)`, detail: `${rp(price)} per porsi`, ev: { health: 0, wallet: -price * n, food: n } });
  opts.push({ id: "istirahat", label: "Istirahat", detail: `+${heal} kesehatan`, ev: { health: heal, wallet: 0, food: 0 } });
  return opts;
}

function specialOptions(s: GameState, p: Player, special?: string): Option[] {
  const o = (id: string, label: string, detail: string, ev: Ev): Option => ({ id, label, detail, ev });
  switch (special) {
    case "mulai": return [];
    case "rumahSakit": return [
      o("berobat", `Berobat (${rp(RULES.hospitalCost)})`, `+${RULES.hospitalHeal} kesehatan`, { health: RULES.hospitalHeal, wallet: -RULES.hospitalCost, food: 0 }),
      o("bpjs", "Antre BPJS", `+${RULES.hospitalHeal} kesehatan, lewati 1 giliran`, { health: RULES.hospitalHeal - 6, wallet: 0, food: -1 }),
    ];
    case "bandara": return [o("kabur", `Kabur aja dulu (${rp(RULES.escapeCost)})`, "Aman dari bencana di akhir ronde ini", { health: 4, wallet: -RULES.escapeCost, food: 0, protect: true })];
    case "nelayan": return [o("melaut", "Melaut", "+2 makanan, -6 kesehatan", { health: -6, wallet: 0, food: 2 })];
    case "kerjaProyek": return [o("proyek", "Kerja proyek tanggul", "+Rp650.000, -14 kesehatan", { health: -14, wallet: 650_000, food: 0 })];
    case "kebunSawit": return [o("sawit", "Buruh sawit", "+Rp500.000, -12 kesehatan", { health: -12, wallet: 500_000, food: 0 })];
    case "konsesi": return [o("konsesi", "Kerja di konsesi", "+Rp800.000, -18 kesehatan", { health: -18, wallet: 800_000, food: 0 })];
    case "puskesmas": return [o("puskesmas", "Berobat murah (Rp100.000)", "+20 kesehatan", { health: 20, wallet: -100_000, food: 0 })];
    case "hutan": return [o("hutan", "Cari makan di hutan", "+2 makanan, -6 kesehatan", { health: -6, wallet: 0, food: 2 })];
    case "ladang": return [o("panen", "Panen", "+3 makanan, -4 kesehatan", { health: -4, wallet: 0, food: 3 })];
    case "posPantau": return [o("jaga", "Jaga pos pantau", "+Rp150.000, aman dari bencana ronde ini", { health: 0, wallet: 150_000, food: 0, protect: true })];
    case "evakuasi": return [o("evakuasi", "Ikut evakuasi", "+5 kesehatan, aman dari bencana ronde ini", { health: 5, wallet: 0, food: 0, protect: true })];
    case "kawah": return [o("belerang", "Tambang belerang", "+Rp900.000, -22 kesehatan", { health: -22, wallet: 900_000, food: 0 })];
    case "kopdes": return [o("kopdes", "Pinjam Kopdes (Rp1.500.000)", "Dicicil Rp200.000 per ronde selama 9 ronde", { health: 0, wallet: 1_500_000 - 1_800_000 * 0.4, food: 0 })];
    case "dapurGizi": return [o("mbg", "Makan gratis", "+3 makanan. Peluang keracunan 30%", { health: -6, wallet: 0, food: 3 })];
    case "bank": return [o("bank", "Pinjam bank (Rp1.000.000)", "Dicicil Rp150.000 per ronde selama 8 ronde", { health: 0, wallet: 1_000_000 - 1_200_000 * 0.4, food: 0 })];
    case "dewan": return [o("demo", "Ikut demo", "Untung-untungan: tunjangan dicabut, atau kena gas air mata", { health: -7, wallet: 100_000, food: 0 })];
    case "orangDalam": return [o("orangDalam", "Bayar orang dalam (Rp500.000)", "+10 kesehatan, aman dari bencana ronde ini", { health: 10, wallet: -500_000, food: 0, protect: true })];
    default: return [];
  }
}

function bursaOptions(s: GameState, p: Player): Option[] {
  const opts: Option[] = [];
  const amount = 500_000;
  if (p.wallet >= amount) opts.push({ id: "beli", label: `Beli saham (${rp(amount)})`, detail: `IHSG ${s.ihsg.toFixed(1)}`, ev: { health: 0, wallet: 30_000, food: 0 } });
  if (p.stocks > 0) {
    const value = p.stocks * s.ihsg;
    opts.push(
      s.halted
        ? { id: "halt", label: "Jual saham (TRADING HALT)", detail: "Bursa dibekukan, tidak bisa jual", ev: { health: 0, wallet: 0, food: 0 } }
        : { id: "jual", label: `Jual semua saham (${rp(value)})`, detail: "Uang tunai sekarang", ev: { health: 0, wallet: 0, food: 0 } },
    );
  }
  opts.push({ id: "lewat", label: "Orang kampung gak main saham", detail: "Lewati", ev: { health: 0, wallet: 0, food: 0 } });
  return opts;
}

/** Apa yang bisa terjadi atau dilakukan pemain di sebuah petak (untuk info petak di UI). */
export function describeTile(s: GameState, playerId: number, index: number): string[] {
  const tile = TILES[index];
  const p = { ...s.players[playerId], pos: index };
  switch (tile.kind) {
    case "kesempatan": return ["Ambil kartu Kesempatan: peluang yang (kadang) menguntungkan."];
    case "musibah": return ["Ambil kartu Musibah: kejadian buruk dari kehidupan nyata."];
    case "bencana": return [`${DISASTERS[tile.zone].name}: langsung kena, makin parah saat Level Krisis naik.`];
    case "bursa": return bursaOptions(s, p).map((o) => `${o.label}: ${o.detail}`);
  }
  if (tile.special === "lapas") return [`Masuk lapas ${RULES.jailTurns} giliran, atau bayar ${rp(RULES.jailBribe)} untuk kamar VIP.`];
  const auto = tile.special === "asap" ? ["Asap tebal: -5 kesehatan saat mendarat."] : tile.special === "jalanRusak" ? ["Jalan rusak: -4 kesehatan saat mendarat."] : [];
  const pay = tile.special === "mulai" ? [`Lewat sini: gajian ${rp(RULES.salary)}, dipotong pajak ${Math.round(RULES.salaryTax * 100)}%.`] : [];
  return [...pay, ...auto, ...[...specialOptions(s, p, tile.special), ...baseOptions(s, p, tile.special)].map((o) => `${o.label}: ${o.detail}`)];
}

function choose(s: GameState, p: Player, id: string) {
  const ch = CHARACTERS[p.character];
  const special = TILES[p.pos].special;
  switch (id) {
    case "kerja": {
      const pay = Math.round(ch.workPay * (1 + (s.crisis - 1) * 0.03));
      change(p, { wallet: pay, health: -ch.workCost });
      log(s, `${p.name} kerja serabutan, dapat ${rp(pay)}.`, "good", p.id);
      return;
    }
    case "makan": {
      const price = foodPrice(s, p, special === "pasarMurah" ? 0.6 : 1);
      const n = Math.max(0, Math.min(RULES.maxFoodBuy, Math.floor(Math.max(0, p.wallet) / price)));
      change(p, { wallet: -price * n, food: n });
      log(s, `${p.name} beli ${n} porsi makan (${rp(price * n)}).`, "info", p.id);
      return;
    }
    case "istirahat": {
      const heal = RULES.restHeal + ch.restBonus + (special === "huntara" ? 8 : 0);
      change(p, { health: heal });
      log(s, `${p.name} istirahat (+${heal} kesehatan).`, "good", p.id);
      return;
    }
    case "berobat":
      change(p, { wallet: -RULES.hospitalCost, health: RULES.hospitalHeal });
      log(s, `${p.name} berobat di RS.`, "good", p.id);
      return;
    case "bpjs":
      change(p, { health: RULES.hospitalHeal });
      p.skip += 1;
      log(s, `${p.name} antre BPJS seharian (lewati 1 giliran).`, "info", p.id);
      return;
    case "kabur":
      change(p, { wallet: -RULES.escapeCost, health: 4 });
      p.protect = true;
      log(s, `${p.name} kabur aja dulu. Aman dari bencana ronde ini.`, "good", p.id);
      return;
    case "melaut": change(p, { food: 2, health: -6 }); log(s, `${p.name} melaut, dapat ikan.`, "good", p.id); return;
    case "proyek": change(p, { wallet: 650_000, health: -14 }); log(s, `${p.name} kerja proyek tanggul yang tak kunjung selesai.`, "good", p.id); return;
    case "sawit": change(p, { wallet: 500_000, health: -12 }); log(s, `${p.name} jadi buruh sawit.`, "good", p.id); return;
    case "konsesi": change(p, { wallet: 800_000, health: -18 }); log(s, `${p.name} kerja di kawasan konsesi. Jangan banyak tanya.`, "good", p.id); return;
    case "puskesmas": change(p, { wallet: -100_000, health: 20 }); log(s, `${p.name} berobat di puskesmas.`, "good", p.id); return;
    case "hutan": change(p, { food: 2, health: -6 }); log(s, `${p.name} cari makan di hutan yang tersisa.`, "good", p.id); return;
    case "panen": change(p, { food: 3, health: -4 }); log(s, `${p.name} panen di lereng.`, "good", p.id); return;
    case "jaga": change(p, { wallet: 150_000 }); p.protect = true; log(s, `${p.name} jaga pos pantau.`, "good", p.id); return;
    case "evakuasi": change(p, { health: 5 }); p.protect = true; log(s, `${p.name} ikut evakuasi.`, "good", p.id); return;
    case "belerang": change(p, { wallet: 900_000, health: -22 }); log(s, `${p.name} menambang belerang di bibir kawah.`, "good", p.id); return;
    case "kopdes":
      change(p, { wallet: 1_500_000 });
      p.loans.push({ perRound: 200_000, left: 9, from: "Kopdes" });
      log(s, `${p.name} pinjam Kopdes Rp1.500.000.`, "info", p.id);
      return;
    case "bank":
      change(p, { wallet: 1_000_000 });
      p.loans.push({ perRound: 150_000, left: 8, from: "Bank Pelat Merah" });
      log(s, `${p.name} pinjam Bank Pelat Merah Rp1.000.000.`, "info", p.id);
      return;
    case "mbg":
      change(p, { food: 3 });
      if (rand(s) < 0.3) {
        change(p, { health: -20 });
        log(s, `${p.name} keracunan makan gratis (-20 kesehatan).`, "bad", p.id);
      } else log(s, `${p.name} dapat makan gratis.`, "good", p.id);
      return;
    case "demo":
      if (rand(s) < 0.45) {
        for (const q of s.players) if (q.alive) change(q, { wallet: 200_000 });
        log(s, `Demo berhasil, tunjangan dibatalkan. Semua warga +Rp200.000.`, "good", p.id);
      } else {
        change(p, { health: -15 });
        log(s, `${p.name} kena gas air mata (-15 kesehatan).`, "bad", p.id);
      }
      return;
    case "orangDalam": change(p, { wallet: -500_000, health: 10 }); p.protect = true; log(s, `${p.name} bayar orang dalam. Urusan lancar.`, "info", p.id); return;
    case "beli": {
      const units = 500_000 / s.ihsg;
      change(p, { wallet: -500_000 });
      p.stocks += units;
      log(s, `${p.name} beli saham saat IHSG ${s.ihsg.toFixed(1)}.`, "market", p.id);
      return;
    }
    case "jual": {
      const value = p.stocks * s.ihsg;
      change(p, { wallet: value });
      p.stocks = 0;
      log(s, `${p.name} jual semua saham, dapat ${rp(value)}.`, "market", p.id);
      return;
    }
    case "halt": log(s, `Trading halt. Saham ${p.name} membeku.`, "market", p.id); return;
    case "lewat": return;
    case "suap": change(p, { wallet: -RULES.jailBribe }); log(s, `${p.name} pesan kamar VIP. Bebas.`, "info", p.id); return;
    case "jalani": goJail(s, p); return;
  }
}

function drawCard(s: GameState, p: Player, deck: "kesempatan" | "musibah", depth: number) {
  const pool = CARDS.map((c, i) => [c, i] as const).filter(([c]) => c.deck === deck).map(([, i]) => i);
  if (!s.decks[deck].length) s.decks[deck] = shuffled(s, pool.length).map((k) => pool[k]);
  const card = CARDS[s.decks[deck].pop()!];
  s.lastCard = card;
  log(s, `${p.name} dapat kartu ${deck === "kesempatan" ? "Kesempatan" : "Musibah"}: ${card.title}. ${card.text}`, "card", p.id);
  applyEffect(s, p, card.effect, depth);
}

function applyEffect(s: GameState, p: Player, e: CardEffect, depth: number) {
  const alive = s.players.filter((q) => q.alive);
  for (const q of e.all ? alive : [p]) change(q, e);
  if (e.others) for (const q of alive) if (q !== p) change(q, e.others);
  if (e.richest && alive.length) {
    const r = alive.reduce((a, b) => (b.wallet > a.wallet ? b : a));
    change(r, e.richest);
    log(s, `${r.name} paling tebal dompetnya, paling berat kenanya.`, "bad", r.id);
  }
  if (e.chars) {
    for (const q of alive) {
      const d = e.chars[q.character];
      if (!d) continue;
      change(q, d);
      log(s, `${q.name} (${CHARACTERS[q.character].name}) paling terdampak.`, (d.wallet ?? 0) + (d.health ?? 0) + (d.food ?? 0) >= 0 ? "good" : "bad", q.id);
    }
  }
  if (e.zone) {
    for (const q of alive) {
      if (TILES[q.pos].zone !== e.zone.zone) continue;
      change(q, e.zone.delta);
      log(s, `${q.name} sedang di zona ${e.zone.zone}, kena paling parah.`, "bad", q.id, e.zone.zone);
    }
  }
  if (e.ihsg) {
    s.ihsg = Math.max(20, s.ihsg * (1 + e.ihsg / 100));
    s.ihsgChange = ((s.ihsg - s.ihsgRoundStart) / s.ihsgRoundStart) * 100;
  }
  if (e.skip) p.skip += e.skip;
  if (e.jail) {
    goJail(s, p);
    return;
  }
  // Pindah petak memicu petak baru, tapi hanya sekali (tidak berantai).
  if ((e.move || e.goto !== undefined) && depth < 1) {
    if (e.goto !== undefined) {
      if (e.goto < p.pos) payday(s, p);
      p.pos = e.goto;
    } else moveBy(s, p, e.move!);
    land(s, p, depth + 1);
  }
}

function personalDisaster(s: GameState, p: Player, zone: Zone) {
  const d = DISASTERS[zone];
  const k = 1.5 * (1 + (s.crisis - 1) * 0.3);
  change(p, { health: -d.health * k, food: -d.food, wallet: -d.wallet * k });
  log(s, `${d.name} menghantam ${p.name}!`, "disaster", p.id, zone);
}

/** Makan di akhir giliran, cek gugur, lalu lanjut ke pemain berikutnya (dan ronde baru bila perlu). */
function endTurn(s: GameState) {
  const p = current(s);
  if (p.alive) {
    if (p.food > 0) {
      p.food -= 1;
      p.hungry = 0;
    } else {
      p.hungry += 1;
      change(p, { health: -RULES.starveDamage });
      log(s, `${p.name} kelaparan (-${RULES.starveDamage} kesehatan).`, "bad", p.id);
    }
  }
  checkOut(s);
  if (finished(s)) return;
  advance(s);
}

function advance(s: GameState) {
  // Cari pemain hidup berikutnya; tiap kali berputar melewati akhir urutan, ronde berakhir.
  for (let guard = 0; guard < 200; guard++) {
    const prev = s.turn;
    do s.turn = (s.turn + 1) % s.players.length;
    while (!s.players[s.turn].alive);
    if (s.turn <= prev) {
      endRound(s);
      if (finished(s)) return;
      if (!current(s).alive) continue; // gugur oleh bencana akhir ronde: lanjut ke pemain berikutnya
    }
    const p = current(s);
    if (p.jailed > 0) {
      p.jailed -= 1;
      eatWhileWaiting(s, p, "di lapas");
      if (finished(s)) return;
      continue;
    }
    if (p.skip > 0) {
      p.skip -= 1;
      eatWhileWaiting(s, p, "melewati giliran");
      if (finished(s)) return;
      continue;
    }
    s.phase = "roll"; // dice dibiarkan: UI butuh angka lemparan terakhir meski giliran sudah pindah
    return;
  }
  throw new Error("advance: terlalu banyak giliran terlewati");
}

function eatWhileWaiting(s: GameState, p: Player, why: string) {
  log(s, `${p.name} ${why}.`, "info", p.id);
  if (p.food > 0) (p.food -= 1), (p.hungry = 0);
  else {
    p.hungry += 1;
    change(p, { health: -RULES.starveDamage });
  }
  checkOut(s);
}

function endRound(s: GameState) {
  const alive = s.players.filter((p) => p.alive);
  // Bencana zona: makin banyak zona dan makin parah seiring Level Krisis.
  const zones: Zone[] = ["selatan", "barat", "utara", "timur"];
  const hits = Math.min(4, 1 + Math.floor(s.crisis / 3));
  const order = shuffled(s, 4).slice(0, hits).map((i) => zones[i]);
  const k = 1 + (s.crisis - 1) * 0.3;
  for (const z of order) {
    const d = DISASTERS[z];
    log(s, `Akhir ronde ${s.round}: ${d.name} di zona ${z}.`, "disaster", undefined, z);
    for (const p of alive) {
      if (TILES[p.pos].zone !== z || p.protect) continue;
      change(p, { health: -d.health * k, food: -d.food, wallet: -d.wallet * k });
    }
    if (z === "barat") for (const p of alive) if (!p.protect) change(p, { health: -2 }); // asap menyebar ke mana-mana
  }
  for (const p of alive) {
    p.protect = false;
    // Cicilan pinjaman.
    for (const l of p.loans) if (l.left > 0) (l.left -= 1), change(p, { wallet: -l.perRound });
    p.loans = p.loans.filter((l) => l.left > 0);
    // Utang berbunga (pinjol).
    if (p.wallet < 0) change(p, { wallet: p.wallet * RULES.debtInterest });
  }
  // IHSG: acak, cenderung turun saat krisis memburuk.
  const before = s.ihsgRoundStart;
  s.ihsg = Math.max(20, s.ihsg * (1 + ((rand(s) - 0.55) * 8 - s.crisis * 0.4) / 100));
  const drop = (before - s.ihsg) / before;
  s.ihsgChange = -drop * 100;
  s.halted = drop >= RULES.haltDrop;
  log(s, `IHSG ${s.ihsg.toFixed(1)} (${drop >= 0 ? "-" : "+"}${Math.abs(drop * 100).toFixed(1)}%).${s.halted ? " TRADING HALT." : ""}`, "market");
  s.ihsgRoundStart = s.ihsg;
  checkOut(s);
  if (finished(s)) return;
  s.round += 1;
  s.crisis = RULES.crisisStart + Math.floor((s.round - 1) / 2);
  log(s, `Ronde ${s.round} dimulai. Level Krisis ${s.crisis}.`, "info");
  if (s.round > s.maxRounds) {
    s.round = s.maxRounds;
    const best = s.players.filter((p) => p.alive).sort((a, b) => survivalScore(s, b) - survivalScore(s, a))[0];
    end(s, best?.id ?? null, `Batas ${s.maxRounds} ronde tercapai.`);
  }
}

function checkOut(s: GameState) {
  for (const p of s.players) {
    if (!p.alive) continue;
    const cause = p.health <= 0 ? "jatuh sakit" : p.wallet < RULES.debtLimit ? "diburu pinjol" : p.hungry >= RULES.starveTurnsToDie ? "kelaparan" : null;
    if (!cause) continue;
    p.alive = false;
    p.cause = cause;
    p.outRound = s.round;
    log(s, `${p.name} gugur: ${cause}.`, "out", p.id);
  }
  const alive = s.players.filter((p) => p.alive);
  if (alive.length <= 1 && s.phase !== "over") end(s, alive[0]?.id ?? null, alive.length ? `${alive[0].name} WNI terakhir yang bertahan.` : "Tidak ada yang bertahan.");
}

function end(s: GameState, winner: number | null, why: string) {
  s.phase = "over";
  s.winner = winner;
  s.options = [];
  log(s, `Permainan selesai. ${why}`, "info");
}

const finished = (s: GameState) => s.phase === "over";
