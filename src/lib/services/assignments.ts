import "server-only";
import type { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { AssignmentStatus, LeadStatus } from "@/generated/prisma/enums";
import { db, type Tx } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan, can, DomainError, NotFoundError, type Actor } from "@/lib/auth/permissions";
import {
  BLOCKING_ASSIGNMENT_STATUSES,
  canTransitionAssignment,
  CONFIRMABLE_FROM,
  OPEN_ASSIGNMENT_STATUSES,
} from "@/lib/domain/assignment-status";
import { ASSIGNMENT_STATUS_LABELS } from "@/lib/domain/labels";
import { calculateCommission } from "@/lib/domain/commission";
import { computeEndDate, parseDateOnly } from "@/lib/domain/dates";
import { summarizeAssignmentLedger } from "@/lib/domain/finance";
import { hardBlockers, rankCandidates, type MatchCaregiver, type MatchRequest } from "@/lib/domain/matching";
import { money } from "@/lib/domain/money";
import { fromDbShift, shiftLabel, toDbShift } from "@/lib/domain/shift";
import {
  acceptanceSchema,
  assignmentCancelSchema,
  assignmentTermsSchema,
  assignmentTransitionSchema,
  createAssignmentSchema,
} from "@/lib/validation/admin";
import { leadScope } from "./leads";
import { getSettings } from "./settings";

const NURSING_PATTERN = /\b(GNM|ANM|B\.?\s?Sc\.?\s?Nursing|nurs(e|ing)|staff nurse)\b/i;

const caregiverMatchSelect = {
  id: true,
  code: true,
  fullName: true,
  phone: true,
  gender: true,
  experienceYears: true,
  skills: true,
  qualifications: true,
  languages: true,
  supportedShifts: true,
  availabilityStatus: true,
  verificationStatus: true,
  affiliation: true,
  archivedAt: true,
  services: { select: { serviceCategoryId: true } },
  areas: { select: { serviceAreaId: true, serviceArea: { select: { city: true } } } },
  availability: { select: { kind: true, startDate: true, endDate: true } },
  assignments: {
    where: { status: { in: [...BLOCKING_ASSIGNMENT_STATUSES] } },
    select: { id: true, startDate: true, endDate: true },
  },
} satisfies Prisma.CaregiverSelect;

type CaregiverForMatch = Awaited<ReturnType<typeof loadCaregiversForMatch>>[number];

async function loadCaregiversForMatch(tx: Tx | typeof db, where: { id?: string } = {}) {
  return tx.caregiver.findMany({ where: { archivedAt: null, ...where }, select: caregiverMatchSelect });
}

function toMatchCaregiver(c: CaregiverForMatch): MatchCaregiver {
  return {
    id: c.id,
    supportedShifts: c.supportedShifts.map(fromDbShift),
    serviceCategoryIds: c.services.map((s) => s.serviceCategoryId),
    areaIds: c.areas.map((a) => a.serviceAreaId),
    areaCities: [...new Set(c.areas.map((a) => a.serviceArea.city))],
    gender: c.gender,
    availabilityStatus: c.availabilityStatus,
    verificationStatus: c.verificationStatus,
    hasNursingQualification: NURSING_PATTERN.test(`${c.qualifications ?? ""} ${c.skills.join(" ")}`),
    availability: c.availability,
    blockingAssignments: c.assignments,
  };
}

async function loadRequestForActor(actor: Actor, requestId: string) {
  const request = await db.serviceRequest.findFirst({
    where: { AND: [{ id: requestId }, leadScope(actor)] },
    include: { serviceCategory: { select: { id: true, name: true, isNursing: true } } },
  });
  if (!request) throw new NotFoundError("Lead not found.");
  return request;
}

