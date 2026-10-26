import { beforeAll, describe, expect, it, vi } from "vitest";
import * as THREE from "three";

// Test procedural geometry in Node; real font/texture/model rendering is checked in the browser.
vi.mock("troika-three-text", async () => {
  const { Mesh, PlaneGeometry, MeshBasicMaterial } = await import("three");
  return {
    Text: class extends Mesh {
      constructor() {
        super(new PlaneGeometry(0.2, 0.1), new MeshBasicMaterial());
      }
      sync() {}
      dispose() {
        this.geometry.dispose();
      }
    },
  };
});
import { ASSETS } from "./registry";
import { card } from "./props";
import { inspectObject } from "./review";
import { disposeObject, mat, tickAll } from "./kit";
import { cityBuilding } from "./timur";
import { kampungHouse } from "./village";
import { exportStaticGlb, staticSnapshot } from "./export";
import { connectedWater, connectedWaterGeometry } from "./water";
import { tile, tileTitleLayout, TILE_D, TILE_W } from "./board";
import { TILES } from "@/engine/data";
import { TILE_TOP, TILE_PRESS_DEPTH, loadTileButtons, supportPawns, stepTileSpring } from "./tileMotion";

beforeAll(() => {
  const gradient = { addColorStop: () => {} };
  const context = new Proxy(
    {
      measureText: (s: string) => ({ width: s.length * 18 }),
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      getImageData: () => ({ data: new Uint8ClampedArray(16) }),
    },
    {
      get: (obj, key) => Reflect.get(obj, key) ?? (() => {}),
      set: (obj, key, value) => Reflect.set(obj, key, value),
    },
  );
  vi.stubGlobal("document", {
    createElement: () => ({
      width: 128,
      height: 128,
      getContext: () => context,
    }),
  });
  vi.stubGlobal("location", { href: "http://localhost:3000/assets" });
});

