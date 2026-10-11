import type { AssignmentStatus } from "@/generated/prisma/enums";

/**
 * Allowed assignment status transitions. CONFIRMED is deliberately absent from
 * every list: it can only be reached through the explicit confirm action,
 * which runs the availability, shift and conflict checks.
 */
export const ASSIGNMENT_TRANSITIONS: Record<AssignmentStatus, readonly AssignmentStatus[]> = {
  PROPOSED: ["AWAITING_CONFIRMATION", "CANCELLED"],
  AWAITING_CONFIRMATION: ["PROPOSED", "CANCELLED"],
  CONFIRMED: ["ACTIVE", "REPLACEMENT_REQUIRED", "CANCELLED"],
  ACTIVE: ["COMPLETED", "REPLACEMENT_REQUIRED", "CANCELLED"],
  REPLACEMENT_REQUIRED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const CONFIRMABLE_FROM: readonly AssignmentStatus[] = ["PROPOSED", "AWAITING_CONFIRMATION"];

/** Assignments that hold the caregiver's time and block overlapping bookings. */
export const BLOCKING_ASSIGNMENT_STATUSES: readonly AssignmentStatus[] = ["CONFIRMED", "ACTIVE"];

/** Assignments that are still being worked on (not terminal). */
export const OPEN_ASSIGNMENT_STATUSES: readonly AssignmentStatus[] = [
  "PROPOSED",
  "AWAITING_CONFIRMATION",
  "CONFIRMED",
  "ACTIVE",
  "REPLACEMENT_REQUIRED",
];

export function canTransitionAssignment(from: AssignmentStatus, to: AssignmentStatus): boolean {
  return ASSIGNMENT_TRANSITIONS[from].includes(to);
}
