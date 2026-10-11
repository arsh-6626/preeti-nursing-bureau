"use client";

/**
 * 3D hero: a stylized "clay" nurse built entirely from primitives in code
 * (no external model, no licensing). She breathes, blinks, waves now and then
 * and follows the pointer with her head. Under reduced motion she renders still.
 */
import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const C = {
  skin: "#b9774f",
  skinShade: "#a5663f",
  hair: "#1d1412",
  scrubs: "#8ec5e8",
  scrubsDeep: "#5f9fca",
  pants: "#5f9fca",
  white: "#f6f9f8",
  ink: "#152a2e",
  blush: "#e7877c",
  silver: "#c9d4d6",
  mint: "#f2a93b",
  board: "#e3ebe8",
};

function Clay({ color, rough = 0.62 }: { color: string; rough?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} clearcoat={0.18} clearcoatRoughness={0.6} sheen={0.3} sheenColor="#ffffff" />;
}

function Hair() {
  return <meshStandardMaterial color="#0f0a09" roughness={0.45} metalness={0} />;
}

function Stethoscope() {
  const tubes = useMemo(() => {
    const right = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.17, 0.53, -0.02),
      new THREE.Vector3(0.27, 0.36, 0.22),
      new THREE.Vector3(0.2, 0.12, 0.35),
      new THREE.Vector3(0.04, -0.05, 0.38),
    ]);
    const left = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.17, 0.53, -0.02),
      new THREE.Vector3(-0.27, 0.36, 0.22),
      new THREE.Vector3(-0.18, 0.12, 0.35),
      new THREE.Vector3(0.0, -0.06, 0.38),
    ]);
    const drop = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, -0.06, 0.38),
      new THREE.Vector3(0.0, -0.2, 0.38),
      new THREE.Vector3(0.05, -0.3, 0.37),
    ]);
    return [right, left, drop].map((c) => new THREE.TubeGeometry(c, 40, 0.02, 10, false));
  }, []);
  return (
    <group>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g} castShadow>
          <Clay color={C.ink} rough={0.4} />
        </mesh>
      ))}
      <mesh position={[0.05, -0.33, 0.37]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.065, 0.035, 28]} />
        <meshPhysicalMaterial color={C.silver} metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Nurse() {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const waveArm = useRef<THREE.Group>(null);
  const forearm = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (root.current) root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, -0.25 + pointer.x * 0.35, 2.5, delta);
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, pointer.x * 0.45, 4, delta);
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, -pointer.y * 0.22, 4, delta);
      head.current.rotation.z = Math.sin(t * 0.8) * 0.04;
    }
    if (torso.current) torso.current.scale.y = 1 + Math.sin(t * 1.6) * 0.012;
    // Wave for ~2.4s every 7s.
    const cycle = t % 7;
    const waving = cycle < 2.4;
    if (waveArm.current) {
      const target = waving ? 2.55 : 0.18;
      waveArm.current.rotation.z = THREE.MathUtils.damp(waveArm.current.rotation.z, target, 6, delta);
    }
    if (forearm.current) {
      const target = waving ? 0.35 + Math.sin(t * 9) * 0.35 : 0.05;
      forearm.current.rotation.z = THREE.MathUtils.damp(forearm.current.rotation.z, target, 10, delta);
    }
    if (eyes.current) {
      const blink = t % 3.8 < 0.12 ? 0.12 : 1;
      eyes.current.scale.y = THREE.MathUtils.damp(eyes.current.scale.y, blink, 30, delta);
    }
  });

  return (
    <group ref={root} position={[0, -0.05, 0]} rotation={[0, -0.25, 0]}>
      {/* Shoes and legs */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.17, 0, 0]}>
          <mesh position={[0, -1.36, 0.06]} scale={[0.15, 0.09, 0.25]} castShadow>
            <sphereGeometry args={[1, 32, 24]} />
            <Clay color={C.white} />
          </mesh>
          <mesh position={[0, -1.02, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.42, 10, 24]} />
            <Clay color={C.pants} />
          </mesh>
        </group>
      ))}

      {/* Torso (scrub top) */}
      <group ref={torso} position={[0, -0.28, 0]}>
        <mesh scale={[1, 1, 0.8]} castShadow>
          <capsuleGeometry args={[0.43, 0.5, 12, 32]} />
          <Clay color={C.scrubs} />
        </mesh>
      </group>
      {/* V-neck */}
      <mesh position={[0, 0.27, 0.27]} rotation={[0.35, 0, Math.PI]} scale={[1, 1.1, 0.4]}>
        <coneGeometry args={[0.12, 0.2, 3]} />
        <Clay color={C.skinShade} />
      </mesh>
      {/* Pocket, pen and name badge */}
      <RoundedBox args={[0.17, 0.13, 0.03]} radius={0.012} position={[0.2, 0.0, 0.33]} rotation={[0, 0.25, 0]}>
        <Clay color={C.scrubsDeep} />
      </RoundedBox>
      <mesh position={[0.25, 0.08, 0.33]} rotation={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.012, 0.012, 0.13, 10]} />
        <Clay color={C.white} />
      </mesh>
      <RoundedBox args={[0.16, 0.08, 0.02]} radius={0.01} position={[-0.2, 0.06, 0.34]} rotation={[0, -0.25, 0]}>
        <Clay color={C.white} />
      </RoundedBox>
      <mesh position={[-0.255, 0.06, 0.352]} rotation={[0, -0.25, 0]}>
        <boxGeometry args={[0.04, 0.05, 0.005]} />
        <Clay color={C.scrubsDeep} />
      </mesh>
      <Stethoscope />

      {/* Neck and head */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.18, 20]} />
        <Clay color={C.skinShade} />
      </mesh>
      <group ref={head} position={[0, 0.92, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.4, 48, 40]} />
          <Clay color={C.skin} />
        </mesh>
        {/* Hair: cap, fringe sweep and bun */}
        <mesh position={[0, 0.03, -0.03]} rotation={[-0.55, 0, 0]}>
          <sphereGeometry args={[0.42, 48, 40, 0, Math.PI * 2, 0, 1.75]} />
          <Hair />
        </mesh>
        <mesh position={[0, 0.22, -0.33]} castShadow>
          <sphereGeometry args={[0.17, 32, 24]} />
          <Hair />
        </mesh>
        {/* Ears */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.39, -0.02, 0.0]} scale={[0.5, 1, 0.8]}>
            <sphereGeometry args={[0.08, 20, 16]} />
            <Clay color={C.skinShade} />
          </mesh>
        ))}
        {/* Face */}
        <group ref={eyes}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.135, 0.02, 0.37]} scale={[1, 1.35, 0.45]}>
              <sphereGeometry args={[0.042, 20, 16]} />
              <meshStandardMaterial color={C.ink} roughness={0.2} />
            </mesh>
          ))}
        </group>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.22, -0.08, 0.32]} rotation={[0, s * 0.55, 0]} scale={[1, 0.7, 0.15]}>
            <sphereGeometry args={[0.06, 20, 16]} />
            <meshStandardMaterial color={C.blush} transparent opacity={0.65} roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, -0.1, 0.375]} rotation={[0.15, 0, Math.PI]}>
          <torusGeometry args={[0.065, 0.013, 10, 24, Math.PI]} />
          <meshStandardMaterial color={C.ink} roughness={0.4} />
        </mesh>
        {/* Nurse cap with cross */}
        <group position={[0, 0.39, 0.06]} rotation={[-0.3, 0, 0]}>
          <RoundedBox args={[0.46, 0.15, 0.24]} radius={0.05} smoothness={4} castShadow>
            <Clay color={C.white} />
          </RoundedBox>
          <mesh position={[0, 0.005, 0.122]}>
            <boxGeometry args={[0.1, 0.03, 0.01]} />
            <Clay color={C.scrubs} />
          </mesh>
          <mesh position={[0, 0.005, 0.122]}>
            <boxGeometry args={[0.03, 0.1, 0.01]} />
            <Clay color={C.scrubs} />
          </mesh>
        </group>
      </group>

      {/* Right arm: waves */}
      <group ref={waveArm} position={[0.47, 0.22, 0]} rotation={[0, 0, 0.18]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.2, 8, 20]} />
          <Clay color={C.scrubs} />
        </mesh>
        <group ref={forearm} position={[0, -0.35, 0]}>
          <mesh position={[0, -0.15, 0]} castShadow>
            <capsuleGeometry args={[0.095, 0.22, 8, 20]} />
            <Clay color={C.skin} />
          </mesh>
          <mesh position={[0, -0.36, 0]} castShadow>
            <sphereGeometry args={[0.11, 24, 20]} />
            <Clay color={C.skin} />
          </mesh>
        </group>
      </group>

      {/* Left arm: holds a clipboard against her side */}
      <group position={[-0.47, 0.22, 0]} rotation={[-0.75, 0, -0.32]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.2, 8, 20]} />
          <Clay color={C.scrubs} />
        </mesh>
        <group position={[0, -0.35, 0]} rotation={[-0.9, 0, 0.4]}>
          <mesh position={[0, -0.15, 0]} castShadow>
            <capsuleGeometry args={[0.095, 0.22, 8, 20]} />
            <Clay color={C.skin} />
          </mesh>
          <mesh position={[0, -0.36, 0]}>
            <sphereGeometry args={[0.11, 24, 20]} />
            <Clay color={C.skin} />
          </mesh>
        </group>
      </group>
      <group position={[-0.5, -0.22, 0.38]} rotation={[-0.15, 0.45, 0.12]}>
        <RoundedBox args={[0.5, 0.66, 0.04]} radius={0.02} castShadow>
          <Clay color={C.board} />
        </RoundedBox>
        <RoundedBox args={[0.42, 0.54, 0.01]} radius={0.01} position={[0, -0.03, 0.025]}>
          <Clay color={C.white} />
        </RoundedBox>
        {[0.12, 0.04, -0.04, -0.12].map((y) => (
          <mesh key={y} position={[-0.02, y, 0.032]}>
            <boxGeometry args={[0.28, 0.018, 0.004]} />
            <meshStandardMaterial color="#b7c7c4" />
          </mesh>
        ))}
        <mesh position={[0.1, -0.2, 0.033]}>
          <boxGeometry args={[0.1, 0.03, 0.004]} />
          <meshStandardMaterial color={C.scrubs} />
        </mesh>
        <RoundedBox args={[0.18, 0.07, 0.04]} radius={0.015} position={[0, 0.31, 0.03]}>
          <meshPhysicalMaterial color={C.silver} metalness={0.8} roughness={0.3} />
        </RoundedBox>
      </group>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[2.5, 4, 5]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -2]} intensity={1.0} color="#cfe8ff" />
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer intensity={1.1} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer intensity={0.7} position={[5, 0, 1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
      <Float speed={1} rotationIntensity={0.05} floatIntensity={0.25}>
        <Nurse />
      </Float>
      <ContactShadows position={[0, -1.47, 0]} opacity={0.5} scale={3.2} blur={2.2} far={2} color="#03211d" />
    </>
  );
}

export default function NurseScene({ animate }: { animate: boolean }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={animate ? "always" : "demand"}
      camera={{ position: [0, 0.1, 7], fov: 30 }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.15;
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <Scene />
    </Canvas>
  );
}
