"use client";

/**
 * Hero diorama: a cut-away room at home (window light, bed with a marigold
 * blanket, bedside table and lamp, plant, rug) with the nurse beside the bed.
 * Built from primitives in code. Tilts gently with the pointer; renders still
 * under reduced motion.
 */
import { useEffect, useMemo, useRef } from "react";
import { GO_EVENT } from "@/lib/client/go-event";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Clay, Nurse } from "./nurse-model";

const R = {
  wallBack: "#dfe7e2",
  wallLeft: "#d2ddd7",
  skirting: "#f4f6f4",
  wood: "#c8a07a",
  woodDark: "#a77f5c",
  linen: "#f5f7f6",
  blanket: "#f2a93b",
  pillowCase: "#e8f0f4",
  sky: "#cfe9f5",
  frame: "#f7f8f7",
  terracotta: "#c4714f",
  leaf: "#3f7d5b",
  leafLight: "#5c9a72",
  rug: "#b9cad3",
  green: "#0f4f48",
  lampShade: "#fbf4e6",
};

function useFloorTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = R.wood;
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
      g.fillRect(0, i * 64, 512, 64);
      g.fillStyle = "rgba(90,60,35,0.35)";
      g.fillRect(0, i * 64, 512, 2);
      const off = (i * 173) % 512;
      g.fillRect(off, i * 64, 2, 64);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 1.4);
    return t;
  }, []);
}

function Room() {
  const floor = useFloorTexture();
  return (
    <group>
      {/* Floor slab */}
      <mesh position={[0, -1.56, 0]} receiveShadow>
        <boxGeometry args={[5.2, 0.12, 3.8]} />
        <meshStandardMaterial map={floor} roughness={0.75} />
      </mesh>
      {/* Back wall with skirting */}
      <mesh position={[0, 0.1, -1.96]} receiveShadow>
        <boxGeometry args={[5.2, 3.2, 0.12]} />
        <meshStandardMaterial color={R.wallBack} roughness={0.95} />
      </mesh>
      <mesh position={[0, -1.43, -1.88]}>
        <boxGeometry args={[5.2, 0.14, 0.04]} />
        <meshStandardMaterial color={R.skirting} roughness={0.8} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-2.66, 0.1, 0]} receiveShadow>
        <boxGeometry args={[0.12, 3.2, 3.8]} />
        <meshStandardMaterial color={R.wallLeft} roughness={0.95} />
      </mesh>
      <mesh position={[-2.58, -1.43, 0]}>
        <boxGeometry args={[0.04, 0.14, 3.8]} />
        <meshStandardMaterial color={R.skirting} roughness={0.8} />
      </mesh>

      {/* Window on the back wall */}
      <group position={[1.15, 0.45, -1.89]}>
        <mesh>
          <planeGeometry args={[1.3, 1.25]} />
          <meshStandardMaterial color={R.sky} emissive={R.sky} emissiveIntensity={0.65} />
        </mesh>
        {[
          [0, 0.65, 1.42, 0.08],
          [0, -0.65, 1.42, 0.08],
          [-0.67, 0, 0.08, 1.38],
          [0.67, 0, 0.08, 1.38],
          [0, 0, 0.04, 1.3],
          [0, 0, 1.3, 0.04],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.03]} castShadow>
            <boxGeometry args={[w, h, 0.06]} />
            <meshStandardMaterial color={R.frame} roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, -0.72, 0.09]} castShadow>
          <boxGeometry args={[1.6, 0.06, 0.2]} />
          <meshStandardMaterial color={R.frame} roughness={0.6} />
        </mesh>
      </group>
      {/* Soft daylight falling from the window */}
      <mesh position={[1.15, -1.495, -0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 1.6]} />
        <meshBasicMaterial color="#fffbe8" transparent opacity={0.22} />
      </mesh>

      {/* Picture on the left wall */}
      <group position={[-2.58, 0.55, -0.4]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[0.9, 0.65, 0.04]} radius={0.015} castShadow>
          <meshStandardMaterial color={R.frame} roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[0.74, 0.5]} />
          <meshStandardMaterial color={R.green} roughness={0.9} />
        </mesh>
        <mesh position={[0.12, -0.06, 0.025]}>
          <circleGeometry args={[0.13, 32]} />
          <meshStandardMaterial color={R.blanket} roughness={0.9} />
        </mesh>
      </group>

      {/* Bed against the left wall, head to the back wall */}
      <group position={[-1.5, 0, -0.5]}>
        <mesh position={[0, -1.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.36, 0.34, 2.2]} />
          <Clay color={R.wood} rough={0.7} />
        </mesh>
        <mesh position={[0, -0.95, -1.12]} castShadow>
          <boxGeometry args={[1.44, 1.05, 0.12]} />
          <Clay color={R.woodDark} rough={0.7} />
        </mesh>
        <RoundedBox args={[1.26, 0.24, 2.06]} radius={0.08} smoothness={4} position={[0, -1.02, 0.02]} castShadow receiveShadow>
          <Clay color={R.linen} />
        </RoundedBox>
        <RoundedBox args={[0.82, 0.16, 0.42]} radius={0.07} smoothness={4} position={[0, -0.84, -0.78]} rotation={[0.12, 0, 0]} castShadow>
          <Clay color={R.pillowCase} />
        </RoundedBox>
        <RoundedBox args={[1.32, 0.09, 1.22]} radius={0.04} smoothness={4} position={[0, -0.88, 0.45]} castShadow receiveShadow>
          <Clay color={R.blanket} />
        </RoundedBox>
        <RoundedBox args={[1.32, 0.1, 0.16]} radius={0.04} smoothness={4} position={[0, -0.86, -0.12]} castShadow>
          <Clay color={R.linen} />
        </RoundedBox>
      </group>

      {/* Bedside table, lamp, glass and pill box */}
      <group position={[-0.42, 0, -1.55]}>
        <RoundedBox args={[0.6, 0.62, 0.5]} radius={0.04} position={[0, -1.19, 0]} castShadow receiveShadow>
          <Clay color={R.wood} rough={0.7} />
        </RoundedBox>
        <mesh position={[0, -1.12, 0.255]}>
          <boxGeometry args={[0.46, 0.02, 0.01]} />
          <meshStandardMaterial color={R.woodDark} />
        </mesh>
        <mesh position={[-0.12, -0.7, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.07, 0.36, 20]} />
          <meshStandardMaterial color={R.woodDark} roughness={0.5} />
        </mesh>
        <mesh position={[-0.12, -0.46, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.19, 0.22, 32, 1, true]} />
          <meshStandardMaterial color={R.lampShade} emissive="#ffd9a0" emissiveIntensity={0.55} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[-0.12, -0.55, 0.05]} intensity={1.4} distance={2.2} color="#ffd59a" />
        <mesh position={[0.15, -0.81, 0.05]}>
          <cylinderGeometry args={[0.045, 0.04, 0.14, 20]} />
          <meshPhysicalMaterial color="#e8f6fb" transparent opacity={0.55} roughness={0.05} transmission={0.6} />
        </mesh>
        <RoundedBox args={[0.18, 0.05, 0.08]} radius={0.015} position={[0.12, -0.855, 0.16]}>
          <Clay color={R.green} />
        </RoundedBox>
      </group>

      {/* Plant in the back-right corner */}
      <group position={[2.15, 0, -1.4]}>
        <mesh position={[0, -1.3, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.18, 0.4, 28]} />
          <Clay color={R.terracotta} rough={0.8} />
        </mesh>
        {[
          [0, -0.55, 0, 0.12],
          [0.16, -0.66, 0.05, -0.45],
          [-0.16, -0.64, -0.05, 0.45],
          [0.05, -0.62, -0.15, 0.2],
          [-0.06, -0.6, 0.14, -0.25],
        ].map(([x, y, z, rz], i) => (
          <mesh key={`l${i}`} position={[x, y, z]} rotation={[0, i, rz]} scale={[0.11, 0.42, 0.04]} castShadow>
            <sphereGeometry args={[1, 20, 16]} />
            <Clay color={i % 2 ? R.leafLight : R.leaf} />
          </mesh>
        ))}
      </group>

      {/* Rug */}
      <mesh position={[0.7, -1.495, 0.55]} receiveShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.015, 64]} />
        <meshStandardMaterial color={R.rug} roughness={0.95} />
      </mesh>
    </group>
  );
}

