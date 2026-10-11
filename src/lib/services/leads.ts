import "server-only";
import type { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan, can, DomainError, NotFoundError, AuthorizationError, type Actor } from "@/lib/auth/permissions";
import { canTransitionLead, OPEN_LEAD_STATUSES, STATUSES_REQUIRING_ASSIGNMENT } from "@/lib/domain/lead-status";
import { LEAD_STATUS_LABELS, CALL_OUTCOME_LABELS } from "@/lib/domain/labels";
import { parseDateOnly, addDays } from "@/lib/domain/dates";
import { toDbShift } from "@/lib/domain/shift";
import {
  callLogSchema,
  followUpCompleteSchema,
  followUpSchema,
  leadMetaSchema,
  leadStatusUpdateSchema,
  noteSchema,
  type LeadFilters,
} from "@/lib/validation/admin";

export const LEADS_PAGE_SIZE = 20;

/** Row-level scope: staff only ever see leads assigned to them. */
export function leadScope(actor: Actor): Prisma.ServiceRequestWhereInput {
  if (can(actor, "lead:read:any")) return {};
  if (can(actor, "lead:read:assigned")) return { assignedToId: actor.id };
  throw new AuthorizationError();
}

export async function listLeads(actor: Actor, filters: LeadFilters) {
  const scope = leadScope(actor);
  const where: Prisma.ServiceRequestWhereInput = { AND: [scope] };
  const and = where.AND as Prisma.ServiceRequestWhereInput[];
  const now = new Date();

  if (filters.q) {
    const q = filters.q;
    const digits = q.replace(/\D/g, "");
    and.push({
      OR: [
        { reference: { contains: q.toUpperCase() } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
        ...(digits.length >= 4 ? [{ customer: { phone: { contains: digits.slice(-10) } } }] : []),
      ],
    });
  }
  if (filters.status) and.push({ status: filters.status });
  if (filters.service) and.push({ serviceCategoryId: filters.service });
  if (filters.city) and.push({ city: { equals: filters.city, mode: "insensitive" } });
  if (filters.priority) and.push({ priority: filters.priority });
  if (filters.source) and.push({ source: filters.source });
  if (filters.shift) and.push({ shiftType: toDbShift(filters.shift) });
  if (filters.from) and.push({ createdAt: { gte: parseDateOnly(filters.from) } });
  if (filters.to) and.push({ createdAt: { lt: addDays(parseDateOnly(filters.to), 1) } });
  switch (filters.view) {
    case "new":
      and.push({ status: "NEW" });
      break;
    case "overdue":
      and.push({ nextFollowUpAt: { lt: now }, status: { in: [...OPEN_LEAD_STATUSES] } });
      break;
    case "mine":
      and.push({ assignedToId: actor.id });
      break;
    case "open":
      and.push({ status: { in: [...OPEN_LEAD_STATUSES] } });
      break;
  }

  const orderBy: Prisma.ServiceRequestOrderByWithRelationInput[] =
    filters.sort === "created_asc"
      ? [{ createdAt: "asc" }]
      : filters.sort === "followup_asc"
        ? [{ nextFollowUpAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];
  const page = filters.page ?? 1;

  const [total, rows] = await Promise.all([
    db.serviceRequest.count({ where }),
    db.serviceRequest.findMany({
      where,
      orderBy,
      skip: (page - 1) * LEADS_PAGE_SIZE,
      take: LEADS_PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        status: true,
        priority: true,
        source: true,
        shiftType: true,
        city: true,
        locality: true,
        startDate: true,
        createdAt: true,
        nextFollowUpAt: true,
        otherServiceText: true,
        customer: { select: { name: true, phone: true } },
        serviceCategory: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    }),
  ]);
  return { total, rows, page, pageCount: Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE)) };
}

/** Loads a lead, enforcing row-level access. Unknown and forbidden ids look identical. */
export async function getLeadForActor(actor: Actor, id: string) {
  const lead = await db.serviceRequest.findFirst({ where: { AND: [{ id }, leadScope(actor)] }, select: { id: true } });
  if (!lead) throw new NotFoundError("Lead not found.");
  return lead;
}

export async function getLeadDetail(actor: Actor, id: string) {
  await getLeadForActor(actor, id);
  const showFinance = can(actor, "finance:read");
  return db.serviceRequest.findUniqueOrThrow({
    where: { id },
    include: {
      customer: true,
      serviceCategory: { select: { id: true, name: true, isNursing: true } },
      serviceArea: { select: { id: true, city: true, locality: true } },
      assignedTo: { select: { id: true, name: true } },
      statusChanges: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      followUps: {
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
        include: { assignedTo: { select: { name: true } }, createdBy: { select: { name: true } } },
      },
      assignments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          shiftType: true,
          startDate: true,
          endDate: true,
          confirmedAt: true,
          cancellationReason: true,
          replacesAssignmentId: true,
          customerAmount: showFinance,
          caregiverPayout: showFinance,
          caregiver: { select: { id: true, code: true, fullName: true } },
        },
      },
    },
  });
}

