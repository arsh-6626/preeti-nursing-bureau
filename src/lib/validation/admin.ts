/** Server-side validation schemas for admin operations. */
import { z } from "zod";
import { SHIFT_TYPES, shiftTypeSchema } from "@/lib/domain/shift";
import { isValidDateOnly } from "@/lib/domain/dates";
import { MONEY_PATTERN } from "@/lib/domain/money";
import { phoneSchema } from "./request";

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const moneySchema = z
  .string()
  .trim()
  .regex(MONEY_PATTERN, "Enter an amount in rupees, e.g. 1500 or 1500.50");

export const optionalMoneySchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || MONEY_PATTERN.test(v), "Enter an amount in rupees, e.g. 1500 or 1500.50");

/** Signed amount for adjustments, e.g. -500 or 750.25. */
export const signedMoneySchema = z
  .string()
  .trim()
  .regex(/^-?\d{1,10}(\.\d{1,2})?$/, "Enter an amount, e.g. 500 or -500")
  .refine((v) => Number(v) !== 0, "Amount cannot be zero");

export const percentSchema = z
  .string()
  .trim()
  .regex(/^\d{1,3}(\.\d{1,2})?$/, "Enter a percentage, e.g. 10")
  .refine((v) => Number(v) <= 100, "Percentage cannot exceed 100");

export const dateOnlySchema = z.string().refine(isValidDateOnly, "Enter a valid date");
export const optionalDateOnlySchema = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || isValidDateOnly(v), "Enter a valid date");

export const idSchema = z.uuid("Invalid identifier");

/** Accepts checkbox / multi-select values from FormData. */
export const stringList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]));

/** Comma or newline separated list to a trimmed array. */
export const csvList = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30),
  );

export const shiftListSchema = stringList.pipe(
  z.array(shiftTypeSchema).min(1, "Choose at least one shift type (12 hours or 24 hours)"),
);

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "REQUIREMENTS_COLLECTED",
  "MATCHING",
  "CAREGIVER_ASSIGNED",
  "SERVICE_ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "UNFULFILLED",
] as const;

export const leadStatusSchema = z.enum(LEAD_STATUSES);
export const prioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
export const leadSourceSchema = z.enum(["WEBSITE", "PHONE", "WHATSAPP", "REFERRAL", "OTHER"]);
export const callOutcomeSchema = z.enum([
  "REACHED",
  "NO_ANSWER",
  "CALLBACK_REQUESTED",
  "WRONG_NUMBER",
  "NOT_INTERESTED",
  "OTHER",
]);

export const leadFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: leadStatusSchema.optional().catch(undefined),
  service: z.uuid().optional().catch(undefined),
  city: z.string().trim().max(80).optional().catch(undefined),
  priority: prioritySchema.optional().catch(undefined),
  source: leadSourceSchema.optional().catch(undefined),
  shift: z.enum(SHIFT_TYPES).optional().catch(undefined),
  from: z.string().refine(isValidDateOnly).optional().catch(undefined),
  to: z.string().refine(isValidDateOnly).optional().catch(undefined),
  view: z.enum(["all", "new", "overdue", "mine", "open"]).optional().catch(undefined),
  sort: z.enum(["created_desc", "created_asc", "followup_asc"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
});
export type LeadFilters = z.infer<typeof leadFiltersSchema>;

export const leadStatusUpdateSchema = z.object({
  requestId: idSchema,
  toStatus: leadStatusSchema,
  note: optionalText(1000),
  closedReason: optionalText(300),
});

export const leadMetaSchema = z.object({
  requestId: idSchema,
  priority: prioritySchema,
  source: leadSourceSchema,
  assignedToId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.uuid().nullable()),
});

export const noteSchema = z.object({
  body: text(4000).min(1, "Write a note first"),
});

export const followUpSchema = z.object({
  requestId: idSchema,
  dueAt: z.string().min(1, "Choose a date and time").refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date and time"),
  notes: optionalText(1000),
  assignedToId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.uuid().nullable()),
});

export const followUpCompleteSchema = z.object({
  followUpId: idSchema,
  outcome: callOutcomeSchema,
  notes: optionalText(1000),
});

export const callLogSchema = z.object({
  requestId: idSchema,
  outcome: callOutcomeSchema,
  notes: optionalText(1000),
});

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export const customerSchema = z.object({
  name: text(100).min(2, "Enter the customer's name"),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .nullable()
    .transform((v) => (v ? v.toLowerCase() : null))
    .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email address"),
  relationship: optionalText(60),
  preferredContact: z.enum(["PHONE", "WHATSAPP", "EMAIL"]).default("PHONE"),
});

