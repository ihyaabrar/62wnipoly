import * as THREE from "three";
import { Text } from "troika-three-text";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { disposeObject, tickAll } from "./kit";

/** Copy only portable objects, without cloning a live font worker or shader emitter. */
export function staticSnapshot(source: THREE.Object3D) {
  const out = new THREE.Group();
  out.name = source.name;
  const visit = (o: THREE.Object3D, parent: THREE.Object3D) => {
    const m = o as THREE.Mesh;
    if (
      o instanceof Text ||
      (o as THREE.Light).isLight ||
      (o as THREE.Points).isPoints ||
      o.type === "LineSegments" ||
      (m.material &&
        (Array.isArray(m.material) ? m.material : [m.material]).some(
          (mt) => mt.type === "ShaderMaterial",
        ))
    )
      return;
    if (o instanceof THREE.LOD) {
      const fixed = new THREE.Group();
      fixed.position.copy(o.position);
      fixed.quaternion.copy(o.quaternion);
      fixed.scale.copy(o.scale);
      parent.add(fixed);
      if (o.levels[0]) visit(o.levels[0].object, fixed);
      return;
    }
    const copy = o.clone(false);
    copy.userData = {};
    parent.add(copy);
    o.children.forEach((child) => visit(child, copy));
  };
  visit(source, out);
  return out;
}

export async function exportStaticGlb(make: () => THREE.Object3D) {
  const source = make();
  try {
    tickAll(source, 2, 1 / 60);
    return (await new GLTFExporter().parseAsync(staticSnapshot(source), {
      binary: true,
    })) as ArrayBuffer;
  } finally {
    disposeObject(source);
  }
}
