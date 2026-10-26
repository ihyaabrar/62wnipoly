"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { zipSync, strToU8 } from "three/examples/jsm/libs/fflate.module.js";
import { exportStaticGlb } from "@/assets3d/export";
import { ASSETS, type AssetEntry } from "@/assets3d/registry";
import {
  bakeStatic,
  budgetLights,
  disposeObject,
  tickAll,
} from "@/assets3d/kit";
import { loadModels } from "@/assets3d/models";
import { inspectObject, type AssetCheck } from "@/assets3d/review";
import { HORIZON, QUALITY_DPR, Stage, type Quality } from "@/scene/Stage";
import css from "./viewer.module.css";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
async function toGlb(entry: AssetEntry) {
  return new Blob([await exportStaticGlb(entry.make)], {
    type: "model/gltf-binary",
  });
}

type Stats = {
  fps: number;
  ms: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
};
function FrameStats({ report }: { report: (s: Stats) => void }) {
  const { gl } = useThree();
  const sum = useRef({ sec: 0, frames: 0 });
  useEffect(() => {
    const old = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = old;
    };
  }, [gl]);
  useFrame((_, dt) => {
    const s = sum.current;
    s.sec += dt;
    s.frames++;
    if (s.sec >= 2) {
      report({
        fps: Math.round(s.frames / s.sec),
        ms: Math.round((s.sec / s.frames) * 10000) / 10,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      });
      s.sec = 0;
      s.frames = 0;
    }
    gl.info.reset();
  }, -100);
  return null;
}
type SceneProps = {
  entry: AssetEntry;
  animate: boolean;
  time: number;
  level: number;
  view: number;
  quality: Quality;
  onReady: (v: boolean) => void;
};
function AssetScene({
  entry,
  animate,
  time,
  level,
  view,
  quality,
  onReady,
}: SceneProps) {
  const obj = useMemo(() => {
    const o = entry.make();
    tickAll(o, 0, 1 / 60);
    return bakeStatic(o);
  }, [entry]);
  const elapsed = useRef(0);
  const { camera, controls, scene, size } = useThree();
  const [floor, setFloor] = useState(-1.8);
  useEffect(() => {
    const lease = Symbol();
    obj.userData.resourceLease = lease;
    onReady(true);
    return () => {
      queueMicrotask(() => {
        if (obj.userData.resourceLease === lease) disposeObject(obj);
      });
      onReady(false);
    };
  }, [obj, onReady]);
  useEffect(() => {
    elapsed.current = time;
    tickAll(obj, time, 0);
  }, [obj, time]);
  useEffect(() => {
    budgetLights(obj, quality === "rendah" ? 0 : quality === "sedang" ? 2 : 4);
  }, [obj, quality]);
  useEffect(() => {
    obj.traverse((o) => {
      o.userData.setLevel?.(level);
      o.userData.setActivity?.(level);
      o.userData.setDensity?.(level);
    });
  }, [obj, level]);
  useEffect(() => {
    const bounds = new THREE.Box3();
    obj.updateWorldMatrix(true, true);
    const visit = (o: THREE.Object3D) => {
      if (o.userData.noFit) return;
      const m = o as THREE.Mesh;
      if (m.isMesh && m.geometry) {
        m.geometry.computeBoundingBox();
        if (m.geometry.boundingBox)
          bounds.union(
            m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld),
          );
      }
      o.children.forEach(visit);
    };
    visit(obj);
    if (bounds.isEmpty()) bounds.setFromObject(obj);
    if (bounds.isEmpty())
      bounds.set(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 1, 1));
    const center = bounds.getCenter(new THREE.Vector3()),
      radius = Math.max(bounds.getSize(new THREE.Vector3()).length() / 2, 0.3);
    const p = camera as THREE.PerspectiveCamera,
      vf = THREE.MathUtils.degToRad(p.fov),
      hf = 2 * Math.atan(Math.tan(vf / 2) * p.aspect),
      dist = (radius / Math.sin(Math.min(vf, hf) / 2)) * 1.06;
    const dir = new THREE.Vector3(0.55, 0.5, 0.67)
      .normalize()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), (view * Math.PI) / 2);
    camera.position.copy(center).addScaledVector(dir, dist);
    camera.near = Math.max(0.01, dist / 200);
    camera.far = Math.max(1000, dist * 10);
    camera.updateProjectionMatrix();
    const c = controls as unknown as {
      target: THREE.Vector3;
      update: () => void;
    } | null;
    c?.target.copy(center);
    const cam = new URLSearchParams(location.search)
      .get("cam")
      ?.split(",")
      .map(Number);
    if (cam?.length === 6 && cam.every(Number.isFinite)) {
      camera.position.set(cam[0], cam[1], cam[2]);
      c?.target.set(cam[3], cam[4], cam[5]);
    }
    c?.update();
    scene.fog = new THREE.Fog(HORIZON, dist * 1.2, dist * 3.5);
    setFloor(
      entry.id === "papan-lengkap" || entry.id === "tanah-dunia"
        ? -1.8
        : bounds.min.y - 0.025,
    );
  }, [obj, camera, controls, scene, view, size.width, size.height, entry.id]);
  useFrame((_, dt) => {
    if (animate) {
      elapsed.current += Math.min(dt, 0.1);
      tickAll(obj, elapsed.current, Math.min(dt, 0.1));
    }
  });
  return (
    <>
      <primitive object={obj} />
      <mesh rotation-x={-Math.PI / 2} position-y={floor} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#9a9785" roughness={1} />
      </mesh>
    </>
  );
}
export default function Viewer() {
  const [id, setId] = useState(() => {
    const id = new URLSearchParams(location.search).get("asset");
    return ASSETS.find((a) => a.id === id)?.id ?? ASSETS[0].id;
  });
  const [modelsReady, setModelsReady] = useState(false),
    [ready, setReady] = useState(false),
    [animate, setAnimate] = useState(true),
    [quality, setQuality] = useState<Quality>("sedang");
  const [neutral, setNeutral] = useState(false),
    [view, setView] = useState(0),
    [time, setTime] = useState(0),
    [level, setLevel] = useState(0.6),
    [query, setQuery] = useState("");
  const [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [checks, setChecks] = useState<AssetCheck[] | null>(null),
    [stats, setStats] = useState<Stats | null>(null);
  const entry = ASSETS.find((a) => a.id === id)!,
    index = ASSETS.indexOf(entry);
  const groups = useMemo(
    () =>
      Object.entries(
        Object.groupBy(
          ASSETS.filter((a) =>
            `${a.name} ${a.category}`
              .toLocaleLowerCase("id")
              .includes(query.toLocaleLowerCase("id")),
          ),
          (a) => a.category,
        ),
      ),
    [query],
  );
  useEffect(() => {
    let live = true;
    loadModels().then(() => live && setModelsReady(true));
    return () => {
      live = false;
    };
  }, []);
  const select = (next: string) => {
    setId(next);
    setView(0);
    setTime(0);
    setMessage("");
    const url = new URL(location.href);
    url.searchParams.set("asset", next);
    history.replaceState(null, "", url);
  };
  const exportOne = async () => {
    setBusy("Menyiapkan snapshot GLB…");
    try {
      download(await toGlb(entry), `${entry.id}.glb`);
      setMessage(
        "GLB statis diekspor. Efek runtime dan teks SDF tidak disertakan.",
      );
    } catch (e) {
      setMessage(`Ekspor gagal: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy("");
    }
  };
  const exportAll = async () => {
    const files: Record<string, Uint8Array> = {
      "README.txt": strToU8(
        "+62WNIPOLY — snapshot statis GLB. Efek partikel runtime, lampu lokal dan teks SDF tidak disertakan. Model/tekstur KayKit dan Kenney: CC0; lihat kredit proyek. Geometri prosedural berasal dari proyek ini.",
      ),
      "catalog.json": strToU8(
        JSON.stringify(
          ASSETS.map(({ id, name, category }) => ({ id, name, category })),
          null,
          2,
        ),
      ),
    };
    try {
      for (const [i, a] of ASSETS.entries()) {
        setBusy(`Ekspor ${i + 1}/${ASSETS.length}: ${a.name}`);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        files[`${a.category}/${a.id}.glb`] = new Uint8Array(
          await exportStaticGlb(a.make),
        );
      }
      setBusy("Mengemas ZIP…");
      const zip = zipSync(files, { level: 1 });
      download(
        new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" }),
        "wnipoly-aset-statis.zip",
      );
      setMessage(`${ASSETS.length} snapshot GLB dikemas dalam satu ZIP.`);
    } catch (e) {
      setMessage(`Ekspor semua gagal: ${String(e)}`);
    } finally {
      setBusy("");
    }
  };
  const validate = async () => {
    setChecks(null);
    setBusy("Memeriksa katalog…");
    const result: AssetCheck[] = [];
    for (const [i, a] of ASSETS.entries()) {
      let o: THREE.Object3D | undefined;
      try {
        o = a.make();
        let check = inspectObject(a.id, o);
        for (const t of [0, 2, 9, 15]) {
          tickAll(o, t, 1 / 60);
          const sample = inspectObject(a.id, o);
          check.valid &&= sample.valid;
        }
        result.push(check);
      } catch (e) {
        result.push({
          id: a.id,
          meshes: 0,
          triangles: 0,
          lights: 0,
          valid: false,
          error: String(e),
        });
      } finally {
        if (o) disposeObject(o);
      }
      if (i % 4 === 0) {
        setBusy(`Memeriksa ${i + 1}/${ASSETS.length}: ${a.name}`);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
      }
    }
    setChecks(result);
    setBusy("");
  };
  return (
    <div className={css.root}>
      <aside className={css.sidebar}>
        <h1>
          <span>+62</span>WNIPOLY <small>Studio aset</small>
        </h1>
        <p>{ASSETS.length} aset · model & prosedural</p>
        <input
          className={css.search}
          type="search"
          aria-label="Cari aset"
          placeholder="Cari aset atau zona…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <nav aria-label="Katalog aset">
          {groups.map(([cat, items]) => (
            <section key={cat}>
              <h2>{cat}</h2>
              {items!.map((a) => (
                <button
                  key={a.id}
                  onClick={() => select(a.id)}
                  aria-current={a.id === id ? "true" : undefined}
                  className={a.id === id ? css.selected : undefined}
                >
                  {a.name}
                </button>
              ))}
            </section>
          ))}
          {groups.length === 0 && <p>Tidak ada aset yang cocok.</p>}
        </nav>
      </aside>
      <main className={css.stage}>
        <Canvas
          shadows
          camera={{ position: [6, 6, 8], fov: 40 }}
          dpr={[1, QUALITY_DPR[quality]]}
          gl={{ antialias: true }}
        >
          <Stage quality={quality} neutral={neutral} />
          {modelsReady && (
            <AssetScene
              entry={entry}
              animate={animate}
              time={time}
              level={level}
              view={view}
              quality={quality}
              onReady={setReady}
            />
          )}
          <OrbitControls makeDefault enableDamping />
          <FrameStats report={setStats} />
        </Canvas>
        <div className={css.toolbar}>
          <select
            aria-label="Kualitas grafis"
            value={quality}
            onChange={(e) => setQuality(e.target.value as Quality)}
          >
            <option value="tinggi">Kualitas tinggi</option>
            <option value="sedang">Kualitas sedang</option>
            <option value="rendah">Kualitas rendah</option>
          </select>
          <button onClick={() => setNeutral((v) => !v)}>
            {neutral ? "Cahaya netral" : "Cahaya senja"}
          </button>
          <button onClick={() => setAnimate((v) => !v)}>
            {animate ? "Jeda animasi" : "Putar animasi"}
          </button>
          <button disabled={!ready || !!busy} onClick={exportOne}>
            Ekspor .glb
          </button>
          <button disabled={!ready || !!busy} onClick={exportAll}>
            Ekspor semua .zip
          </button>
        </div>
        <div className={css.inspector}>
          <div className={css.heading}>
            <button
              aria-label="Aset sebelumnya"
              onClick={() =>
                select(ASSETS[(index - 1 + ASSETS.length) % ASSETS.length].id)
              }
            >
              ←
            </button>
            <div>
              <small>
                {entry.category} · {index + 1}/{ASSETS.length}
              </small>
              <h2>{entry.name}</h2>
            </div>
            <button
              aria-label="Aset berikutnya"
              onClick={() => select(ASSETS[(index + 1) % ASSETS.length].id)}
            >
              →
            </button>
          </div>
          <div className={css.controls}>
            <button onClick={() => setView((v) => (v + 1) % 4)}>
              Putar sudut 90°
            </button>
            <label>
              Fase{" "}
              <input
                aria-label="Fase animasi"
                type="range"
                min="0"
                max="36"
                step="0.5"
                value={time}
                onChange={(e) => {
                  setAnimate(false);
                  setTime(Number(e.target.value));
                }}
              />
              {time}s
            </label>
            <label>
              Krisis{" "}
              <input
                aria-label="Intensitas krisis"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
              />
              {Math.round(level * 100)}%
            </label>
          </div>
          <div className={css.controls}>
            <button disabled={!ready || !!busy} onClick={validate}>
              Validasi katalog
            </button>
            {checks && (
              <>
                <span role="status">
                  {checks.filter((c) => c.valid).length}/{checks.length} valid
                </span>
                <button
                  onClick={() =>
                    download(
                      new Blob(
                        [
                          JSON.stringify(
                            { date: new Date().toISOString(), quality, checks },
                            null,
                            2,
                          ),
                        ],
                        { type: "application/json" },
                      ),
                      "validasi-aset.json",
                    )
                  }
                >
                  Unduh laporan
                </button>
              </>
            )}
          </div>
          {checks?.some((c) => !c.valid) && (
            <p role="alert">
              Perlu diperiksa:{" "}
              {checks
                .filter((c) => !c.valid)
                .map((c) => c.id)
                .join(", ")}
            </p>
          )}
          <p className={css.stats}>
            {stats
              ? `${stats.fps} fps · ${stats.ms} ms · ${stats.calls} draw calls/frame · ${stats.triangles.toLocaleString("id-ID")} segitiga/frame · ${stats.geometries} geometri · ${stats.textures} tekstur`
              : "Menyiapkan pengukuran…"}
          </p>
          <p className={css.status} role="status">
            {busy ||
              message ||
              (!ready
                ? "Memuat aset…"
                : "Seret untuk putar · gulir untuk zoom. Angka performa berlaku untuk perangkat dan kualitas saat ini.")}
          </p>
        </div>
      </main>
    </div>
  );
}
