"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GO_EVENT, type GoDetail } from "@/lib/client/go-event";

type Phase = "idle" | "cover" | "covered" | "reveal";

const PRESS_BEAT_MS = 120; // a beat for the button press to register before the curtain sweeps
const COVER_MS = 650;
const REVEAL_MS = 700;

/**
 * Deep-green curtain that grows from the click point, navigates while the
 * screen is covered, then shrinks away on the new page.
 */
export function PageCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const fromPath = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    function onGo(e: Event) {
      const { href, x, y } = (e as CustomEvent<GoDetail>).detail;
      timers.current.forEach(clearTimeout);
      setOrigin({ x, y });
      fromPath.current = window.location.pathname;
      router.prefetch(href);
      timers.current = [
        window.setTimeout(() => setPhase("cover"), PRESS_BEAT_MS),
        window.setTimeout(() => {
          setPhase("covered");
          router.push(href);
        }, PRESS_BEAT_MS + COVER_MS),
      ];
    }
    window.addEventListener(GO_EVENT, onGo);
    return () => {
      window.removeEventListener(GO_EVENT, onGo);
      timers.current.forEach(clearTimeout);
    };
  }, [router]);

  // Once the new page is in place, reveal it.
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    if (phase === "covered" || phase === "cover") setPhase("reveal");
  }
  useEffect(() => {
    if (phase !== "reveal") return;
    const id = window.setTimeout(() => setPhase("idle"), REVEAL_MS);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === "idle") return null;
  const radius = "150vmax";
  const clip =
    phase === "cover" || phase === "covered"
      ? `circle(${radius} at ${origin.x}px ${origin.y}px)`
      : `circle(0px at 50% 100%)`;
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[60] grid place-items-center bg-field"
      style={{
        clipPath: clip,
        transition: `clip-path ${phase === "reveal" ? REVEAL_MS : COVER_MS}ms cubic-bezier(0.77, 0, 0.18, 1)`,
      }}
      ref={(el) => {
        // Start the cover animation from a zero-radius circle at the click point.
        if (el && phase === "cover" && !el.dataset.started) {
          el.dataset.started = "1";
          el.style.transition = "none";
          el.style.clipPath = `circle(0px at ${origin.x}px ${origin.y}px)`;
          void el.offsetWidth;
          el.style.transition = `clip-path ${COVER_MS}ms cubic-bezier(0.77, 0, 0.18, 1)`;
          el.style.clipPath = clip;
        }
      }}
    >
      <p className={`font-display text-3xl font-bold text-white transition-opacity duration-300 sm:text-4xl ${phase === "covered" ? "opacity-100" : "opacity-0"}`}>
        Let&apos;s find the right person.
      </p>
    </div>
  );
}