// ---------------------------------------------------------------------------
// Caregivers
// ---------------------------------------------------------------------------

export const caregiverSchema = z
  .object({
    fullName: text(100).min(2, "Enter the caregiver's full name"),
    phone: phoneSchema,
    email: z
      .string()
      .trim()
      .max(160)
      .optional()
      .nullable()
      .transform((v) => (v ? v.toLowerCase() : null))
      .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email address"),
    photoUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .nullable()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^https:\/\//.test(v), "Use an https:// image link"),
    gender: z.enum(["FEMALE", "MALE", "OTHER", "UNSPECIFIED"]),
    serviceCategoryIds: stringList.pipe(z.array(z.uuid())),
    areaIds: stringList.pipe(z.array(z.uuid())),
    skills: csvList,
    qualifications: optionalText(1000),
    experienceYears: z.coerce.number().int().min(0, "Cannot be negative").max(70),
    languages: csvList,
    availabilityStatus: z.enum(["AVAILABLE", "ON_ASSIGNMENT", "UNAVAILABLE"]),
    supportedShifts: shiftListSchema,
    payout12h: optionalMoneySchema,
    payout24h: optionalMoneySchema,
    payoutPeriod: z.enum(["PER_DAY", "PER_MONTH"]).default("PER_DAY"),
    affiliation: z.enum(["INDEPENDENT", "AGENCY_MANAGED", "OTHER"]),
    agencyName: optionalText(120),
  })
  .refine((v) => v.affiliation !== "AGENCY_MANAGED" || Boolean(v.agencyName), {
    path: ["agencyName"],
    message: "Enter the agency name for agency-managed caregivers",
  });

export const verificationSchema = z.object({
  caregiverId: idSchema,
  type: z.enum(["IDENTITY", "QUALIFICATION", "REFERENCE", "BACKGROUND", "OTHER"]),
  status: z.enum(["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"]),
  documentRef: optionalText(200),
  expiresAt: optionalDateOnlySchema,
  notes: optionalText(1000),
});

export const verificationUpdateSchema = verificationSchema.omit({ caregiverId: true, type: true }).extend({
  recordId: idSchema,
});

export const overallVerificationSchema = z.object({
  caregiverId: idSchema,
  status: z.enum(["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"]),
});

export const availabilitySchema = z
  .object({
    caregiverId: idSchema,
    kind: z.enum(["AVAILABLE_WINDOW", "UNAVAILABLE"]),
    startDate: dateOnlySchema,
    endDate: optionalDateOnlySchema,
    reason: optionalText(300),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date",
  });

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export const assignmentTermsSchema = z
  .object({
    shiftType: shiftTypeSchema,
    startDate: dateOnlySchema,
    durationValue: z.coerce.number().int().min(1, "Enter at least 1").max(365),
    durationUnit: z.enum(["DAYS", "WEEKS", "MONTHS"]),
    quotedAmount: optionalMoneySchema,
    customerAmount: moneySchema,
    caregiverPayout: moneySchema,
    commissionMethod: z.enum(["FIXED", "PERCENTAGE"]),
    commissionRate: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    commissionFixedAmount: optionalMoneySchema,
    commissionBasis: z.enum(["CUSTOMER_AMOUNT", "CAREGIVER_PAYOUT"]).default("CUSTOMER_AMOUNT"),
    staffingPlan: optionalText(2000),
    financialNotes: optionalText(2000),
  })
  .superRefine((v, ctx) => {
    if (v.commissionMethod === "PERCENTAGE") {
      const parsed = percentSchema.safeParse(v.commissionRate ?? "");
      if (!parsed.success) ctx.addIssue({ code: "custom", path: ["commissionRate"], message: "Enter a commission percentage between 0 and 100" });
    } else if (!v.commissionFixedAmount) {
      ctx.addIssue({ code: "custom", path: ["commissionFixedAmount"], message: "Enter the fixed commission amount" });
    }
    if (v.shiftType === "24_HOURS" && !v.staffingPlan) {
      ctx.addIssue({
        code: "custom",
        path: ["staffingPlan"],
        message: "Describe the relief, rest and staffing plan for this 24-hour arrangement",
      });
    }
  });

export const createAssignmentSchema = z.object({
  requestId: idSchema,
  caregiverId: idSchema,
  replacesAssignmentId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.uuid().nullable()),
});

