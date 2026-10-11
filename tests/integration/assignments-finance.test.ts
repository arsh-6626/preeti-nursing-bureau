import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { Actor } from "@/lib/auth/permissions";
import { AuthorizationError, DomainError } from "@/lib/auth/permissions";
import { submitPublicRequest } from "@/lib/services/requests";
import { createCaregiver, getCaregiverDetail, setOverallVerification, addVerificationRecord, addAvailability } from "@/lib/services/caregivers";
import {
  cancelAssignment,
  confirmAssignment,
  createAssignment,
  getAssignmentDetail,
  getCandidates,
  recordAcceptance,
  transitionAssignment,
} from "@/lib/services/assignments";
import { addAdjustment, correctCommission, getAssignmentLedger, recordPayment, reversePayment } from "@/lib/services/finance";
import { updateCommissionPolicy } from "@/lib/services/settings";
import { futureDate, makeCatalogue, makeUser, resetDb, validRequestPayload } from "../support/db";

let cat: Awaited<ReturnType<typeof makeCatalogue>>;
let admin: Actor;
let staff: Actor;

beforeEach(async () => {
  await resetDb();
  cat = await makeCatalogue();
  admin = await makeUser("ADMIN");
  staff = await makeUser("STAFF");
});

async function makeLead(overrides: Record<string, unknown> = {}) {
  const r = await submitPublicRequest(validRequestPayload({ serviceCategoryId: cat.gda.id, serviceAreaId: cat.area.id, ...overrides }));
  if (!r.ok) throw new Error(JSON.stringify(r));
  return db.serviceRequest.findUniqueOrThrow({ where: { reference: r.reference } });
}

async function makeCaregiver(overrides: Record<string, unknown> = {}) {
  return createCaregiver(admin, {
    fullName: "Sunita Rawat",
    phone: "9810011111",
    gender: "FEMALE",
    serviceCategoryIds: [cat.gda.id],
    areaIds: [cat.area.id],
    skills: "Mobility support, Feeding",
    experienceYears: "5",
    languages: "Hindi, English",
    availabilityStatus: "AVAILABLE",
    supportedShifts: ["12_HOURS"],
    payout12h: "900",
    affiliation: "INDEPENDENT",
    ...overrides,
  });
}

const terms = (overrides: Record<string, unknown> = {}) => ({
  shiftType: "12_HOURS",
  startDate: futureDate(3),
  durationValue: "14",
  durationUnit: "DAYS",
  customerAmount: "18000",
  caregiverPayout: "12600",
  commissionMethod: "PERCENTAGE",
  commissionRate: "10",
  commissionBasis: "CUSTOMER_AMOUNT",
  ...overrides,
}) as Parameters<typeof createAssignment>[2];

async function proposeAndAccept(leadId: string, caregiverId: string, t = terms()) {
  const a = await createAssignment(admin, { requestId: leadId, caregiverId }, t);
  await recordAcceptance(admin, { assignmentId: a.id, party: "customer", accepted: "yes" });
  await recordAcceptance(admin, { assignmentId: a.id, party: "caregiver", accepted: "yes" });
  return a;
}

describe("caregivers", () => {
  it("never marks a new caregiver as verified", async () => {
    const c = await makeCaregiver();
    expect(c.verificationStatus).toBe("NOT_STARTED");
    expect(c.code).toBe("CG-0001");
    await expect(setOverallVerification(admin, { caregiverId: c.id, status: "VERIFIED" })).rejects.toBeInstanceOf(DomainError);
    await addVerificationRecord(admin, { caregiverId: c.id, type: "IDENTITY", status: "VERIFIED", documentRef: "Aadhaar sighted" });
    await setOverallVerification(admin, { caregiverId: c.id, status: "VERIFIED" });
    const record = await db.verificationRecord.findFirstOrThrow();
    expect(record.reviewedById).toBe(admin.id);
  });

  it("hides verification records and pay from staff", async () => {
    const c = await makeCaregiver();
    const view = await getCaregiverDetail(staff, c.id);
    expect(view).not.toHaveProperty("payout12h");
    expect(view.verifications).toBeUndefined();
    await expect(addVerificationRecord(staff, { caregiverId: c.id, type: "IDENTITY", status: "VERIFIED" })).rejects.toBeInstanceOf(AuthorizationError);
  });
});

