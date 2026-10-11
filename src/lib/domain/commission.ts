import type { CommissionBasis, CommissionMethod } from "@/generated/prisma/enums";
import { Decimal, money, roundMoney, type MoneyInput } from "./money";

export type CommissionTerms = {
  method: CommissionMethod;
  /** Percentage, e.g. 10 for 10%. Required for PERCENTAGE. */
  rate?: MoneyInput;
  /** Fixed amount per successful placement. Required for FIXED. */
  fixedAmount?: MoneyInput;
  basis: CommissionBasis;
};

export type CommissionResult = {
  amount: Decimal;
  basisAmount: Decimal | null;
  rate: Decimal | null;
};

/**
 * Calculates commission under the configured policy.
 * - FIXED: the fixed amount per successful placement.
 * - PERCENTAGE: basis amount × rate / 100, where the basis is either the agreed
 *   customer amount or the agreed caregiver payout (explicitly configured).
 * The customer-minus-payout margin is never treated as the commission here.
 */
export function calculateCommission(
  terms: CommissionTerms,
  amounts: { customerAmount: MoneyInput; caregiverPayout: MoneyInput },
): CommissionResult {
  if (terms.method === "FIXED") {
    if (terms.fixedAmount === null || terms.fixedAmount === undefined || terms.fixedAmount === "") {
      throw new Error("A fixed commission amount is required.");
    }
    const fixed = money(terms.fixedAmount);
    if (fixed.isNegative()) throw new Error("Commission cannot be negative.");
    return { amount: roundMoney(fixed), basisAmount: null, rate: null };
  }
  if (terms.rate === null || terms.rate === undefined || terms.rate === "") {
    throw new Error("A commission percentage is required.");
  }
  const rate = money(terms.rate);
  if (rate.isNegative() || rate.greaterThan(100)) {
    throw new Error("Commission percentage must be between 0 and 100.");
  }
  const basisAmount = money(
    terms.basis === "CUSTOMER_AMOUNT" ? amounts.customerAmount : amounts.caregiverPayout,
  );
  return {
    amount: roundMoney(basisAmount.times(rate).dividedBy(100)),
    basisAmount: roundMoney(basisAmount),
    rate,
  };
}

/** Gross margin: agreed customer amount minus agreed caregiver payout. Informational only. */
export function calculateMargin(customerAmount: MoneyInput, caregiverPayout: MoneyInput): Decimal {
  return roundMoney(money(customerAmount).minus(money(caregiverPayout)));
}
