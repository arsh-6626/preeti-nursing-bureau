/** Human-readable labels for enum values. Safe to import from client code. */
import type {
  AffiliationType,
  ArrangementType,
  AssignmentStatus,
  AvailabilityStatus,
  CallOutcome,
  CommissionBasis,
  CommissionMethod,
  CommissionRecognition,
  ContactMethod,
  DurationUnit,
  FollowUpStatus,
  Gender,
  GenderPreference,
  LeadSource,
  LeadStatus,
  Mobility,
  PaymentDirection,
  PaymentMethod,
  Priority,
  RatePeriod,
  Role,
  ShiftTiming,
  VerificationStatus,
  VerificationType,
  AdjustmentTarget,
  AvailabilityKind,
} from "@/generated/prisma/enums";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  REQUIREMENTS_COLLECTED: "Requirements collected",
  MATCHING: "Matching",
  CAREGIVER_ASSIGNED: "Caregiver assigned",
  SERVICE_ACTIVE: "Service active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  UNFULFILLED: "Unfulfilled",
};

/** Plain-language status for the customer-facing status page. */
export const LEAD_STATUS_PUBLIC: Record<LeadStatus, string> = {
  NEW: "Received. We will call you to discuss your request.",
  CONTACTED: "We have spoken with you and are reviewing your needs.",
  REQUIREMENTS_COLLECTED: "We have your requirements and are looking for a suitable caregiver.",
  MATCHING: "We are looking for a suitable caregiver.",
  CAREGIVER_ASSIGNED: "A caregiver has been arranged. We will confirm details with you by phone.",
  SERVICE_ACTIVE: "Care is in progress.",
  COMPLETED: "This arrangement is complete.",
  CANCELLED: "This request was cancelled.",
  UNFULFILLED: "We were not able to arrange care for this request.",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Website",
  PHONE: "Phone",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const MOBILITY_LABELS: Record<Mobility, string> = {
  MOBILE: "Can walk independently",
  NEEDS_ASSISTANCE: "Needs help moving",
  BEDRIDDEN: "Bedridden",
  OTHER: "Other",
};

export const GENDER_PREF_LABELS: Record<GenderPreference, string> = {
  NO_PREFERENCE: "No preference",
  FEMALE: "Female caregiver",
  MALE: "Male caregiver",
};

export const GENDER_LABELS: Record<Gender, string> = {
  FEMALE: "Female",
  MALE: "Male",
  OTHER: "Other",
  UNSPECIFIED: "Not specified",
};

export const SHIFT_TIMING_LABELS: Record<ShiftTiming, string> = {
  NO_PREFERENCE: "No preference",
  DAY: "Day",
  NIGHT: "Night",
};

export const ARRANGEMENT_LABELS: Record<ArrangementType, string> = {
  ONE_TIME: "One-time",
  TEMPORARY: "Temporary",
  LONG_TERM: "Long-term",
};

export const DURATION_UNIT_LABELS: Record<DurationUnit, string> = {
  DAYS: "days",
  WEEKS: "weeks",
  MONTHS: "months",
};

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  PHONE: "Phone call",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
};

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: "Available",
  ON_ASSIGNMENT: "On assignment",
  UNAVAILABLE: "Unavailable",
};

export const AVAILABILITY_KIND_LABELS: Record<AvailabilityKind, string> = {
  AVAILABLE_WINDOW: "Available window",
  UNAVAILABLE: "Unavailable",
};

export const AFFILIATION_LABELS: Record<AffiliationType, string> = {
  INDEPENDENT: "Independent",
  AGENCY_MANAGED: "Agency-managed",
  OTHER: "Other",
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  NOT_STARTED: "Not started",
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  IDENTITY: "Identity",
  QUALIFICATION: "Qualification",
  REFERENCE: "Reference check",
  BACKGROUND: "Background check",
  OTHER: "Other",
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  PROPOSED: "Proposed",
  AWAITING_CONFIRMATION: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REPLACEMENT_REQUIRED: "Replacement required",
};

export const COMMISSION_METHOD_LABELS: Record<CommissionMethod, string> = {
  FIXED: "Fixed amount per placement",
  PERCENTAGE: "Percentage",
};

export const COMMISSION_BASIS_LABELS: Record<CommissionBasis, string> = {
  CUSTOMER_AMOUNT: "Agreed customer amount",
  CAREGIVER_PAYOUT: "Agreed caregiver payout",
};

export const COMMISSION_RECOGNITION_LABELS: Record<CommissionRecognition, string> = {
  ON_CONFIRMATION: "When the assignment is confirmed",
  ON_COMPLETION: "When the service is completed",
};

export const PAYMENT_DIRECTION_LABELS: Record<PaymentDirection, string> = {
  CUSTOMER_RECEIPT: "Received from customer",
  CUSTOMER_REFUND: "Refunded to customer",
  CAREGIVER_PAYOUT: "Paid to caregiver",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
};

export const ADJUSTMENT_TARGET_LABELS: Record<AdjustmentTarget, string> = {
  CUSTOMER_CHARGE: "Customer charge",
  CAREGIVER_PAYOUT: "Caregiver payout",
};

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  PENDING: "Pending",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  REACHED: "Reached",
  NO_ANSWER: "No answer",
  CALLBACK_REQUESTED: "Callback requested",
  WRONG_NUMBER: "Wrong number",
  NOT_INTERESTED: "Not interested",
  OTHER: "Other",
};

export const RATE_PERIOD_LABELS: Record<RatePeriod, string> = {
  PER_DAY: "per day",
  PER_MONTH: "per month",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  STAFF: "Staff",
};

export function keysOf<T extends string>(record: Record<T, string>): T[] {
  return Object.keys(record) as T[];
}
