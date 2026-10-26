import * as THREE from "three";
import { C, ball, box, cone, cyl, gableRoof, group, mat, onUpdate, textTexture, texturedPlane, windows } from "./kit";
import { person } from "./props";

// Bangunan pojok papan, satu per petak sudut. Nama rekaan.

function sign(lines: string[], w: number, h: number, bg: string, fg: string) {
  return texturedPlane(w, h, textTexture(lines, { bg, fg, w: 512, h: Math.round((512 * h) / w), border: fg }));
}

/** Pelataran: tebal ke bawah supaya di tanah miring sisinya tertanam, tidak tampak melayang. */
function pad(w: number, d: number) {
  return group("pelataran",
    box(w, 0.7, d, "#a59d8e", [0, -0.55, 0]),
    box(w, 0.04, d, "#bdb6a8", [0, 0.11, 0]),
  );
}

/** Pojok MULAI: kantor pajak. Gaji masuk, langsung dipotong. */
export function taxOffice() {
  const g = group("kantor-pajak",
    pad(3.4, 3.2),
    box(2.2, 1.6, 1.4, "#e9e4d8", [0, 0.15, 0]),
    windows(2, 1.3, 4, 7, 0.71, 0.25, "#2d4a5a"),
    box(2.3, 0.1, 1.5, "#2a5d8f", [0, 1.75, 0]),
    box(1.2, 0.5, 0.9, "#e9e4d8", [0, 1.85, 0]),
    box(0.5, 0.45, 0.03, "#2b3a4a", [0, 0.15, 0.71]),
    box(1.4, 0.06, 0.6, "#2a5d8f", [0, 0.7, 0.95]), // kanopi
  );
  const s = sign(["KANTOR PAJAK", "GAJIAN? KAMI DULUAN"], 1.6, 0.36, "#2a5d8f", C.white);
  s.position.set(0, 1.35, 0.76); // di depan jendela, bukan sebidang
  g.add(s);
  // Antrean wajib pajak.
  for (let i = 0; i < 6; i++) {
    const p = person(["#24345c", "#c8102e", "#2fa84f", "#f7f7f2"][i % 4], 30 + i);
    p.position.set(-0.3 + (i % 2) * 0.12, 0.15, 1.15 + i * 0.25);
    p.rotation.y = Math.PI;
    g.add(p);
  }
  // Mesin penghitung uang yang terus berputar.
  const coin = cyl(0.18, 0.18, 0.04, mat(C.gold, { metalness: 0.9, roughness: 0.25, emissive: C.goldDark, emissiveIntensity: 0.4 }), [0, 0, 0], 16, [Math.PI / 2, 0, 0]);
  coin.position.set(0.85, 2.6, 0.2);
  g.add(cyl(0.02, 0.02, 0.4, C.concrete, [0.85, 2.15, 0.2]), coin);
  return onUpdate(g, (t) => (coin.rotation.y = t * 2));
}

/** Rumah sakit penuh: antrean berobat sampai luar gedung. */
export function hospital() {
  const crossMat = mat("#ff2a2a", { emissive: "#ff2a2a", emissiveIntensity: 1.5 });
  const g = group("rumah-sakit",
    pad(3.4, 3.2),
    box(2.4, 1.3, 1.3, C.white, [0, 0.15, -0.2]),
    windows(2.2, 1.1, 3, 8, 0.46, 0.2, "#4f7a93"),
    box(2.5, 0.08, 1.4, "#3fa66b", [0, 1.45, -0.2]),
    box(0.9, 0.55, 0.6, C.white, [0, 0.15, 0.6]), // IGD
    box(1.1, 0.05, 0.8, "#3fa66b", [0, 0.7, 0.7]),
    box(0.4, 0.12, 0.04, crossMat, [0.75, 1.6, 0.46]),
    box(0.12, 0.4, 0.04, crossMat, [0.75, 1.46, 0.46]),
  );
  const s = sign(["RS PENUH", "SILAKAN SAKIT LAIN WAKTU"], 1.3, 0.3, C.white, "#3fa66b");
  s.position.set(-0.4, 1.2, 0.5);
  g.add(s);
  // Pasien antre di luar, sebagian di kursi roda.
  for (let i = 0; i < 8; i++) {
    const p = person(["#9ac7e0", "#f7f7f2", "#c8102e"][i % 3], 50 + i);
    p.position.set(-0.7 + i * 0.22, 0.15, 1.3 + Math.sin(i) * 0.15);
    p.rotation.y = Math.PI;
    g.add(p);
  }
  const bed = group("ranjang-lorong", box(0.5, 0.05, 0.2, C.white, [0, 0.2, 0]), box(0.05, 0.2, 0.2, C.concrete, [0.23, 0, 0]), box(0.05, 0.2, 0.2, C.concrete, [-0.23, 0, 0]));
  bed.position.set(1.1, 0.15, 1.1);
  g.add(bed);
  return g;
}

