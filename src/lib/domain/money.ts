/**
 * Decimal-safe currency helpers. All arithmetic on money goes through
 * decimal.js; JavaScript numbers are never used for amounts.
 */
import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };
export type MoneyInput = Decimal | string | number | { toString(): string } | null | undefined;

export const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export function money(value: MoneyInput): Decimal {
  if (value === null || value === undefined || value === "") return new Decimal(0);
  if (value instanceof Decimal) return value;
  return new Decimal(typeof value === "number" ? value : value.toString());
}

export function roundMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function sumMoney(values: MoneyInput[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(money(v)), new Decimal(0));
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats an amount as Indian rupees, e.g. ₹1,25,000. */
export function formatINR(value: MoneyInput): string {
  const d = roundMoney(money(value));
  // Intl only accepts numbers; amounts are bounded by Decimal(12,2) so the
  // conversion is exact for display purposes.
  return inr.format(Number(d.toFixed(2)));
}

/** Serialises an amount for transport to client components. */
export function moneyString(value: MoneyInput): string {
  return roundMoney(money(value)).toFixed(2);
}
