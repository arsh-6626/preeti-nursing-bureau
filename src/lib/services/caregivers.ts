import "server-only";
import type { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db, type Tx } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan, can, DomainError, NotFoundError, type Actor } from "@/lib/auth/permissions";
import { parseDateOnly } from "@/lib/domain/dates";
import { parseShift, toDbShift, type ShiftType } from "@/lib/domain/shift";
import { VERIFICATION_STATUS_LABELS, VERIFICATION_TYPE_LABELS } from "@/lib/domain/labels";
import {
  availabilitySchema,
  caregiverSchema,
  noteSchema,
  overallVerificationSchema,
  verificationSchema,
  verificationUpdateSchema,
} from "@/lib/validation/admin";

export const CAREGIVERS_PAGE_SIZE = 20;

export type CaregiverFilters = {
  q?: string;
  service?: string;
  area?: string;
  shift?: ShiftType;
  availability?: "AVAILABLE" | "ON_ASSIGNMENT" | "UNAVAILABLE";
  verification?: "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
  archived?: boolean;
  page?: number;
};

export async function listCaregivers(actor: Actor, filters: CaregiverFilters) {
  assertCan(actor, "caregiver:read");
  const and: Prisma.CaregiverWhereInput[] = [{ archivedAt: filters.archived ? { not: null } : null }];
  if (filters.q) {
    const digits = filters.q.replace(/\D/g, "");
    and.push({
      OR: [
        { fullName: { contains: filters.q, mode: "insensitive" } },
        { code: { contains: filters.q.toUpperCase() } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-10) } }] : []),
      ],
    });
  }
  if (filters.service) and.push({ services: { some: { serviceCategoryId: filters.service } } });
  if (filters.area) and.push({ areas: { some: { serviceAreaId: filters.area } } });
  if (filters.shift) and.push({ supportedShifts: { has: toDbShift(filters.shift) } });
  if (filters.availability) and.push({ availabilityStatus: filters.availability });
  if (filters.verification) and.push({ verificationStatus: filters.verification });
  const where = { AND: and };
  const page = filters.page ?? 1;
  const [total, rows] = await Promise.all([
    db.caregiver.count({ where }),
    db.caregiver.findMany({
      where,
      orderBy: [{ fullName: "asc" }],
      skip: (page - 1) * CAREGIVERS_PAGE_SIZE,
      take: CAREGIVERS_PAGE_SIZE,
      select: {
        id: true,
        code: true,
        fullName: true,
        phone: true,
        gender: true,
        experienceYears: true,
        availabilityStatus: true,
        verificationStatus: true,
        supportedShifts: true,
        affiliation: true,
        services: { select: { serviceCategory: { select: { name: true } } } },
        areas: { select: { serviceArea: { select: { city: true, locality: true } } } },
      },
    }),
  ]);
  return { total, rows, page, pageCount: Math.max(1, Math.ceil(total / CAREGIVERS_PAGE_SIZE)) };
}

export async function getCaregiverDetail(actor: Actor, id: string) {
  assertCan(actor, "caregiver:read");
  const showVerification = can(actor, "caregiver:verification");
  const showPay = can(actor, "caregiver:compensation");
  const caregiver = await db.caregiver.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      fullName: true,
      phone: true,
      email: true,
      photoUrl: true,
      gender: true,
      skills: true,
      qualifications: true,
      experienceYears: true,
      languages: true,
      availabilityStatus: true,
      supportedShifts: true,
      payout12h: showPay,
      payout24h: showPay,
      payoutPeriod: showPay,
      affiliation: true,
      agencyName: true,
      verificationStatus: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
      services: { select: { serviceCategoryId: true, serviceCategory: { select: { name: true } } } },
      areas: { select: { serviceAreaId: true, serviceArea: { select: { city: true, locality: true } } } },
      availability: { orderBy: { startDate: "desc" } },
      assignments: {
        orderBy: { startDate: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          shiftType: true,
          startDate: true,
          endDate: true,
          request: { select: { id: true, reference: true, customer: { select: { name: true } } } },
        },
      },
    },
  });
  if (!caregiver) throw new NotFoundError("Caregiver not found.");
  if (!showVerification) return { ...caregiver, verifications: undefined, notes: undefined };
  const [verifications, notes] = await Promise.all([
    db.verificationRecord.findMany({ where: { caregiverId: id }, orderBy: { createdAt: "desc" }, include: { reviewedBy: { select: { name: true } } } }),
    db.internalNote.findMany({ where: { caregiverId: id }, orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } }),
  ]);
  return { ...caregiver, verifications, notes };
}

async function nextCaregiverCode(tx: Tx): Promise<string> {
  // Serialise code allocation so concurrent creates cannot collide.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(72101)`;
  const last = await tx.caregiver.findFirst({ orderBy: { code: "desc" }, select: { code: true } });
  const n = last ? Number(last.code.replace(/\D/g, "")) + 1 : 1;
  return `CG-${String(n).padStart(4, "0")}`;
}

