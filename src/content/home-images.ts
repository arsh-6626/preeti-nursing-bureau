/**
 * Homepage photographs (generated, illustrative). Each slot renders only once
 * its file is listed here, so the page never shows a placeholder. Files live
 * in public/images/home. The people are generated, not real staff or clients,
 * so captions describe roles, never names.
 */
export type HomeImageSlot = "hero" | "caregiver" | "nurse" | "shift12" | "shift24" | "call" | "close";

export type HomeImage = { src: string; alt: string; width: number; height: number };

export const HOME_IMAGES: Partial<Record<HomeImageSlot, HomeImage>> = {};