describe("matching and assignment", () => {
  it("lists candidates with shift compatibility and explanations", async () => {
    const lead = await makeLead();
    const good = await makeCaregiver();
    await makeCaregiver({ fullName: "Ramesh Yadav", phone: "9810022222", gender: "MALE", supportedShifts: ["24_HOURS"] });
    const { candidates } = await getCandidates(admin, lead.id);
    expect(candidates[0].caregiver.id).toBe(good.id);
    expect(candidates[0].eligible).toBe(true);
    expect(candidates[1].eligible).toBe(false);
    expect(candidates[1].blockers.join(" ")).toMatch(/12 hours/);
  });

  it("refuses to propose a caregiver for an unsupported shift", async () => {
    const lead = await makeLead({ shiftType: "24_HOURS" });
    const c = await makeCaregiver();
    await expect(
      createAssignment(admin, { requestId: lead.id, caregiverId: c.id }, terms({ shiftType: "24_HOURS", staffingPlan: "Relief 4h daily" })),
    ).rejects.toThrow(/does not work 24 hours/);
    await expect(createAssignment(admin, { requestId: lead.id, caregiverId: c.id }, terms())).rejects.toThrow(/24 hours/);
  });

  it("only lets administrators confirm, and only after both acceptances", async () => {
    const lead = await makeLead();
    const c = await makeCaregiver();
    const a = await createAssignment(admin, { requestId: lead.id, caregiverId: c.id }, terms());
    expect(a.status).toBe("PROPOSED");
    await expect(confirmAssignment(admin, a.id)).rejects.toThrow(/acceptance/);
    await recordAcceptance(admin, { assignmentId: a.id, party: "customer", accepted: "yes" });
    await recordAcceptance(admin, { assignmentId: a.id, party: "caregiver", accepted: "yes" });
    await db.serviceRequest.update({ where: { id: lead.id }, data: { assignedToId: staff.id } });
    await expect(confirmAssignment(staff, a.id)).rejects.toBeInstanceOf(AuthorizationError);
    expect((await db.assignment.findUniqueOrThrow({ where: { id: a.id } })).status).toBe("PROPOSED");
    await confirmAssignment(admin, a.id);
    const after = await db.assignment.findUniqueOrThrow({ where: { id: a.id } });
    expect(after.status).toBe("CONFIRMED");
    expect(after.confirmedById).toBe(admin.id);
    expect((await db.serviceRequest.findUniqueOrThrow({ where: { id: lead.id } })).status).toBe("CAREGIVER_ASSIGNED");
  });

  it("blocks conflicting assignments from being confirmed", async () => {
    const lead1 = await makeLead();
    const lead2 = await makeLead({ phone: "9811122334", idempotencyKey: crypto.randomUUID() });
    const c = await makeCaregiver();
    const a1 = await proposeAndAccept(lead1.id, c.id);
    const a2 = await proposeAndAccept(lead2.id, c.id, terms({ startDate: futureDate(10) }));
    await confirmAssignment(admin, a1.id);
    await expect(confirmAssignment(admin, a2.id)).rejects.toThrow(/overlapping/);
    expect((await db.assignment.findUniqueOrThrow({ where: { id: a2.id } })).status).toBe("PROPOSED");
  });

  it("blocks unavailable caregivers from being confirmed", async () => {
    const lead = await makeLead();
    const c = await makeCaregiver();
    const a = await proposeAndAccept(lead.id, c.id);
    await addAvailability(admin, { caregiverId: c.id, kind: "UNAVAILABLE", startDate: futureDate(5), endDate: futureDate(7), reason: "Family wedding" });
    await expect(confirmAssignment(admin, a.id)).rejects.toThrow(/unavailability/);
    await db.caregiver.update({ where: { id: c.id }, data: { availabilityStatus: "UNAVAILABLE" } });
    await expect(confirmAssignment(admin, a.id)).rejects.toThrow(/unavailable/i);
  });

  it("preserves assignment history and tracks cancellations and replacements", async () => {
    const lead = await makeLead();
    const c1 = await makeCaregiver();
    const c2 = await makeCaregiver({ fullName: "Meena Kumari", phone: "9810033333" });
    const a1 = await proposeAndAccept(lead.id, c1.id);
    await confirmAssignment(admin, a1.id);
    await transitionAssignment(admin, { assignmentId: a1.id, toStatus: "ACTIVE" });
    expect((await db.serviceRequest.findUniqueOrThrow({ where: { id: lead.id } })).status).toBe("SERVICE_ACTIVE");
    await transitionAssignment(admin, { assignmentId: a1.id, toStatus: "REPLACEMENT_REQUIRED", note: "Caregiver unwell" });
    expect((await db.serviceRequest.findUniqueOrThrow({ where: { id: lead.id } })).status).toBe("MATCHING");
    const a2 = await createAssignment(admin, { requestId: lead.id, caregiverId: c2.id, replacesAssignmentId: a1.id }, terms({ startDate: futureDate(6) }));
    await recordAcceptance(admin, { assignmentId: a2.id, party: "customer", accepted: "yes" });
    await recordAcceptance(admin, { assignmentId: a2.id, party: "caregiver", accepted: "yes" });
    await confirmAssignment(admin, a2.id);
    await cancelAssignment(admin, { assignmentId: a1.id, reason: "Replaced after illness", finalCustomerCharge: "3000", finalCaregiverPayout: "2100", reverseCommission: "on" });

    const events = await db.assignmentEvent.findMany({ where: { assignmentId: a1.id }, orderBy: { createdAt: "asc" } });
    expect(events.map((e) => e.toStatus)).toEqual([
      "PROPOSED", "PROPOSED", "PROPOSED", "CONFIRMED", "ACTIVE", "REPLACEMENT_REQUIRED", "CANCELLED",
    ]);
    const old = await db.assignment.findUniqueOrThrow({ where: { id: a1.id }, include: { replacedBy: true, adjustments: true, commissions: true } });
    expect(old.replacedBy?.id).toBe(a2.id);
    expect(old.cancellationReason).toBe("Replaced after illness");
    expect(old.adjustments.map((x) => x.amount.toString()).sort()).toEqual(["-10500", "-15000"]);
    const ledger = await getAssignmentLedger(admin, a1.id);
    expect(ledger.customerCharge.toFixed(2)).toBe("3000.00");
    expect(ledger.commissionEarned.toFixed(2)).toBe("0.00");
    expect(old.commissions.map((x) => x.entryType)).toEqual(expect.arrayContaining(["RECOGNITION", "REVERSAL"]));
  });

  it("hides agreed amounts from staff on assignment detail", async () => {
    const lead = await makeLead();
    const c = await makeCaregiver();
    const a = await createAssignment(admin, { requestId: lead.id, caregiverId: c.id }, terms());
    await db.serviceRequest.update({ where: { id: lead.id }, data: { assignedToId: staff.id } });
    const view = await getAssignmentDetail(staff, a.id);
    expect(view.finance).toBe(false);
    expect(view.assignment).not.toHaveProperty("customerAmount");
    expect(view.assignment).not.toHaveProperty("caregiverPayout");
    expect(view.assignment).not.toHaveProperty("payments");
  });
});

