import type { ReactNode } from "react";
import type { CardArt as ArtId } from "@/engine/data";

// Ilustrasi kartu: SVG datar bergaris tebal, satu adegan per tema. Tanpa file gambar.

const INK = "#1d1f24";
const s = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const Ground = ({ c = "#7cc46b" }: { c?: string }) => <rect x="-5" y="92" width="210" height="40" fill={c} {...s} />;
const Coin = ({ x, y, r = 8 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#f2c94c" {...s} />
    <text x={x} y={y + 3.5} fontSize={r * 1.1} fontWeight="900" textAnchor="middle" fill={INK}>Rp</text>
  </g>
);
const House = ({ x, y, w = 40, wall = "#f7f1e1", roof = "#d9534f" }: { x: number; y: number; w?: number; wall?: string; roof?: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={w * 0.7} fill={wall} {...s} />
    <path d={`M${x - 5} ${y} L${x + w / 2} ${y - w * 0.5} L${x + w + 5} ${y} Z`} fill={roof} {...s} />
    <rect x={x + w * 0.38} y={y + w * 0.3} width={w * 0.24} height={w * 0.4} fill="#8a5a3b" {...s} />
  </g>
);
const Person = ({ x, y, c = "#2f6fdb", head = "#f0c08a", cap }: { x: number; y: number; c?: string; head?: string; cap?: string }) => (
  <g>
    <rect x={x - 8} y={y} width="16" height="22" rx="6" fill={c} {...s} />
    <circle cx={x} cy={y - 7} r="8" fill={head} {...s} />
    {cap && <path d={`M${x - 9} ${y - 9} Q${x} ${y - 20} ${x + 9} ${y - 9} Z`} fill={cap} {...s} />}
  </g>
);
const Cloud = ({ x, y, k = 1, c = "#9aa0a6" }: { x: number; y: number; k?: number; c?: string }) => (
  <path d={`M${x} ${y} a${10 * k} ${10 * k} 0 0 1 ${18 * k} -${8 * k} a${12 * k} ${12 * k} 0 0 1 ${22 * k} ${2 * k} a${9 * k} ${9 * k} 0 0 1 ${4 * k} ${17 * k} Z`} fill={c} {...s} />
);
const Phone = ({ x, y, screen = "#bfe3ff", children }: { x: number; y: number; screen?: string; children?: ReactNode }) => (
  <g>
    <rect x={x} y={y} width="56" height="92" rx="9" fill={INK} {...s} />
    <rect x={x + 5} y={y + 9} width="46" height="72" rx="3" fill={screen} />
    {children}
  </g>
);
const Label = ({ x, y, t, bg = "#fff", fg = INK, size = 12 }: { x: number; y: number; t: string; bg?: string; fg?: string; size?: number }) => {
  const w = t.length * size * 0.66 + 12;
  return (
    <g>
      <rect x={x - w / 2} y={y - size} width={w} height={size + 8} rx="4" fill={bg} {...s} />
      <text x={x} y={y + 2} fontSize={size} fontWeight="900" textAnchor="middle" fill={fg}>{t}</text>
    </g>
  );
};

const ART: Record<ArtId, ReactNode> = {
  bansos: (
    <>
      <Ground />
      <rect x="120" y="44" width="56" height="50" fill="#e8e1d0" {...s} />
      <rect x="132" y="40" width="32" height="6" fill={INK} />
      <text x="148" y="76" fontSize="12" fontWeight="900" textAnchor="middle" fill={INK}>PEMILU</text>
      <path d="M40 94 Q30 60 52 46 L88 46 Q108 60 98 94 Z" fill="#f7f1e1" {...s} />
      <path d="M50 46 Q70 30 90 46" fill="none" {...s} />
      <Label x={70} y={74} t="BANSOS" bg="#2fa84f" fg="#fff" />
      <Coin x={104} y={86} /><Coin x={114} y={78} r={7} />
    </>
  ),
  viral: (
    <>
      <Phone x={72} y={14}>
        <path d="M100 66 C84 54 86 40 96 40 C100 40 100 44 100 46 C100 44 100 40 104 40 C114 40 116 54 100 66 Z" fill="#ff4d6d" {...s} />
        <text x="100" y="86" fontSize="11" fontWeight="900" textAnchor="middle" fill={INK}>99rb ♥</text>
      </Phone>
      <path d="M38 70 Q30 50 44 36 Q44 50 52 52 Q56 40 50 30 Q70 44 62 70 Z" fill="#ff8a1f" {...s} />
      <path d="M150 40 l10 -10 M156 54 h14 M150 68 l10 10" {...s} fill="none" />
    </>
  ),
  proyek: (
    <>
      <Ground c="#c9b48a" />
      <rect x="40" y="18" width="8" height="76" fill="#f2c94c" {...s} />
      <rect x="40" y="18" width="110" height="8" fill="#f2c94c" {...s} />
      <path d="M130 26 V52" {...s} />
      <rect x="120" y="52" width="20" height="14" fill="#9aa0a6" {...s} />
      <rect x="70" y="70" width="90" height="24" fill="#b9b2a5" {...s} />
      <path d="M70 82 h90 M100 70 v12 M130 82 v12" {...s} />
      <Label x={160} y={110} t="MANGKRAK" bg="#d9534f" fg="#fff" size={10} />
    </>
  ),
  mbg: (
    <>
      <rect x="40" y="40" width="120" height="62" rx="10" fill="#d6dbe0" {...s} />
      <rect x="50" y="48" width="44" height="22" rx="4" fill="#f7f1e1" {...s} />
      <rect x="100" y="48" width="50" height="22" rx="4" fill="#e9a23b" {...s} />
      <rect x="50" y="74" width="30" height="20" rx="4" fill="#7cc46b" {...s} />
      <rect x="86" y="74" width="64" height="20" rx="4" fill="#c0392b" {...s} />
      <path d="M70 34 q-6 -8 0 -16 q6 -8 0 -16 M100 34 q-6 -8 0 -16 q6 -8 0 -16 M130 34 q-6 -8 0 -16 q6 -8 0 -16" stroke="#5fae3a" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  naik: (
    <>
      <rect x="24" y="16" width="152" height="88" rx="6" fill="#0e1a14" {...s} />
      <path d="M34 90 L70 70 L96 78 L130 44 L160 30" stroke="#2fe07a" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M146 26 L164 28 L160 46" stroke="#2fe07a" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="40" y="36" fontSize="14" fontWeight="900" fill="#2fe07a">IHSG ▲</text>
    </>
  ),
  gotong: (
    <>
      <Ground />
      <House x={18} y={58} w={44} />
      <House x={138} y={58} w={44} roof="#2f6fdb" />
      <Person x={80} y={70} c="#2fa84f" />
      <Person x={120} y={70} c="#e3b341" />
      <path d="M86 78 h28 l-4 16 h-20 Z" fill="#b5803f" {...s} />
      <circle cx="94" cy="76" r="5" fill="#d9534f" {...s} /><circle cx="106" cy="76" r="5" fill="#f2c94c" {...s} />
    </>
  ),
  bpjs: (
    <>
      <rect x="46" y="26" width="108" height="70" rx="8" fill="#fff" {...s} />
      <rect x="46" y="26" width="108" height="20" rx="8" fill="#2fa84f" {...s} />
      <text x="100" y="41" fontSize="12" fontWeight="900" textAnchor="middle" fill="#fff">KARTU SEHAT</text>
      <rect x="88" y="54" width="24" height="34" fill="#d9534f" {...s} />
      <rect x="83" y="60" width="34" height="22" fill="#d9534f" stroke="none" />
      <path d="M88 60 h-5 v22 h5 M112 60 h5 v22 h-5" {...s} fill="none" />
      <text x="168" y="30" fontSize="22" fontWeight="900" fill="#f2c94c">✦</text>
    </>
  ),
  jalan: (
    <>
      <Ground />
      <path d="M-5 120 Q60 70 100 92 T205 50 V70 Q150 80 108 112 T-5 132 Z" fill="#3b3d43" {...s} />
      <path d="M20 112 l14 -8 M60 96 l16 -2 M118 96 l16 -10 M160 74 l16 -6" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M120 30 h40 l-8 -10 M160 30 l-8 10" stroke="#f2c94c" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="70" y="40" fontSize="13" fontWeight="900" fill={INK}>JALAN TIKUS</text>
    </>
  ),
  lembur: (
    <>
      <circle cx="78" cy="60" r="38" fill="#fff" {...s} />
      <path d="M78 34 V60 L98 70" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M150 22 a20 20 0 1 0 22 28 a16 16 0 1 1 -22 -28 Z" fill="#f2c94c" {...s} />
      <Coin x={140} y={84} r={10} /><Coin x={160} y={92} r={10} />
    </>
  ),
  tiket: (
    <>
      <path d="M30 70 L150 40 Q170 36 172 44 Q174 52 156 58 L40 90 Z" fill="#fff" {...s} />
      <path d="M100 52 L120 20 L132 18 L122 50 M70 78 L64 98 L74 96 L88 72" fill="#2f6fdb" {...s} />
      <rect x="110" y="78" width="70" height="30" rx="4" fill="#f2c94c" {...s} />
      <text x="145" y="98" fontSize="12" fontWeight="900" textAnchor="middle" fill={INK}>PROMO!</text>
    </>
  ),
  phk: (
    <>
      <Ground c="#9aa0a6" />
      <path d="M30 94 V50 L60 64 V50 L90 64 V50 L120 64 V30 H140 V94 Z" fill="#c9b9a6" {...s} />
      <rect x="66" y="72" width="40" height="22" fill="#5c5f66" {...s} />
      <path d="M66 72 l40 22 M106 72 l-40 22" stroke="#d9534f" strokeWidth="5" />
      <Label x={160} y={40} t="TUTUP" bg="#d9534f" fg="#fff" />
    </>
  ),
  pinjol: (
    <Phone x={72} y={14} screen="#ffd6d6">
      <rect x="80" y="30" width="40" height="20" rx="4" fill="#d9534f" {...s} />
      <text x="100" y="45" fontSize="14" fontWeight="900" textAnchor="middle" fill="#fff">!!!</text>
      <text x="100" y="66" fontSize="9" fontWeight="900" textAnchor="middle" fill={INK}>BAYAR</text>
      <text x="100" y="78" fontSize="9" fontWeight="900" textAnchor="middle" fill="#d9534f">SEKARANG</text>
    </Phone>
  ),
  beras: (
    <>
      <path d="M50 100 Q36 60 56 34 L120 34 Q140 60 126 100 Z" fill="#f7f1e1" {...s} />
      <path d="M56 34 Q88 22 120 34" fill="none" {...s} />
      <text x="88" y="72" fontSize="16" fontWeight="900" textAnchor="middle" fill={INK}>BERAS</text>
      <text x="88" y="88" fontSize="10" fontWeight="900" textAnchor="middle" fill="#d9534f">PREMIUM*</text>
      <path d="M150 90 V36 M136 50 L150 34 L164 50" stroke="#d9534f" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  asap: (
    <>
      <rect x="-5" y="-5" width="210" height="130" fill="#c9a77a" />
      <Ground c="#6b5a3a" />
      <circle cx="160" cy="30" r="12" fill="#e98b3a" opacity="0.8" />
      {[30, 60, 150].map((x) => (
        <g key={x}><path d={`M${x} 94 V70`} {...s} /><path d={`M${x - 12} 76 L${x} 50 L${x + 12} 76 Z`} fill="#3f5d2a" {...s} /></g>
      ))}
      <Cloud x={40} y={50} k={1.6} /><Cloud x={100} y={40} k={1.4} c="#7d8085" />
      <rect x="86" y="70" width="34" height="14" rx="6" fill="#fff" {...s} />
    </>
  ),
  anjlok: (
    <>
      <rect x="24" y="16" width="152" height="88" rx="6" fill="#1a0e0e" {...s} />
      <path d="M34 30 L70 44 L96 38 L130 76 L160 90" stroke="#ff3b3b" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M146 92 L164 92 L160 74" stroke="#ff3b3b" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="40" y="96" fontSize="14" fontWeight="900" fill="#ff3b3b">IHSG ▼</text>
    </>
  ),
  pungli: (
    <>
      <Ground c="#3b3d43" />
      <rect x="110" y="34" width="62" height="60" fill="#d9d4c8" {...s} />
      <rect x="104" y="28" width="74" height="10" fill="#d9534f" {...s} />
      <rect x="120" y="46" width="42" height="24" fill="#5c5f66" {...s} />
      <path d="M100 66 h20" {...s} />
      <path d="M30 80 h80" stroke="#d9534f" strokeWidth="6" />
      <path d="M30 80 h80" stroke="#fff" strokeWidth="6" strokeDasharray="10 10" />
      <path d="M118 62 q-14 -4 -24 4 l6 8 q10 -4 18 -2" fill="#f0c08a" {...s} />
      <Coin x={90} y={60} r={8} />
    </>
  ),
  ott: (
    <>
      <circle cx="74" cy="64" r="26" fill="none" stroke="#9aa0a6" strokeWidth="12" />
      <circle cx="74" cy="64" r="26" fill="none" {...s} />
      <circle cx="126" cy="64" r="26" fill="none" stroke="#9aa0a6" strokeWidth="12" />
      <circle cx="126" cy="64" r="26" fill="none" {...s} />
      <rect x="94" y="58" width="12" height="12" fill="#9aa0a6" {...s} />
      <Label x={100} y={112} t="SAKSI" bg="#f2c94c" />
    </>
  ),
  banjir: (
    <>
      <House x={70} y={34} w={60} />
      <rect x="-5" y="64" width="210" height="70" fill="#3d86b5" opacity="0.92" />
      <path d="M-5 64 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" fill="none" stroke="#bfe3ff" strokeWidth="4" />
      <rect x="20" y="80" width="40" height="8" rx="3" fill="#8a5a3b" {...s} />
      <circle cx="160" cy="82" r="8" fill="#f2c94c" {...s} />
    </>
  ),
  tilang: (
    <>
      <path d="M40 60 Q40 30 80 30 Q120 30 120 60 Z" fill="#4a4f5a" {...s} />
      <rect x="34" y="58" width="92" height="12" rx="4" fill="#2b2e35" {...s} />
      <circle cx="80" cy="46" r="7" fill="#f2c94c" {...s} />
      <rect x="128" y="40" width="50" height="64" fill="#fff" {...s} transform="rotate(8 153 72)" />
      <path d="M138 58 h30 M138 68 h30 M138 78 h20" stroke={INK} strokeWidth="3" transform="rotate(8 153 72)" />
      <text x="80" y="104" fontSize="13" fontWeight="900" textAnchor="middle" fill={INK}>DAMAI?</text>
    </>
  ),
  sakit: (
    <>
      <rect x="30" y="60" width="140" height="18" fill="#fff" {...s} />
      <path d="M30 60 V96 M170 60 V96" {...s} />
      <circle cx="56" cy="52" r="10" fill="#f0c08a" {...s} />
      <rect x="66" y="46" width="90" height="16" rx="6" fill="#2f6fdb" {...s} />
      <rect x="132" y="14" width="12" height="40" rx="6" fill="#fff" {...s} />
      <circle cx="138" cy="56" r="8" fill="#d9534f" {...s} />
      <rect x="135" y="30" width="6" height="22" fill="#d9534f" />
    </>
  ),
  bbm: (
    <>
      <Ground c="#3b3d43" />
      <rect x="22" y="26" width="40" height="68" rx="4" fill="#d9534f" {...s} />
      <rect x="30" y="34" width="24" height="16" fill="#fff" {...s} />
      <path d="M62 44 h10 v30 h-6" fill="none" {...s} />
      <Label x={42} y={22} t="HABIS" bg={INK} fg="#ff5a5a" size={10} />
      {[92, 132, 172].map((x, i) => (
        <g key={x}>
          <circle cx={x - 10} cy="92" r="8" fill={INK} {...s} />
          <circle cx={x + 12} cy="92" r="8" fill={INK} {...s} />
          <path d={`M${x - 10} 92 L${x} 78 L${x + 12} 92`} fill="none" {...s} />
          <Person x={x} y={58} c="#2fa84f" cap={i === 0 ? "#2fa84f" : "#1f8f3f"} />
        </g>
      ))}
    </>
  ),
  demo: (
    <>
      <rect x="-5" y="-5" width="210" height="130" fill="#e8b48a" />
      <Cloud x={120} y={40} k={1.5} c="#f2f2f2" />
      <rect x="30" y="22" width="100" height="26" fill="#fff" {...s} />
      <text x="80" y="40" fontSize="12" fontWeight="900" textAnchor="middle" fill="#d9534f">TOLAK TUNJANGAN</text>
      <path d="M36 48 V62 M124 48 V62" {...s} />
      {[24, 50, 76, 102, 128, 154, 180].map((x, i) => (
        <Person key={x} x={x} y={i % 2 ? 76 : 82} c={["#d9534f", "#2f6fdb", "#2fa84f", "#e3b341"][i % 4]} head={i % 3 ? "#f0c08a" : "#c99a6b"} />
      ))}
    </>
  ),
  gas: (
    <>
      <ellipse cx="80" cy="66" rx="36" ry="34" fill="#4caf50" {...s} />
      <rect x="66" y="22" width="28" height="12" rx="3" fill="#9aa0a6" {...s} />
      <path d="M58 98 h44 v10 h-44 Z" fill="#4caf50" {...s} />
      <text x="80" y="72" fontSize="14" fontWeight="900" textAnchor="middle" fill="#fff">3 kg</text>
      <text x="150" y="80" fontSize="64" fontWeight="900" textAnchor="middle" fill="#d9534f" stroke={INK} strokeWidth="3">?</text>
    </>
  ),
  rekening: (
    <>
      <rect x="28" y="28" width="120" height="74" rx="10" fill="#2f6fdb" {...s} />
      <rect x="40" y="44" width="24" height="18" rx="3" fill="#f2c94c" {...s} />
      <path d="M40 84 h80" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <rect x="128" y="62" width="48" height="40" rx="6" fill="#f2c94c" {...s} />
      <path d="M138 62 V50 a14 14 0 0 1 28 0 V62" fill="none" stroke={INK} strokeWidth="6" />
      <circle cx="152" cy="80" r="5" fill={INK} />
    </>
  ),
  honorer: (
    <>
      <rect x="22" y="18" width="130" height="80" fill="#2e5d3b" stroke="#8a5a3b" strokeWidth="8" />
      <text x="87" y="54" fontSize="22" fontWeight="900" textAnchor="middle" fill="#f7f1e1">GAJI:</text>
      <text x="87" y="82" fontSize="22" fontWeight="900" textAnchor="middle" fill="#f7f1e1">Rp 0</text>
      <Person x={172} y={72} c="#a9c7e8" />
    </>
  ),
  pajak: (
    <>
      <Ground />
      <House x={30} y={50} w={60} />
      <text x="145" y="72" fontSize="34" fontWeight="900" textAnchor="middle" fill="#d9534f" stroke={INK} strokeWidth="2">250%</text>
      <path d="M120 90 h50" stroke="#d9534f" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  ojol: (
    <>
      <Ground c="#3b3d43" />
      <circle cx="60" cy="88" r="14" fill={INK} {...s} />
      <circle cx="140" cy="88" r="14" fill={INK} {...s} />
      <path d="M60 88 L84 66 H120 L140 88" fill="none" {...s} />
      <path d="M84 66 H128 L134 56 H92 Z" fill="#2fa84f" {...s} />
      <Person x={104} y={34} c="#2fa84f" cap="#2fa84f" />
      <rect x="68" y="44" width="22" height="20" fill="#2fa84f" {...s} />
      <Coin x={170} y={40} r={11} />
    </>
  ),
  tani: (
    <>
      <rect x="-5" y="60" width="210" height="70" fill="#a7d36b" {...s} />
      {[20, 44, 68, 92, 116].map((x) => (
        <path key={x} d={`M${x} 100 V72 M${x} 80 l-8 -10 M${x} 80 l8 -10`} stroke="#3f7a2a" strokeWidth="3" fill="none" strokeLinecap="round" />
      ))}
      <path d="M140 100 Q132 70 146 56 L178 56 Q190 70 182 100 Z" fill="#f7f1e1" {...s} />
      <text x="161" y="84" fontSize="10" fontWeight="900" textAnchor="middle" fill={INK}>PUPUK</text>
      <Coin x={150} y={36} r={10} />
    </>
  ),
  dewan: (
    <>
      <Ground />
      <rect x="40" y="62" width="120" height="32" fill="#f7f1e1" {...s} />
      <path d="M58 62 a42 30 0 0 1 84 0 Z" fill="#2fa84f" {...s} />
      <path d="M100 32 V62" {...s} />
      {[52, 72, 92, 108, 128, 148].map((x) => <path key={x} d={`M${x} 66 V92`} {...s} />)}
      <Coin x={30} y={50} /><Coin x={172} y={48} /><Coin x={180} y={66} r={7} />
    </>
  ),
};

/** Gambar adegan kartu; dek menentukan langit belakangnya (kuning Kesempatan, gelap Musibah). */
export function CardArt({ art, deck }: { art: ArtId; deck: "kesempatan" | "musibah" }) {
  return (
    <svg viewBox="0 0 200 120" role="img" aria-hidden="true" style={{ display: "block", width: "100%", height: "auto", borderRadius: 10, border: `3px solid ${INK}` }}>
      <rect x="-5" y="-5" width="210" height="130" fill={deck === "kesempatan" ? "#ffe9a3" : "#3a3f4b"} />
      {deck === "musibah" && <circle cx="170" cy="26" r="40" fill="#4a5060" />}
      {ART[art]}
    </svg>
  );
}
