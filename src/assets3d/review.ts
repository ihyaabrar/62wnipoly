import * as THREE from "three";
import { C, box, group, mat } from "./kit";
import { kampungHouse } from "./village";
import { citizen } from "./characters";
import { tropicalTree } from "./vegetation";
import { serviceVehicle } from "./vehicles";
import { model } from "./models";
import { buruh } from "./pawns";
import { car, streetLamp } from "./props";
import { PALETTE } from "./style";
import { clouds } from "./fx";
import { terrain } from "./routes";

export function routeReview(make: () => THREE.Object3D) {
  return group("jalur-dengan-medan", terrain(), make());
}

export function scaleLineup() {
  const g = group("lineup-skala", box(10, 0.04, 2.7, C.concrete));
  const items = [
    citizen(),
    buruh(),
    car(),
    serviceVehicle(),
    kampungHouse(),
    streetLamp(),
    tropicalTree(),
  ];
  items.forEach((o, i) => {
    o.position.set(-4.3 + i * 1.4, 0.04, 0);
    g.add(o);
  });
  for (let i = 0; i < 21; i++)
    g.add(
      box(0.02, 0.01, i % 2 ? 0.1 : 0.2, C.ink, [-5 + i * 0.5, 0.045, 1.2]),
    );
  return g;
}
export function paletteLineup() {
  const g = group("palet-bersama");
  Object.values(PALETTE).forEach((c, i) =>
    g.add(box(0.7, 0.12, 0.7, c, [(i % 8) * 0.8, 0, Math.floor(i / 8) * 0.8])),
  );
  return g;
}
export function houseLineup() {
  const g = group("varian-rumah");
  (["normal", "banjir", "abu", "roboh"] as const).forEach((state, i) => {
    const h = kampungHouse(2, state);
    h.position.x = i * 1.8;
    g.add(h);
  });
  return g;
}
export function treeLineup() {
  const g = group("varian-pohon");
  (["sehat", "terbakar", "hangus"] as const).forEach((state, i) => {
    const t = tropicalTree(4, state);
    t.position.x = i * 1.5;
    g.add(t);
  });
  return g;
}
export function trainLineup() {
  const g = group("kereta-tiga-gerbong");
  (["keretaDepan", "keretaTengah", "keretaBelakang"] as const).forEach(
    (name, i) => {
      const o =
        model(name, 0.46) ??
        group(
          name,
          box(1.1, 0.4, 0.5, C.paper, [0, 0.12, 0]),
          box(1.12, 0.05, 0.51, C.red, [0, 0.32, 0]),
        );
      o.position.x = i * 1.3;
      g.add(o);
    },
  );
  return g;
}
export function cloudReview() {
  const g = clouds(1, 3);
  delete g.userData.update;
  delete g.userData.noFit;
  g.children.forEach((c) => {
    c.position.set(0, 0.6, 0);
    delete c.userData.noFit;
  });
  return g;
}
export function benchReview() {
  return (
    model("bangku") ??
    group(
      "bangku",
      box(0.65, 0.05, 0.24, C.wood, [0, 0.2, 0]),
      box(0.65, 0.17, 0.04, C.wood, [0, 0.24, -0.1]),
      box(0.04, 0.2, 0.2, C.ink, [-0.25, 0, 0]),
      box(0.04, 0.2, 0.2, C.ink, [0.25, 0, 0]),
    )
  );
}
/** Neutral contrast ground for effects which cannot be judged against an empty sky. */
export function effectReview(make: () => THREE.Object3D) {
  const fx = make(),
    g = group("pratinjau-efek", box(4.8, 0.025, 3.8, "#74796e"), fx);
  const reference = kampungHouse(1);
  reference.position.set(0, 0.025, 0);
  reference.scale.setScalar(0.65);
  g.add(reference);
  return g;
}
export function floodedHouseReview() {
  const g = group("rumah-dan-muka-air", kampungHouse(2, "banjir"));
  const water = box(
    2.1,
    0.012,
    1.65,
    mat(C.water, { opacity: 0.78, roughness: 0.6 }),
    [0, 0.35, 0],
  );
  water.castShadow = false;
  g.add(water);
  return g;
}

export type AssetCheck = {
  id: string;
  meshes: number;
  triangles: number;
  lights: number;
  valid: boolean;
  error?: string;
};
export function inspectObject(id: string, obj: THREE.Object3D): AssetCheck {
  let meshes = 0,
    triangles = 0,
    lights = 0;
  let valid = true;
  obj.updateWorldMatrix(true, true);
  obj.traverse((o) => {
    if ((o as THREE.Light).isLight) lights++;
    if (!o.matrixWorld.elements.every(Number.isFinite)) valid = false;
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      meshes++;
      const geo = m.geometry,
        p = geo.getAttribute("position");
      triangles += (geo.index?.count ?? p?.count ?? 0) / 3;
      if (p)
        for (let i = 0; i < p.count; i++)
          if (
            !Number.isFinite(p.getX(i)) ||
            !Number.isFinite(p.getY(i)) ||
            !Number.isFinite(p.getZ(i))
          )
            valid = false;
    }
  });
  return { id, meshes, triangles: Math.round(triangles), lights, valid };
}
