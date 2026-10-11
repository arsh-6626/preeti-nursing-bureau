"use client";

/**
 * 3D hero: a medicine-style carton for the bureau, drawn entirely in code.
 * Faces are painted on canvases from real bureau facts only (name, the two
 * shift lengths, region, the four-step process); no regulatory marks,
 * barcodes or claims. Loaded client-side only and skipped under reduced motion.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer } from "@react-three/drei";
import * as THREE from "three";

const TEAL = "#0f766e";
const TEAL_DEEP = "#0b5a54";
const MINT = "#99f6e4";
const NAVY = "#0f2237";
const PAPER = "#fbfcfc";
// next/font renames families, so read the real stacks from the page at draw time.
let FONT = "ui-sans-serif, system-ui, sans-serif";
let MONO = "ui-monospace, monospace";
function readFonts() {
  const root = getComputedStyle(document.documentElement);
  FONT = root.getPropertyValue("--font-geist").trim() || getComputedStyle(document.body).fontFamily || FONT;
  MONO = root.getPropertyValue("--font-geist-mono").trim() || MONO;
}

type Faces = { front: HTMLCanvasElement; back: HTMLCanvasElement; side: HTMLCanvasElement; sideAlt: HTMLCanvasElement; top: HTMLCanvasElement };

function canvas(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  const ctx = el.getContext("2d")!;
  draw(ctx);
  return el;
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawFaces(name: string, region: string): Faces {
  readFonts();
  const initial = name.trim().charAt(0).toUpperCase() || "P";
  const words = name.split(" ");
  const line1 = words.slice(0, -1).join(" ") || name;
  const line2 = words.length > 1 ? words[words.length - 1] : "";

  const front = canvas(1024, 1408, (c) => {
    c.fillStyle = PAPER;
    c.fillRect(0, 0, 1024, 1408);
    // brand mark
    roundRect(c, 88, 96, 120, 120, 30);
    c.fillStyle = TEAL;
    c.fill();
    c.fillStyle = "#fff";
    c.font = `700 76px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(initial, 148, 160);
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    c.fillStyle = NAVY;
    c.font = `600 44px ${FONT}`;
    c.fillText(line1, 236, 146);
    c.fillText(line2, 236, 198);
    // product name
    c.font = `700 150px ${FONT}`;
    c.fillText("Home", 88, 520);
    c.fillText("Care", 88, 670);
    c.fillStyle = "#52657a";
    c.font = `500 40px ${FONT}`;
    c.fillText("Caregivers, attendants and", 92, 760);
    c.fillText("home nurses, arranged by", 92, 812);
    c.fillText("people who call you back.", 92, 864);
    // pharma band
    c.save();
    c.beginPath();
    c.moveTo(0, 1010);
    c.lineTo(1024, 900);
    c.lineTo(1024, 1408);
    c.lineTo(0, 1408);
    c.closePath();
    const g = c.createLinearGradient(0, 900, 0, 1408);
    g.addColorStop(0, TEAL);
    g.addColorStop(1, TEAL_DEEP);
    c.fillStyle = g;
    c.fill();
    c.restore();
    // strengths
    c.font = `600 34px ${MONO}`;
    c.fillStyle = MINT;
    c.fillText("SHIFT LENGTH", 92, 1100);
    const pill = (x: number, label: string) => {
      roundRect(c, x, 1138, 260, 110, 55);
      c.fillStyle = "rgba(255,255,255,0.14)";
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.55)";
      c.lineWidth = 3;
      c.stroke();
      c.fillStyle = "#fff";
      c.font = `700 64px ${FONT}`;
      c.fillText(label, x + 44, 1216);
    };
    pill(88, "12 h");
    pill(376, "24 h");
    c.fillStyle = "rgba(255,255,255,0.85)";
    c.font = `500 32px ${MONO}`;
    c.fillText(region.toUpperCase(), 92, 1336);
  });

  const back = canvas(1024, 1408, (c) => {
    c.fillStyle = PAPER;
    c.fillRect(0, 0, 1024, 1408);
    c.fillStyle = NAVY;
    c.font = `700 72px ${FONT}`;
    c.fillText("How it works", 88, 180);
    const steps = ["Tell us what you need", "We call you", "We suggest a caregiver", "You decide"];
    steps.forEach((s, i) => {
      const y = 330 + i * 220;
      roundRect(c, 88, y - 70, 96, 96, 48);
      c.fillStyle = TEAL;
      c.fill();
      c.fillStyle = "#fff";
      c.font = `700 52px ${FONT}`;
      c.textAlign = "center";
      c.fillText(String(i + 1), 136, y - 4);
      c.textAlign = "left";
      c.fillStyle = NAVY;
      c.font = `600 50px ${FONT}`;
      c.fillText(s, 220, y - 4);
    });
    c.fillStyle = "#52657a";
    c.font = `500 34px ${MONO}`;
    c.fillText("NOT AN EMERGENCY SERVICE · CALL 112", 88, 1300);
  });

  const side = canvas(512, 1408, (c) => {
    const g = c.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, TEAL_DEEP);
    g.addColorStop(1, TEAL);
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 1408);
    c.save();
    c.translate(300, 1300);
    c.rotate(-Math.PI / 2);
    c.fillStyle = "#fff";
    c.font = `700 120px ${FONT}`;
    c.fillText("12 h · 24 h", 0, 0);
    c.restore();
  });

  const sideAlt = canvas(512, 1408, (c) => {
    c.fillStyle = PAPER;
    c.fillRect(0, 0, 512, 1408);
    c.save();
    c.translate(280, 1300);
    c.rotate(-Math.PI / 2);
    c.fillStyle = NAVY;
    c.font = `600 76px ${FONT}`;
    c.fillText(name, 0, 0);
    c.restore();
  });

  const top = canvas(1024, 512, (c) => {
    c.fillStyle = PAPER;
    c.fillRect(0, 0, 1024, 512);
    roundRect(c, 432, 176, 160, 160, 40);
    c.fillStyle = TEAL;
    c.fill();
    c.fillStyle = "#fff";
    c.font = `700 100px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(initial, 512, 260);
  });

  return { front, back, side, sideAlt, top };
}

function useFaceTextures(name: string, region: string) {
  const [faces, setFaces] = useState<Faces | null>(null);
  useEffect(() => {
    let alive = true;
    // Wait for web fonts so the canvas text uses Geist, not a fallback.
    const ready = typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(() => {
      if (alive) setFaces(drawFaces(name, region));
    });
    return () => {
      alive = false;
    };
  }, [name, region]);
  return useMemo(() => {
    if (!faces) return null;
    const tex = (el: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(el);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    };
    return {
      front: tex(faces.front),
      back: tex(faces.back),
      side: tex(faces.side),
      sideAlt: tex(faces.sideAlt),
      top: tex(faces.top),
    };
  }, [faces]);
}

function Carton({ name, region }: { name: string; region: string }) {
  const group = useRef<THREE.Group>(null);
  const textures = useFaceTextures(name, region);
  const { pointer } = useThree();
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const targetY = -0.55 + pointer.x * 0.45 + Math.sin(t * 0.35) * 0.12;
    const targetX = 0.12 - pointer.y * 0.18;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 3, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 3, delta);
  });
  if (!textures) return null;
  return (
    <group ref={group} rotation={[0.12, -0.55, 0.04]}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 2.2, 0.7]} />
        {/* BoxGeometry face order: +x, -x, +y, -y, +z, -z */}
        <meshPhysicalMaterial attach="material-0" map={textures.side} roughness={0.42} clearcoat={0.35} />
        <meshPhysicalMaterial attach="material-1" map={textures.sideAlt} roughness={0.42} clearcoat={0.35} />
        <meshPhysicalMaterial attach="material-2" map={textures.top} roughness={0.42} clearcoat={0.35} />
        <meshPhysicalMaterial attach="material-3" color={PAPER} roughness={0.5} />
        <meshPhysicalMaterial attach="material-4" map={textures.front} roughness={0.42} clearcoat={0.35} />
        <meshPhysicalMaterial attach="material-5" map={textures.back} roughness={0.42} clearcoat={0.35} />
      </mesh>
    </group>
  );
}