/** Pesawat penumpang kecil. Moncong ke -x, roda di y 0. */
export function planeModel() {
  const plane = group("pesawat",
    cyl(0.12, 0.12, 1.4, C.white, [0, 0.3, 0], 10, [0, 0, Math.PI / 2]),
    cone(0.12, 0.25, C.white, [-0.7, 0.3, 0], 10, [0, 0, Math.PI / 2]),
    box(0.35, 0.02, 1.4, C.white, [0.05, 0.28, 0]),
    box(0.15, 0.3, 0.02, C.merah, [0.62, 0.38, 0]),
    box(0.15, 0.02, 0.45, C.white, [0.62, 0.36, 0]),
    box(1.2, 0.03, 0.245, C.merah, [0, 0.3, 0]), // garis merah di badan
    cyl(0.05, 0.05, 0.18, "#9aa0a6", [0.1, 0.22, 0.32], 8, [0, 0, Math.PI / 2]), // mesin
    cyl(0.05, 0.05, 0.18, "#9aa0a6", [0.1, 0.22, -0.32], 8, [0, 0, Math.PI / 2]),
    cyl(0.04, 0.04, 0.16, C.ink, [0, 0.0, 0.3]), cyl(0.04, 0.04, 0.16, C.ink, [0, 0.0, -0.3]),
  );
  plane.children[0].position.x = 0.7; // badan silinder dipusatkan (cyl tumbuh ke -x setelah diputar)
  return plane;
}

/**
 * Pesawat menjalani siklus: parkir di ujung A, lepas landas ke arah B, memutari dunia sambil naik dan
 * berbelok miring, mendarat di A menuju B, lalu taksi kembali ke A. Koordinat dunia.
 */
export function airplaneFlight(a: THREE.Vector3, b: THREE.Vector3) {
  const plane = planeModel();
  plane.scale.setScalar(1.2);
  const g = group("penerbangan", plane);
  const center = new THREE.Vector3(0, a.y, 0);
  const angA = Math.atan2(a.z, a.x), angB = Math.atan2(b.z, b.x);
  let dAng = angB - angA;
  dAng = Math.atan2(Math.sin(dAng), Math.cos(dAng)); // arah putaran mengikuti landasan
  const dir = Math.sign(dAng);
  const r0 = Math.hypot(a.x, a.z);
  const T = 38;
  const ease = (x: number) => x * x * (3 - 2 * x);
  const k = (t: number, s: number, e: number) => Math.min(1, Math.max(0, (t - s) / (e - s)));
  const prev = new THREE.Vector3();
  const pos = new THREE.Vector3();
  let bank = 0;
  const posAt = (ang: number, r: number, y: number) => pos.set(center.x + Math.cos(ang) * r, y, center.z + Math.sin(ang) * r);
  const runArc = Math.abs(dAng);
  return onUpdate(g, (time) => {
    const t = time % T;
    let ang = angA, r = r0, y = a.y, rolling = false;
    if (t < 3) ang = angA; // parkir
    else if (t < 8) {
      // Lepas landas: makin cepat di landasan, terangkat di ujungnya.
      const u = k(t, 3, 8);
      ang = angA + dir * runArc * 1.8 * u * u;
      y = a.y + Math.max(0, u - 0.55) * 2.4;
      rolling = u < 0.55;
    } else if (t < 26) {
      // Memutari dunia: naik, melebar ke luar, lalu turun lagi.
      const u = k(t, 8, 26);
      ang = angA + dir * (runArc * 1.8 + u * (Math.PI * 2 - runArc * 1.8 - runArc * 0.9));
      y = a.y + 1.1 + Math.sin(u * Math.PI) * 4.2;
      r = r0 + Math.sin(u * Math.PI) * 3.5 - Math.sin(u * Math.PI * 3) * 0.8;
    } else if (t < 31) {
      // Mendarat: menyentuh landasan di A lalu melambat sampai B.
      const u = k(t, 26, 31);
      const eu = 1 - (1 - u) * (1 - u);
      ang = angA + dir * (Math.PI * 2 - runArc * 0.9 + eu * runArc * 1.9);
      y = a.y + Math.max(0, 0.35 - u) / 0.35 * 1.1;
      rolling = u > 0.35;
    } else if (t < 36) {
      // Taksi kembali dari B ke A.
      const u = ease(k(t, 31, 36));
      ang = angA + dir * runArc * (1 - u);
      rolling = true;
    }
    prev.copy(plane.position);
    posAt(ang, r, y);
    plane.position.copy(pos);
    const dx = pos.x - prev.x, dz = pos.z - prev.z, dy = pos.y - prev.y;
    const sp = Math.hypot(dx, dz);
    if (sp > 1e-4) {
      // Moncong (sumbu -x) menghadap arah gerak; taksi mundur tetap menghadap depan.
      const yaw = Math.atan2(dz, -dx);
      const back = t >= 31 && t < 36;
      plane.rotation.set(0, back ? yaw + Math.PI : yaw, 0);
      const targetBank = rolling ? 0 : -dir * 0.35;
      bank += (targetBank - bank) * 0.05;
      plane.rotateX(bank);
      plane.rotateZ(rolling ? 0 : -Math.atan2(dy, sp) * 0.8);
    }
  });
}

