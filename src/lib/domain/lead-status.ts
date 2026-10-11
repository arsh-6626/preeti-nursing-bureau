import type { LeadStatus } from "@/generated/prisma/enums";

/** Allowed lead status transitions. Terminal states can only be reopened. */
export const LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ["CONTACTED", "REQUIREMENTS_COLLECTED", "MATCHING", "CANCELLED", "UNFULFILLED"],
  CONTACTED: ["REQUIREMENTS_COLLECTED", "MATCHING", "CANCELLED", "UNFULFILLED"],
  REQUIREMENTS_COLLECTED: ["CONTACTED", "MATCHING", "CANCELLED", "UNFULFILLED"],
  MATCHING: ["REQUIREMENTS_COLLECTED", "CAREGIVER_ASSIGNED", "CANCELLED", "UNFULFILLED"],
  CAREGIVER_ASSIGNED: ["SERVICE_ACTIVE", "MATCHING", "CANCELLED"],
  SERVICE_ACTIVE: ["COMPLETED", "MATCHING", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["CONTACTED"],
  UNFULFILLED: ["CONTACTED"],
};

/** Statuses that require a confirmed (or later) assignment on the request. */
export const STATUSES_REQUIRING_ASSIGNMENT: readonly LeadStatus[] = [
  "CAREGIVER_ASSIGNED",
  "SERVICE_ACTIVE",
  "COMPLETED",
];

export const OPEN_LEAD_STATUSES: readonly LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "REQUIREMENTS_COLLECTED",
  "MATCHING",
  "CAREGIVER_ASSIGNED",
  "SERVICE_ACTIVE",
];

export function canTransitionLead(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_TRANSITIONS[from].includes(to);
}
