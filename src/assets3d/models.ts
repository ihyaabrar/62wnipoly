import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Model .glb/.gltf dari paket CC0 (lihat docs/riset-aset.md). Dimuat sekali sebelum dunia dibangun,
// lalu disalin (clone) setiap kali dipakai. Kalau gagal dimuat, pemanggil memakai aset prosedural lama.

/** turn = putaran Y supaya arah model cocok dengan aset prosedural (mobil: depan ke +x). */
type Spec = { url: string; turn?: number };

const kk = (file: string, turn = 0): Spec => ({ url: `/models/kaykit/${file}.gltf`, turn });
const km = (file: string, turn = 0): Spec => ({ url: `/models/kaykit-medieval/${file}.gltf`, turn }); // KayKit Medieval Hexagon (CC0)
const kt = (file: string): Spec => ({ url: `/models/kenney-train/${file}.glb`, turn: Math.PI / 2 }); // Kenney Train Kit (CC0), depan +z -> +x
const CAR = Math.PI / 2; // mobil KayKit menghadap +z; aset kita menghadap +x

/**
 * Daftar model, semuanya dari KayKit City Builder Bits (CC0). Dasar model diletakkan di y = 0,
 * ukurannya tetap satuan asli KayKit (mobil sepanjang 0.94), lalu diskalakan oleh pemanggil.
 */
const MODELS = {
  mobilPolisi: kk("car_police", CAR),
  sedan: kk("car_sedan", CAR),
  hatchback: kk("car_hatchback", CAR),
  taksi: kk("car_taxi", CAR),
  stationwagon: kk("car_stationwagon", CAR),
  gedungA: kk("building_A_withoutBase"),
  gedungB: kk("building_B_withoutBase"),
  gedungC: kk("building_C_withoutBase"),
  gedungD: kk("building_D_withoutBase"),
  gedungE: kk("building_E_withoutBase"),
  gedungF: kk("building_F_withoutBase"),
  gedungG: kk("building_G_withoutBase"),
  gedungH: kk("building_H_withoutBase"),
  lampuJalan: kk("streetlight"),
  lampuLalin: kk("trafficlight_A"),
  bangku: kk("bench"),
  semak: kk("bush"),
  pohonA: km("tree_single_A"),
  pohonB: km("tree_single_B"),
  tunggul: km("tree_single_A_cut"),
  batuA: km("rock_single_A"),
  batuC: km("rock_single_C"),
  batuE: km("rock_single_E"),
  rumahMerah: km("building_home_A_red"),
  rumahBiru: km("building_home_A_blue"),
  rumahKuning: km("building_home_B_yellow"),
  rumahHijau: km("building_home_B_green"),
  rumahRoboh: km("building_destroyed"),
  tenda: km("tent"),
  keretaDepan: kt("train-electric-city-a"),
  keretaTengah: kt("train-electric-city-b"),
  keretaBelakang: kt("train-electric-city-c"),
} satisfies Record<string, Spec>;

/** Empat rumah desa KayKit dengan warna atap berbeda (dipilih dari seed). */
export const HOMES = ["rumahMerah", "rumahBiru", "rumahKuning", "rumahHijau"] as const;

/** Skala supaya model KayKit seukuran aset prosedural di dunia ini (mobil 0.62 panjang). */
export const KAYKIT_SCALE = 0.66;

export type ModelName = keyof typeof MODELS;

const cache = new Map<ModelName, THREE.Object3D>();
let ready: Promise<void> | null = null;

/**
 * Atlas KayKit cukup jenuh. Turunkan saturasinya dan hangatkan sedikit supaya cocok dengan palet
 * +62WNIPOLY (aspal, krem, kuning rambu). Satu atlas dipakai bersama oleh semua model KayKit.
 */