/** Bandara sepi: terminal megah, pesawat terparkir (opsional), landasan kosong. */
export function airport(withPlane = true) {
  const plane = planeModel();
  plane.position.set(0.5, 0.15, 0.9);
  const runway = box(3.2, 0.02, 0.45, "#3d4048", [0, 0.15, 1.35]);
  const g = group("bandara-sepi",
    pad(3.6, 3.4),
    runway,
    box(2.6, 0.7, 1.1, "#d4dde3", [0, 0.15, -0.8]),
    windows(2.4, 0.5, 1, 10, -0.24, 0.25, "#3c5a78"),
    // Atap melengkung bergaya terminal modern.
    box(2.8, 0.06, 1.3, "#8aa0b0", [0, 0.88, -0.8], [0.08, 0, 0]),
    cyl(0.18, 0.22, 1.2, "#d4dde3", [1.3, 0.15, -0.2], 8), // menara kontrol
    cyl(0.3, 0.3, 0.25, mat("#3c5a78", { roughness: 0.1, metalness: 0.5 }), [1.3, 1.35, -0.2], 8),
  );
  if (withPlane) g.add(plane);
  for (let i = 0; i < 6; i++) g.add(box(0.2, 0.021, 0.04, C.white, [-1.3 + i * 0.5, 0.16, 1.35]));
  const s = sign(["BANDARA INTERNASIONAL", "#KABURAJADULU"], 1.6, 0.32, C.white, "#24345c");
  s.position.set(-0.3, 0.6, -0.2);
  g.add(s);
  // Rumput liar di landasan: bandara jarang dipakai.
  for (let i = 0; i < 10; i++) g.add(cone(0.05, 0.12, C.leaf, [-1.4 + i * 0.3, 0.15, 1.6 + Math.sin(i) * 0.1], 4));
  // Apron: garis kuning parkir pesawat dan jalur taksi.
  const yellow = mat("#e8b21f");
  g.add(box(2.4, 0.012, 0.03, yellow, [0, 0.151, 0.35]), box(0.03, 0.012, 0.75, yellow, [0.5, 0.151, 0.75]), box(0.03, 0.012, 0.75, yellow, [-0.6, 0.151, 0.75]));
  // Garbarata ke terminal, menjulur kosong.
  g.add(box(0.7, 0.14, 0.16, "#c9d1d6", [-0.6, 0.28, -0.05], [0, 0.5, 0]), box(0.08, 0.13, 0.08, "#7f8c8d", [-0.85, 0.15, 0.1])); // di bawah papan nama
  // Troli bagasi kosong.
  for (let i = 0; i < 3; i++) g.add(box(0.18, 0.06, 0.12, "#8f9aa3", [1.0 - i * 0.24, 0.2, 0.55]), cyl(0.02, 0.02, 0.04, C.ink, [1.0 - i * 0.24, 0.15, 0.6], 6, [Math.PI / 2, 0, 0]));
  // Papan jadwal satir di depan terminal.
  const board = textTexture(["KEDATANGAN : -", "KEBERANGKATAN : SEMUA"], { bg: "#0b0f14", fg: "#ffcc00", w: 512, h: 160 });
  const boardMat = new THREE.MeshStandardMaterial({ map: board, emissiveMap: board, emissive: "#ffffff", emissiveIntensity: 1.2 });
  const flight = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), boardMat);
  flight.position.set(0.7, 0.46, 0.02); // berdiri di apron, tidak menutupi papan nama terminal
  g.add(flight, box(0.04, 0.18, 0.04, C.ink, [0.7, 0.15, 0]));
  // Kantong angin yang berkibar dan lampu menara yang berkedip.
  const sock = cone(0.06, 0.32, mat(C.orange), [0, 0, 0], 8);
  sock.rotation.z = Math.PI / 2;
  const sockG = group("kantong-angin", sock);
  sockG.position.set(-1.55, 0.75, 1.0);
  const beacon = mat("#ff3030", { emissive: "#ff3030", emissiveIntensity: 3 });
  g.add(cyl(0.012, 0.012, 0.62, C.ink, [-1.55, 0.15, 1.0], 6), sockG, ball(0.05, beacon, [1.3, 1.65, -0.2], 1));
  // Animasi dipasang di kantong angin saja, supaya sisa bandara tetap bisa digabung jadi statis.
  onUpdate(sockG, (t) => {
    sockG.rotation.y = Math.sin(t * 0.7) * 0.5;
    sock.scale.y = 0.9 + Math.sin(t * 6) * 0.1;
    beacon.emissiveIntensity = Math.sin(t * 3) > 0.6 ? 4 : 0.2;
  });
  return g;
}