function Diorama() {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const going = useRef(false);
  useEffect(() => {
    const onGo = () => {
      going.current = true;
    };
    window.addEventListener(GO_EVENT, onGo);
    return () => window.removeEventListener(GO_EVENT, onGo);
  }, []);
  useFrame((state, delta) => {
    if (!group.current) return;
    // Dolly the camera towards the nurse when the visitor heads to the request form.
    const persp = state.camera as THREE.PerspectiveCamera;
    const targetFov = going.current ? 17 : 30;
    if (Math.abs(persp.fov - targetFov) > 0.01) {
      persp.fov = THREE.MathUtils.damp(persp.fov, targetFov, 3.2, delta);
      persp.updateProjectionMatrix();
    }
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, 0.32 + pointer.x * 0.12, 2.5, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -pointer.y * 0.04, 2.5, delta);
  });
  return (
    <group ref={group} rotation={[0, 0.32, 0]} position={[0, -0.05, 0]}>
      <Room />
      <group position={[0.55, -0.37, 0.35]} scale={0.78} rotation={[0, -0.2, 0]}>
        <Nurse />
      </group>
    </group>
  );
}

export default function HomeScene({ animate }: { animate: boolean }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={animate ? "always" : "demand"}
      camera={{ position: [3.2, 2.6, 11], fov: 30 }}
      onCreated={({ gl, camera }) => {
        gl.toneMappingExposure = 1.1;
        camera.lookAt(-0.1, -0.35, -0.3);
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#ffffff", "#c8a07a", 0.45]} />
      <directionalLight
        position={[4, 6, 6]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0004}
      />
      <Environment resolution={256}>
        <Lightformer intensity={1.6} position={[0, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer intensity={0.8} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
      <Diorama />
      <ContactShadows position={[0, -1.63, 0]} opacity={0.35} scale={9} blur={2.8} far={1.5} color="#0a3b36" />
    </Canvas>
  );
}