/** Ranked candidates with reasons and unmet requirements, for administrator review only. */
export async function getCandidates(actor: Actor, requestId: string) {
  assertCan(actor, "assignment:write");
  const request = await loadRequestForActor(actor, requestId);
  const endDate = computeEndDate(request.startDate, request.durationValue, request.durationUnit);
  const matchRequest: MatchRequest = {
    serviceCategoryId: request.serviceCategoryId,
    serviceIsNursing: request.serviceCategory?.isNursing ?? false,
    shiftType: fromDbShift(request.shiftType),
    preferredGender: request.preferredGender,
    serviceAreaId: request.serviceAreaId,
    city: request.city,
    startDate: request.startDate,
    endDate,
  };
  const caregivers = await loadCaregiversForMatch(db);
  const byId = new Map(caregivers.map((c) => [c.id, c]));
  const ranked = rankCandidates(matchRequest, caregivers.map(toMatchCaregiver));
  return {
    request: { ...request, endDate },
    candidates: ranked.map((r) => {
      const c = byId.get(r.caregiverId)!;
      return {
        ...r,
        caregiver: {
          id: c.id,
          code: c.code,
          fullName: c.fullName,
          gender: c.gender,
          experienceYears: c.experienceYears,
          languages: c.languages,
          qualifications: c.qualifications,
          verificationStatus: c.verificationStatus,
          availabilityStatus: c.availabilityStatus,
          supportedShifts: c.supportedShifts.map(fromDbShift),
        },
      };
    }),
  };
}

async function recordEvent(
  tx: Tx,
  assignmentId: string,
  from: AssignmentStatus | null,
  to: AssignmentStatus,
  actorId: string,
  note?: string | null,
) {
  await tx.assignmentEvent.create({ data: { assignmentId, fromStatus: from, toStatus: to, actorId, note: note ?? null } });
}

/** System-driven lead status change with history. Only applied when the lead is in one of `fromAny`. */
async function moveLead(tx: Tx, requestId: string, fromAny: LeadStatus[], to: LeadStatus, actorId: string, note: string) {
  const lead = await tx.serviceRequest.findUniqueOrThrow({ where: { id: requestId }, select: { status: true } });
  if (!fromAny.includes(lead.status) || lead.status === to) return;
  await tx.serviceRequest.update({ where: { id: requestId }, data: { status: to } });
  await tx.statusChange.create({ data: { requestId, fromStatus: lead.status, toStatus: to, changedById: actorId, note } });
}

async function refreshCaregiverAvailability(tx: Tx, caregiverId: string) {
  const caregiver = await tx.caregiver.findUniqueOrThrow({ where: { id: caregiverId }, select: { availabilityStatus: true } });
  if (caregiver.availabilityStatus === "UNAVAILABLE") return;
  const active = await tx.assignment.count({ where: { caregiverId, status: "ACTIVE" } });
  await tx.caregiver.update({ where: { id: caregiverId }, data: { availabilityStatus: active > 0 ? "ON_ASSIGNMENT" : "AVAILABLE" } });
}

export async function getDefaultTerms(requestId: string, caregiverId: string) {
  const [settings, request, caregiver] = await Promise.all([
    getSettings(),
    db.serviceRequest.findUniqueOrThrow({ where: { id: requestId } }),
    db.caregiver.findUniqueOrThrow({ where: { id: caregiverId } }),
  ]);
  const rule = request.serviceCategoryId
    ? await db.pricingRule.findUnique({
        where: { serviceCategoryId_shiftType: { serviceCategoryId: request.serviceCategoryId, shiftType: request.shiftType } },
      })
    : null;
  return {
    settings,
    request,
    pricingRule: rule,
    caregiverPayoutRate: request.shiftType === "TWELVE_HOURS" ? caregiver.payout12h : caregiver.payout24h,
    caregiverPayoutPeriod: caregiver.payoutPeriod,
  };
}

