import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { Actor } from "@/lib/auth/permissions";

const TABLES = [
  "AuditLog", "CommissionRecord", "Payment", "FinancialAdjustment", "AssignmentEvent", "Assignment",
  "VerificationRecord", "CaregiverAvailability", "CaregiverArea", "CaregiverService", "CaregiverLivingArea", "LivingArea", "StaffFile", "InternalNote",
  "FollowUp", "StatusChange", "RequestStatusToken", "ServiceRequest", "Customer", "Caregiver", "PricingRule", "ServiceCategory",
  "ServiceArea", "ContactInquiry", "ContentPage", "BusinessSettings", "Session", "RateLimit", "User",
];

export async function resetDb() {
  await db.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);
}

export async function makeUser(role: "ADMIN" | "STAFF", email = `${role.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}@test.local`): Promise<Actor> {
  const user = await db.user.create({ data: { email, name: `${role} Tester`, role, passwordHash: await hashPassword("test-password-123") } });
  return { id: user.id, role: user.role, name: user.name, email: user.email };
}

export async function makeCatalogue() {
  const gda = await db.serviceCategory.create({
    data: { name: "General Duty Assistant", slug: "general-duty-assistant", summary: "Daily care", description: "Daily care support at home.", sortOrder: 10 },
  });
  const nursing = await db.serviceCategory.create({
    data: { name: "Home Nursing", slug: "home-nursing", summary: "Nursing", description: "Qualified nursing at home.", isNursing: true, sortOrder: 20 },
  });
  const area = await db.serviceArea.create({ data: { city: "Noida", locality: "Sector 62", pincode: "201309" } });
  const otherArea = await db.serviceArea.create({ data: { city: "Gurugram", locality: "DLF Phase 2", pincode: "122002" } });
  await db.businessSettings.create({ data: { id: 1 } });
  return { gda, nursing, area, otherArea };
}

export function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export function validRequestPayload(overrides: Record<string, unknown> = {}) {
  return {
    serviceCategoryId: "",
    otherServiceText: "",
    assistanceType: "Help after hip surgery",
    mobility: "NEEDS_ASSISTANCE",
    careDescription: "My father needs help with walking, bathing and medicines after surgery.",
    preferredGender: "NO_PREFERENCE",
    nursingSkillsRequired: "",
    additionalRequirements: "",
    shiftType: "12_HOURS",
    shiftTiming: "DAY",
    startDate: futureDate(3),
    durationValue: 2,
    durationUnit: "WEEKS",
    arrangementType: "TEMPORARY",
    serviceAreaId: "",
    city: "Noida",
    locality: "Sector 62",
    pincode: "201309",
    address: "",
    customerName: "Ritika Malhotra",
    phone: "98100 23456",
    email: "",
    relationship: "Daughter",
    preferredContact: "WHATSAPP",
    contactConsent: true,
    idempotencyKey: crypto.randomUUID(),
    ...overrides,
  };
}
