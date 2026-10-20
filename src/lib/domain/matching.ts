/**
 * Caregiver matching. Produces an explained, ranked list of candidates for a
 * request. A score is a sorting aid only: it never confirms suitability or a
 * booking. Hard blockers (shift, availability, conflicts) prevent confirmation.
 */
import { worksInCity } from "./staff";
import type {
  AvailabilityKind,
  AvailabilityStatus,
  Gender,
  GenderPreference,
  VerificationStatus,
} from "@/generated/prisma/enums";
import { rangesOverlap } from "./dates";
import { shiftLabel, type ShiftType } from "./shift";

export type MatchRequest = {
  serviceCategoryId: string | null;
  serviceIsNursing: boolean;
  shiftType: ShiftType;
  preferredGender: GenderPreference;
  serviceAreaId: string | null;
  city: string;
  startDate: Date;
  endDate: Date;
  /** Assignment to ignore in conflict checks (e.g. the one being confirmed). */
  excludeAssignmentId?: string;
};

export type MatchCaregiver = {
  id: string;
  supportedShifts: ShiftType[];
  serviceCategoryIds: string[];
  areaIds: string[];
  areaCities: string[];
  /** Whole cities outside Delhi the person works in; "Other" covers unlisted cities. */
  workCities: string[];
  gender: Gender;
  availabilityStatus: AvailabilityStatus;
  verificationStatus: VerificationStatus;
  hasNursingQualification: boolean;
  availability: { kind: AvailabilityKind; startDate: Date; endDate: Date | null }[];
  /** Assignments that hold the caregiver's time (CONFIRMED / ACTIVE). */
  blockingAssignments: { id: string; startDate: Date; endDate: Date; reference?: string }[];
};

export type MatchCheck = { ok: boolean; label: string; hard?: boolean };

export type MatchResult = {
  caregiverId: string;
  score: number;
  /** False when any hard requirement fails; such a caregiver cannot be confirmed. */
  eligible: boolean;
  checks: MatchCheck[];
  blockers: string[];
};

const WEIGHTS = {
  service: 30,
  area: 20,
  gender: 15,
  verified: 15,
  nursing: 10,
  availableNow: 10,
} as const;

/** Hard checks shared by matching and assignment confirmation. */
export function hardBlockers(request: MatchRequest, caregiver: MatchCaregiver): string[] {
  const blockers: string[] = [];
  if (!caregiver.supportedShifts.includes(request.shiftType)) {
    blockers.push(`Does not work ${shiftLabel(request.shiftType)} shifts`);
  }
  if (caregiver.availabilityStatus === "UNAVAILABLE") {
    blockers.push("Marked unavailable");
  }
  const unavailable = caregiver.availability.find(
    (p) => p.kind === "UNAVAILABLE" && rangesOverlap(p.startDate, p.endDate, request.startDate, request.endDate),
  );
  if (unavailable) blockers.push("Has an unavailability period during these dates");
  const windows = caregiver.availability.filter((p) => p.kind === "AVAILABLE_WINDOW");
  if (windows.length > 0) {
    const covered = windows.some(
      (w) =>
        w.startDate.getTime() <= request.startDate.getTime() &&
        (w.endDate === null || w.endDate.getTime() >= request.endDate.getTime()),
    );
    if (!covered) blockers.push("Dates fall outside the caregiver's availability windows");
  }
  const conflict = caregiver.blockingAssignments.find(
    (a) => a.id !== request.excludeAssignmentId && rangesOverlap(a.startDate, a.endDate, request.startDate, request.endDate),
  );
  if (conflict) blockers.push("Already booked on an overlapping confirmed or active assignment");
  return blockers;
}

export function evaluateCaregiver(request: MatchRequest, caregiver: MatchCaregiver): MatchResult {
  const blockers = hardBlockers(request, caregiver);
  const checks: MatchCheck[] = [];
  let score = 0;

  checks.push({
    ok: caregiver.supportedShifts.includes(request.shiftType),
    label: `Works ${shiftLabel(request.shiftType)} shifts`,
    hard: true,
  });

  if (request.serviceCategoryId) {
    const ok = caregiver.serviceCategoryIds.includes(request.serviceCategoryId);
    checks.push({ ok, label: ok ? "Offers this service" : "Service not listed in profile" });
    if (ok) score += WEIGHTS.service;
  } else {
    score += WEIGHTS.service / 2;
  }

  // Choosing a whole city (e.g. Noida) counts as preferring every locality in it.
  const areaOk =
    (request.serviceAreaId
      ? caregiver.areaIds.includes(request.serviceAreaId)
      : caregiver.areaCities.some((c) => c.toLowerCase() === request.city.toLowerCase())) || worksInCity(caregiver.workCities, request.city);
  const cityOk = caregiver.areaCities.some((c) => c.toLowerCase() === request.city.toLowerCase());
  if (areaOk) {
    score += WEIGHTS.area;
    checks.push({ ok: true, label: "Prefers this locality" });
  } else if (cityOk) {
    score += WEIGHTS.area / 2;
    checks.push({ ok: true, label: "Works in this city (not this exact locality)" });
  } else {
    checks.push({ ok: false, label: "Location is outside preferred areas" });
  }

  if (request.preferredGender === "NO_PREFERENCE") {
    score += WEIGHTS.gender;
  } else {
    const wanted = request.preferredGender === "FEMALE" ? "FEMALE" : "MALE";
    const ok = caregiver.gender === wanted;
    checks.push({ ok, label: ok ? "Matches gender preference" : "Does not match gender preference" });
    if (ok) score += WEIGHTS.gender;
  }

  const verified = caregiver.verificationStatus === "VERIFIED";
  checks.push({
    ok: verified,
    label: verified ? "Verification complete" : `Verification: ${caregiver.verificationStatus.toLowerCase().replace("_", " ")}`,
  });
  if (verified) score += WEIGHTS.verified;

  if (request.serviceIsNursing) {
    checks.push({
      ok: caregiver.hasNursingQualification,
      label: caregiver.hasNursingQualification
        ? "Nursing qualification recorded"
        : "No nursing qualification recorded",
    });
    if (caregiver.hasNursingQualification) score += WEIGHTS.nursing;
  } else {
    score += WEIGHTS.nursing;
  }

  const availableNow = caregiver.availabilityStatus === "AVAILABLE";
  checks.push({ ok: availableNow, label: availableNow ? "Currently available" : "Currently on assignment" });
  if (availableNow) score += WEIGHTS.availableNow;

  for (const b of blockers) checks.push({ ok: false, label: b, hard: true });

  return {
    caregiverId: caregiver.id,
    score: blockers.length > 0 ? Math.min(score, 20) : score,
    eligible: blockers.length === 0,
    checks: dedupe(checks),
    blockers,
  };
}

function dedupe(checks: MatchCheck[]): MatchCheck[] {
  const seen = new Set<string>();
  return checks.filter((c) => (seen.has(c.label) ? false : (seen.add(c.label), true)));
}

export function rankCandidates(request: MatchRequest, caregivers: MatchCaregiver[]): MatchResult[] {
  return caregivers
    .map((c) => evaluateCaregiver(request, c))
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score);
}
