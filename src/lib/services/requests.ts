import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { LeadSource } from "@/generated/prisma/enums";
import { db, type Tx } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan, type Actor } from "@/lib/auth/permissions";
import { parseDateOnly, todayInIndia, addDays } from "@/lib/domain/dates";
import { generatePublicToken, generateReference, hashToken, isPublicTokenFormat } from "@/lib/domain/reference";
import { fromDbShift, toDbShift } from "@/lib/domain/shift";
import { careRequestSchema, type CareRequest } from "@/lib/validation/request";
import { leadSourceSchema } from "@/lib/validation/admin";
import { getSettings } from "./settings";

export type SubmitResult =
  | { ok: true; reference: string; token: string; duplicate: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const MAX_START_DAYS_AHEAD = 180;

/** Validation that depends on the database (active service, active area, date window). */
async function validateAgainstCatalogue(
  data: CareRequest,
  options: { allowPastStart?: boolean } = {},
): Promise<Record<string, string>> {
  const errors: Record<string, string> = {};
  const settings = await getSettings();
  if (data.serviceCategoryId) {
    const service = await db.serviceCategory.findFirst({ where: { id: data.serviceCategoryId, isActive: true } });
    if (!service) errors.serviceCategoryId = "This service is not currently offered. Please choose another.";
  } else if (!settings.allowOtherService) {
    errors.serviceCategoryId = "Please choose one of the listed services.";
  }
  if (data.serviceAreaId) {
    const area = await db.serviceArea.findFirst({ where: { id: data.serviceAreaId, isActive: true } });
    if (!area) errors.serviceAreaId = "This area is not currently listed. Choose another or type your locality.";
  }
  const start = parseDateOnly(data.startDate);
  const today = todayInIndia();
  if (start < today && !options.allowPastStart) errors.startDate = "The start date cannot be in the past.";
  if (start > addDays(today, MAX_START_DAYS_AHEAD)) errors.startDate = "Choose a start date within the next 6 months.";
  return errors;
}

async function findOrCreateCustomer(
  tx: Tx,
  input: { name: string; phone: string; email?: string | null; relationship?: string | null; preferredContact: "PHONE" | "WHATSAPP" | "EMAIL" },
) {
  const existing = await tx.customer.findFirst({ where: { phone: input.phone }, orderBy: { createdAt: "asc" } });
  if (existing) {
    // Fill gaps only; never overwrite what the bureau already has on file.
    return tx.customer.update({
      where: { id: existing.id },
      data: {
        email: existing.email ?? input.email ?? null,
        relationship: existing.relationship ?? input.relationship ?? null,
      },
    });
  }
  return tx.customer.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      relationship: input.relationship ?? null,
      preferredContact: input.preferredContact,
    },
  });
}

async function createRequestRecord(
  tx: Tx,
  data: CareRequest,
  options: { source: LeadSource; actorId: string | null; idempotencyKey: string | null; followUpHours: number },
) {
  const customer = await findOrCreateCustomer(tx, {
    name: data.customerName,
    phone: data.phone,
    email: data.email,
    relationship: data.relationship,
    preferredContact: data.preferredContact,
  });
  const token = generatePublicToken();
  const now = new Date();
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = generateReference();
    const clash = await tx.serviceRequest.findUnique({ where: { reference }, select: { id: true } });
    if (clash) continue;
    const request = await tx.serviceRequest.create({
      data: {
        reference,
        publicTokenHash: hashToken(token),
        idempotencyKey: options.idempotencyKey,
        customerId: customer.id,
        serviceCategoryId: data.serviceCategoryId ?? null,
        otherServiceText: data.serviceCategoryId ? null : (data.otherServiceText ?? null),
        assistanceType: data.assistanceType ?? null,
        mobility: data.mobility,
        careDescription: data.careDescription,
        preferredGender: data.preferredGender,
        nursingSkillsRequired: data.nursingSkillsRequired ?? null,
        additionalRequirements: data.additionalRequirements ?? null,
        shiftType: toDbShift(data.shiftType),
        shiftTiming: data.shiftTiming,
        startDate: parseDateOnly(data.startDate),
        durationValue: data.durationValue,
        durationUnit: data.durationUnit,
        arrangementType: data.arrangementType,
        serviceAreaId: data.serviceAreaId ?? null,
        city: data.city,
        locality: data.locality,
        pincode: data.pincode,
        address: data.address ?? null,
        contactConsent: true,
        consentAt: now,
        source: options.source,
        status: "NEW",
        nextFollowUpAt: new Date(now.getTime() + options.followUpHours * 3_600_000),
      },
    });
    await tx.statusChange.create({
      data: { requestId: request.id, fromStatus: null, toStatus: "NEW", changedById: options.actorId, note: "Request received" },
    });
    return { request, token };
  }
  throw new Error("Could not allocate a unique reference number");
}

