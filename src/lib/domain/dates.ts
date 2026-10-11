import type { DurationUnit } from "@/generated/prisma/enums";

/** Parses a YYYY-MM-DD string as a UTC date (dates are stored without time). */
export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Invalid date");
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() !== Number(match[2]) - 1 ||
    date.getUTCDate() !== Number(match[3])
  ) {
    throw new Error("Invalid date");
  }
  return date;
}

export function isValidDateOnly(value: string): boolean {
  try {
    parseDateOnly(value);
    return true;
  } catch {
    return false;
  }
}

export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's date in India (IST), as a UTC date-only value. */
export function todayInIndia(now: Date = new Date()): Date {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Inclusive last day of an arrangement starting on `start` for the given duration. */
export function computeEndDate(start: Date, value: number, unit: DurationUnit): Date {
  if (!Number.isInteger(value) || value < 1) throw new Error("Duration must be a positive whole number");
  if (unit === "DAYS") return addDays(start, value - 1);
  if (unit === "WEEKS") return addDays(start, value * 7 - 1);
  const end = new Date(start.getTime());
  const targetMonth = end.getUTCMonth() + value;
  end.setUTCDate(1);
  end.setUTCMonth(targetMonth);
  const daysInTarget = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(start.getUTCDate(), daysInTarget));
  return addDays(end, -1);
}

/** Number of calendar days in an inclusive range. */
export function daysInclusive(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

/** True when two inclusive date ranges share at least one day. A null end means open-ended. */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date | null,
  bStart: Date,
  bEnd: Date | null,
): boolean {
  const aEndTime = aEnd ? aEnd.getTime() : Number.POSITIVE_INFINITY;
  const bEndTime = bEnd ? bEnd.getTime() : Number.POSITIVE_INFINITY;
  return aStart.getTime() <= bEndTime && bStart.getTime() <= aEndTime;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return dateTimeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

/** Current time in milliseconds. Wrapped so render code reads time through one place. */
export function currentTimeMs(): number {
  return Date.now();
}