type CaregiverInput = z.input<typeof caregiverSchema>;

function caregiverData(data: z.output<typeof caregiverSchema>, includePay: boolean) {
  return {
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    photoUrl: data.photoUrl,
    gender: data.gender,
    skills: data.skills,
    qualifications: data.qualifications,
    experienceYears: data.experienceYears,
    languages: data.languages,
    availabilityStatus: data.availabilityStatus,
    supportedShifts: data.supportedShifts.map(toDbShift),
    affiliation: data.affiliation,
    agencyName: data.affiliation === "AGENCY_MANAGED" || data.affiliation === "OTHER" ? data.agencyName : null,
    ...(includePay ? { payout12h: data.payout12h, payout24h: data.payout24h, payoutPeriod: data.payoutPeriod } : {}),
  };
}

export async function createCaregiver(actor: Actor, input: CaregiverInput) {
  assertCan(actor, "caregiver:write");
  const data = caregiverSchema.parse(input);
  return db.$transaction(async (tx) => {
    const code = await nextCaregiverCode(tx);
    const caregiver = await tx.caregiver.create({
      data: {
        ...caregiverData(data, can(actor, "caregiver:compensation")),
        code,
        // A new profile is never verified automatically.
        verificationStatus: "NOT_STARTED",
        services: { create: data.serviceCategoryIds.map((serviceCategoryId) => ({ serviceCategoryId })) },
        areas: { create: data.areaIds.map((serviceAreaId) => ({ serviceAreaId })) },
      },
    });
    await audit(
      { actorId: actor.id, action: "caregiver.create", entityType: "Caregiver", entityId: caregiver.id, summary: `Created caregiver ${code} (${caregiver.fullName})` },
      tx,
    );
    return caregiver;
  });
}

export async function updateCaregiver(actor: Actor, id: string, input: CaregiverInput) {
  assertCan(actor, "caregiver:write");
  const data = caregiverSchema.parse(input);
  return db.$transaction(async (tx) => {
    const existing = await tx.caregiver.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Caregiver not found.");
    await tx.caregiverService.deleteMany({ where: { caregiverId: id } });
    await tx.caregiverArea.deleteMany({ where: { caregiverId: id } });
    const caregiver = await tx.caregiver.update({
      where: { id },
      data: {
        ...caregiverData(data, can(actor, "caregiver:compensation")),
        services: { create: data.serviceCategoryIds.map((serviceCategoryId) => ({ serviceCategoryId })) },
        areas: { create: data.areaIds.map((serviceAreaId) => ({ serviceAreaId })) },
      },
    });
    await audit(
      { actorId: actor.id, action: "caregiver.update", entityType: "Caregiver", entityId: id, summary: `Updated caregiver ${caregiver.code}` },
      tx,
    );
    return caregiver;
  });
}

/** Archiving hides a caregiver from matching but keeps every historical record. */
export async function setCaregiverArchived(actor: Actor, id: string, archived: boolean) {
  assertCan(actor, "caregiver:write");
  await db.$transaction(async (tx) => {
    if (archived) {
      const open = await tx.assignment.count({
        where: { caregiverId: id, status: { in: ["PROPOSED", "AWAITING_CONFIRMATION", "CONFIRMED", "ACTIVE"] } },
      });
      if (open > 0) throw new DomainError("This caregiver has open assignments. Complete, cancel or replace them first.");
    }
    const c = await tx.caregiver.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } });
    await audit(
      { actorId: actor.id, action: archived ? "caregiver.archive" : "caregiver.restore", entityType: "Caregiver", entityId: id, summary: `${archived ? "Archived" : "Restored"} caregiver ${c.code}` },
      tx,
    );
  });
}

export async function addVerificationRecord(actor: Actor, input: z.input<typeof verificationSchema>) {
  assertCan(actor, "caregiver:verification");
  const data = verificationSchema.parse(input);
  await db.$transaction(async (tx) => {
    const caregiver = await tx.caregiver.findUnique({ where: { id: data.caregiverId } });
    if (!caregiver) throw new NotFoundError("Caregiver not found.");
    const reviewed = data.status === "VERIFIED" || data.status === "REJECTED";
    const record = await tx.verificationRecord.create({
      data: {
        caregiverId: data.caregiverId,
        type: data.type,
        status: data.status,
        documentRef: data.documentRef,
        expiresAt: data.expiresAt ? parseDateOnly(data.expiresAt) : null,
        notes: data.notes,
        verifiedAt: reviewed ? new Date() : null,
        reviewedById: reviewed ? actor.id : null,
      },
    });
    await audit(
      {
        actorId: actor.id,
        action: "verification.create",
        entityType: "VerificationRecord",
        entityId: record.id,
        summary: `${caregiver.code}: ${VERIFICATION_TYPE_LABELS[data.type]} recorded as ${VERIFICATION_STATUS_LABELS[data.status]}`,
      },
      tx,
    );
  });
}