export async function createAssignment(
  actor: Actor,
  ids: z.input<typeof createAssignmentSchema>,
  terms: z.input<typeof assignmentTermsSchema>,
) {
  assertCan(actor, "assignment:write");
  const { requestId, caregiverId, replacesAssignmentId } = createAssignmentSchema.parse(ids);
  const t = assignmentTermsSchema.parse(terms);
  const request = await loadRequestForActor(actor, requestId);
  if (["COMPLETED", "CANCELLED", "UNFULFILLED"].includes(request.status)) {
    throw new DomainError("This lead is closed. Reopen it before proposing a caregiver.");
  }
  if (toDbShift(t.shiftType) !== request.shiftType) {
    throw new DomainError(
      `The customer asked for a ${shiftLabel(request.shiftType)} arrangement. Update the request first if the shift has changed.`,
    );
  }
  return db.$transaction(async (tx) => {
    const caregiver = await tx.caregiver.findUnique({ where: { id: caregiverId } });
    if (!caregiver || caregiver.archivedAt) throw new DomainError("This caregiver is archived or does not exist.");
    if (!caregiver.supportedShifts.includes(toDbShift(t.shiftType))) {
      throw new DomainError(`${caregiver.fullName} does not work ${shiftLabel(t.shiftType)} shifts.`);
    }
    if (replacesAssignmentId) {
      const old = await tx.assignment.findUnique({ where: { id: replacesAssignmentId } });
      if (!old || old.requestId !== requestId) throw new DomainError("The assignment being replaced does not belong to this lead.");
      if (old.status !== "REPLACEMENT_REQUIRED") throw new DomainError("Mark the original assignment as needing replacement first.");
      if (old.caregiverId === caregiverId) throw new DomainError("Choose a different caregiver for the replacement.");
    }
    const start = parseDateOnly(t.startDate);
    const assignment = await tx.assignment.create({
      data: {
        requestId,
        caregiverId,
        shiftType: toDbShift(t.shiftType),
        startDate: start,
        endDate: computeEndDate(start, t.durationValue, t.durationUnit),
        durationValue: t.durationValue,
        durationUnit: t.durationUnit,
        status: "PROPOSED",
        quotedAmount: t.quotedAmount,
        customerAmount: t.customerAmount,
        caregiverPayout: t.caregiverPayout,
        commissionMethod: t.commissionMethod,
        commissionRate: t.commissionMethod === "PERCENTAGE" ? t.commissionRate : null,
        commissionFixedAmount: t.commissionMethod === "FIXED" ? t.commissionFixedAmount : null,
        commissionBasis: t.commissionBasis,
        staffingPlan: t.staffingPlan,
        financialNotes: t.financialNotes,
        replacesAssignmentId,
        createdById: actor.id,
      },
    });
    await recordEvent(tx, assignment.id, null, "PROPOSED", actor.id, replacesAssignmentId ? "Proposed as a replacement" : "Caregiver proposed");
    await moveLead(tx, requestId, ["NEW", "CONTACTED", "REQUIREMENTS_COLLECTED"], "MATCHING", actor.id, "Caregiver proposed");
    await audit(
      { actorId: actor.id, action: "assignment.create", entityType: "Assignment", entityId: assignment.id, summary: `${request.reference}: proposed ${caregiver.code} (${shiftLabel(t.shiftType)})` },
      tx,
    );
    return assignment;
  });
}

async function loadAssignmentForActor(actor: Actor, id: string) {
  const assignment = await db.assignment.findFirst({ where: { id, request: leadScope(actor) } });
  if (!assignment) throw new NotFoundError("Assignment not found.");
  return assignment;
}

