"use client";

import { Environment, Lightformer } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";

export type Quality = "rendah" | "sedang" | "tinggi";

/** Batas atas resolusi render per kualitas. Mengikuti skala layar (laptop 125-150%) supaya tidak buram. */
export const QUALITY_DPR: Record<Quality, number> = {
  rendah: 1,
  sedang: 1.5,
  tinggi: 2,
};

/** Warna cakrawala: dipakai juga untuk kabut supaya tepi dunia menyatu dengan langit. */
export const HORIZON = "#d6c2a0";

/** Kubah langit bergradasi: kelabu kebiruan di atas, oranye berasap di cakrawala. */
function SkyDome({ neutral = false }: { neutral?: boolean }) {
  return (
    <mesh scale={400} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={{
          top: { value: new THREE.Color(neutral ? "#c2ced5" : "#4f7fb8") },
          mid: { value: new THREE.Color(neutral ? "#cbd0ca" : "#a9bccb") },
          bottom: { value: new THREE.Color(neutral ? "#c5c9c0" : HORIZON) },
        }}
        vertexShader={`varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vDir;
          void main() { float h = vDir.y; vec3 c = h > 0.15 ? mix(mid, top, smoothstep(0.15, 0.7, h)) : mix(bottom, mid, smoothstep(-0.05, 0.15, h)); gl_FragColor = vec4(c, 1.0); }`}
      />
    </mesh>
  );
}

/**
 * Pencahayaan dan pascaproses bersama untuk katalog dan game.
 * Suasana: senja berasap. Matahari hangat rendah, langit kelabu oranye.
 */
export function Stage({
  quality = "tinggi",
  fogNear,
  fogFar,
  neutral = false,
}: {
  quality?: Quality;
  fogNear?: number;
  fogFar?: number;
  neutral?: boolean;
}) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping =
      quality === "rendah" ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  }, [gl, quality]);
  // Diukur di Intel UHD: AO paling mahal, jadi hanya aktif di "tinggi" (setengah resolusi).
  const shadowSize = quality === "rendah" ? 1024 : 2048;
  return (
    <>
      <color attach="background" args={[HORIZON]} />
      {fogFar !== undefined && (
        <fog attach="fog" args={[HORIZON, fogNear ?? fogFar / 2, fogFar]} />
      )}
      <SkyDome neutral={neutral} />
      <hemisphereLight
        args={[
          neutral ? "#f2f3f1" : "#fff1dc",
          neutral ? "#778080" : "#6d624e",
          0.95,
        ]}
      />
      <directionalLight
        position={[14, 18, 10]}
        intensity={neutral ? 1.8 : 1.9}
        color={neutral ? "#ffffff" : "#ffe8c9"}
        castShadow={quality !== "rendah"}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-far={80}
      />
      <directionalLight
        position={[-12, 8, -10]}
        intensity={0.55}
        color="#b4c6d3"
      />
      {/* Peta lingkungan dari Lightformer: pantulan lembut tanpa mengunduh HDR. */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={1.1}
          color={neutral ? "#ffffff" : "#ffe8c9"}
          position={[10, 10, 10]}
          scale={[20, 10, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#9fb7d9"
          position={[-10, 5, -10]}
          scale={[20, 10, 1]}
        />
        <Lightformer
          form="ring"
          intensity={0.35}
          color="#d9b78b"
          position={[0, 10, -20]}
          scale={8}
        />
      </Environment>
      {quality !== "rendah" && (
        <EffectComposer multisampling={0}>
          {[
            ...(quality === "tinggi"
              ? [
                  <N8AO
                    key="ao"
                    aoRadius={0.4}
                    intensity={1.1}
                    distanceFalloff={0.6}
                    halfRes
                  />,
                ]
              : []),
            <Bloom
              key="bloom"
              mipmapBlur
              luminanceThreshold={1.6}
              intensity={neutral ? 0 : 0.22}
              radius={0.4}
            />,
            <Vignette key="vig" offset={0.3} darkness={neutral ? 0 : 0.22} />,
            // ACES lebih kontras dan jenuh daripada AgX (AgX membuat peta terlihat pucat).
            <ToneMapping key="tm" mode={ToneMappingMode.ACES_FILMIC} />,
            <SMAA key="aa" />,
          ]}
        </EffectComposer>
      )}
    </>
  );
}
