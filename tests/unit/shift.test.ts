import { describe, expect, it } from "vitest";
import { SHIFT_TYPES, shiftTypeSchema, toDbShift, fromDbShift, isShiftType, parseShift } from "@/lib/domain/shift";
import { careRequestSchema, scheduleStepSchema } from "@/lib/validation/request";
import { assignmentTermsSchema, caregiverSchema, pricingRuleSchema } from "@/lib/validation/admin";

const schedule = (shiftType: unknown) => ({
  shiftType,
  shiftTiming: "NO_PREFERENCE",
  startDate: "2030-01-10",
  durationValue: 3,
  durationUnit: "DAYS",
  arrangementType: "ONE_TIME",
});

describe("shift types", () => {
  it("defines exactly two shift types", () => {
    expect(SHIFT_TYPES).toEqual(["12_HOURS", "24_HOURS"]);
  });

  it("accepts a 12-hour request", () => {
    expect(scheduleStepSchema.safeParse(schedule("12_HOURS")).success).toBe(true);
  });

  it("accepts a 24-hour request", () => {
    expect(scheduleStepSchema.safeParse(schedule("24_HOURS")).success).toBe(true);
  });

  it("rejects an 8-hour request with a clear message", () => {
    const result = scheduleStepSchema.safeParse(schedule("8_HOURS"));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/12 hours or 24 hours/);
  });

  it.each(["6_HOURS", "10_HOURS", "DAY", "NIGHT", "12", "24", 12, 24, "", null, undefined, "12_hours", "CUSTOM"])(
    "rejects unsupported shift value %s",
    (value) => {
      expect(shiftTypeSchema.safeParse(value).success).toBe(false);
      expect(isShiftType(value)).toBe(false);
      expect(parseShift(value)).toBeUndefined();
    },
  );

  it("does not accept a free-text duration field on the public payload", () => {
    const result = careRequestSchema.safeParse({ shiftHours: 8 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.code === "unrecognized_keys")).toBe(true);
  });

  it("maps API values to database enum members and back", () => {
    expect(toDbShift("12_HOURS")).toBe("TWELVE_HOURS");
    expect(toDbShift("24_HOURS")).toBe("TWENTY_FOUR_HOURS");
    expect(fromDbShift("TWELVE_HOURS")).toBe("12_HOURS");
    expect(() => toDbShift("8_HOURS" as never)).toThrow();
  });

  it("restricts caregiver supported shifts, pricing rules and assignment terms", () => {
    const caregiverBase = {
      fullName: "Sunita Rawat",
      phone: "9810012345",
      gender: "FEMALE",
      experienceYears: "4",
      availabilityStatus: "AVAILABLE",
      affiliation: "INDEPENDENT",
    };
    expect(caregiverSchema.safeParse({ ...caregiverBase, supportedShifts: ["12_HOURS", "24_HOURS"] }).success).toBe(true);
    expect(caregiverSchema.safeParse({ ...caregiverBase, supportedShifts: ["8_HOURS"] }).success).toBe(false);
    expect(caregiverSchema.safeParse({ ...caregiverBase, supportedShifts: [] }).success).toBe(false);
    expect(
      pricingRuleSchema.safeParse({ serviceCategoryId: crypto.randomUUID(), shiftType: "6_HOURS", ratePeriod: "PER_DAY", customerRate: "100", caregiverPayout: "80" }).success,
    ).toBe(false);
    expect(
      assignmentTermsSchema.safeParse({
        shiftType: "10_HOURS",
        startDate: "2030-01-01",
        durationValue: "1",
        durationUnit: "DAYS",
        customerAmount: "1000",
        caregiverPayout: "800",
        commissionMethod: "FIXED",
        commissionFixedAmount: "200",
      }).success,
    ).toBe(false);
  });

  it("requires a staffing plan for 24-hour assignments", () => {
    const base = {
      shiftType: "24_HOURS",
      startDate: "2030-01-01",
      durationValue: "1",
      durationUnit: "MONTHS",
      customerAmount: "30000",
      caregiverPayout: "24000",
      commissionMethod: "PERCENTAGE",
      commissionRate: "10",
    };
    expect(assignmentTermsSchema.safeParse(base).success).toBe(false);
    expect(assignmentTermsSchema.safeParse({ ...base, staffingPlan: "Relief attendant covers 4 hours daily; family covers nights on Sundays." }).success).toBe(true);
  });
});
