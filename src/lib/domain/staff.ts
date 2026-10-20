/**
 * Staff records: caregivers and nurses are kept as separate lists, each with
 * its own form, codes and admin section, but share matching and assignments.
 */
export const STAFF_KINDS = ["CAREGIVER", "NURSE"] as const;
export type StaffKind = (typeof STAFF_KINDS)[number];

export const STAFF = {
  CAREGIVER: { label: "Caregiver", plural: "Caregivers", codePrefix: "CG", listPath: "/admin/caregivers" },
  NURSE: { label: "Nurse", plural: "Nurses", codePrefix: "NR", listPath: "/admin/nurses" },
} as const satisfies Record<StaffKind, { label: string; plural: string; codePrefix: string; listPath: string }>;

export function parseStaffKind(value: unknown): StaffKind {
  return value === "NURSE" ? "NURSE" : "CAREGIVER";
}

/** School education, asked on the caregiver form. */
export const EDUCATION_LEVELS = {
  UNEDUCATED: "Uneducated",
  BELOW_8TH: "Below 8th pass",
  PASS_10TH: "10th pass",
  PASS_12TH: "12th pass",
} as const;
export type EducationLevel = keyof typeof EDUCATION_LEVELS;

/** Hands-on clinical skills. Stored as these labels in Caregiver.skills. */
export const SKILL_OPTIONS = ["BP check", "Sugar check", "Ryles tube", "Catheter", "ICU monitors", "Nebuliser", "Oximeter"] as const;

/** Conditions and kinds of care the person handles. Stored in Caregiver.careTypes. */
export const CARE_TYPE_OPTIONS = ["Paralysis", "Mentally challenged", "Orthopedic", "Child care", "Nanny"] as const;

/** Work locations outside Delhi are chosen by city, not locality. */
export const WORK_CITIES = ["Gurugram", "Noida", "Ghaziabad", "Faridabad", "Other"] as const;
export const WORK_CITY_LABELS: Record<(typeof WORK_CITIES)[number], string> = {
  Gurugram: "Gurugram",
  Noida: "Noida",
  Ghaziabad: "Ghaziabad",
  Faridabad: "Faridabad",
  Other: "Others (outside these cities)",
};
export const DELHI = "Delhi";

/** True when a person's chosen work cities cover a request in `city`. "Other" covers any city not listed. */
export function worksInCity(workCities: string[], city: string): boolean {
  const c = city.trim().toLowerCase();
  if (workCities.some((w) => w.toLowerCase() === c)) return true;
  const named = [DELHI, ...WORK_CITIES.filter((w) => w !== "Other")].map((w) => w.toLowerCase());
  return workCities.includes("Other") && !named.includes(c);
}

/** Services not offered on the caregiver form (existing links are kept). */
export const CAREGIVER_FORM_HIDDEN_SERVICES = ["male-patient-attendant", "female-patient-attendant"];

/** Uploads: images only, downscaled in the browser before upload. */
export const STAFF_FILE_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Short "can work in" summary: all Delhi, or a few Delhi localities plus a
 * count, then the cities outside Delhi.
 */
export function summariseWorkAreas(
  areas: { city: string; locality: string }[],
  workCities: string[],
  delhiTotal: number,
  { max = 4 }: { max?: number } = {},
): string {
  const delhi = areas.filter((a) => a.city === DELHI).map((a) => a.locality);
  const elsewhere = areas.filter((a) => a.city !== DELHI).map((a) => `${a.locality} (${a.city})`);
  const parts: string[] = [];
  if (delhi.length > 0 && delhiTotal > 0 && delhi.length >= delhiTotal) parts.push("All Delhi");
  else if (delhi.length > max) parts.push(`Delhi: ${delhi.slice(0, max).join(", ")} +${delhi.length - max} more`);
  else if (delhi.length > 0) parts.push(`Delhi: ${delhi.join(", ")}`);
  const cities = [...workCities.map((w) => (w === "Other" ? "Others" : w)), ...elsewhere];
  if (cities.length > 0) parts.push(cities.join(", "));
  return parts.join("; ");
}