export async function updateAssignmentTerms(actor: Actor, id: string, terms: z.input<typeof assignmentTermsSchema>) {
  assertCan(actor, "assignment:write");
  const t = assignmentTermsSchema.parse(terms);
  const existing = await loadAssignmentForActor(actor, id);
  if (!CONFIRMABLE_FROM.includes(existing.status)) {
    throw new DomainError("Terms can only be edited before confirmation. Use adjustments for later changes.");
  }
  if (toDbShift(t.shiftType) !== existing.shiftType) {
    throw new DomainError("The shift type cannot be changed on an existing proposal. Cancel it and propose again.");
  }
  await db.$transaction(async (tx) => {
    const start = parseDateOnly(t.startDate);
    await tx.assignment.update({
      where: { id },
      data: {
        startDate: start,
        endDate: computeEndDate(start, t.durationValue, t.durationUnit),
        durationValue: t.durationValue,
        durationUnit: t.durationUnit,
        quotedAmount: t.quotedAmount,
        customerAmount: t.customerAmount,
        caregiverPayout: t.caregiverPayout,
        commissionMethod: t.commissionMethod,
        commissionRate: t.commissionMethod === "PERCENTAGE" ? t.commissionRate : null,
        commissionFixedAmount: t.commissionMethod === "FIXED" ? t.commissionFixedAmount : null,
        commissionBasis: t.commissionBasis,
        staffingPlan: t.staffingPlan,
        financialNotes: t.financialNotes,
        // Changed terms need fresh acceptance from both sides.
        customerAcceptedAt: null,
        caregiverAcceptedAt: null,
      },
    });
    await recordEvent(tx, id, existing.status, existing.status, actor.id, "Terms updated; acceptances reset");
    await audit(
      {
        actorId: actor.id,
        action: "assignment.terms",
        entityType: "Assignment",
        entityId: id,
        summary: "Updated assignment terms",
        metadata: {
          before: { customerAmount: existing.customerAmount.toString(), caregiverPayout: existing.caregiverPayout.toString() },
          after: { customerAmount: t.customerAmount, caregiverPayout: t.caregiverPayout },
        },
      },
      tx,
    );
  });
}

export async function recordAcceptance(actor: Actor, input: z.input<typeof acceptanceSchema>) {
  assertCan(actor, "assignment:write");
  const data = acceptanceSchema.parse(input);
  const assignment = await loadAssignmentForActor(actor, data.assignmentId);
  if (!CONFIRMABLE_FROM.includes(assignment.status)) throw new DomainError("Acceptance is recorded before confirmation.");
  const value = data.accepted === "yes" ? new Date() : null;
  await db.$transaction(async (tx) => {
    await tx.assignment.update({
      where: { id: assignment.id },
      data: data.party === "customer" ? { customerAcceptedAt: value } : { caregiverAcceptedAt: value },
    });
    await recordEvent(
      tx,
      assignment.id,
      assignment.status,
      assignment.status,
      actor.id,
      `${data.party === "customer" ? "Customer" : "Caregiver"} ${value ? "accepted" : "acceptance withdrawn"}`,
    );
  });
}

async function recognizeCommission(tx: Tx, assignmentId: string, actorId: string, reason: string) {
  const a = await tx.assignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: { adjustments: true, commissions: true, payments: true },
  });
  if (a.commissions.some((c) => c.entryType === "RECOGNITION")) return;
  const ledger = summarizeAssignmentLedger({
    confirmed: true,
    customerAmount: a.customerAmount,
    caregiverPayout: a.caregiverPayout,
    payments: a.payments,
    adjustments: a.adjustments,
    commissions: [],
  });
  const result = calculateCommission(
    { method: a.commissionMethod, rate: a.commissionRate, fixedAmount: a.commissionFixedAmount, basis: a.commissionBasis },
    { customerAmount: ledger.customerCharge, caregiverPayout: ledger.caregiverObligation },
  );
  await tx.commissionRecord.create({
    data: {
      assignmentId,
      entryType: "RECOGNITION",
      amount: result.amount.toFixed(2),
      method: a.commissionMethod,
      rate: result.rate?.toFixed(2) ?? null,
      basisAmount: result.basisAmount?.toFixed(2) ?? null,
      reason,
      recordedById: actorId,
    },
  });
}

/**
 * Explicit, administrator-only confirmation. Runs inside a transaction that
 * locks the caregiver row so two confirmations cannot double-book them.
 */