const toned = new Map<string, THREE.Texture>();
const materials = new Map<string, THREE.MeshStandardMaterial>();
/** key = alamat file atlas: setiap .gltf memuat salinan atlasnya sendiri, tapi cukup satu versi teredup per file. */
function tone(tex: THREE.Texture, key: string) {
  const img = tex.image as HTMLImageElement | ImageBitmap | undefined;
  if (!img || toned.has(key)) return toned.get(key) ?? tex;
  const cv = document.createElement("canvas");
  cv.width = img.width;
  cv.height = img.height;
  const ctx = cv.getContext("2d")!;
  ctx.drawImage(img as CanvasImageSource, 0, 0);
  // Dihitung manual (bukan ctx.filter) karena Safari mengabaikan filter kanvas.
  const px = ctx.getImageData(0, 0, cv.width, cv.height);
  const d = px.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i] = Math.min(255, (l + (d[i] - l) * 0.72) * 1.02 + 2); // sedikit lebih hangat
    d[i + 1] = l + (d[i + 1] - l) * 0.72;
    d[i + 2] = (l + (d[i + 2] - l) * 0.72) * 0.96;
  }
  ctx.putImageData(px, 0, 0);
  const out = new THREE.CanvasTexture(cv);
  out.colorSpace = THREE.SRGBColorSpace;
  out.flipY = tex.flipY;
  out.userData.sharedResource = true;
  out.magFilter = THREE.NearestFilter; // atlas gradasi: hindari warna tetangga ikut tercampur
  out.minFilter = THREE.LinearMipmapLinearFilter;
  toned.set(key, out);
  tex.dispose(); // salinan asli tidak dipakai lagi
  return out;
}

/** Muat semua model sekali. Aman dipanggil berulang; error tidak menggagalkan game. */
export function loadModels() {
  if (ready) return ready;
  const loader = new GLTFLoader();
  ready = Promise.all(
    (Object.entries(MODELS) as [ModelName, Spec][]).filter(([name]) => !["pohonA", "pohonB", "tunggul", "rumahMerah", "rumahBiru", "rumahKuning", "rumahHijau", "rumahRoboh", "tenda"].includes(name)).map(async ([name, spec]) => {
      try {
        const gltf = await loader.loadAsync(spec.url);
        const src = gltf.scene;
        const imageUri = (gltf.parser.json as { images?: { uri?: string }[] }).images?.[0]?.uri ?? name;
        const atlasKey = new URL(imageUri, new URL(spec.url, location.href)).href;
        src.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          m.castShadow = m.receiveShadow = true;
          // Satu material per atlas, dipakai bersama semua model: bakeStatic jadi bisa menggabungkannya.
          m.geometry.userData.sharedResource = true;
          const original = m.material as THREE.MeshStandardMaterial;
          const materialKey = JSON.stringify([atlasKey, original.color?.getHex(), original.opacity, original.transparent, original.side, original.alphaTest, original.emissive?.getHex(), original.vertexColors]);
          const shared = materials.get(materialKey);
          if (shared) {
            (m.material as THREE.Material).dispose();
            m.material = shared;
            return;
          }
          const mat = m.material as THREE.MeshStandardMaterial;
          if (mat.map) mat.map = tone(mat.map, atlasKey);
          mat.roughness = 0.85;
          mat.metalness = 0;
          mat.userData.sharedResource = true;
          materials.set(materialKey, mat);
        });
        // Bungkus: arah disamakan dengan aset prosedural, dasar model tepat di y = 0.
        const box = new THREE.Box3().setFromObject(src);
        src.position.y -= box.min.y;
        src.rotation.y = spec.turn ?? 0;
        const wrap = new THREE.Group();
        wrap.name = `model-${name}`;
        wrap.add(src);
        cache.set(name, wrap);
      } catch (e) {
        console.warn(`Model ${name} gagal dimuat, memakai aset prosedural.`, e);
      }
    }),
  ).then(async () => { await document.fonts?.load('900 16px "Barlow Condensed"'); });
  return ready;
}

/** Salinan model siap pakai (skala dikali `scale`), atau null kalau belum/gagal dimuat. */
export function model(name: ModelName, scale = KAYKIT_SCALE) {
  const src = cache.get(name);
  if (!src) return null;
  const o = src.clone(true);
  o.scale.setScalar(scale);
  return o;
}

/**
 * Warnai ulang salinan model (materialnya digandakan dulu supaya model lain tidak ikut berubah).
 * mix 0..1: seberapa kuat warna menimpa atlas (1 = penuh, mis. untuk abu vulkanik atau hangus).
 */
export function tint<T extends THREE.Object3D>(o: T, color: string, mix = 1) {
  const c = new THREE.Color("#ffffff").lerp(new THREE.Color(color), mix);
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh) return;
    const mt = (m.material as THREE.MeshStandardMaterial).clone();
    mt.userData.sharedResource = false;
    mt.color.copy(c);
    m.material = mt;
  });
  return o;
}

/** Model kalau ada, kalau tidak aset prosedural cadangan. Dipakai di pembangun dunia. */
export function modelOr(name: ModelName, fallback: () => THREE.Object3D, scale = KAYKIT_SCALE) {
  return model(name, scale) ?? fallback();
}
