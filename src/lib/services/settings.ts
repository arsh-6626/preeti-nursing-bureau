import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan, DomainError, NotFoundError, type Actor } from "@/lib/auth/permissions";
import { toDbShift } from "@/lib/domain/shift";
import {
  businessSettingsSchema,
  commissionPolicySchema,
  contentPageSchema,
  pricingRuleSchema,
  serviceAreaSchema,
  serviceCategorySchema,
} from "@/lib/validation/admin";

/** Returns the singleton settings row, creating it with defaults if missing. */
export async function getSettings() {
  return db.businessSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export type PublicSettings = {
  businessName: string;
  logoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  businessHours: string | null;
  address: string | null;
  regionLabel: string;
  heroHeadline: string;
  heroSubtext: string;
  aboutText: string;
  consentText: string;
  whatsappPrefill: string;
  allowOtherService: boolean;
};

/** Settings safe to expose on public pages (no commission policy). */
export async function getPublicSettings(): Promise<PublicSettings> {
  const s = await getSettings();
  return {
    businessName: s.businessName,
    logoUrl: s.logoUrl,
    phone: s.phone ?? process.env.NEXT_PUBLIC_CONTACT_PHONE ?? null,
    whatsapp: s.whatsapp ?? process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? null,
    email: s.email,
    businessHours: s.businessHours,
    address: s.address,
    regionLabel: s.regionLabel,
    heroHeadline: s.heroHeadline,
    heroSubtext: s.heroSubtext,
    aboutText: s.aboutText,
    consentText: s.consentText,
    whatsappPrefill: s.whatsappPrefill,
    allowOtherService: s.allowOtherService,
  };
}

export async function updateBusinessSettings(actor: Actor, input: z.input<typeof businessSettingsSchema>) {
  assertCan(actor, "settings:write");
  const data = businessSettingsSchema.parse(input);
  await getSettings();
  await db.$transaction(async (tx) => {
    await tx.businessSettings.update({ where: { id: 1 }, data });
    await audit(
      { actorId: actor.id, action: "settings.update", entityType: "BusinessSettings", entityId: "1", summary: "Updated business profile and website content" },
      tx,
    );
  });
}

export async function updateCommissionPolicy(actor: Actor, input: z.input<typeof commissionPolicySchema>) {
  assertCan(actor, "settings:write");
  const data = commissionPolicySchema.parse(input);
  await getSettings();
  await db.$transaction(async (tx) => {
    const before = await tx.businessSettings.findUniqueOrThrow({ where: { id: 1 } });
    await tx.businessSettings.update({ where: { id: 1 }, data });
    await audit(
      {
        actorId: actor.id,
        action: "settings.commission_policy",
        entityType: "BusinessSettings",
        entityId: "1",
        summary: `Commission policy set to ${data.commissionMethod === "FIXED" ? `fixed ₹${data.commissionFixedAmount}` : `${data.commissionRate}% of ${data.commissionBasis === "CUSTOMER_AMOUNT" ? "customer amount" : "caregiver payout"}`}, recognised ${data.commissionRecognition === "ON_CONFIRMATION" ? "on confirmation" : "on completion"}`,
        metadata: {
          before: {
            method: before.commissionMethod,
            rate: before.commissionRate.toString(),
            fixed: before.commissionFixedAmount.toString(),
            basis: before.commissionBasis,
            recognition: before.commissionRecognition,
          },
        },
      },
      tx,
    );
  });
}

// ---------------------------------------------------------------------------
// Service categories
// ---------------------------------------------------------------------------

export async function listActiveServices() {
  return db.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      summary: true,
      description: true,
      imageUrl: true,
      requiredSkills: true,
      indicativePrice: true,
      notes: true,
      isNursing: true,
    },
  });
}

export async function getActiveServiceBySlug(slug: string) {
  return db.serviceCategory.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      summary: true,
      description: true,
      imageUrl: true,
      requiredSkills: true,
      indicativePrice: true,
      notes: true,
      isNursing: true,
    },
  });
}

export async function listAllServices(actor: Actor) {
  assertCan(actor, "settings:write");
  return db.serviceCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { pricingRules: true, _count: { select: { requests: true, caregivers: true } } },
  });
}

export async function saveServiceCategory(
  actor: Actor,
  id: string | null,
  input: z.input<typeof serviceCategorySchema>,
) {
  assertCan(actor, "settings:write");
  const data = serviceCategorySchema.parse(input);
  const clash = await db.serviceCategory.findFirst({ where: { slug: data.slug, NOT: id ? { id } : undefined } });
  if (clash) throw new DomainError("Another service already uses this web address (slug).");
  return db.$transaction(async (tx) => {
    const saved = id
      ? await tx.serviceCategory.update({ where: { id }, data })
      : await tx.serviceCategory.create({
          data: { ...data, sortOrder: ((await tx.serviceCategory.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0) + 10 },
        });
    await audit(
      { actorId: actor.id, action: id ? "service.update" : "service.create", entityType: "ServiceCategory", entityId: saved.id, summary: `${id ? "Updated" : "Created"} service "${saved.name}"` },
      tx,
    );
    return saved;
  });
}

export async function setServiceActive(actor: Actor, id: string, isActive: boolean) {
  assertCan(actor, "settings:write");
  await db.$transaction(async (tx) => {
    const s = await tx.serviceCategory.update({ where: { id }, data: { isActive } });
    await audit(
      { actorId: actor.id, action: isActive ? "service.activate" : "service.deactivate", entityType: "ServiceCategory", entityId: id, summary: `${isActive ? "Activated" : "Deactivated"} service "${s.name}"` },
      tx,
    );
  });
}

/** Moves a service one place up or down in the public ordering. */
export async function moveService(actor: Actor, id: string, direction: "up" | "down") {
  assertCan(actor, "settings:write");
  await db.$transaction(async (tx) => {
    const all = await tx.serviceCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true } });
    const index = all.findIndex((s) => s.id === id);
    if (index < 0) throw new NotFoundError("Service not found.");
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= all.length) return;
    [all[index], all[swapWith]] = [all[swapWith], all[index]];
    for (const [i, s] of all.entries()) {
      await tx.serviceCategory.update({ where: { id: s.id }, data: { sortOrder: (i + 1) * 10 } });
    }
  });
}

