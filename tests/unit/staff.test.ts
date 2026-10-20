import { describe, expect, it } from "vitest";
import { summariseWorkAreas, worksInCity } from "@/lib/domain/staff";

describe("work cities", () => {
  it("matches a named city regardless of case", () => {
    expect(worksInCity(["Noida"], "noida")).toBe(true);
    expect(worksInCity(["Noida"], "Gurugram")).toBe(false);
  });

  it("treats Other as any city that is not Delhi or a named NCR city", () => {
    expect(worksInCity(["Other"], "Greater Noida")).toBe(true);
    expect(worksInCity(["Other"], "Sonipat")).toBe(true);
    expect(worksInCity(["Other"], "Noida")).toBe(false);
    expect(worksInCity(["Other"], "Delhi")).toBe(false);
  });

  it("matches nothing when no city is chosen", () => {
    expect(worksInCity([], "Noida")).toBe(false);
  });
});

describe("work area summary", () => {
  const delhi = (n: number) => Array.from({ length: n }, (_, i) => ({ city: "Delhi", locality: `L${i + 1}` }));
  it("collapses every Delhi locality to All Delhi", () => {
    expect(summariseWorkAreas(delhi(3), ["Noida", "Other"], 3)).toBe("All Delhi; Noida, Others");
  });
  it("shortens long lists with a count", () => {
    expect(summariseWorkAreas(delhi(6), [], 10)).toBe("Delhi: L1, L2, L3, L4 +2 more");
  });
  it("keeps older non-Delhi localities", () => {
    expect(summariseWorkAreas([{ city: "Noida", locality: "Sector 62" }], [], 10)).toBe("Sector 62 (Noida)");
  });
});