export async function confirmAssignment(actor: Actor, assignmentId: string) {
  assertCan(actor, "assignment:confirm");
  await loadAssignmentForActor(actor, assignmentId);
  await db.$transaction(async (tx) => {
    const a = await tx.assignment.findUniqueOrThrow({
      where: { id: assignmentId },
      include: { request: { include: { serviceCategory: true } } },
    });
    await tx.$queryRaw`SELECT id FROM "Caregiver" WHERE id = ${a.caregiverId}::uuid FOR UPDATE`;
    if (!CONFIRMABLE_FROM.includes(a.status)) {
      throw new DomainError(`An assignment that is "${ASSIGNMENT_STATUS_LABELS[a.status]}" cannot be confirmed.`);
    }
    if (!a.customerAcceptedAt || !a.caregiverAcceptedAt) {
      throw new DomainError("Record both the customer's and the caregiver's acceptance before confirming.");
    }
    if (a.shiftType === "TWENTY_FOUR_HOURS" && !a.staffingPlan) {
      throw new DomainError("Add the relief and rest plan for this 24-hour arrangement before confirming.");
    }
    if (a.shiftType !== a.request.shiftType) {
      throw new DomainError("The assignment shift does not match the customer's requested shift.");
    }
    const [caregiver] = await loadCaregiversForMatch(tx, { id: a.caregiverId });
    if (!caregiver) throw new DomainError("This caregiver is archived and cannot be confirmed.");
    const blockers = hardBlockers(
      {
        serviceCategoryId: a.request.serviceCategoryId,
        serviceIsNursing: a.request.serviceCategory?.isNursing ?? false,
        shiftType: fromDbShift(a.shiftType),
        preferredGender: a.request.preferredGender,
        serviceAreaId: a.request.serviceAreaId,
        city: a.request.city,
        startDate: a.startDate,
        endDate: a.endDate,
        excludeAssignmentId: a.id,
      },
      toMatchCaregiver(caregiver),
    );
    if (blockers.length > 0) throw new DomainError(`Cannot confirm: ${blockers.join("; ")}.`);

    await tx.assignment.update({
      where: { id: a.id },
      data: { status: "CONFIRMED", confirmedAt: new Date(), confirmedById: actor.id },
    });
    await recordEvent(tx, a.id, a.status, "CONFIRMED", actor.id, "Confirmed by administrator");
    const settings = await tx.businessSettings.findUnique({ where: { id: 1 } });
    if ((settings?.commissionRecognition ?? "ON_CONFIRMATION") === "ON_CONFIRMATION") {
      await recognizeCommission(tx, a.id, actor.id, "Recognised on confirmation");
    }
    await moveLead(tx, a.requestId, ["NEW", "CONTACTED", "REQUIREMENTS_COLLECTED", "MATCHING"], "CAREGIVER_ASSIGNED", actor.id, `Assignment confirmed (${caregiver.code})`);
    await audit(
      { actorId: actor.id, action: "assignment.confirm", entityType: "Assignment", entityId: a.id, summary: `${a.request.reference}: confirmed ${caregiver.code}` },
      tx,
    );
  });
}

