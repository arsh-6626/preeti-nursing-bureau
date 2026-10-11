import "server-only";
import type { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan, DomainError, NotFoundError, type Actor } from "@/lib/auth/permissions";
import { calculateCommission } from "@/lib/domain/commission";
import { parseDateOnly } from "@/lib/domain/dates";
import { summarizeAssignmentLedger } from "@/lib/domain/finance";
import { formatINR, money } from "@/lib/domain/money";
import { PAYMENT_DIRECTION_LABELS } from "@/lib/domain/labels";
import { adjustmentSchema, paymentReversalSchema, paymentSchema } from "@/lib/validation/admin";

async function loadLedger(assignmentId: string) {
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { payments: true, adjustments: true, commissions: true, request: { select: { reference: true } } },
  });
  if (!a) throw new NotFoundError("Assignment not found.");
  return { a, ledger: summarizeAssignmentLedger({ confirmed: a.confirmedAt !== null, ...a }) };
}

export async function getAssignmentLedger(actor: Actor, assignmentId: string) {
  assertCan(actor, "finance:read");
  return (await loadLedger(assignmentId)).ledger;
}

/**
 * Records a manual payment (cash, UPI, bank transfer). Amounts can never push
 * a balance past what is owed: record an adjustment first if the agreed
 * amount changed.
 */
export async function recordPayment(actor: Actor, input: z.input<typeof paymentSchema>) {
  assertCan(actor, "finance:write");
  const data = paymentSchema.parse(input);
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Assignment" WHERE id = ${data.assignmentId}::uuid FOR UPDATE`;
    const a = await tx.assignment.findUnique({
      where: { id: data.assignmentId },
      include: { payments: true, adjustments: true, commissions: true, request: { select: { reference: true } } },
    });
    if (!a) throw new NotFoundError("Assignment not found.");
    if (!a.confirmedAt) throw new DomainError("Payments can be recorded once the assignment has been confirmed.");
    const ledger = summarizeAssignmentLedger({ confirmed: true, ...a });
    const amount = money(data.amount);
    if (data.direction === "CUSTOMER_RECEIPT" && amount.greaterThan(ledger.customerOutstanding)) {
      throw new DomainError(
        `This is more than the customer owes (${formatINR(ledger.customerOutstanding)}). Record a charge adjustment first if the agreed amount changed.`,
      );
    }
    if (data.direction === "CUSTOMER_REFUND" && amount.greaterThan(ledger.customerNetCollected)) {
      throw new DomainError(`A refund cannot exceed the amount collected (${formatINR(ledger.customerNetCollected)}).`);
    }
    if (data.direction === "CAREGIVER_PAYOUT" && amount.greaterThan(ledger.caregiverOutstanding)) {
      throw new DomainError(
        `This is more than the caregiver is owed (${formatINR(ledger.caregiverOutstanding)}). Record a payout adjustment first if the agreement changed.`,
      );
    }
    const payment = await tx.payment.create({
      data: {
        assignmentId: a.id,
        direction: data.direction,
        entryType: "PAYMENT",
        amount: amount.toFixed(2),
        method: data.method,
        methodNote: data.method === "OTHER" ? data.methodNote : null,
        paidOn: parseDateOnly(data.paidOn),
        transactionRef: data.transactionRef,
        notes: data.notes,
        recordedById: actor.id,
      },
    });
    await audit(
      {
        actorId: actor.id,
        action: "payment.record",
        entityType: "Payment",
        entityId: payment.id,
        summary: `${a.request.reference}: ${PAYMENT_DIRECTION_LABELS[data.direction]} ${formatINR(amount)} by ${data.method.replace("_", " ").toLowerCase()}`,
        metadata: { assignmentId: a.id },
      },
      tx,
    );
  });
}

/** Corrects a payment by posting a reversal entry. The original row is never edited or deleted. */
export async function reversePayment(actor: Actor, input: z.input<typeof paymentReversalSchema>) {
  assertCan(actor, "finance:write");
  const data = paymentReversalSchema.parse(input);
  await db.$transaction(async (tx) => {
    const original = await tx.payment.findUnique({
      where: { id: data.paymentId },
      include: { reversedBy: true, assignment: { include: { request: { select: { reference: true } } } } },
    });
    if (!original) throw new NotFoundError("Payment not found.");
    if (original.entryType === "REVERSAL") throw new DomainError("A reversal entry cannot itself be reversed.");
    if (original.reversedBy) throw new DomainError("This payment has already been reversed.");
    const reversal = await tx.payment.create({
      data: {
        assignmentId: original.assignmentId,
        direction: original.direction,
        entryType: "REVERSAL",
        amount: original.amount,
        method: original.method,
        methodNote: original.methodNote,
        paidOn: new Date(),
        transactionRef: original.transactionRef,
        notes: `Reversal: ${data.reason}`,
        reversesPaymentId: original.id,
        recordedById: actor.id,
      },
    });
    await audit(
      {
        actorId: actor.id,
        action: "payment.reverse",
        entityType: "Payment",
        entityId: reversal.id,
        summary: `${original.assignment.request.reference}: reversed ${PAYMENT_DIRECTION_LABELS[original.direction].toLowerCase()} of ${formatINR(original.amount)} (${data.reason})`,
        metadata: { originalPaymentId: original.id },
      },
      tx,
    );
  });
}

