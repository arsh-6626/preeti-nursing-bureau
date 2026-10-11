import type { AssignmentStatus, LeadStatus, Priority, VerificationStatus, AvailabilityStatus } from "@/generated/prisma/enums";
import { Badge, type Tone } from "@/components/ui/badge";
import {
  ASSIGNMENT_STATUS_LABELS,
  AVAILABILITY_LABELS,
  LEAD_STATUS_LABELS,
  PRIORITY_LABELS,
  VERIFICATION_STATUS_LABELS,
} from "@/lib/domain/labels";

const LEAD_TONES: Record<LeadStatus, Tone> = {
  NEW: "navy",
  CONTACTED: "teal",
  REQUIREMENTS_COLLECTED: "teal",
  MATCHING: "amber",
  CAREGIVER_ASSIGNED: "green",
  SERVICE_ACTIVE: "green",
  COMPLETED: "neutral",
  CANCELLED: "rose",
  UNFULFILLED: "rose",
};
const ASSIGNMENT_TONES: Record<AssignmentStatus, Tone> = {
  PROPOSED: "neutral",
  AWAITING_CONFIRMATION: "amber",
  CONFIRMED: "green",
  ACTIVE: "teal",
  COMPLETED: "neutral",
  CANCELLED: "rose",
  REPLACEMENT_REQUIRED: "amber",
};
const VERIFICATION_TONES: Record<VerificationStatus, Tone> = {
  NOT_STARTED: "neutral",
  PENDING: "amber",
  VERIFIED: "green",
  REJECTED: "rose",
  EXPIRED: "rose",
};
const PRIORITY_TONES: Record<Priority, Tone> = { LOW: "neutral", NORMAL: "neutral", HIGH: "amber", URGENT: "rose" };
const AVAILABILITY_TONES: Record<AvailabilityStatus, Tone> = { AVAILABLE: "green", ON_ASSIGNMENT: "teal", UNAVAILABLE: "neutral" };

export const LeadStatusBadge = ({ status }: { status: LeadStatus }) => <Badge tone={LEAD_TONES[status]}>{LEAD_STATUS_LABELS[status]}</Badge>;
export const AssignmentStatusBadge = ({ status }: { status: AssignmentStatus }) => <Badge tone={ASSIGNMENT_TONES[status]}>{ASSIGNMENT_STATUS_LABELS[status]}</Badge>;
export const VerificationBadge = ({ status }: { status: VerificationStatus }) => <Badge tone={VERIFICATION_TONES[status]}>{VERIFICATION_STATUS_LABELS[status]}</Badge>;
export const PriorityBadge = ({ priority }: { priority: Priority }) =>
  priority === "NORMAL" ? null : <Badge tone={PRIORITY_TONES[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
export const AvailabilityBadge = ({ status }: { status: AvailabilityStatus }) => <Badge tone={AVAILABILITY_TONES[status]}>{AVAILABILITY_LABELS[status]}</Badge>;
