"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { ASSETS, type AssetEntry } from "@/assets3d/registry";
import { tickAll } from "@/assets3d/kit";
import { loadModels } from "@/assets3d/models";
import { HORIZON, Stage, type Quality } from "@/scene/Stage";

async function toGlb(obj: THREE.Object3D) {
  const buf = (await new GLTFExporter().parseAsync(obj, { binary: true })) as ArrayBuffer;
  return new Blob([buf], { type: "model/gltf-binary" });
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Tunggu model .glb (KayKit) dimuat dulu supaya aset yang memakainya tampil dengan model, bukan cadangannya. */
function AssetView(props: { entry: AssetEntry; animate: boolean }) {
  const [ready, setReady] = useState(false);
  useEffect(() => void loadModels().then(() => setReady(true)), []);
  return ready ? <AssetScene {...props} /> : null;
}

function AssetScene({ entry, animate }: { entry: AssetEntry; animate: boolean }) {
  const obj = useMemo(() => entry.make(), [entry]);
  const { camera, controls, scene } = useThree();
  // Arahkan kamera agar aset (besar atau kecil) memenuhi layar.
  useEffect(() => {
    // Abaikan objek bertanda noFit (tanah dunia yang sangat lebar) saat membingkai kamera.
    const box = new THREE.Box3();
    const visit = (o: THREE.Object3D) => {
      if (o.userData.noFit) return;
      if ((o as THREE.Mesh).isMesh) box.expandByObject(o, true);
      else o.children.forEach(visit);
    };
    obj.updateWorldMatrix(true, true);
    visit(obj);
    if (box.isEmpty()) box.setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const r = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.3);
    const dist = (r / Math.tan(((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360)) * 0.8;
    camera.position.copy(center).add(new THREE.Vector3(0.55, 0.5, 0.67).normalize().multiplyScalar(dist * 1.1));
    camera.near = dist / 100;
    camera.far = Math.max(dist * 10, 1000); // kubah langit berjari-jari 400
    camera.updateProjectionMatrix();
    // Kabut mengikuti jarak kamera, supaya tepi dunia memudar tanpa menutupi aset.
    scene.fog = new THREE.Fog(HORIZON, dist * 1.1, dist * 2.6);
    const c = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    c?.target.copy(center);
    // ?cam=x,y,z,tx,ty,tz menimpa posisi kamera (untuk memeriksa titik tertentu dari dekat).
    const cam = new URLSearchParams(location.search).get("cam")?.split(",").map(Number);
    if (cam?.length === 6 && cam.every(Number.isFinite)) {
      camera.position.set(cam[0], cam[1], cam[2]);
      c?.target.set(cam[3], cam[4], cam[5]);
      camera.near = 0.05;
      camera.updateProjectionMatrix();
    }
    c?.update();
  }, [obj, camera, controls, scene]);
  useFrame((s, dt) => animate && tickAll(obj, s.clock.elapsedTime, dt));
  return <primitive object={obj} />;
}

export default function Viewer() {
  const [id, setId] = useState(ASSETS[0].id);
  const [animate, setAnimate] = useState(true);
  const [quality, setQuality] = useState<Quality>("sedang");
  const [busy, setBusy] = useState("");
  const entry = ASSETS.find((a) => a.id === id)!;
  const groups = useMemo(() => Object.entries(Object.groupBy(ASSETS, (a) => a.category)), []);

  const exportOne = async (a: AssetEntry) => download(await toGlb(a.make()), `${a.id}.glb`);
  const exportAll = async () => {
    for (const [i, a] of ASSETS.entries()) {
      setBusy(`Ekspor ${i + 1}/${ASSETS.length}: ${a.id}`);
      await exportOne(a);
      await new Promise((r) => setTimeout(r, 250));
    }
    setBusy("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) 1fr", height: "100dvh" }}>
      <aside style={{ overflowY: "auto", background: "var(--panel)", borderRight: "1px solid var(--line)", padding: "16px 12px" }}>
        <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>
          <span style={{ color: "#ffc61a" }}>+62</span>WNI<span style={{ color: "#ffc61a" }}>POLY</span> · Aset 3D
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 12px" }}>{ASSETS.length} aset prosedural</p>
        {groups.map(([cat, items]) => (
          <section key={cat} style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", margin: "8px 4px" }}>{cat}</h2>
            {items!.map((a) => (
              <button
                key={a.id}
                onClick={() => setId(a.id)}
                aria-current={a.id === id}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "6px 8px", marginBottom: 2,
                  border: 0, borderRadius: 6, cursor: "pointer", fontSize: 14,
                  background: a.id === id ? "var(--accent)" : "transparent", color: a.id === id ? "#111" : "var(--text)",
                }}
              >
                {a.name}
              </button>
            ))}
          </section>
        ))}
      </aside>
      <main style={{ position: "relative", minWidth: 0, overflow: "hidden" }}>
        <Canvas shadows camera={{ position: [6, 6, 8], fov: 40 }} dpr={[1, quality === "tinggi" ? 1.5 : 1]} gl={{ antialias: false }}>
          <Stage quality={quality} />
          {/* Lantai di bawah dasar diorama (-1.73); kalau lebih tinggi ia menutupi lembah dan air banjir. */}
          <mesh rotation-x={-Math.PI / 2} position-y={-1.8} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial color="#6b6152" />
          </mesh>
          <AssetView entry={entry} animate={animate} />
          <OrbitControls makeDefault />
        </Canvas>
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <select aria-label="Kualitas grafis" value={quality} onChange={(ev) => setQuality(ev.target.value as Quality)} style={btn}>
            <option value="tinggi">Kualitas tinggi</option>
            <option value="sedang">Kualitas sedang</option>
            <option value="rendah">Kualitas rendah</option>
          </select>
          <button onClick={() => setAnimate((v) => !v)} style={btn}>{animate ? "Jeda animasi" : "Putar animasi"}</button>
          <button onClick={() => exportOne(entry)} style={btn}>Ekspor .glb</button>
          <button onClick={exportAll} disabled={!!busy} style={btn}>Ekspor semua</button>
        </div>
        <p role="status" style={{ position: "absolute", bottom: 8, left: 12, margin: 0, color: "var(--muted)", fontSize: 13 }}>
          {busy || `${entry.name} · seret untuk putar, gulir untuk zoom`}
        </p>
      </main>
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "var(--panel)", color: "var(--text)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 14,
};
