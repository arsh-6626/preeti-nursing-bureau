import { describe, expect, it } from "vitest";
import { calculateCommission, calculateMargin } from "@/lib/domain/commission";
import { summarizeAssignmentLedger } from "@/lib/domain/finance";
import { formatINR, money, sumMoney } from "@/lib/domain/money";

describe("commission", () => {
  it("calculates a fixed commission per placement", () => {
    const r = calculateCommission({ method: "FIXED", fixedAmount: "2500", basis: "CUSTOMER_AMOUNT" }, { customerAmount: "36000", caregiverPayout: "27000" });
    expect(r.amount.toFixed(2)).toBe("2500.00");
    expect(r.basisAmount).toBeNull();
  });

  it("calculates a percentage of the agreed customer amount", () => {
    const r = calculateCommission({ method: "PERCENTAGE", rate: "12.5", basis: "CUSTOMER_AMOUNT" }, { customerAmount: "36000", caregiverPayout: "27000" });
    expect(r.amount.toFixed(2)).toBe("4500.00");
    expect(r.basisAmount?.toFixed(2)).toBe("36000.00");
  });

  it("calculates a percentage of the caregiver payout when that basis is configured", () => {
    const r = calculateCommission({ method: "PERCENTAGE", rate: "10", basis: "CAREGIVER_PAYOUT" }, { customerAmount: "36000", caregiverPayout: "27000" });
    expect(r.amount.toFixed(2)).toBe("2700.00");
  });

  it("uses decimal arithmetic without floating-point drift", () => {
    const r = calculateCommission({ method: "PERCENTAGE", rate: "7", basis: "CUSTOMER_AMOUNT" }, { customerAmount: "0.10", caregiverPayout: "0" });
    expect(r.amount.toFixed(2)).toBe("0.01");
    expect(sumMoney(["0.1", "0.2"]).toFixed(2)).toBe("0.30");
    const third = calculateCommission({ method: "PERCENTAGE", rate: "33.33", basis: "CUSTOMER_AMOUNT" }, { customerAmount: "1000.05", caregiverPayout: "0" });
    expect(third.amount.toFixed(2)).toBe("333.32");
  });

  it("keeps margin separate from commission", () => {
    const commission = calculateCommission({ method: "PERCENTAGE", rate: "10", basis: "CUSTOMER_AMOUNT" }, { customerAmount: "36000", caregiverPayout: "27000" });
    const margin = calculateMargin("36000", "27000");
    expect(margin.toFixed(2)).toBe("9000.00");
    expect(commission.amount.toFixed(2)).toBe("3600.00");
    expect(margin.equals(commission.amount)).toBe(false);
  });

  it("rejects invalid commission terms", () => {
    expect(() => calculateCommission({ method: "PERCENTAGE", rate: "120", basis: "CUSTOMER_AMOUNT" }, { customerAmount: "1", caregiverPayout: "1" })).toThrow();
    expect(() => calculateCommission({ method: "FIXED", basis: "CUSTOMER_AMOUNT" }, { customerAmount: "1", caregiverPayout: "1" })).toThrow();
  });
});

describe("assignment ledger", () => {
  const base = { confirmed: true, customerAmount: "36000", caregiverPayout: "27000", adjustments: [], commissions: [] };

  it("distinguishes agreed charges from actual collections", () => {
    const l = summarizeAssignmentLedger({ ...base, payments: [] });
    expect(l.customerCharge.toFixed(2)).toBe("36000.00");
    expect(l.customerReceived.toFixed(2)).toBe("0.00");
    expect(l.customerOutstanding.toFixed(2)).toBe("36000.00");
  });

  it("updates outstanding balances with partial payments", () => {
    const l = summarizeAssignmentLedger({
      ...base,
      payments: [
        { direction: "CUSTOMER_RECEIPT", entryType: "PAYMENT", amount: "10000" },
        { direction: "CUSTOMER_RECEIPT", entryType: "PAYMENT", amount: "6000.50" },
        { direction: "CAREGIVER_PAYOUT", entryType: "PAYMENT", amount: "9000" },
      ],
    });
    expect(l.customerNetCollected.toFixed(2)).toBe("16000.50");
    expect(l.customerOutstanding.toFixed(2)).toBe("19999.50");
    expect(l.caregiverPaid.toFixed(2)).toBe("9000.00");
    expect(l.caregiverOutstanding.toFixed(2)).toBe("18000.00");
  });

  it("keeps caregiver payouts distinct from commission revenue", () => {
    const l = summarizeAssignmentLedger({
      ...base,
      payments: [{ direction: "CAREGIVER_PAYOUT", entryType: "PAYMENT", amount: "27000" }],
      commissions: [{ entryType: "RECOGNITION", amount: "3600" }],
    });
    expect(l.caregiverPaid.toFixed(2)).toBe("27000.00");
    expect(l.commissionEarned.toFixed(2)).toBe("3600.00");
  });

  it("applies reversals, refunds and adjustments as separate auditable entries", () => {
    const l = summarizeAssignmentLedger({
      ...base,
      adjustments: [{ target: "CUSTOMER_CHARGE", amount: "-1000" }, { target: "CAREGIVER_PAYOUT", amount: "500" }],
      payments: [
        { direction: "CUSTOMER_RECEIPT", entryType: "PAYMENT", amount: "20000" },
        { direction: "CUSTOMER_RECEIPT", entryType: "REVERSAL", amount: "20000" },
        { direction: "CUSTOMER_RECEIPT", entryType: "PAYMENT", amount: "15000" },
        { direction: "CUSTOMER_REFUND", entryType: "PAYMENT", amount: "1000" },
      ],
      commissions: [{ entryType: "RECOGNITION", amount: "3600" }, { entryType: "REVERSAL", amount: "-100" }],
    });
    expect(l.customerCharge.toFixed(2)).toBe("35000.00");
    expect(l.caregiverObligation.toFixed(2)).toBe("27500.00");
    expect(l.customerReceived.toFixed(2)).toBe("15000.00");
    expect(l.customerNetCollected.toFixed(2)).toBe("14000.00");
    expect(l.customerOutstanding.toFixed(2)).toBe("21000.00");
    expect(l.commissionEarned.toFixed(2)).toBe("3500.00");
  });

  it("has no obligations before an assignment is confirmed", () => {
    const l = summarizeAssignmentLedger({ ...base, confirmed: false, payments: [] });
    expect(l.customerCharge.isZero()).toBe(true);
    expect(l.caregiverObligation.isZero()).toBe(true);
    expect(l.commissionEarned.isZero()).toBe(true);
  });

  it("formats rupees in the Indian numbering system", () => {
    expect(formatINR("125000")).toBe("₹1,25,000");
    expect(formatINR(money("1500.5"))).toBe("₹1,500.5");
  });
});
