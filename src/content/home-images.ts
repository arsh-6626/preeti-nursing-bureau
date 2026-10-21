/**
 * Homepage photographs (generated, illustrative, all square). Files live in
 * public/images/home. The people are not real staff or clients, so alt text
 * and captions describe the care shown, never names.
 */
export type HomeImage = { src: string; alt: string };

const img = (file: string, alt: string): HomeImage => ({ src: `/images/home/${file}.webp`, alt });

/** Auto-scrolling hero gallery: one moment of care per service. */
export const HERO_GALLERY: HomeImage[] = [
  img("hair-braid-female", "A caregiver braids an elderly woman's hair at her dressing table"),
  img("male-nurse", "A male nurse changes a dressing on an elderly man's forearm"),
  img("physiotherapy", "A caregiver guides an elderly woman through seated arm exercises on a terrace"),
  img("male-shave", "An attendant shaves an elderly man in a bright bathroom"),
  img("feeding", "A caregiver helps an elderly woman eat her meal"),
  img("male-oxy", "An attendant checks an elderly man's oxygen level after a hospital stay"),
  img("japa-maid", "A japa maid shows a new mother how to hold her baby"),
  img("videocall", "An attendant helps an elderly man start a video call with his family"),
  img("male-gda", "An attendant helps an elderly man settle comfortably in bed"),
];

export const HOME_IMAGES = {
  caregiver: img("gda-female-walker", "A caregiver helps an elderly woman walk with a walker"),
  nurse: img("female-nurse", "A nurse checks an elderly woman's blood pressure at her bedside"),
  shift12: img("gda-male-meal", "An attendant brings an elderly man his lunch and medicines"),
  shift24: img("nurse-icu-female", "A nurse monitors an elderly woman resting at home"),
  call: img("family-talks", "An attendant talks through the day's care with a patient and his son"),
};

/** Care outside the house. */
export const BEYOND_HOME: (HomeImage & { caption: string })[] = [
  { ...img("male-park-walk", "An attendant walks with an elderly man in a park"), caption: "Morning walks" },
  { ...img("female-wheelchair-park", "A caregiver pushes an elderly woman's wheelchair through a garden"), caption: "Wheelchair outings" },
];
