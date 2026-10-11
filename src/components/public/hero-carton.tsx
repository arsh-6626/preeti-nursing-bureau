"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CartonScene = dynamic(() => import("./carton-scene"), { ssr: false, loading: () => <CartonFallback /> });

/** Static stand-in shown while WebGL loads, without WebGL, or under reduced motion. */
function CartonFallback() {
  return (
    <div aria-hidden className="grid h-full place-items-center">
      <div className="relative h-[62%] w-[42%] rotate-[-8deg] overflow-hidden rounded-[6px] bg-paper shadow-[0_40px_80px_-30px_rgb(15_34_55/0.45)] ring-1 ring-line">
        <div className="absolute left-[9%] top-[7%] grid size-[12%] place-items-center rounded-[22%] bg-[#0f766e] text-[0.9rem] font-bold text-white">P</div>
        <p className="absolute left-[9%] top-[30%] text-[clamp(1.5rem,3vw,2.6rem)] font-bold leading-[0.95] text-navy-900">Home<br />Care</p>
        <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-b from-[#0f766e] to-[#0b5a54] [clip-path:polygon(0_22%,100%_0,100%_100%,0_100%)]" />
      </div>
    </div>
  );
}

function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function HeroCarton({ name, region }: { name: string; region: string }) {
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = requestAnimationFrame(() => setMode(!reduce && canUseWebGL() ? "3d" : "static"));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="relative h-full w-full">
      {mode === "3d" ? <CartonScene name={name} region={region} /> : <CartonFallback />}
    </div>
  );
}