export async function transitionAssignment(actor: Actor, input: z.input<typeof assignmentTransitionSchema>) {
  assertCan(actor, "assignment:write");
  const data = assignmentTransitionSchema.parse(input);
  await loadAssignmentForActor(actor, data.assignmentId);
  await db.$transaction(async (tx) => {
    const a = await tx.assignment.findUniqueOrThrow({ where: { id: data.assignmentId }, include: { request: true } });
    if (!canTransitionAssignment(a.status, data.toStatus)) {
      throw new DomainError(
        `An assignment cannot move from "${ASSIGNMENT_STATUS_LABELS[a.status]}" to "${ASSIGNMENT_STATUS_LABELS[data.toStatus]}".`,
      );
    }
    await tx.assignment.update({ where: { id: a.id }, data: { status: data.toStatus } });
    await recordEvent(tx, a.id, a.status, data.toStatus, actor.id, data.note);

    if (data.toStatus === "ACTIVE") {
      await moveLead(tx, a.requestId, ["CAREGIVER_ASSIGNED"], "SERVICE_ACTIVE", actor.id, "Service started");
      await refreshCaregiverAvailability(tx, a.caregiverId);
    }
    if (data.toStatus === "COMPLETED") {
      const settings = await tx.businessSettings.findUnique({ where: { id: 1 } });
      if (settings?.commissionRecognition === "ON_COMPLETION" && a.confirmedAt) {
        await recognizeCommission(tx, a.id, actor.id, "Recognised on completion");
      }
      const otherOpen = await tx.assignment.count({
        where: { requestId: a.requestId, id: { not: a.id }, status: { in: [...OPEN_ASSIGNMENT_STATUSES] } },
      });
      if (otherOpen === 0) {
        await moveLead(tx, a.requestId, ["CAREGIVER_ASSIGNED", "SERVICE_ACTIVE"], "COMPLETED", actor.id, "Service completed");
      }
      await refreshCaregiverAvailability(tx, a.caregiverId);
    }
    if (data.toStatus === "REPLACEMENT_REQUIRED") {
      await moveLead(tx, a.requestId, ["CAREGIVER_ASSIGNED", "SERVICE_ACTIVE"], "MATCHING", actor.id, "Replacement caregiver needed");
      await refreshCaregiverAvailability(tx, a.caregiverId);
    }
    await audit(
      {
        actorId: actor.id,
        action: "assignment.status",
        entityType: "Assignment",
        entityId: a.id,
        summary: `${a.request.reference}: assignment ${ASSIGNMENT_STATUS_LABELS[a.status]} → ${ASSIGNMENT_STATUS_LABELS[data.toStatus]}`,
      },
      tx,
    );
  });
}

/**
 * Cancels an assignment. For confirmed assignments the admin states what is
 * still payable; the difference is posted as auditable adjustments rather
 * than editing the agreed amounts.
 */
export async function cancelAssignment(actor: Actor, input: z.input<typeof assignmentCancelSchema>) {
  assertCan(actor, "assignment:write");
  const data = assignmentCancelSchema.parse(input);
  await loadAssignmentForActor(actor, data.assignmentId);
  if ((data.finalCustomerCharge || data.finalCaregiverPayout || data.reverseCommission) && !can(actor, "finance:write")) {
    throw new DomainError("Only users with finance access can settle amounts on cancellation.");
  }
  await db.$transaction(async (tx) => {
    const a = await tx.assignment.findUniqueOrThrow({
      where: { id: data.assignmentId },
      include: { request: true, adjustments: true, payments: true, commissions: true },
    });
    if (a.status === "CANCELLED" || a.status === "COMPLETED") {
      throw new DomainError("This assignment is already closed.");
    }
    if (a.confirmedAt) {
      const ledger = summarizeAssignmentLedger({ confirmed: true, ...a });
      const settle = async (target: "CUSTOMER_CHARGE" | "CAREGIVER_PAYOUT", finalValue: string | null, current: ReturnType<typeof money>) => {
        if (finalValue === null) return;
        const diff = money(finalValue).minus(current);
        if (diff.isZero()) return;
        await tx.financialAdjustment.create({
          data: {
            assignmentId: a.id,
            target,
            amount: diff.toFixed(2),
            reason: `Cancellation settlement: ${data.reason}`,
            recordedById: actor.id,
          },
        });
      };
      await settle("CUSTOMER_CHARGE", data.finalCustomerCharge, ledger.customerCharge);
      await settle("CAREGIVER_PAYOUT", data.finalCaregiverPayout, ledger.caregiverObligation);
      if (data.reverseCommission && ledger.commissionEarned.greaterThan(0)) {
        await tx.commissionRecord.create({
          data: {
            assignmentId: a.id,
            entryType: "REVERSAL",
            amount: ledger.commissionEarned.negated().toFixed(2),
            method: a.commissionMethod,
            reason: `Reversed on cancellation: ${data.reason}`,
            recordedById: actor.id,
          },
        });
      }
    }
    await tx.assignment.update({
      where: { id: a.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: data.reason },
    });
    await recordEvent(tx, a.id, a.status, "CANCELLED", actor.id, data.reason);
    const otherOpen = await tx.assignment.count({
      where: { requestId: a.requestId, id: { not: a.id }, status: { in: [...OPEN_ASSIGNMENT_STATUSES] } },
    });
    if (otherOpen === 0) {
      await moveLead(tx, a.requestId, ["CAREGIVER_ASSIGNED", "SERVICE_ACTIVE"], "MATCHING", actor.id, "Assignment cancelled; matching again");
    }
    await refreshCaregiverAvailability(tx, a.caregiverId);
    await audit(
      { actorId: actor.id, action: "assignment.cancel", entityType: "Assignment", entityId: a.id, summary: `${a.request.reference}: assignment cancelled (${data.reason})` },
      tx,
    );
  });
}

