"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";

export type Quality = "rendah" | "sedang" | "tinggi";

/** Warna cakrawala: dipakai juga untuk kabut supaya tepi dunia menyatu dengan langit. */
export const HORIZON = "#d6c2a0";

/** Kubah langit bergradasi: kelabu kebiruan di atas, oranye berasap di cakrawala. */
function SkyDome() {
  return (
    <mesh scale={400} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={{ top: { value: new THREE.Color("#4f7fb8") }, mid: { value: new THREE.Color("#a9bccb") }, bottom: { value: new THREE.Color(HORIZON) } }}
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
export function Stage({ quality = "tinggi", fogNear, fogFar }: { quality?: Quality; fogNear?: number; fogFar?: number }) {
  // Diukur di Intel UHD: AO paling mahal, jadi hanya aktif di "tinggi" (setengah resolusi).
  const shadowSize = quality === "rendah" ? 1024 : 2048;
  return (
    <>
      <color attach="background" args={[HORIZON]} />
      {fogFar !== undefined && <fog attach="fog" args={[HORIZON, fogNear ?? fogFar / 2, fogFar]} />}
      <SkyDome />
      <hemisphereLight args={["#fff1dc", "#4a3b2c", 0.7]} />
      <directionalLight
        position={[14, 18, 10]}
        intensity={2.3}
        color="#ffe2b8"
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
      <directionalLight position={[-12, 8, -10]} intensity={0.6} color="#9fb7d9" />
      {/* Peta lingkungan dari Lightformer: pantulan lembut tanpa mengunduh HDR. */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} color="#ffe2b8" position={[10, 10, 10]} scale={[20, 10, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#9fb7d9" position={[-10, 5, -10]} scale={[20, 10, 1]} />
        <Lightformer form="ring" intensity={1} color="#ff8a4a" position={[0, 10, -20]} scale={8} />
      </Environment>
      {quality !== "rendah" && (
        <EffectComposer multisampling={0}>
          {[
            ...(quality === "tinggi" ? [<N8AO key="ao" aoRadius={0.6} intensity={2} distanceFalloff={0.6} halfRes />] : []),
            <Bloom key="bloom" mipmapBlur luminanceThreshold={1.2} intensity={0.6} radius={0.6} />,
            <Vignette key="vig" offset={0.25} darkness={0.55} />,
            // ACES lebih kontras dan jenuh daripada AgX (AgX membuat peta terlihat pucat).
            <ToneMapping key="tm" mode={ToneMappingMode.ACES_FILMIC} />,
            <HueSaturation key="sat" saturation={0.1} />,
            <BrightnessContrast key="bc" brightness={0.03} contrast={0.03} />,
            <SMAA key="aa" />,
          ]}
        </EffectComposer>
      )}
    </>
  );
}
