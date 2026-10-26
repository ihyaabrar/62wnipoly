import { C, ball, box, cyl, group, mat } from "./kit";

export type CitizenRole = "warga" | "relawan" | "pemadam" | "aparat";
/** Shared cartoon anatomy. Environment figures simplify the same two-legged pawn silhouette. */
export function citizen(
  shirt: string = C.navy,
  seed = 1,
  role: CitizenRole = "warga",
  seated = false,
) {
  const skin = seed % 2 ? C.skin : C.skinDark;
  const g = group(role);
  const hip = seated ? 0.12 : 0.17;
  for (const x of [-0.045, 0.045]) {
    g.add(
      cyl(
        0.027,
        0.03,
        seated ? 0.1 : 0.17,
        C.ink,
        [x, 0.015, seated ? 0.065 : 0],
        6,
        seated ? [Math.PI / 2, 0, 0] : [0, 0, 0],
      ),
    );
    g.add(box(0.065, 0.035, 0.09, C.ink, [x, 0, seated ? 0.14 : 0.025]));
  }
  g.add(
    cyl(0.072, 0.087, 0.2, shirt, [0, hip, 0], 8),
    ball(0.088, skin, [0, hip + 0.29, 0], 1),
  );
  for (const x of [-0.1, 0.1]) {
    g.add(
      cyl(0.022, 0.025, 0.16, shirt, [x, hip + 0.015, 0], 6, [
        0,
        0,
        x > 0 ? 0.15 : -0.15,
      ]),
      ball(0.024, skin, [x * 1.1, hip + 0.012, 0.02], 0),
    );
  }
  if (role !== "aparat") {
    for (const x of [-0.03, 0.03])
      g.add(ball(0.011, C.ink, [x, hip + 0.3, 0.078], 0));
    g.add(box(0.032, 0.008, 0.008, C.woodDark, [0, hip + 0.26, 0.085]));
  }
  if (role === "relawan" || role === "pemadam") {
    const vest = role === "pemadam" ? C.orange : C.gold;
    g.add(
      box(0.15, 0.16, 0.035, vest, [0, hip + 0.02, 0.06]),
      box(0.15, 0.018, 0.04, C.paper, [0, hip + 0.09, 0.065]),
    );
    g.add(
      cyl(
        0.095,
        0.1,
        0.055,
        role === "pemadam" ? C.gold : C.white,
        [0, hip + 0.34, 0],
        10,
      ),
    );
  } else if (role === "aparat") {
    g.add(
      ball(0.099, C.ink, [0, hip + 0.31, -0.01], 1),
      box(0.14, 0.055, 0.02, C.navy, [0, hip + 0.29, 0.085]),
    );
    const shield = box(
      0.21,
      0.31,
      0.018,
      mat("#95a9b4", { opacity: 0.64, roughness: 0.48 }),
      [0, 0.07, 0.15],
    );
    shield.castShadow = false;
    g.add(shield, box(0.21, 0.018, 0.023, C.concrete, [0, 0.36, 0.15]));
  } else if (seed % 3 === 0)
    g.add(cyl(0.09, 0.09, 0.035, C.ink, [0, hip + 0.36, 0], 8));
  return g;
}