export async function updateVerificationRecord(actor: Actor, input: z.input<typeof verificationUpdateSchema>) {
  assertCan(actor, "caregiver:verification");
  const data = verificationUpdateSchema.parse(input);
  await db.$transaction(async (tx) => {
    const record = await tx.verificationRecord.findUnique({ where: { id: data.recordId }, include: { caregiver: true } });
    if (!record) throw new NotFoundError("Verification record not found.");
    const reviewed = data.status === "VERIFIED" || data.status === "REJECTED";
    await tx.verificationRecord.update({
      where: { id: record.id },
      data: {
        status: data.status,
        documentRef: data.documentRef,
        expiresAt: data.expiresAt ? parseDateOnly(data.expiresAt) : null,
        notes: data.notes,
        verifiedAt: reviewed ? new Date() : record.verifiedAt,
        reviewedById: reviewed ? actor.id : record.reviewedById,
      },
    });
    await audit(
      {
        actorId: actor.id,
        action: "verification.update",
        entityType: "VerificationRecord",
        entityId: record.id,
        summary: `${record.caregiver.code}: ${VERIFICATION_TYPE_LABELS[record.type]} ${VERIFICATION_STATUS_LABELS[record.status]} → ${VERIFICATION_STATUS_LABELS[data.status]}`,
      },
      tx,
    );
  });
}

/**
 * Sets the caregiver's overall verification status. VERIFIED requires at least
 * one verified identity record and no rejected or expired records.
 */
export async function setOverallVerification(actor: Actor, input: z.input<typeof overallVerificationSchema>) {
  assertCan(actor, "caregiver:verification");
  const data = overallVerificationSchema.parse(input);
  await db.$transaction(async (tx) => {
    const caregiver = await tx.caregiver.findUnique({ where: { id: data.caregiverId }, include: { verifications: true } });
    if (!caregiver) throw new NotFoundError("Caregiver not found.");
    if (data.status === "VERIFIED") {
      const today = new Date();
      const identity = caregiver.verifications.some((v) => v.type === "IDENTITY" && v.status === "VERIFIED");
      const problem = caregiver.verifications.some(
        (v) => v.status === "REJECTED" || v.status === "EXPIRED" || (v.expiresAt !== null && v.expiresAt < today),
      );
      if (!identity) throw new DomainError("Record a verified identity check before marking the caregiver verified.");
      if (problem) throw new DomainError("Resolve rejected or expired verification records first.");
    }
    await tx.caregiver.update({ where: { id: caregiver.id }, data: { verificationStatus: data.status } });
    await audit(
      {
        actorId: actor.id,
        action: "caregiver.verification_status",
        entityType: "Caregiver",
        entityId: caregiver.id,
        summary: `${caregiver.code}: overall verification ${VERIFICATION_STATUS_LABELS[caregiver.verificationStatus]} → ${VERIFICATION_STATUS_LABELS[data.status]}`,
      },
      tx,
    );
  });
}

export async function addAvailability(actor: Actor, input: z.input<typeof availabilitySchema>) {
  assertCan(actor, "caregiver:write");
  const data = availabilitySchema.parse(input);
  const caregiver = await db.caregiver.findUnique({ where: { id: data.caregiverId } });
  if (!caregiver) throw new NotFoundError("Caregiver not found.");
  await db.caregiverAvailability.create({
    data: {
      caregiverId: data.caregiverId,
      kind: data.kind,
      startDate: parseDateOnly(data.startDate),
      endDate: data.endDate ? parseDateOnly(data.endDate) : null,
      reason: data.reason,
    },
  });
}

export async function removeAvailability(actor: Actor, availabilityId: string) {
  assertCan(actor, "caregiver:write");
  await db.caregiverAvailability.delete({ where: { id: availabilityId } }).catch(() => {
    throw new NotFoundError("Availability entry not found.");
  });
}

export async function addCaregiverNote(actor: Actor, caregiverId: string, input: z.input<typeof noteSchema>) {
  assertCan(actor, "caregiver:verification");
  const { body } = noteSchema.parse(input);
  await db.internalNote.create({ data: { caregiverId, authorId: actor.id, body } });
}

export function parseCaregiverFilters(params: Record<string, string | string[] | undefined>): CaregiverFilters {
  const get = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const uuid = (v?: string) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : undefined);
  const availability = get("availability");
  const verification = get("verification");
  return {
    q: get("q")?.slice(0, 100) || undefined,
    service: uuid(get("service")),
    area: uuid(get("area")),
    shift: parseShift(get("shift")),
    availability: availability === "AVAILABLE" || availability === "ON_ASSIGNMENT" || availability === "UNAVAILABLE" ? availability : undefined,
    verification:
      verification && ["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"].includes(verification)
        ? (verification as CaregiverFilters["verification"])
        : undefined,
    archived: get("archived") === "1",
    page: Math.max(1, Math.min(10_000, Number(get("page")) || 1)),
  };
}