// ---------------------------------------------------------------------------
// Service areas
// ---------------------------------------------------------------------------

export async function listActiveAreas() {
  return db.serviceArea.findMany({
    where: { isActive: true },
    orderBy: [{ city: "asc" }, { sortOrder: "asc" }, { locality: "asc" }],
    select: { id: true, city: true, locality: true, pincode: true },
  });
}

export async function listAllAreas(actor: Actor) {
  assertCan(actor, "caregiver:read");
  return db.serviceArea.findMany({ orderBy: [{ city: "asc" }, { locality: "asc" }] });
}

export async function createServiceArea(actor: Actor, input: z.input<typeof serviceAreaSchema>) {
  assertCan(actor, "settings:write");
  const data = serviceAreaSchema.parse(input);
  const exists = await db.serviceArea.findUnique({ where: { city_locality: { city: data.city, locality: data.locality } } });
  if (exists) throw new DomainError("This locality is already listed for that city.");
  await db.$transaction(async (tx) => {
    const area = await tx.serviceArea.create({ data });
    await audit({ actorId: actor.id, action: "area.create", entityType: "ServiceArea", entityId: area.id, summary: `Added service area ${area.locality}, ${area.city}` }, tx);
  });
}

export async function setAreaActive(actor: Actor, id: string, isActive: boolean) {
  assertCan(actor, "settings:write");
  await db.$transaction(async (tx) => {
    const area = await tx.serviceArea.update({ where: { id }, data: { isActive } });
    await audit({ actorId: actor.id, action: isActive ? "area.activate" : "area.deactivate", entityType: "ServiceArea", entityId: id, summary: `${isActive ? "Activated" : "Deactivated"} ${area.locality}, ${area.city}` }, tx);
  });
}

// ---------------------------------------------------------------------------
// Pricing (by service and shift type)
// ---------------------------------------------------------------------------

export async function upsertPricingRule(actor: Actor, input: z.input<typeof pricingRuleSchema>) {
  assertCan(actor, "settings:write");
  const data = pricingRuleSchema.parse(input);
  const shiftType = toDbShift(data.shiftType);
  await db.$transaction(async (tx) => {
    const rule = await tx.pricingRule.upsert({
      where: { serviceCategoryId_shiftType: { serviceCategoryId: data.serviceCategoryId, shiftType } },
      update: { ratePeriod: data.ratePeriod, customerRate: data.customerRate, caregiverPayout: data.caregiverPayout, notes: data.notes },
      create: { ...data, shiftType },
    });
    await audit(
      {
        actorId: actor.id,
        action: "pricing.upsert",
        entityType: "PricingRule",
        entityId: rule.id,
        summary: `Set ${data.shiftType === "12_HOURS" ? "12-hour" : "24-hour"} pricing: customer ₹${data.customerRate}, caregiver ₹${data.caregiverPayout} ${data.ratePeriod === "PER_DAY" ? "per day" : "per month"}`,
      },
      tx,
    );
  });
}

export async function getPricingFor(serviceCategoryId: string | null) {
  if (!serviceCategoryId) return [];
  return db.pricingRule.findMany({ where: { serviceCategoryId } });
}

// ---------------------------------------------------------------------------
// Content pages
// ---------------------------------------------------------------------------

export const CONTENT_PAGES = [
  { slug: "privacy-policy", title: "Privacy Policy" },
  { slug: "terms-of-service", title: "Terms of Service" },
  { slug: "cancellation-refund-policy", title: "Cancellation and Refund Policy" },
  { slug: "service-limitations", title: "Service Limitations and Emergency Disclaimer" },
] as const;

export async function getContentPage(slug: string) {
  return db.contentPage.findUnique({ where: { slug } });
}

export async function listContentPages(actor: Actor) {
  assertCan(actor, "settings:write");
  return db.contentPage.findMany({ orderBy: { title: "asc" } });
}

export async function saveContentPage(actor: Actor, input: z.input<typeof contentPageSchema>) {
  assertCan(actor, "settings:write");
  const data = contentPageSchema.parse(input);
  await db.$transaction(async (tx) => {
    const page = await tx.contentPage.upsert({ where: { slug: data.slug }, update: data, create: data });
    await audit({ actorId: actor.id, action: "content.update", entityType: "ContentPage", entityId: page.id, summary: `Updated page "${page.title}"` }, tx);
  });
}