export async function addAdjustment(actor: Actor, input: z.input<typeof adjustmentSchema>) {
  assertCan(actor, "finance:write");
  const data = adjustmentSchema.parse(input);
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Assignment" WHERE id = ${data.assignmentId}::uuid FOR UPDATE`;
    const a = await tx.assignment.findUnique({
      where: { id: data.assignmentId },
      include: { payments: true, adjustments: true, commissions: true, request: { select: { reference: true } } },
    });
    if (!a) throw new NotFoundError("Assignment not found.");
    if (!a.confirmedAt) throw new DomainError("Before confirmation, edit the agreed terms instead of adding adjustments.");
    const ledger = summarizeAssignmentLedger({ confirmed: true, ...a });
    const amount = money(data.amount);
    const resulting = (data.target === "CUSTOMER_CHARGE" ? ledger.customerCharge : ledger.caregiverObligation).plus(amount);
    if (resulting.isNegative()) throw new DomainError("An adjustment cannot make the total negative.");
    const adjustment = await tx.financialAdjustment.create({
      data: { assignmentId: a.id, target: data.target, amount: amount.toFixed(2), reason: data.reason, recordedById: actor.id },
    });
    await audit(
      {
        actorId: actor.id,
        action: "adjustment.create",
        entityType: "FinancialAdjustment",
        entityId: adjustment.id,
        summary: `${a.request.reference}: ${data.target === "CUSTOMER_CHARGE" ? "customer charge" : "caregiver payout"} adjusted by ${formatINR(amount)} (${data.reason})`,
      },
      tx,
    );
  });
}

/**
 * Brings recognised commission in line with the current agreed amounts after
 * adjustments, by posting a correcting entry. Returns the correction amount.
 */
export async function correctCommission(actor: Actor, assignmentId: string) {
  assertCan(actor, "finance:write");
  return db.$transaction(async (tx) => {
    const a = await tx.assignment.findUnique({
      where: { id: assignmentId },
      include: { payments: true, adjustments: true, commissions: true, request: { select: { reference: true } } },
    });
    if (!a) throw new NotFoundError("Assignment not found.");
    if (!a.commissions.some((c) => c.entryType === "RECOGNITION")) {
      throw new DomainError("No commission has been recognised for this assignment yet.");
    }
    if (a.status === "CANCELLED") throw new DomainError("Commission on cancelled assignments is settled at cancellation.");
    const ledger = summarizeAssignmentLedger({ confirmed: true, ...a });
    const expected = calculateCommission(
      { method: a.commissionMethod, rate: a.commissionRate, fixedAmount: a.commissionFixedAmount, basis: a.commissionBasis },
      { customerAmount: ledger.customerCharge, caregiverPayout: ledger.caregiverObligation },
    );
    const diff = expected.amount.minus(ledger.commissionEarned);
    if (diff.isZero()) throw new DomainError("Commission already matches the current amounts.");
    await tx.commissionRecord.create({
      data: {
        assignmentId: a.id,
        entryType: diff.isNegative() ? "REVERSAL" : "RECOGNITION",
        amount: diff.toFixed(2),
        method: a.commissionMethod,
        rate: expected.rate?.toFixed(2) ?? null,
        basisAmount: expected.basisAmount?.toFixed(2) ?? null,
        reason: "Correction after amount adjustments",
        recordedById: actor.id,
      },
    });
    await audit(
      { actorId: actor.id, action: "commission.correct", entityType: "Assignment", entityId: a.id, summary: `${a.request.reference}: commission corrected by ${formatINR(diff)}` },
      tx,
    );
    return diff;
  });
}

export async function listPayments(actor: Actor, page: number) {
  assertCan(actor, "finance:read");
  const size = 30;
  const [total, rows] = await Promise.all([
    db.payment.count(),
    db.payment.findMany({
      orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * size,
      take: size,
      include: {
        recordedBy: { select: { name: true } },
        assignment: {
          select: { id: true, request: { select: { reference: true, customer: { select: { name: true } } } }, caregiver: { select: { code: true, fullName: true } } },
        },
      },
    }),
  ]);
  return { total, rows, page, pageCount: Math.max(1, Math.ceil(total / size)) };
}

/** Assignments with money still owed in either direction. */
export async function listOutstanding(actor: Actor) {
  assertCan(actor, "finance:read");
  const assignments = await db.assignment.findMany({
    where: { confirmedAt: { not: null } },
    include: {
      payments: true,
      adjustments: true,
      commissions: true,
      request: { select: { reference: true, customer: { select: { name: true, phone: true } } } },
      caregiver: { select: { code: true, fullName: true } },
    },
    orderBy: { startDate: "desc" },
  });
  return assignments
    .map((a) => ({ a, ledger: summarizeAssignmentLedger({ confirmed: true, ...a }) }))
    .filter(({ ledger }) => !ledger.customerOutstanding.isZero() || !ledger.caregiverOutstanding.isZero());
}