export async function updateLeadStatus(actor: Actor, input: z.input<typeof leadStatusUpdateSchema>) {
  assertCan(actor, "lead:write");
  const data = leadStatusUpdateSchema.parse(input);
  await getLeadForActor(actor, data.requestId);
  await db.$transaction(async (tx) => {
    const lead = await tx.serviceRequest.findUniqueOrThrow({ where: { id: data.requestId } });
    if (lead.status === data.toStatus) throw new DomainError("The lead already has this status.");
    if (!canTransitionLead(lead.status, data.toStatus)) {
      throw new DomainError(
        `A lead cannot move from "${LEAD_STATUS_LABELS[lead.status]}" to "${LEAD_STATUS_LABELS[data.toStatus]}".`,
      );
    }
    if (STATUSES_REQUIRING_ASSIGNMENT.includes(data.toStatus)) {
      const confirmed = await tx.assignment.count({
        where: { requestId: lead.id, status: { in: ["CONFIRMED", "ACTIVE", "COMPLETED"] } },
      });
      if (confirmed === 0) {
        throw new DomainError("Confirm a caregiver assignment before moving the lead to this status.");
      }
    }
    if ((data.toStatus === "CANCELLED" || data.toStatus === "UNFULFILLED") && !data.closedReason && !data.note) {
      throw new DomainError("Add a short reason when cancelling or closing a lead as unfulfilled.");
    }
    const closing = data.toStatus === "CANCELLED" || data.toStatus === "UNFULFILLED" || data.toStatus === "COMPLETED";
    await tx.serviceRequest.update({
      where: { id: lead.id },
      data: {
        status: data.toStatus,
        closedReason: closing ? (data.closedReason ?? data.note ?? null) : null,
        nextFollowUpAt: closing ? null : lead.nextFollowUpAt,
      },
    });
    await tx.statusChange.create({
      data: { requestId: lead.id, fromStatus: lead.status, toStatus: data.toStatus, note: data.note ?? data.closedReason, changedById: actor.id },
    });
    if (closing) {
      await tx.followUp.updateMany({ where: { requestId: lead.id, status: "PENDING" }, data: { status: "CANCELLED" } });
    }
    await audit(
      {
        actorId: actor.id,
        action: "lead.status",
        entityType: "ServiceRequest",
        entityId: lead.id,
        summary: `${lead.reference}: ${LEAD_STATUS_LABELS[lead.status]} → ${LEAD_STATUS_LABELS[data.toStatus]}`,
      },
      tx,
    );
  });
}

export async function updateLeadMeta(actor: Actor, input: z.input<typeof leadMetaSchema>) {
  assertCan(actor, "lead:write");
  const data = leadMetaSchema.parse(input);
  await getLeadForActor(actor, data.requestId);
  const lead = await db.serviceRequest.findUniqueOrThrow({ where: { id: data.requestId } });
  const reassigning = data.assignedToId !== lead.assignedToId;
  if (reassigning && !can(actor, "lead:assign")) throw new AuthorizationError("Only administrators can reassign leads.");
  if (data.assignedToId) {
    const user = await db.user.findFirst({ where: { id: data.assignedToId, isActive: true } });
    if (!user) throw new DomainError("That team member is not active.");
  }
  await db.$transaction(async (tx) => {
    await tx.serviceRequest.update({
      where: { id: lead.id },
      data: { priority: data.priority, source: data.source, assignedToId: data.assignedToId },
    });
    await audit(
      { actorId: actor.id, action: "lead.update", entityType: "ServiceRequest", entityId: lead.id, summary: `${lead.reference}: priority ${data.priority.toLowerCase()}, source ${data.source.toLowerCase()}${reassigning ? ", reassigned" : ""}` },
      tx,
    );
  });
}

export async function addLeadNote(actor: Actor, requestId: string, input: z.input<typeof noteSchema>) {
  assertCan(actor, "lead:write");
  const { body } = noteSchema.parse(input);
  await getLeadForActor(actor, requestId);
  await db.internalNote.create({ data: { requestId, authorId: actor.id, body } });
}

