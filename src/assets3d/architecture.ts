import {
  C,
  box,
  cyl,
  group,
  mat,
  softBox,
  textTexture,
  texturedPlane,
} from "./kit";

/** Side elevations share the same window and sill dimensions as the front. */
export function facadeSides(w: number, h: number, d: number, rows = 2) {
  const g = group("fasad-samping");
  for (const side of [-1, 1])
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < 3; col++) {
        const z = -d * 0.3 + col * d * 0.3;
        g.add(
          box(0.025, 0.19, 0.15, C.navy, [
            side * (w / 2 + 0.01),
            0.35 + (row * (h - 0.3)) / rows,
            z,
          ]),
          box(0.04, 0.025, 0.2, C.paper, [
            side * (w / 2 + 0.01),
            0.33 + (row * (h - 0.3)) / rows,
            z,
          ]),
        );
      }
  return g;
}

export function safeCabinet() {
  const steel = mat(C.navy, { metalness: 0.35, roughness: 0.65 });
  const g = group(
    "brankas-arsip",
    softBox(0.65, 0.8, 0.5, steel),
    softBox(0.55, 0.68, 0.035, C.concrete, [0, 0.06, 0.26]),
  );
  g.add(
    cyl(0.08, 0.08, 0.025, C.ink, [0.1, 0.38, 0.29], 12, [Math.PI / 2, 0, 0]),
    box(0.13, 0.025, 0.04, C.gold, [0.1, 0.38, 0.31]),
  );
  g.add(
    texturedPlane(
      0.37,
      0.11,
      textTexture(["ARSIP RAHASIA"], {
        bg: C.concrete,
        fg: C.ink,
        w: 256,
        h: 64,
      }),
      [0, 0.67, 0.285],
      [0, 0, 0],
      false,
    ),
  );
  return g;
}

export function roadSign(text = "TITIK KUMPUL", color: string = C.green) {
  return group(
    "rambu-bersama",
    cyl(0.02, 0.03, 0.9, C.concrete, [0, 0, 0], 7),
    box(0.64, 0.3, 0.035, C.paper, [0, 0.65, 0]),
    texturedPlane(
      0.58,
      0.25,
      textTexture([text], { bg: color, fg: C.paper, w: 384, h: 160 }),
      [0, 0.8, 0.02],
      [0, 0, 0],
      true,
    ),
  );
}
