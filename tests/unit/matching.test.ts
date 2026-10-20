import { describe, expect, it } from "vitest";
import { computeEndDate, parseDateOnly, rangesOverlap } from "@/lib/domain/dates";
import { evaluateCaregiver, hardBlockers, rankCandidates, type MatchCaregiver, type MatchRequest } from "@/lib/domain/matching";

const d = parseDateOnly;
const request: MatchRequest = {
  serviceCategoryId: "svc-gda",
  serviceIsNursing: false,
  shiftType: "12_HOURS",
  preferredGender: "FEMALE",
  serviceAreaId: "area-noida-62",
  city: "Noida",
  startDate: d("2030-03-01"),
  endDate: d("2030-03-14"),
};
const caregiver = (overrides: Partial<MatchCaregiver> = {}): MatchCaregiver => ({
  id: "cg-1",
  supportedShifts: ["12_HOURS"],
  serviceCategoryIds: ["svc-gda"],
  areaIds: ["area-noida-62"],
  areaCities: ["Noida"],
  workCities: [],
  gender: "FEMALE",
  availabilityStatus: "AVAILABLE",
  verificationStatus: "VERIFIED",
  hasNursingQualification: false,
  availability: [],
  blockingAssignments: [],
  ...overrides,
});

describe("dates", () => {
  it("computes inclusive end dates", () => {
    expect(computeEndDate(d("2030-03-01"), 14, "DAYS").toISOString().slice(0, 10)).toBe("2030-03-14");
    expect(computeEndDate(d("2030-03-01"), 2, "WEEKS").toISOString().slice(0, 10)).toBe("2030-03-14");
    expect(computeEndDate(d("2030-01-31"), 1, "MONTHS").toISOString().slice(0, 10)).toBe("2030-02-27");
    expect(computeEndDate(d("2030-03-01"), 1, "MONTHS").toISOString().slice(0, 10)).toBe("2030-03-31");
  });

  it("detects overlapping ranges, including open-ended ones", () => {
    expect(rangesOverlap(d("2030-03-01"), d("2030-03-10"), d("2030-03-10"), d("2030-03-20"))).toBe(true);
    expect(rangesOverlap(d("2030-03-01"), d("2030-03-09"), d("2030-03-10"), d("2030-03-20"))).toBe(false);
    expect(rangesOverlap(d("2030-03-01"), null, d("2031-01-01"), d("2031-01-02"))).toBe(true);
  });
});

describe("matching", () => {
  it("ranks a fully matching caregiver as eligible with explained reasons", () => {
    const r = evaluateCaregiver(request, caregiver());
    expect(r.eligible).toBe(true);
    expect(r.blockers).toEqual([]);
    expect(r.checks.find((c) => c.label.includes("Works 12 hours"))?.ok).toBe(true);
    expect(r.score).toBeGreaterThan(80);
  });

  it("blocks caregivers who do not support the requested shift type", () => {
    const r = evaluateCaregiver(request, caregiver({ supportedShifts: ["24_HOURS"] }));
    expect(r.eligible).toBe(false);
    expect(r.blockers[0]).toMatch(/12 hours/);
  });

  it("blocks overlapping confirmed assignments but ignores the assignment being confirmed", () => {
    const busy = caregiver({ blockingAssignments: [{ id: "a1", startDate: d("2030-03-10"), endDate: d("2030-04-10") }] });
    expect(hardBlockers(request, busy)).toHaveLength(1);
    expect(hardBlockers({ ...request, excludeAssignmentId: "a1" }, busy)).toHaveLength(0);
  });

  it("blocks unavailable caregivers and unavailability periods", () => {
    expect(hardBlockers(request, caregiver({ availabilityStatus: "UNAVAILABLE" }))).not.toHaveLength(0);
    expect(
      hardBlockers(request, caregiver({ availability: [{ kind: "UNAVAILABLE", startDate: d("2030-03-05"), endDate: d("2030-03-06") }] })),
    ).not.toHaveLength(0);
    expect(
      hardBlockers(request, caregiver({ availability: [{ kind: "AVAILABLE_WINDOW", startDate: d("2030-03-05"), endDate: null }] })),
    ).not.toHaveLength(0);
  });

  it("reports unmet soft requirements without blocking", () => {
    const r = evaluateCaregiver(request, caregiver({ gender: "MALE", verificationStatus: "PENDING", areaIds: [], areaCities: ["Delhi"] }));
    expect(r.eligible).toBe(true);
    expect(r.checks.filter((c) => !c.ok).map((c) => c.label)).toEqual(
      expect.arrayContaining(["Does not match gender preference", "Location is outside preferred areas"]),
    );
  });

  it("counts a whole work city as a full area match", () => {
    const byCity = evaluateCaregiver(request, caregiver({ areaIds: [], areaCities: [], workCities: ["Noida"] }));
    const byLocality = evaluateCaregiver(request, caregiver());
    expect(byCity.score).toBe(byLocality.score);
    expect(byCity.checks).toContainEqual({ ok: true, label: "Prefers this locality" });
  });

  it("puts eligible caregivers before blocked ones", () => {
    const ranked = rankCandidates(request, [
      caregiver({ id: "blocked", supportedShifts: ["24_HOURS"] }),
      caregiver({ id: "weak", gender: "MALE", verificationStatus: "NOT_STARTED" }),
      caregiver({ id: "strong" }),
    ]);
    expect(ranked.map((r) => r.caregiverId)).toEqual(["strong", "weak", "blocked"]);
  });
});
