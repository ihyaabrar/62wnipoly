import * as THREE from "three";
import {
  C,
  ball,
  box,
  cyl,
  gableRoof,
  group,
  mat,
  rng,
  textTexture,
  texturedPlane,
} from "./kit";

export type HouseState = "normal" | "banjir" | "abu" | "roboh";
/** Plastered walls, tiled shallow roof, ventilation and a small terrace: one local house family. */
export function kampungHouse(seed = 1, state: HouseState = "normal") {
  const r = rng(seed);
  const dusty = state === "abu" || state === "roboh";
  const wall = dusty ? C.ash : [C.paper, "#d8d2bd", "#c6cdb9"][seed % 3];
  const roof = dusty ? "#8f8a7f" : seed % 3 === 0 ? C.roofBlue : C.roofRed;
  const g = group(
    `rumah-kampung-${state}`,
    box(1.32, 0.08, 1.08, C.concrete),
    box(1.38, 0.055, 0.31, C.concrete, [0, 0.03, 0.66]),
  );
  const h = state === "roboh" ? 0.36 : 0.73;
  g.add(box(1.18, h, 0.88, wall, [0, 0.08, 0]));
  g.add(box(0.25, Math.min(h, 0.58), 0.018, C.woodDark, [-0.25, 0.08, 0.449]));
  if (state !== "roboh") {
    g.add(gableRoof(1.4, 0.28, 1.18, roof, [0, 0.81, 0]));
    g.add(box(1.42, 0.035, 0.055, dusty ? C.ash : C.woodDark, [0, 1.08, 0]));
    for (const x of [-0.51, 0.51])
      g.add(cyl(0.025, 0.03, 0.64, C.concrete, [x, 0.1, 0.7], 6));
    g.add(box(1.25, 0.04, 0.32, roof, [0, 0.73, 0.6]));
    for (const x of [0.13, 0.34]) {
      g.add(
        box(0.16, 0.27, 0.025, C.wood, [x, 0.31, 0.45]),
        box(0.12, 0.23, 0.03, C.navy, [x, 0.33, 0.454]),
      );
    }
    for (const x of [-0.37, -0.25, -0.13, 0.16, 0.29])
      g.add(box(0.055, 0.04, 0.02, C.woodDark, [x, 0.69, 0.45]));
    g.add(box(0.025, 0.22, 0.24, C.navy, [0.598, 0.34, -0.15]));
  } else {
    const fallen = gableRoof(
      1.28,
      0.25,
      1.08,
      roof,
      [0.14, 0.13, 0.2],
      [0.18, 0.12, 0.24],
    );
    g.add(fallen, box(0.08, 0.65, 0.82, wall, [-0.56, 0.08, 0], [0, 0, 0.17]));
    for (let i = 0; i < 10; i++)
      g.add(
        box(
          0.1 + r() * 0.1,
          0.06,
          0.09,
          i % 2 ? C.roofRed : wall,
          [(r() - 0.5) * 1.5, 0.08, (r() - 0.5) * 1.25],
          [0, r() * 3, 0],
        ),
      );
  }
  if (state === "abu") {
    const cover = gableRoof(1.42, 0.28, 1.2, C.ash, [0, 0.835, 0]);
    g.add(cover, box(1.47, 0.045, 1.32, C.ash, [0, 0.02, 0.08]));
  }
  if (state === "banjir")
    g.add(box(1.185, 0.14, 0.886, "#9c9e85", [0, 0.08, 0]));
  g.userData.houseState = state;
  return g;
}

