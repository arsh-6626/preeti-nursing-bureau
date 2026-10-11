import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan, NotFoundError, type Actor } from "@/lib/auth/permissions";
import { phoneSchema } from "@/lib/validation/request";

export const contactInquirySchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(100),
    phone: phoneSchema,
    message: z
      .string()
      .trim()
      .max(600, "Please keep your message under 600 characters")
      .optional()
      .transform((v) => (v ? v : null)),
    preferredContact: z.enum(["PHONE", "WHATSAPP"]).default("PHONE"),
    contactConsent: z.literal("on", { error: "Please agree so we can call you back" }),
    website: z.string().max(0).optional(),
  })
  .strict();

export async function createContactInquiry(raw: unknown) {
  const data = contactInquirySchema.parse(raw);
  const inquiry = await db.contactInquiry.create({
    data: { name: data.name, phone: data.phone, message: data.message, preferredContact: data.preferredContact, contactConsent: true },
  });
  await audit({ actorId: null, action: "inquiry.create", entityType: "ContactInquiry", entityId: inquiry.id, summary: "Callback request received from contact page" });
}

export async function listOpenInquiries(actor: Actor) {
  assertCan(actor, "lead:create");
  return db.contactInquiry.findMany({ where: { handledAt: null }, orderBy: { createdAt: "asc" }, take: 50 });
}

export async function markInquiryHandled(actor: Actor, id: string) {
  assertCan(actor, "lead:create");
  const inquiry = await db.contactInquiry.findUnique({ where: { id } });
  if (!inquiry) throw new NotFoundError("Callback request not found.");
  await db.$transaction(async (tx) => {
    await tx.contactInquiry.update({ where: { id }, data: { handledAt: new Date(), handledById: actor.id } });
    await audit({ actorId: actor.id, action: "inquiry.handled", entityType: "ContactInquiry", entityId: id, summary: "Callback request marked as handled" }, tx);
  });
}
