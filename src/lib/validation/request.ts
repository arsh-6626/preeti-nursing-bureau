/**
 * Shared validation for the public care request. Used by the multi-step form
 * on the client and re-run on the server before anything is persisted.
 */
import { z } from "zod";
import { shiftTypeSchema } from "@/lib/domain/shift";
import { isValidDateOnly } from "@/lib/domain/dates";

/** Normalises an Indian mobile number to its 10-digit form, or returns null. */
export function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2)
    : digits.length === 11 && digits.startsWith("0") ? digits.slice(1)
    : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Enter a mobile number")
  .refine((v) => normalizeIndianPhone(v) !== null, "Enter a valid 10-digit Indian mobile number")
  .transform((v) => normalizeIndianPhone(v) as string);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

const serviceStepShape = {
  serviceCategoryId: z.uuid().optional().or(z.literal("")).transform((v) => v || undefined),
  otherServiceText: optionalText(200),
};

export const serviceStepSchema = z
  .object(serviceStepShape)
  .refine((v) => Boolean(v.serviceCategoryId) || Boolean(v.otherServiceText), {
    message: "Choose a service, or describe what you need",
    path: ["serviceCategoryId"],
  });

export const careStepSchema = z.object({
  assistanceType: optionalText(120),
  mobility: z.enum(["MOBILE", "NEEDS_ASSISTANCE", "BEDRIDDEN", "OTHER"], {
    error: "Tell us how the patient moves around",
  }),
  careDescription: z
    .string()
    .trim()
    .min(10, "Please describe the care needed in a sentence or two")
    .max(1000, "Please keep this under 1000 characters"),
  preferredGender: z.enum(["NO_PREFERENCE", "FEMALE", "MALE"]).default("NO_PREFERENCE"),
  nursingSkillsRequired: optionalText(300),
  additionalRequirements: optionalText(500),
});

export const scheduleStepSchema = z.object({
  shiftType: shiftTypeSchema,
  shiftTiming: z.enum(["NO_PREFERENCE", "DAY", "NIGHT"]).default("NO_PREFERENCE"),
  startDate: z
    .string()
    .refine(isValidDateOnly, "Choose a start date"),
  durationValue: z.coerce
    .number({ error: "Enter how long you need care" })
    .int("Use a whole number")
    .min(1, "Enter at least 1")
    .max(365, "Enter 365 or less"),
  durationUnit: z.enum(["DAYS", "WEEKS", "MONTHS"]),
  arrangementType: z.enum(["ONE_TIME", "TEMPORARY", "LONG_TERM"], {
    error: "Choose the type of arrangement",
  }),
});

export const locationStepSchema = z.object({
  serviceAreaId: z.uuid().optional().or(z.literal("")).transform((v) => v || undefined),
  city: z.string().trim().min(2, "Choose your city").max(80),
  locality: z.string().trim().min(2, "Enter your locality or neighbourhood").max(120),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
  address: optionalText(300),
});

export const contactStepSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your name").max(100),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email address or leave it empty")
    .transform((v) => (v ? v.toLowerCase() : undefined)),
  relationship: optionalText(60),
  preferredContact: z.enum(["PHONE", "WHATSAPP", "EMAIL"]).default("PHONE"),
  contactConsent: z.literal(true, { error: "Please agree so we can contact you about this request" }),
});

/** Full public request payload. Unknown keys (e.g. a "shiftHours" field) are rejected. */
export const careRequestSchema = z
  .object({
    ...serviceStepShape,
    ...careStepSchema.shape,
    ...scheduleStepSchema.shape,
    ...locationStepSchema.shape,
    ...contactStepSchema.shape,
    idempotencyKey: z.uuid("Missing submission key"),
    // Honeypot: real users never see or fill this field.
    website: z.string().max(0).optional(),
  })
  .strict()
  .refine((v) => Boolean(v.serviceCategoryId) || Boolean(v.otherServiceText), {
    message: "Choose a service, or describe what you need",
    path: ["serviceCategoryId"],
  })
  .refine((v) => v.contactConsent === true, { path: ["contactConsent"], message: "Consent is required" })
  .refine((v) => v.preferredContact !== "EMAIL" || Boolean(v.email), {
    path: ["email"],
    message: "Add an email address, or choose phone or WhatsApp",
  });

export type CareRequestInput = z.input<typeof careRequestSchema>;
export type CareRequest = z.output<typeof careRequestSchema>;

export const REQUEST_STEPS = [
  { key: "service", title: "Service", schema: serviceStepSchema },
  { key: "care", title: "Care needs", schema: careStepSchema },
  { key: "schedule", title: "Shift and dates", schema: scheduleStepSchema },
  { key: "location", title: "Location", schema: locationStepSchema },
  { key: "contact", title: "Your details", schema: contactStepSchema },
  { key: "review", title: "Review", schema: null },
] as const;