async function syncNextFollowUp(requestId: string) {
  const next = await db.followUp.findFirst({
    where: { requestId, status: "PENDING" },
    orderBy: { dueAt: "asc" },
    select: { dueAt: true },
  });
  await db.serviceRequest.update({ where: { id: requestId }, data: { nextFollowUpAt: next?.dueAt ?? null } });
}

export async function scheduleFollowUp(actor: Actor, input: z.input<typeof followUpSchema>) {
  assertCan(actor, "lead:write");
  const data = followUpSchema.parse(input);
  await getLeadForActor(actor, data.requestId);
  if (data.assignedToId && data.assignedToId !== actor.id && !can(actor, "lead:assign")) {
    throw new AuthorizationError("Only administrators can assign follow-ups to others.");
  }
  await db.followUp.create({
    data: {
      requestId: data.requestId,
      dueAt: new Date(data.dueAt),
      notes: data.notes,
      assignedToId: data.assignedToId ?? actor.id,
      createdById: actor.id,
    },
  });
  await syncNextFollowUp(data.requestId);
}

export async function completeFollowUp(actor: Actor, input: z.input<typeof followUpCompleteSchema>) {
  assertCan(actor, "lead:write");
  const data = followUpCompleteSchema.parse(input);
  const followUp = await db.followUp.findUnique({ where: { id: data.followUpId } });
  if (!followUp) throw new NotFoundError("Follow-up not found.");
  await getLeadForActor(actor, followUp.requestId);
  if (followUp.status !== "PENDING") throw new DomainError("This follow-up is already closed.");
  await db.$transaction(async (tx) => {
    await tx.followUp.update({
      where: { id: followUp.id },
      data: { status: "DONE", outcome: data.outcome, notes: [followUp.notes, data.notes].filter(Boolean).join("\n") || null, completedAt: new Date() },
    });
    await tx.serviceRequest.update({ where: { id: followUp.requestId }, data: { lastCallOutcome: data.outcome } });
  });
  await syncNextFollowUp(followUp.requestId);
}

export async function cancelFollowUp(actor: Actor, followUpId: string) {
  assertCan(actor, "lead:write");
  const followUp = await db.followUp.findUnique({ where: { id: followUpId } });
  if (!followUp) throw new NotFoundError("Follow-up not found.");
  await getLeadForActor(actor, followUp.requestId);
  if (followUp.status !== "PENDING") throw new DomainError("This follow-up is already closed.");
  await db.followUp.update({ where: { id: followUpId }, data: { status: "CANCELLED" } });
  await syncNextFollowUp(followUp.requestId);
}

/** Records a call outcome as a note and on the lead, moving NEW leads to CONTACTED when reached. */
export async function logCall(actor: Actor, input: z.input<typeof callLogSchema>) {
  assertCan(actor, "lead:write");
  const data = callLogSchema.parse(input);
  await getLeadForActor(actor, data.requestId);
  await db.$transaction(async (tx) => {
    const lead = await tx.serviceRequest.findUniqueOrThrow({ where: { id: data.requestId } });
    await tx.serviceRequest.update({ where: { id: lead.id }, data: { lastCallOutcome: data.outcome } });
    await tx.internalNote.create({
      data: {
        requestId: lead.id,
        authorId: actor.id,
        body: `Call: ${CALL_OUTCOME_LABELS[data.outcome]}${data.notes ? `. ${data.notes}` : ""}`,
      },
    });
    if (data.outcome === "REACHED" && lead.status === "NEW") {
      await tx.serviceRequest.update({ where: { id: lead.id }, data: { status: "CONTACTED" } });
      await tx.statusChange.create({
        data: { requestId: lead.id, fromStatus: "NEW", toStatus: "CONTACTED", changedById: actor.id, note: "Customer reached by phone" },
      });
    }
  });
}

export async function listFollowUps(actor: Actor, view: "due" | "upcoming" | "done") {
  const scope = leadScope(actor);
  const now = new Date();
  const where: Prisma.FollowUpWhereInput =
    view === "done"
      ? { status: { not: "PENDING" }, request: scope }
      : view === "due"
        ? { status: "PENDING", dueAt: { lte: now }, request: scope }
        : { status: "PENDING", dueAt: { gt: now }, request: scope };
  return db.followUp.findMany({
    where,
    orderBy: { dueAt: view === "done" ? "desc" : "asc" },
    take: 100,
    include: {
      request: { select: { id: true, reference: true, status: true, customer: { select: { name: true, phone: true } } } },
      assignedTo: { select: { name: true } },
    },
  });
}

export async function listActiveTeam(actor: Actor) {
  assertCan(actor, "lead:write");
  return db.user.findMany({ where: { isActive: true }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" } });
}
