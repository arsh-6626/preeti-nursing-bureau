"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HomeScene = dynamic(() => import("./home-scene"), { ssr: false, loading: () => <div aria-hidden className="h-full w-full" /> });

function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** 3D "care at home" diorama for the hero. Still under reduced motion; skipped without WebGL. */
export function HeroNurse() {
  const [mode, setMode] = useState<"pending" | "animate" | "still" | "none">("pending");
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = requestAnimationFrame(() => setMode(!canUseWebGL() ? "none" : reduce ? "still" : "animate"));
    return () => cancelAnimationFrame(id);
  }, []);
  return <div className="relative h-full w-full">{mode === "animate" || mode === "still" ? <HomeScene animate={mode === "animate"} /> : null}</div>;
}