export async function listAssignments(
  actor: Actor,
  filters: { status?: AssignmentStatus; shift?: "12_HOURS" | "24_HOURS"; page?: number },
) {
  assertCan(actor, "assignment:read");
  const where = {
    request: leadScope(actor),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.shift ? { shiftType: toDbShift(filters.shift) } : {}),
  };
  const page = filters.page ?? 1;
  const size = 25;
  const [total, rows] = await Promise.all([
    db.assignment.count({ where }),
    db.assignment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
      select: {
        id: true,
        status: true,
        shiftType: true,
        startDate: true,
        endDate: true,
        customerAmount: can(actor, "finance:read"),
        request: { select: { id: true, reference: true, customer: { select: { name: true } } } },
        caregiver: { select: { id: true, code: true, fullName: true } },
      },
    }),
  ]);
  return { total, rows, page, pageCount: Math.max(1, Math.ceil(total / size)) };
}

const assignmentDetailInclude = {
  request: { include: { customer: true, serviceCategory: { select: { name: true } } } },
  caregiver: { select: { id: true, code: true, fullName: true, phone: true, supportedShifts: true } },
  createdBy: { select: { name: true } },
  confirmedBy: { select: { name: true } },
  replaces: { select: { id: true, caregiver: { select: { code: true, fullName: true } } } },
  replacedBy: { select: { id: true, status: true, caregiver: { select: { code: true, fullName: true } } } },
  events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
} satisfies Prisma.AssignmentInclude;

const financeInclude = {
  ...assignmentDetailInclude,
  payments: { orderBy: { createdAt: "asc" }, include: { recordedBy: { select: { name: true } } } },
  adjustments: { orderBy: { createdAt: "asc" }, include: { recordedBy: { select: { name: true } } } },
  commissions: { orderBy: { createdAt: "asc" }, include: { recordedBy: { select: { name: true } } } },
} satisfies Prisma.AssignmentInclude;

export async function getAssignmentDetail(actor: Actor, id: string) {
  assertCan(actor, "assignment:read");
  await loadAssignmentForActor(actor, id);
  if (can(actor, "finance:read")) {
    const a = await db.assignment.findUniqueOrThrow({ where: { id }, include: financeInclude });
    return { assignment: a, finance: true as const };
  }
  const a = await db.assignment.findUniqueOrThrow({ where: { id }, include: assignmentDetailInclude });
  // Staff never receive agreed amounts, payouts or commission terms.
  const {
    customerAmount: _c,
    caregiverPayout: _p,
    quotedAmount: _q,
    commissionRate: _r,
    commissionFixedAmount: _f,
    financialNotes: _n,
    ...safe
  } = a;
  void [_c, _p, _q, _r, _f, _n];
  return { assignment: safe, finance: false as const };
}
