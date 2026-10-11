/**
 * Single source of truth for shift types.
 *
 * The application supports exactly two shift arrangements. The public/API
 * values are "12_HOURS" and "24_HOURS"; the Prisma enum member names are
 * TWELVE_HOURS and TWENTY_FOUR_HOURS (mapped to "12_HOURS"/"24_HOURS" in the
 * database). Every form, filter, pricing row, matching rule, report and seed
 * must import from this module rather than inventing its own list.
 */
import { z } from "zod";
import { ShiftType as DbShiftType } from "@/generated/prisma/enums";

export const SHIFT_TYPES = ["12_HOURS", "24_HOURS"] as const;
export type ShiftType = (typeof SHIFT_TYPES)[number];
export type DbShift = DbShiftType;

export const SHIFT_LABELS: Record<ShiftType, string> = {
  "12_HOURS": "12 hours",
  "24_HOURS": "24 hours",
};

export const SHIFT_DESCRIPTIONS: Record<ShiftType, string> = {
  "12_HOURS":
    "One caregiver for a 12-hour duty, by day or by night. Suitable when family members can cover the remaining hours.",
  "24_HOURS":
    "Round-the-clock care arrangement. Rest periods and relief are planned with you, so no caregiver is expected to work 24 hours without breaks.",
};

const TO_DB: Record<ShiftType, DbShiftType> = {
  "12_HOURS": DbShiftType.TWELVE_HOURS,
  "24_HOURS": DbShiftType.TWENTY_FOUR_HOURS,
};

const FROM_DB: Record<DbShiftType, ShiftType> = {
  TWELVE_HOURS: "12_HOURS",
  TWENTY_FOUR_HOURS: "24_HOURS",
};

export const SHIFT_ERROR = "Choose either 12 hours or 24 hours. No other shift lengths are offered.";

/** Zod schema accepting only the two permitted shift values. */
export const shiftTypeSchema = z.enum(SHIFT_TYPES, { error: SHIFT_ERROR });

export function isShiftType(value: unknown): value is ShiftType {
  return typeof value === "string" && (SHIFT_TYPES as readonly string[]).includes(value);
}

export function toDbShift(value: ShiftType): DbShiftType {
  const mapped = TO_DB[value];
  if (!mapped) throw new Error(SHIFT_ERROR);
  return mapped;
}

export function fromDbShift(value: DbShiftType): ShiftType {
  return FROM_DB[value];
}

export function shiftLabel(value: ShiftType | DbShiftType): string {
  return SHIFT_LABELS[isShiftType(value) ? value : FROM_DB[value]];
}

/** Parses a shift value from an untrusted source (e.g. a URL filter). */
export function parseShift(value: unknown): ShiftType | undefined {
  return isShiftType(value) ? value : undefined;
}