function Capsule({ position, rotation, color, scale = 1, speed = 1.2 }: { position: [number, number, number]; rotation: [number, number, number]; color: string; scale?: number; speed?: number }) {
  return (
    <Float speed={speed} rotationIntensity={0.8} floatIntensity={0.9}>
      <group position={position} rotation={rotation} scale={scale}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <capsuleGeometry args={[0.13, 0.3, 8, 24]} />
          <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={0.8} clearcoatRoughness={0.15} />
        </mesh>
      </group>
    </Float>
  );
}

function Scene({ name, region }: { name: string; region: string }) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2.5, 4, 5]} intensity={2.1} castShadow />
      <directionalLight position={[0, 0.5, 6]} intensity={0.7} />
      <directionalLight position={[-4, 2, -2]} intensity={0.5} color={MINT} />
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer intensity={1.2} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer intensity={0.8} color={MINT} position={[5, 0, 1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
      <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.4}>
        <Carton name={name} region={region} />
      </Float>
      <Capsule position={[-1.15, 1.05, 0.6]} rotation={[0.4, 0, 0.9]} color={TEAL} />
      <Capsule position={[1.12, -0.45, 0.9]} rotation={[0.2, 0.3, -0.6]} color="#ffffff" scale={0.9} speed={1.5} />
      <Capsule position={[1.05, 1.25, -0.4]} rotation={[0.1, 0, 0.3]} color={MINT} scale={0.75} speed={1} />
      <Capsule position={[-1.05, -1.0, 0.3]} rotation={[0.3, 0.2, -1.1]} color="#ffffff" scale={0.7} speed={1.3} />
      <ContactShadows position={[0, -1.45, 0]} opacity={0.26} scale={3.6} blur={2.6} far={2.2} color={NAVY} />
    </>
  );
}

export default function CartonScene({ name, region }: { name: string; region: string }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.05, 6.2], fov: 36 }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.25;
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <Scene name={name} region={region} />
    </Canvas>
  );
}
