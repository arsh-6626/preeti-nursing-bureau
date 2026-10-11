/**
 * Client-side "go" event: a call to action asks the page to play its
 * hand-off animation (nurse reacts, curtain covers the screen) and then
 * navigate. Listeners: the hero nurse and the page curtain.
 */
export const GO_EVENT = "pnb:go";

export type GoDetail = { href: string; x: number; y: number };

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
