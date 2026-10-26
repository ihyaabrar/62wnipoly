import * as THREE from "three";
import {
  C,
  box,
  cyl,
  group,
  mat,
  onUpdate,
  softBox,
  textTexture,
  texturedPlane,
} from "./kit";
import { SURFACES } from "./style";

/** Shared wheel, glazing and body proportions, nose towards +x. */
export function serviceVehicle(
  kind: "ambulans" | "water-cannon" | "logistik" = "ambulans",
) {
  const armored = kind === "water-cannon",
    color = armored ? C.navy : C.white;
  const g = group(
    kind,
    softBox(0.9, 0.43, 0.43, color, [-0.14, 0.14, 0]),
    softBox(0.35, 0.34, 0.42, color, [0.46, 0.14, 0]),
    box(0.022, 0.14, 0.34, mat(C.navy, SURFACES.glass), [0.642, 0.3, 0]),
    softBox(1.28, 0.055, 0.45, C.ink, [0.05, 0.12, 0]),
  );
  for (const z of [-0.224, 0.224]) {
    for (const x of [-0.38, 0.43]) {
      g.add(
        cyl(0.1, 0.1, 0.055, C.ink, [x, 0.12, z], 12, [Math.PI / 2, 0, 0]),
        cyl(0.05, 0.05, 0.06, C.concrete, [x, 0.12, z], 10, [
          Math.PI / 2,
          0,
          0,
        ]),
      );
    }
    g.add(
      box(0.19, 0.14, 0.014, C.navy, [0.45, 0.3, z]),
      box(0.76, 0.018, 0.014, armored ? C.concrete : C.red, [-0.17, 0.28, z]),
    );
    if (!armored)
      g.add(
        texturedPlane(
          0.56,
          0.12,
          textTexture([kind === "ambulans" ? "AMBULANS" : "BANTUAN"], {
            bg: color,
            fg: C.red,
            w: 256,
            h: 64,
          }),
          [-0.16, 0.42, z + (z > 0 ? 0.009 : -0.009)],
          [0, z > 0 ? 0 : Math.PI, 0],
          false,
        ),
      );
  }
  for (const z of [-0.13, 0.13])
    g.add(
      box(
        0.018,
        0.05,
        0.08,
        mat(C.paper, { emissive: C.paper, emissiveIntensity: 0.25 }),
        [0.65, 0.2, z],
      ),
    );
  if (armored) {
    g.add(
      cyl(0.07, 0.09, 0.08, C.ink, [0.1, 0.57, 0], 8),
      cyl(0.027, 0.032, 0.37, C.ink, [0.13, 0.67, 0], 8, [
        0,
        0,
        -Math.PI / 2 + 0.12,
      ]),
    );
    for (const z of [-0.22, 0.22])
      g.add(box(0.65, 0.2, 0.025, "#4c6172", [-0.2, 0.31, z]));
  } else {
    const red = mat(C.red, { emissive: C.red, emissiveIntensity: 0.5 }).clone();
    red.userData.sharedResource = false;
    const blue = mat(C.navy, {
      emissive: C.navy,
      emissiveIntensity: 0.5,
    }).clone();
    blue.userData.sharedResource = false;
    g.add(
      softBox(0.12, 0.05, 0.09, red, [0.06, 0.58, 0.11]),
      softBox(0.12, 0.05, 0.09, blue, [0.06, 0.58, -0.11]),
    );
    onUpdate(g, (t) => {
      red.emissiveIntensity = Math.sin(t * 8) > 0 ? 0.9 : 0.1;
      blue.emissiveIntensity = Math.sin(t * 8) > 0 ? 0.1 : 0.9;
    });
  }
  return g;
}

export function scooter() {
  const g = group(
    "motor-ojol",
    softBox(0.38, 0.15, 0.19, C.ojol, [-0.06, 0.17, 0]),
    softBox(0.3, 0.055, 0.2, C.ink, [-0.09, 0.33, 0]),
    softBox(0.12, 0.31, 0.16, C.ojol, [0.22, 0.17, 0]),
  );
  for (const x of [-0.27, 0.28])
    g.add(
      cyl(0.105, 0.105, 0.075, C.ink, [x, 0.11, 0.038], 12, [
        Math.PI / 2,
        0,
        0,
      ]),
      cyl(0.052, 0.052, 0.08, C.concrete, [x, 0.11, 0.04], 10, [
        Math.PI / 2,
        0,
        0,
      ]),
    );
  g.add(
    softBox(0.1, 0.065, 0.15, C.paper, [0.287, 0.38, 0]),
    box(0.025, 0.05, 0.29, C.ink, [0.22, 0.43, 0]),
    box(0.1, 0.045, 0.15, C.red, [-0.3, 0.27, 0]),
  );
  return g;
}