describe("asset catalogue integrity", () => {
  it("leaves a visible gap between every pair of tile bodies, including corners", () => {
    const tiles = TILES.map((info) => tile(info.index));
    try {
      const bounds = tiles.map((t) => {
        t.updateMatrixWorld(true);
        return new THREE.Box3().setFromObject(t.children[0].children[0]);
      });
      for (let i = 0; i < bounds.length; i++)
        for (let j = i + 1; j < bounds.length; j++)
          expect(bounds[i].intersectsBox(bounds[j]), `tiles ${i} and ${j}`).toBe(false);
    } finally { tiles.forEach(disposeObject); }
  });
  it("holds a tile down until the last pawn leaves, then returns without pawn height drift", () => {
    const button = tile(5);
    const a = new THREE.Group(), b = new THREE.Group();
    a.position.y = b.position.y = TILE_TOP;
    a.userData.tileContacts = b.userData.tileContacts = [{ index: 0, weight: 1 }];
    const run = () => {
      for (let i = 0; i < 120; i++) {
        loadTileButtons([button], [a, b]);
        tickAll(button, i / 60, 1 / 60);
        supportPawns([button], [a, b]);
      }
    };
    try {
      run();
      expect(button.userData.pressOffset).toBeCloseTo(-TILE_PRESS_DEPTH, 4);
      expect(a.position.y).toBeCloseTo(TILE_TOP - TILE_PRESS_DEPTH, 4);
      a.userData.tileContacts = [];
      run();
      expect(button.userData.pressOffset).toBeCloseTo(-TILE_PRESS_DEPTH, 4);
      expect(a.position.y).toBeCloseTo(TILE_TOP, 4);
      b.userData.tileContacts = [];
      run();
      expect(button.userData.pressOffset).toBe(0);
      expect(b.position.y).toBeCloseTo(TILE_TOP, 4);
    } finally { disposeObject(button); }
  });
  it("keeps button springs stable on slow frames and reverses mid-press", () => {
    const s = { offset: 0, velocity: 0 };
    for (let i = 0; i < 20; i++) stepTileSpring(s, 4, 0.5);
    expect(s.offset).toBeCloseTo(-TILE_PRESS_DEPTH, 4);
    for (let i = 0; i < 20; i++) stepTileSpring(s, 0, 0.5);
    expect(s.offset).toBe(0);
    stepTileSpring(s, 1, 0.02);
    expect(s.offset).toBeLessThan(0);
    for (let i = 0; i < 60; i++) stepTileSpring(s, 0, 1 / 60);
    expect(s.offset).toBe(0);
  });
  it.each(TILES)(
    "keeps tile $index ($name) text and miniatures inside separate areas",
    (info) => {
      const layout = tileTitleLayout(info.index);
      expect(layout.measuredWidth).toBeLessThan(layout.width);
      expect(
        layout.text.split("\n").length * layout.size * layout.lineHeight,
      ).toBeLessThanOrEqual(0.701);
      if (info.kind !== "sudut")
        expect(layout.text.replaceAll("\n", " ")).toBe(info.name.toUpperCase());
      const object = tile(info.index);
      try {
        object.position.set(0, 0, 0);
        object.rotation.set(0, 0, 0);
        object.updateMatrixWorld(true);
        const miniature = object.getObjectByName(
          `miniatur-petak-${info.index}`,
        );
        expect(miniature).toBeDefined();
        const bounds = new THREE.Box3().setFromObject(miniature!);
        const halfWidth =
          ((info.kind === "sudut" ? TILE_D : TILE_W) - 0.22) / 2;
        expect(bounds.min.x).toBeGreaterThanOrEqual(-halfWidth - 0.001);
        expect(bounds.max.x).toBeLessThanOrEqual(halfWidth + 0.001);
        expect(bounds.min.z).toBeGreaterThanOrEqual(-0.671);
        expect(bounds.max.z).toBeLessThanOrEqual(-0.189);
        expect(bounds.min.y).toBeGreaterThanOrEqual(TILE_TOP - 0.001);
        expect(bounds.max.y).toBeLessThanOrEqual(TILE_TOP + 0.461);
      } finally {
        disposeObject(object);
      }
    },
  );
  it("joins the river and floodplain into one connected mesh without duplicate seam vertices", () => {
    const { geometry } = connectedWaterGeometry();
    try {
      const indices = geometry.index!,
        p = geometry.attributes.position;
      const parent = Array.from({ length: p.count }, (_, i) => i);
      const find = (n: number): number => {
        while (parent[n] !== n) {
          parent[n] = parent[parent[n]];
          n = parent[n];
        }
        return n;
      };
      const used = new Set<number>(),
        coordinates = new Set<string>();
      for (let i = 0; i < indices.count; i += 3) {
        const a = indices.getX(i),
          b = indices.getX(i + 1),
          c = indices.getX(i + 2);
        used.add(a);
        used.add(b);
        used.add(c);
        parent[find(b)] = find(a);
        parent[find(c)] = find(a);
      }
      expect(new Set([...used].map(find)).size).toBe(1);
      for (const i of used)
        coordinates.add(`${p.getX(i).toFixed(5)},${p.getZ(i).toFixed(5)}`);
      expect(coordinates.size).toBe(used.size);
    } finally {
      geometry.dispose();
    }
  });
  it("raises the floodplain and lower river together while keeping the upstream level", () => {
    const water = connectedWater(),
      surface = water.getObjectByName("sungai-dan-banjir") as THREE.Mesh;
    try {
      const p = surface.geometry.attributes.position;
      const nearest = (x: number, z: number) => {
        let best = 0,
          d = Infinity;
        for (let i = 0; i < p.count; i++) {
          const v = (p.getX(i) - x) ** 2 + (p.getZ(i) - z) ** 2;
          if (v < d) {
            best = i;
            d = v;
          }
        }
        return best;
      };
      const upstream = nearest(-15.5, -5.7),
        lake = nearest(0, 10.9);
      water.userData.setLevel(0);
      const lowUp = p.getY(upstream),
        lowLake = p.getY(lake);
      water.userData.setLevel(1);
      expect(p.getY(upstream) - lowUp).toBeCloseTo(0, 5);
      expect(p.getY(lake) - lowLake).toBeCloseTo(0.6, 5);
      expect(inspectObject("connected-water", water).valid).toBe(true);
    } finally {
      disposeObject(water);
    }
  });
  it("omits runtime lights and particle shaders from portable snapshots", () => {
    const source = new THREE.Group();
    source.add(
      new THREE.Mesh(new THREE.BoxGeometry(), mat("#654321")),
      new THREE.PointLight(),
      new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial()),
    );
    const snapshot = staticSnapshot(source);
    let meshes = 0,
      lights = 0,
      points = 0;
    snapshot.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes++;
      if ((o as THREE.Light).isLight) lights++;
      if ((o as THREE.Points).isPoints) points++;
    });
    expect({ meshes, lights, points }).toEqual({
      meshes: 1,
      lights: 0,
      points: 0,
    });
    disposeObject(source);
  });
  it("writes a valid GLB header and nonempty scene for a local house", async () => {
    class Reader {
      result: ArrayBuffer | null = null;
      onloadend: (() => void) | null = null;
      readAsArrayBuffer(blob: Blob) {
        void blob.arrayBuffer().then((buffer) => {
          this.result = buffer;
          this.onloadend?.();
        });
      }
    }
    vi.stubGlobal("FileReader", Reader);
    const buf = await exportStaticGlb(() => kampungHouse(2));
    const header = new DataView(buf);
    expect(header.getUint32(0, true)).toBe(0x46546c67);
    expect(header.getUint32(4, true)).toBe(2);
    expect(header.getUint32(8, true)).toBe(buf.byteLength);
    expect(buf.byteLength).toBeGreaterThan(1024);
    vi.stubGlobal("FileReader", undefined);
  }, 30000);
  it("keeps unique stable IDs and includes every original entry plus new families", () => {
    expect(new Set(ASSETS.map((a) => a.id)).size).toBe(ASSETS.length);
    expect(ASSETS.length).toBe(126);
    for (const id of [
      "papan-lengkap",
      "petak-mulai",
      "rumah-terendam",
      "bidak-buruh",
      "spanduk-12",
      "baliho-4",
    ])
      expect(ASSETS.some((a) => a.id === id)).toBe(true);
  });
  it.each(ASSETS.map((a) => [a.id, a] as const))(
    "%s has finite geometry and transforms across four phases",
    (_id, entry) => {
      const o = entry.make();
      try {
        for (const t of [0, 2, 9, 15]) {
          tickAll(o, t, 1 / 60);
          expect(inspectObject(entry.id, o).valid).toBe(true);
          if (entry.id === "papan-lengkap") {
            let surfaces = 0;
            o.traverse((child) => {
              if (child.name === "sungai-dan-banjir") surfaces++;
            });
            expect(surfaces).toBe(1);
          }
        }
      } finally {
        disposeObject(o);
      }
    },
    60000,
  );
  it("puts card artwork above the solid surface for both decks", () => {
    for (const kind of ["kesempatan", "musibah"] as const) {
      const o = card(kind);
      o.updateWorldMatrix(true, true);
      const body = new THREE.Box3().setFromObject(o.children[0]);
      expect(o.children[1].position.y).toBeGreaterThan(body.max.y);
      disposeObject(o);
    }
  });
  it("selects architecture explicitly instead of inferring glass from a seed", () => {
    const a = cityBuilding(17, "kaca"),
      b = cityBuilding(17, "ruko");
    expect(new THREE.Box3().setFromObject(a).max.y).toBeGreaterThan(
      new THREE.Box3().setFromObject(b).max.y + 1,
    );
    disposeObject(a);
    disposeObject(b);
  });
  it("keeps the same footprint for damaged and intact local houses", () => {
    const normal = kampungHouse(2),
      ash = kampungHouse(2, "abu");
    const a = new THREE.Box3()
        .setFromObject(normal)
        .getSize(new THREE.Vector3()),
      b = new THREE.Box3().setFromObject(ash).getSize(new THREE.Vector3());
    expect(Math.abs(a.x - b.x)).toBeLessThan(0.16);
    expect(Math.abs(a.z - b.z)).toBeLessThan(0.16);
    disposeObject(normal);
    disposeObject(ash);
  });
  it("does not dispose shared cached materials when an asset is released", () => {
    const material = mat("#123456"),
      spy = vi.spyOn(material, "dispose");
    const o = new THREE.Mesh(new THREE.BoxGeometry(), material);
    disposeObject(o);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