export function reliefTent(color: string = C.roofBlue) {
  const g = group(
    "tenda-pengungsian",
    box(1.3, 0.035, 1.12, C.woodDark),
    box(1.12, 0.5, 0.95, color, [0, 0.035, 0]),
    gableRoof(1.3, 0.34, 1.12, color, [0, 0.535, 0]),
  );
  // Dark doorway plus two rolled flaps; walls remain visible from the initial camera.
  g.add(
    box(0.38, 0.47, 0.02, C.ink, [0, 0.04, 0.482]),
    box(0.075, 0.48, 0.04, C.paper, [-0.23, 0.04, 0.49]),
    box(0.075, 0.48, 0.04, C.paper, [0.23, 0.04, 0.49]),
  );
  for (const x of [-0.62, 0.62])
    for (const z of [-0.52, 0.52]) {
      g.add(cyl(0.012, 0.012, 0.63, C.concrete, [x, 0.01, z], 5));
      const rope = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.LineCurve3(
            new THREE.Vector3(x, 0.56, z),
            new THREE.Vector3(x * 1.32, 0.02, z * 1.3),
          ),
          1,
          0.008,
          4,
          false,
        ),
        mat(C.paper),
      );
      g.add(rope, box(0.035, 0.06, 0.035, C.woodDark, [x * 1.32, 0, z * 1.3]));
    }
  g.add(box(0.3, 0.18, 0.22, "#bc9d72", [0.8, 0, 0.32]));
  return g;
}

export function reliefPost() {
  const g = reliefTent(C.paper);
  g.name = "posko-bantuan";
  g.add(
    texturedPlane(
      0.78,
      0.17,
      textTexture(["POSKO BANTUAN"], {
        bg: C.paper,
        fg: C.navy,
        w: 384,
        h: 80,
      }),
      [0, 0.65, 0.57],
      [0, 0, 0],
      false,
    ),
  );
  for (let i = 0; i < 3; i++)
    g.add(box(0.23, 0.14, 0.2, "#bc9d72", [0.95, i * 0.14, -0.1]));
  return g;
}

export function marketStall() {
  const g = group(
    "warung-pasar",
    box(1, 0.1, 0.62, C.wood, [0, 0.42, 0]),
    gableRoof(1.25, 0.16, 1.05, C.roofRed, [0, 1.03, 0]),
  );
  for (const x of [-0.5, 0.5])
    for (const z of [-0.35, 0.35])
      g.add(box(0.04, 1.03, 0.04, C.woodDark, [x, 0, z]));
  for (let i = 0; i < 6; i++)
    g.add(
      ball(0.065, i % 2 ? C.leaf : C.gold, [-0.36 + i * 0.14, 0.56, 0.06], 0),
    );
  g.add(
    texturedPlane(
      0.9,
      0.18,
      textTexture(["WARUNG WARGA"], { bg: C.paper, fg: C.ink, w: 384, h: 80 }),
      [0, 0.86, 0.44],
      [0, 0, 0],
      false,
    ),
  );
  return g;
}

export function dock() {
  const g = group("dermaga-warga");
  for (let i = 0; i < 9; i++)
    g.add(box(0.13, 0.045, 0.65, C.wood, [-0.58 + i * 0.145, 0.28, 0]));
  for (const x of [-0.55, 0.55])
    for (const z of [-0.26, 0.26])
      g.add(cyl(0.035, 0.04, 0.65, C.woodDark, [x, -0.3, z], 6));
  g.add(
    box(0.6, 0.045, 0.16, C.wood, [0.9, 0.16, 0]),
    box(0.6, 0.045, 0.16, C.wood, [0.9, 0.05, 0.14]),
  );
  return g;
}

export function waterPump() {
  const hose = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.025, 5, 16, Math.PI * 1.7),
    mat(C.ink),
  );
  hose.rotation.x = -Math.PI / 2;
  hose.position.set(0.4, 0.04, 0.05);
  return group(
    "pompa-banjir",
    box(0.45, 0.06, 0.32, C.ink),
    box(0.22, 0.24, 0.24, C.red, [0, 0.06, 0]),
    cyl(0.09, 0.09, 0.14, C.concrete, [0.12, 0.18, 0], 10, [0, 0, Math.PI / 2]),
    hose,
  );
}

export function floodGauge() {
  const g = group("ukur-tinggi-air", box(0.13, 1.15, 0.045, C.paper));
  for (let i = 0; i < 10; i++)
    g.add(
      box(i % 2 ? 0.06 : 0.1, 0.025, 0.008, i > 6 ? C.red : C.navy, [
        0,
        0.1 + i * 0.1,
        0.026,
      ]),
    );
  return g;
}