/** Lapas VIP: tembok tinggi, menara jaga, tapi di dalam ada sofa dan AC. */
export function vipPrison() {
  const g = group("lapas-vip", pad(3.4, 3.2));
  const wallMat = mat("#a8a196");
  for (let i = 0; i < 4; i++) {
    const w = box(2.8, 0.75, 0.12, wallMat, [0, 0.15, 1.3]);
    const side = group("tembok", w, box(2.8, 0.06, 0.04, "#5a5a5a", [0, 0.93, 1.3]));
    side.rotation.y = (i * Math.PI) / 2;
    g.add(side);
  }
  g.add(
    box(1.4, 0.8, 1, "#c9c2b3", [0, 0.15, -0.2]),
    windows(1.2, 0.6, 2, 5, 0.31, 0.2, "#2b2b2b"),
    gableRoof(1.5, 0.3, 1.1, "#7f8c8d", [0, 0.95, -0.2]),
    // Kamar VIP: sofa, TV, AC, karpet merah.
    box(0.9, 0.01, 0.5, C.merah, [0.2, 0.16, 0.7]),
    box(0.5, 0.15, 0.2, "#7a3b8f", [0.2, 0.16, 0.85]),
    box(0.5, 0.15, 0.06, "#7a3b8f", [0.2, 0.31, 0.93]),
    box(0.35, 0.22, 0.03, C.ink, [0.2, 0.3, 0.45]),
    box(0.22, 0.1, 0.1, "#e8e8e8", [-0.5, 0.75, 0.31]), // AC
  );
  for (const [x, z] of [[1.3, 1.3], [-1.3, -1.3]]) {
    const lampMat = mat("#fff2c4", { emissive: "#fff2c4", emissiveIntensity: 2 });
    g.add(
      box(0.3, 1.4, 0.3, "#8f887d", [x, 0.15, z]),
      box(0.42, 0.3, 0.42, "#6d675e", [x, 1.55, z]),
      cone(0.32, 0.25, "#4a4540", [x, 1.85, z], 4),
      ball(0.06, lampMat, [x, 1.65, z + (z > 0 ? -0.22 : 0.22)], 1),
    );
  }
  const s = sign(["LAPAS VIP", "TERSEDIA KAMAR SUITE"], 1.3, 0.3, C.ink, C.gold);
  s.position.set(0, 0.6, 1.37);
  g.add(s);
  // Lampu sorot menara berputar.
  const spot = new THREE.SpotLight("#fff2c4", 8, 6, 0.35, 0.5, 1.5);
  spot.position.set(1.3, 1.7, 1.3);
  g.add(spot, spot.target);
  return onUpdate(g, (t) => spot.target.position.set(1.3 + Math.cos(t * 0.7) * 2, 0, 1.3 + Math.sin(t * 0.7) * 2));
}
