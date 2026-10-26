import * as THREE from "three";
import { disposeObject, group, onUpdate } from "./kit";
import { floodWater } from "./selatan";
import { RIVER, WATER_Y } from "./routes";

const FLOOD = { left: -9, right: 9, top: 6.65, bottom: 15.15, centerZ: 10.9 };
export const CONNECTED_WATER_COLOR = "#608c9c";
type Sample = {
  x: number;
  z: number;
  wet: number;
  y: number;
  influence: number;
};

/** One height field for the channel and the floodplain; the last stretch shares the lake level. */
function sample(x: number, z: number): Sample {
  let distanceSq = Infinity,
    nearest = 0;
  if (x < -6.5) {
    for (let i = 0; i < RIVER.length; i++) {
      const p = RIVER[i],
        d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < distanceSq) {
        distanceSq = d;
        nearest = i;
      }
    }
  }
  const progress = nearest / (RIVER.length - 1);
  const influence = THREE.MathUtils.smoothstep(progress, 0.72, 0.91);
  const riverField = 0.475 + influence * 0.22 - Math.sqrt(distanceSq);
  const floodField = Math.min(
    x - FLOOD.left,
    FLOOD.right - x,
    z - FLOOD.top,
    FLOOD.bottom - z,
  );
  const inLake = floodField >= 0;
  const blend = inLake ? 1 : influence;
  return {
    x,
    z,
    wet: Math.max(riverField, floodField),
    y: THREE.MathUtils.lerp(RIVER[nearest].y, WATER_Y, blend),
    influence: blend,
  };
}

/** Clip each grid triangle against the union, keeping smooth banks and shared seam vertices. */
export function connectedWaterGeometry(step = 0.24) {
  const left = -18.2,
    top = -6.8;
  const nx = Math.ceil((FLOOD.right - left) / step),
    nz = Math.ceil((FLOOD.bottom - top) / step);
  const grid: Sample[] = [];
  for (let iz = 0; iz <= nz; iz++)
    for (let ix = 0; ix <= nx; ix++) {
      grid.push(
        sample(
          THREE.MathUtils.lerp(left, FLOOD.right, ix / nx),
          THREE.MathUtils.lerp(top, FLOOD.bottom, iz / nz),
        ),
      );
    }
  const positions: number[] = [],
    influences: number[] = [],
    indices: number[] = [];
  const vertices = new Map<string, number>();
  const vertex = (p: Sample) => {
    const key = `${p.x.toFixed(5)},${p.z.toFixed(5)}`;
    let index = vertices.get(key);
    if (index === undefined) {
      index = positions.length / 3;
      vertices.set(key, index);
      positions.push(p.x, p.y, p.z);
      influences.push(p.influence);
    }
    return index;
  };
  const triangle = (a: Sample, b: Sample, c: Sample) => {
    const input = [a, b, c],
      clipped: Sample[] = [];
    for (let i = 0; i < 3; i++) {
      const p = input[i],
        q = input[(i + 1) % 3];
      if (p.wet >= 0) clipped.push(p);
      if (p.wet >= 0 !== q.wet >= 0) {
        const t = p.wet / (p.wet - q.wet);
        clipped.push({
          x: THREE.MathUtils.lerp(p.x, q.x, t),
          z: THREE.MathUtils.lerp(p.z, q.z, t),
          wet: 0,
          y: THREE.MathUtils.lerp(p.y, q.y, t),
          influence: THREE.MathUtils.lerp(p.influence, q.influence, t),
        });
      }
    }
    for (let i = 1; i + 1 < clipped.length; i++) {
      const ia = vertex(clipped[0]),
        ib = vertex(clipped[i]),
        ic = vertex(clipped[i + 1]);
      if (ia !== ib && ib !== ic && ic !== ia) indices.push(ia, ib, ic);
    }
  };
  for (let iz = 0; iz < nz; iz++)
    for (let ix = 0; ix < nx; ix++) {
      const a = iz * (nx + 1) + ix,
        b = a + 1,
        c = a + nx + 1,
        d = c + 1;
      triangle(grid[a], grid[c], grid[b]);
      triangle(grid[b], grid[c], grid[d]);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return {
    geometry,
    base: Float32Array.from(positions),
    influences: Float32Array.from(influences),
  };
}

/** The complete world has exactly one continuous water mesh, including its river mouth. */
export function connectedWater(withRain = false) {
  const { geometry, base, influences } = connectedWaterGeometry();
  const surface = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: CONNECTED_WATER_COLOR,
      roughness: 0.6,
      metalness: 0.02,
      transparent: true,
      opacity: 0.92,
    }),
  );
  surface.name = "sungai-dan-banjir";
  surface.receiveShadow = true;
  // Retain the original floating debris and optional rain, without rendering its old rectangular plane.
  const effects = floodWater(18, 8.5, withRain),
    oldSurface = effects.children[0];
  const floating = group("benda-hanyut");
  floating.add(...oldSurface.children.slice());
  effects.remove(oldSurface);
  disposeObject(oldSurface);
  effects.userData = {};
  effects.name = "hujan-banjir";
  effects.position.z = FLOOD.centerZ;
  floating.position.z = FLOOD.centerZ;
  const water = group("air-banjir", surface, floating, effects);
  let level = 0.35,
    normalTime = 0;
  const raise = () => level * 0.6 - 0.21;
  const update = (t: number) => {
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3],
        z = base[i * 3 + 2];
      p.setY(
        i,
        base[i * 3 + 1] +
          raise() * influences[i] +
          Math.sin(x * 1.8 + t * 0.9) * 0.018 +
          Math.cos(z * 2.6 + t * 0.7) * 0.012,
      );
    }
    p.needsUpdate = true;
    floating.position.y = WATER_Y + raise();
    effects.position.y = WATER_Y + raise();
    if (t < normalTime || t - normalTime >= 0.1) {
      geometry.computeVertexNormals();
      normalTime = t;
    }
  };
  water.userData.setLevel = (value: number) => {
    level = THREE.MathUtils.clamp(value, 0, 1);
    update(0);
  };
  water.userData.connectedWater = true;
  update(0);
  geometry.computeBoundingSphere();
  // Include the highest crisis level in culling bounds.
  geometry.boundingSphere!.radius += 0.65;
  return onUpdate(water, (t) => update(t));
}