describe("financial tracking", () => {
  async function confirmedAssignment() {
    const lead = await makeLead();
    const c = await makeCaregiver();
    const a = await proposeAndAccept(lead.id, c.id);
    await confirmAssignment(admin, a.id);
    return a;
  }

  it("does not earn commission on a proposal, only on the configured event", async () => {
    const lead = await makeLead();
    const c = await makeCaregiver();
    const a = await proposeAndAccept(lead.id, c.id);
    expect(await db.commissionRecord.count()).toBe(0);
    await confirmAssignment(admin, a.id);
    const rec = await db.commissionRecord.findFirstOrThrow({ where: { assignmentId: a.id } });
    expect(rec.amount.toString()).toBe("1800");
  });

  it("recognises commission on completion when that policy is configured", async () => {
    await updateCommissionPolicy(admin, { commissionMethod: "FIXED", commissionRate: "10", commissionFixedAmount: "2500", commissionBasis: "CUSTOMER_AMOUNT", commissionRecognition: "ON_COMPLETION" });
    const lead = await makeLead();
    const c = await makeCaregiver();
    const a = await proposeAndAccept(lead.id, c.id, terms({ commissionMethod: "FIXED", commissionFixedAmount: "2500" }));
    await confirmAssignment(admin, a.id);
    expect(await db.commissionRecord.count()).toBe(0);
    await transitionAssignment(admin, { assignmentId: a.id, toStatus: "ACTIVE" });
    await transitionAssignment(admin, { assignmentId: a.id, toStatus: "COMPLETED" });
    const rec = await db.commissionRecord.findFirstOrThrow();
    expect(rec.amount.toString()).toBe("2500");
    expect((await db.serviceRequest.findUniqueOrThrow({ where: { id: lead.id } })).status).toBe("COMPLETED");
  });

  it("tracks partial payments, outstanding balances and refuses overpayment", async () => {
    const a = await confirmedAssignment();
    await recordPayment(admin, { assignmentId: a.id, direction: "CUSTOMER_RECEIPT", amount: "5000", method: "UPI", paidOn: futureDate(0), transactionRef: "UPI-REF-1" });
    await recordPayment(admin, { assignmentId: a.id, direction: "CUSTOMER_RECEIPT", amount: "4000.50", method: "CASH", paidOn: futureDate(0) });
    await recordPayment(admin, { assignmentId: a.id, direction: "CAREGIVER_PAYOUT", amount: "6300", method: "BANK_TRANSFER", paidOn: futureDate(0) });
    let ledger = await getAssignmentLedger(admin, a.id);
    expect(ledger.customerReceived.toFixed(2)).toBe("9000.50");
    expect(ledger.customerOutstanding.toFixed(2)).toBe("8999.50");
    expect(ledger.caregiverOutstanding.toFixed(2)).toBe("6300.00");
    expect(ledger.commissionEarned.toFixed(2)).toBe("1800.00");
    await expect(
      recordPayment(admin, { assignmentId: a.id, direction: "CUSTOMER_RECEIPT", amount: "9000", method: "CASH", paidOn: futureDate(0) }),
    ).rejects.toThrow(/more than the customer owes/);
    await addAdjustment(admin, { assignmentId: a.id, target: "CUSTOMER_CHARGE", amount: "1000", reason: "Two extra days" });
    ledger = await getAssignmentLedger(admin, a.id);
    expect(ledger.customerOutstanding.toFixed(2)).toBe("9999.50");
    const diff = await correctCommission(admin, a.id);
    expect(diff.toFixed(2)).toBe("100.00");
  });

  it("keeps corrections auditable through reversal entries", async () => {
    const a = await confirmedAssignment();
    await recordPayment(admin, { assignmentId: a.id, direction: "CUSTOMER_RECEIPT", amount: "5000", method: "UPI", paidOn: futureDate(0) });
    const payment = await db.payment.findFirstOrThrow();
    await reversePayment(admin, { paymentId: payment.id, reason: "Entered against wrong assignment" });
    await expect(reversePayment(admin, { paymentId: payment.id, reason: "again" })).rejects.toThrow(/already been reversed/);
    expect(await db.payment.count()).toBe(2);
    const ledger = await getAssignmentLedger(admin, a.id);
    expect(ledger.customerReceived.toFixed(2)).toBe("0.00");
    expect(await db.auditLog.count({ where: { action: { in: ["payment.record", "payment.reverse"] } } })).toBe(2);
    await expect(db.$executeRawUnsafe(`UPDATE "Payment" SET amount = -5 WHERE id = '${payment.id}'`)).rejects.toThrow();
  });

  it("refuses payments before confirmation and finance access for staff", async () => {
    const lead = await makeLead();
    const c = await makeCaregiver();
    const a = await createAssignment(admin, { requestId: lead.id, caregiverId: c.id }, terms());
    await expect(
      recordPayment(admin, { assignmentId: a.id, direction: "CUSTOMER_RECEIPT", amount: "100", method: "CASH", paidOn: futureDate(0) }),
    ).rejects.toThrow(/confirmed/);
    await expect(getAssignmentLedger(staff, a.id)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      recordPayment(staff, { assignmentId: a.id, direction: "CUSTOMER_RECEIPT", amount: "100", method: "CASH", paidOn: futureDate(0) }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});