export const assignmentTransitionSchema = z.object({
  assignmentId: idSchema,
  toStatus: z.enum(["PROPOSED", "AWAITING_CONFIRMATION", "ACTIVE", "COMPLETED", "REPLACEMENT_REQUIRED"]),
  note: optionalText(1000),
});

export const assignmentCancelSchema = z.object({
  assignmentId: idSchema,
  reason: text(1000).min(3, "Give a reason for the cancellation"),
  finalCustomerCharge: optionalMoneySchema,
  finalCaregiverPayout: optionalMoneySchema,
  reverseCommission: z
    .union([z.literal("on"), z.literal("true"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export const acceptanceSchema = z.object({
  assignmentId: idSchema,
  party: z.enum(["customer", "caregiver"]),
  accepted: z.enum(["yes", "no"]),
});

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export const paymentSchema = z.object({
  assignmentId: idSchema,
  direction: z.enum(["CUSTOMER_RECEIPT", "CUSTOMER_REFUND", "CAREGIVER_PAYOUT"]),
  amount: moneySchema.refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  method: z.enum(["CASH", "UPI", "BANK_TRANSFER", "OTHER"]),
  methodNote: optionalText(80),
  paidOn: dateOnlySchema,
  transactionRef: optionalText(120),
  notes: optionalText(1000),
});

export const paymentReversalSchema = z.object({
  paymentId: idSchema,
  reason: text(500).min(3, "Explain why this payment is being reversed"),
});

export const adjustmentSchema = z.object({
  assignmentId: idSchema,
  target: z.enum(["CUSTOMER_CHARGE", "CAREGIVER_PAYOUT"]),
  amount: signedMoneySchema,
  reason: text(500).min(3, "Explain the adjustment"),
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const businessSettingsSchema = z.object({
  businessName: text(120).min(2),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^(https:\/\/|\/)/.test(v), "Use an https:// link or a /path"),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\+?[\d\s-]{8,16}$/.test(v), "Enter a valid phone number"),
  whatsapp: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\+?[\d\s-]{8,16}$/.test(v), "Enter a valid WhatsApp number with country code"),
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email"),
  businessHours: optionalText(200),
  address: optionalText(300),
  regionLabel: text(60).min(2),
  heroHeadline: text(120).min(5),
  heroSubtext: text(300).min(5),
  aboutText: text(4000),
  consentText: text(500).min(10),
  whatsappPrefill: text(300).min(5),
  followUpDefaultHours: z.coerce.number().int().min(1).max(720),
  allowOtherService: z
    .union([z.literal("on"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
});

export const commissionPolicySchema = z
  .object({
    commissionMethod: z.enum(["FIXED", "PERCENTAGE"]),
    commissionRate: percentSchema,
    commissionFixedAmount: moneySchema,
    commissionBasis: z.enum(["CUSTOMER_AMOUNT", "CAREGIVER_PAYOUT"]),
    commissionRecognition: z.enum(["ON_CONFIRMATION", "ON_COMPLETION"]),
  });

export const serviceCategorySchema = z.object({
  name: text(100).min(2, "Enter a service name"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  summary: text(200).min(5, "Add a one-line summary"),
  description: text(4000).min(10, "Add a description"),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^(https:\/\/|\/)/.test(v), "Use an https:// link or a /path"),
  requiredSkills: csvList,
  indicativePrice: optionalText(120),
  notes: optionalText(1000),
  isNursing: z.union([z.literal("on"), z.literal("")]).optional().transform((v) => v === "on"),
  isActive: z.union([z.literal("on"), z.literal("")]).optional().transform((v) => v === "on"),
});

export const serviceAreaSchema = z.object({
  city: text(80).min(2, "Enter the city"),
  locality: text(120).min(2, "Enter the locality"),
  pincode: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^[1-9]\d{5}$/.test(v), "Enter a 6-digit pincode"),
});

export const pricingRuleSchema = z.object({
  serviceCategoryId: idSchema,
  shiftType: shiftTypeSchema,
  ratePeriod: z.enum(["PER_DAY", "PER_MONTH"]),
  customerRate: moneySchema,
  caregiverPayout: moneySchema,
  notes: optionalText(300),
});

export const contentPageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: text(120).min(2),
  body: text(30000).min(10),
  needsReview: z.union([z.literal("on"), z.literal("")]).optional().transform((v) => v === "on"),
});

export const userCreateSchema = z.object({
  name: text(100).min(2, "Enter a name"),
  email: z.email("Enter a valid email").transform((v) => v.toLowerCase()),
  role: z.enum(["ADMIN", "STAFF"]),
  password: z.string().min(1, "Enter a password"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(160),
  password: z.string().max(128),
});
