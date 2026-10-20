/**
 * Client-side "go" event: a call to action asks the page to play its
 * hand-off animation (the curtain covers the screen) and then navigate.
 * Listeners: the page curtain, and the 3D scene wherever it is mounted.
 */
export const GO_EVENT = "pnb:go";

export type GoDetail = { href: string; x: number; y: number };

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
