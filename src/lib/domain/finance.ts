import type {
  AdjustmentTarget,
  CommissionEntryType,
  PaymentDirection,
  PaymentEntryType,
} from "@/generated/prisma/enums";
import { Decimal, money, roundMoney, type MoneyInput } from "./money";

export type LedgerPayment = {
  direction: PaymentDirection;
  entryType: PaymentEntryType;
  amount: MoneyInput;
};
export type LedgerAdjustment = { target: AdjustmentTarget; amount: MoneyInput };
export type LedgerCommission = { entryType: CommissionEntryType; amount: MoneyInput };

export type AssignmentLedgerInput = {
  /** Obligations exist only once an assignment has been confirmed. */
  confirmed: boolean;
  customerAmount: MoneyInput;
  caregiverPayout: MoneyInput;
  payments: LedgerPayment[];
  adjustments: LedgerAdjustment[];
  commissions: LedgerCommission[];
};

export type AssignmentLedger = {
  /** Agreed customer amount plus customer-charge adjustments (0 before confirmation). */
  customerCharge: Decimal;
  /** Agreed caregiver payout plus payout adjustments (0 before confirmation). */
  caregiverObligation: Decimal;
  /** Money actually received from the customer, net of reversals. */
  customerReceived: Decimal;
  /** Money refunded to the customer, net of reversals. */
  customerRefunded: Decimal;
  /** Received minus refunded. */
  customerNetCollected: Decimal;
  /** Charge minus net collected. Negative means the customer is in credit. */
  customerOutstanding: Decimal;
  /** Money actually paid to the caregiver, net of reversals. */
  caregiverPaid: Decimal;
  caregiverOutstanding: Decimal;
  /** Sum of recognised commission entries, net of reversals. */
  commissionEarned: Decimal;
};

function signed(entryType: PaymentEntryType, amount: MoneyInput): Decimal {
  const value = money(amount);
  return entryType === "REVERSAL" ? value.negated() : value;
}

/**
 * Derives every balance for an assignment from its ledger rows. Nothing is
 * stored as "paid": paid amounts are always the sum of recorded payments.
 */
export function summarizeAssignmentLedger(input: AssignmentLedgerInput): AssignmentLedger {
  const zero = new Decimal(0);
  const adj = (target: AdjustmentTarget) =>
    input.adjustments
      .filter((a) => a.target === target)
      .reduce<Decimal>((acc, a) => acc.plus(money(a.amount)), zero);
  const paid = (direction: PaymentDirection) =>
    input.payments
      .filter((p) => p.direction === direction)
      .reduce<Decimal>((acc, p) => acc.plus(signed(p.entryType, p.amount)), zero);

  const customerCharge = input.confirmed ? money(input.customerAmount).plus(adj("CUSTOMER_CHARGE")) : zero;
  const caregiverObligation = input.confirmed
    ? money(input.caregiverPayout).plus(adj("CAREGIVER_PAYOUT"))
    : zero;
  const customerReceived = paid("CUSTOMER_RECEIPT");
  const customerRefunded = paid("CUSTOMER_REFUND");
  const customerNetCollected = customerReceived.minus(customerRefunded);
  const caregiverPaid = paid("CAREGIVER_PAYOUT");
  const commissionEarned = input.commissions.reduce<Decimal>((acc, c) => acc.plus(money(c.amount)), zero);

  return {
    customerCharge: roundMoney(customerCharge),
    caregiverObligation: roundMoney(caregiverObligation),
    customerReceived: roundMoney(customerReceived),
    customerRefunded: roundMoney(customerRefunded),
    customerNetCollected: roundMoney(customerNetCollected),
    customerOutstanding: roundMoney(customerCharge.minus(customerNetCollected)),
    caregiverPaid: roundMoney(caregiverPaid),
    caregiverOutstanding: roundMoney(caregiverObligation.minus(caregiverPaid)),
    commissionEarned: roundMoney(commissionEarned),
  };
}
