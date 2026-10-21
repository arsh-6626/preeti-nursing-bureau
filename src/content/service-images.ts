import type { HomeImage } from "./home-images";

/** Photo for each service card, by service slug. Services without one show a plain card. */
export const SERVICE_IMAGES: Record<string, HomeImage> = {
  "general-duty-assistant": { src: "/images/home/hair-braid-female.webp", alt: "A caregiver braids an elderly woman's hair" },
  "home-nursing": { src: "/images/home/male-nurse.webp", alt: "A nurse changes a dressing on an elderly man's arm" },
  "male-patient-attendant": { src: "/images/home/male-shave.webp", alt: "A male attendant shaves an elderly man" },
  "female-patient-attendant": { src: "/images/home/physiotherapy.webp", alt: "A female attendant helps an elderly woman with gentle exercises" },
  "elderly-care": { src: "/images/home/videocall.webp", alt: "An attendant helps an elderly man video call his family" },
  "bedridden-patient-care": { src: "/images/home/male-gda.webp", alt: "An attendant settles an elderly man comfortably in bed" },
  "post-hospitalization-care": { src: "/images/home/male-oxy.webp", alt: "An attendant checks the oxygen level of a man recovering at home" },
  "long-term-patient-care": { src: "/images/home/feeding.webp", alt: "A caregiver helps an elderly woman with her meal" },
  "baby-care": { src: "/images/home/baby-care.webp", alt: "A japa maid cares for a newborn while the mother rests" },
};
