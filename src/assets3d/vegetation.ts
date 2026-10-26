import * as THREE from "three";
import { C, ball, cyl, group, mat, onUpdate, rng } from "./kit";

/** One branching skeleton, shared by healthy, burning and charred tropical trees. */
export function tropicalTree(
  seed = 1,
  state: "sehat" | "terbakar" | "hangus" = "sehat",
) {
  const r = rng(seed);
  const h = 0.72 + r() * 0.28;
  const wood = state === "sehat" ? C.woodDark : "#494137";
  const g = group(
    state === "sehat" ? "pohon" : `pohon-${state}`,
    cyl(0.055, 0.105, h, wood, [0, 0, 0], 7),
  );
  const branches = [
    [-0.23, h - 0.12, 0.05],
    [0.22, h + 0.03, 0.02],
    [0, h + 0.13, -0.2],
  ];
  branches.forEach(([x, y, z], i) => {
    g.add(
      cyl(0.022, 0.043, 0.42, wood, [x * 0.45, y - 0.23, z * 0.45], 6, [
        z * 1.8,
        0,
        -x * 1.7,
      ]),
    );
    if (state !== "hangus") {
      const crown = ball(
        0.38,
        state === "sehat" ? [C.greenDark, C.green, C.leaf][i] : "#706047",
        [x, y + 0.16, z],
        1,
      );
      crown.scale.set(1.05, 0.75 + r() * 0.12, 1);
      g.add(crown);
    }
  });
  g.rotation.y = r() * Math.PI * 2;
  if (state !== "sehat")
    g.add(cyl(0.42, 0.45, 0.008, "#514735", [0, 0.003, 0], 12));
  return g;
}

const leafMaterials = new Map<string, THREE.MeshStandardMaterial>();
function frond(length: number, width: number, color: string) {
  const pts: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5,
      x = t * length,
      y = Math.sin(t * Math.PI) * length * 0.17 - t * t * length * 0.28,
      w = Math.sin(t * Math.PI) * width;
    pts.push(x, y, -w, x, y + 0.018, w);
    if (i) {
      const a = (i - 1) * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  let double = leafMaterials.get(color);
  if (!double) {
    double = mat(color).clone();
    double.userData.sharedResource = true;
    double.side = THREE.DoubleSide;
    leafMaterials.set(color, double);
  }
  const m = new THREE.Mesh(geo, double);
  m.castShadow = true;
  return m;
}

export function tropicalPalm(seed = 1, oil = false) {
  const r = rng(seed),
    h = oil ? 0.76 : 1.6 + r() * 0.35,
    bend = oil ? 0.04 : 0.24;
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(),
    new THREE.Vector3(-bend * 0.3, h * 0.55, 0),
    new THREE.Vector3(bend, h, 0),
  );
  const trunk = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 7, oil ? 0.09 : 0.055, 7, false),
    mat(C.wood),
  );
  trunk.castShadow = true;
  const g = group(oil ? "pohon-sawit" : "pohon-kelapa", trunk),
    top = group("pelepah");
  top.position.set(bend, h, 0);
  for (let i = 0; i < (oil ? 10 : 8); i++) {
    const f = frond(
      oil ? 0.7 : 0.86,
      oil ? 0.12 : 0.1,
      i % 2 ? C.green : C.leaf,
    );
    f.rotation.y = (i * Math.PI * 2) / (oil ? 10 : 8) + r() * 0.1;
    top.add(f);
  }
  for (let i = 0; i < 3; i++)
    top.add(
      ball(
        oil ? 0.07 : 0.06,
        oil ? C.roofRed : C.woodDark,
        [Math.cos(i * 2) * 0.09, -0.04, Math.sin(i * 2) * 0.09],
        0,
      ),
    );
  g.add(top);
  return onUpdate(g, (t) => {
    top.rotation.z = Math.sin(t * 0.9 + seed) * 0.025;
  }, [top]);
}

export function tropicalStump() {
  const g = group(
    "tunggul",
    cyl(0.09, 0.16, 0.18, C.woodDark, [0, 0, 0], 7),
    cyl(0.095, 0.095, 0.006, "#c3a174", [0, 0.181, 0], 9),
  );
  for (let i = 0; i < 4; i++)
    g.add(
      cyl(
        0.025,
        0.055,
        0.17,
        C.woodDark,
        [Math.sin(i * 1.57) * 0.09, 0, Math.cos(i * 1.57) * 0.09],
        5,
        [0, 0, (i % 2 ? 1 : -1) * 0.5],
      ),
    );
  return g;
}
