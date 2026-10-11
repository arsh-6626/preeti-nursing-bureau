import { describe, expect, it } from "vitest";
import { canTransitionLead, LEAD_TRANSITIONS } from "@/lib/domain/lead-status";
import { ASSIGNMENT_TRANSITIONS, canTransitionAssignment } from "@/lib/domain/assignment-status";
import { can, ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import { generatePublicToken, generateReference, hashToken, isPublicTokenFormat, isReferenceFormat } from "@/lib/domain/reference";
import { normalizeIndianPhone, careRequestSchema } from "@/lib/validation/request";
import { whatsappHref, telHref } from "@/lib/contact";

describe("status transitions", () => {
  it("follows the lead pipeline and blocks skipping to completion", () => {
    expect(canTransitionLead("NEW", "CONTACTED")).toBe(true);
    expect(canTransitionLead("NEW", "COMPLETED")).toBe(false);
    expect(canTransitionLead("COMPLETED", "NEW")).toBe(false);
    expect(LEAD_TRANSITIONS.COMPLETED).toEqual([]);
  });

  it("never allows reaching CONFIRMED through a plain status change", () => {
    for (const targets of Object.values(ASSIGNMENT_TRANSITIONS)) expect(targets).not.toContain("CONFIRMED");
    expect(canTransitionAssignment("CONFIRMED", "ACTIVE")).toBe(true);
    expect(canTransitionAssignment("CANCELLED", "ACTIVE")).toBe(false);
  });
});

describe("permissions", () => {
  it("keeps finance, settings, confirmation and users away from staff", () => {
    const staff = { role: "STAFF" as const };
    for (const p of ["finance:read", "finance:write", "settings:write", "users:manage", "assignment:confirm", "lead:read:any", "caregiver:verification", "caregiver:compensation"] as const) {
      expect(can(staff, p)).toBe(false);
    }
    expect(can(staff, "lead:read:assigned")).toBe(true);
    expect(can({ role: "ADMIN" }, "assignment:confirm")).toBe(true);
    expect(can(null, "lead:read:assigned")).toBe(false);
    expect(ROLE_PERMISSIONS.ADMIN.length).toBeGreaterThan(ROLE_PERMISSIONS.STAFF.length);
  });
});

describe("references and tokens", () => {
  it("generates readable, non-sequential references", () => {
    const refs = new Set(Array.from({ length: 500 }, generateReference));
    expect(refs.size).toBe(500);
    for (const r of refs) expect(isReferenceFormat(r)).toBe(true);
  });

  it("generates unguessable status tokens and stores only hashes", () => {
    const token = generatePublicToken();
    expect(isPublicTokenFormat(token)).toBe(true);
    expect(token).toHaveLength(43);
    expect(hashToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(token)).not.toContain(token);
    expect(isPublicTokenFormat("123")).toBe(false);
  });
});

describe("request validation", () => {
  it("normalises Indian mobile numbers", () => {
    expect(normalizeIndianPhone("+91 98100-23456")).toBe("9810023456");
    expect(normalizeIndianPhone("098100 23456")).toBe("9810023456");
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(normalizeIndianPhone("5810023456")).toBeNull();
  });

  it("requires consent and a valid pincode", () => {
    const r = careRequestSchema.safeParse({ contactConsent: false, pincode: "12" });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["contactConsent", "pincode"]));
  });
});

describe("contact links", () => {
  it("builds working tel and WhatsApp links without medical details", () => {
    expect(telHref("+91 98100 23456")).toBe("tel:+919810023456");
    expect(whatsappHref("9810023456", "Hello")).toBe("https://wa.me/919810023456?text=Hello");
    expect(whatsappHref(null)).toBeNull();
  });
});