/**
 * A repeated submission gets its own status link. Earlier links keep working,
 * so a family never loses a link they already bookmarked or shared.
 */
async function issueAdditionalLink(requestId: string, reference: string): Promise<SubmitResult> {
  const token = generatePublicToken();
  await db.requestStatusToken.create({ data: { requestId, tokenHash: hashToken(token) } });
  return { ok: true, reference, token, duplicate: true };
}

/**
 * Public submission. Validates on the server, enforces idempotency so a
 * double-tap or retry never creates a second request, and never confirms a
 * booking: the result is only a reference number and a status link.
 */
export async function submitPublicRequest(raw: unknown): Promise<SubmitResult> {
  const parsed = careRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please check the highlighted answers.", fieldErrors };
  }
  const data = parsed.data;
  if (data.website) return { ok: false, error: "Submission rejected." };

  const existing = await db.serviceRequest.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
  if (existing) return issueAdditionalLink(existing.id, existing.reference);

  const catalogueErrors = await validateAgainstCatalogue(data);
  if (Object.keys(catalogueErrors).length > 0) {
    return { ok: false, error: "Please check the highlighted answers.", fieldErrors: catalogueErrors };
  }

  const settings = await getSettings();
  try {
    const { request, token } = await db.$transaction((tx) =>
      createRequestRecord(tx, data, {
        source: "WEBSITE",
        actorId: null,
        idempotencyKey: data.idempotencyKey,
        followUpHours: settings.followUpDefaultHours,
      }),
    );
    await audit({ actorId: null, action: "request.submit", entityType: "ServiceRequest", entityId: request.id, summary: `Website request ${request.reference} received` });
    return { ok: true, reference: request.reference, token, duplicate: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const again = await db.serviceRequest.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
      if (again) return issueAdditionalLink(again.id, again.reference);
    }
    throw error;
  }
}

/** Admin/staff entry of a lead received by phone, WhatsApp or referral. */
export async function createManualLead(actor: Actor, raw: unknown) {
  assertCan(actor, "lead:create");
  const { source: rawSource, ...rest } = (raw ?? {}) as Record<string, unknown>;
  const source = leadSourceSchema.parse(rawSource);
  const parsed = careRequestSchema.safeParse(rest);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".") || "form"] ??= issue.message;
    return { ok: false as const, error: "Please check the highlighted fields.", fieldErrors };
  }
  const catalogueErrors = await validateAgainstCatalogue(parsed.data, { allowPastStart: true });
  if (Object.keys(catalogueErrors).length > 0) {
    return { ok: false as const, error: "Please check the highlighted fields.", fieldErrors: catalogueErrors };
  }
  const duplicate = await db.serviceRequest.findUnique({ where: { idempotencyKey: parsed.data.idempotencyKey } });
  if (duplicate) return { ok: true as const, id: duplicate.id, reference: duplicate.reference };
  const settings = await getSettings();
  const { request } = await db.$transaction(async (tx) => {
    const created = await createRequestRecord(tx, parsed.data, {
      source,
      actorId: actor.id,
      idempotencyKey: parsed.data.idempotencyKey,
      followUpHours: settings.followUpDefaultHours,
    });
    if (actor.role === "STAFF") {
      await tx.serviceRequest.update({ where: { id: created.request.id }, data: { assignedToId: actor.id } });
    }
    await audit(
      { actorId: actor.id, action: "request.create_manual", entityType: "ServiceRequest", entityId: created.request.id, summary: `Created lead ${created.request.reference} from ${source.toLowerCase()}` },
      tx,
    );
    return created;
  });
  return { ok: true as const, id: request.id, reference: request.reference };
}

/** Limited, customer-safe view of a request, reachable only with the unguessable token. */
export async function getPublicRequestStatus(token: string) {
  if (!isPublicTokenFormat(token)) return null;
  const tokenHash = hashToken(token);
  const extra = await db.requestStatusToken.findUnique({ where: { tokenHash }, select: { requestId: true } });
  const request = await db.serviceRequest.findUnique({
    where: extra ? { id: extra.requestId } : { publicTokenHash: tokenHash },
    select: {
      reference: true,
      status: true,
      createdAt: true,
      shiftType: true,
      startDate: true,
      city: true,
      locality: true,
      otherServiceText: true,
      serviceCategory: { select: { name: true } },
    },
  });
  if (!request) return null;
  return {
    reference: request.reference,
    status: request.status,
    createdAt: request.createdAt,
    shiftType: fromDbShift(request.shiftType),
    startDate: request.startDate,
    area: `${request.locality}, ${request.city}`,
    serviceName: request.serviceCategory?.name ?? request.otherServiceText ?? "Other care",
  };
}
