import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { Actor } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/lib/auth/permissions";
import { createCaregiver, getStaffFile, listCaregivers, saveStaffFiles, updateCaregiver } from "@/lib/services/caregivers";
import { createLivingArea, listLivingAreas } from "@/lib/services/settings";
import { makeCatalogue, makeUser, resetDb } from "../support/db";

let admin: Actor;
let staff: Actor;
let cat: Awaited<ReturnType<typeof makeCatalogue>>;

// Smallest valid JPEG header bytes are enough for the type check.
const jpeg = () => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46])], "a.jpg", { type: "image/jpeg" });

type CaregiverInput = Parameters<typeof createCaregiver>[1];
const base = (overrides: Record<string, unknown> = {}): CaregiverInput => ({
  fullName: "Asha Devi",
  phone: "9810022222",
  gender: "FEMALE",
  serviceCategoryIds: [cat.gda.id],
  areaIds: [],
  experienceYears: "3",
  availabilityStatus: "AVAILABLE",
  supportedShifts: ["12_HOURS"],
  affiliation: "INDEPENDENT",
  ...overrides,
}) as CaregiverInput;

beforeEach(async () => {
  await resetDb();
  cat = await makeCatalogue();
  admin = await makeUser("ADMIN");
  staff = await makeUser("STAFF");
});

describe("caregivers and nurses", () => {
  it("keeps separate records with their own codes", async () => {
    const c1 = await createCaregiver(admin, base());
    const n1 = await createCaregiver(admin, base({ kind: "NURSE", fullName: "Rekha Singh", serviceCategoryIds: [cat.nursing.id] }));
    const c2 = await createCaregiver(admin, base({ fullName: "Meena Kumari" }));
    expect([c1.code, n1.code, c2.code]).toEqual(["CG-0001", "NR-0001", "CG-0002"]);
    const nurses = await listCaregivers(admin, { kind: "NURSE" });
    expect(nurses.rows.map((r) => r.code)).toEqual(["NR-0001"]);
    expect((await listCaregivers(admin, { kind: "CAREGIVER" })).total).toBe(2);
  });

  it("stores education, skills, care types, work cities and living areas", async () => {
    await createLivingArea(admin, { name: "Shakti Nagar" });
    const [living] = await listLivingAreas(admin);
    const c = await createCaregiver(
      admin,
      base({ education: "PASS_10TH", skills: ["BP check", "Oximeter"], careTypes: ["Paralysis", "Not a real option"], workCities: ["Noida", "Other", "Mars"], livingAreaIds: [living.id] }),
    );
    const row = await db.caregiver.findUniqueOrThrow({ where: { id: c.id }, include: { livingAreas: true } });
    expect(row.education).toBe("PASS_10TH");
    expect(row.skills).toEqual(["BP check", "Oximeter"]);
    expect(row.careTypes).toEqual(["Paralysis"]);
    expect(row.workCities).toEqual(["Noida", "Other"]);
    expect(row.livingAreas.map((l) => l.livingAreaId)).toEqual([living.id]);
    expect((await listCaregivers(admin, { kind: "CAREGIVER", livingArea: living.id })).total).toBe(1);
  });

  it("keeps attendant services that the caregiver form no longer shows", async () => {
    const attendant = await db.serviceCategory.create({ data: { name: "Male Patient Attendant", slug: "male-patient-attendant", summary: "x", description: "x" } });
    const c = await createCaregiver(admin, base({ serviceCategoryIds: [cat.gda.id, attendant.id] }));
    await updateCaregiver(admin, c.id, base({ serviceCategoryIds: [cat.gda.id] }));
    const links = await db.caregiverService.findMany({ where: { caregiverId: c.id } });
    expect(links.map((l) => l.serviceCategoryId).sort()).toEqual([cat.gda.id, attendant.id].sort());
  });
});

describe("photo and Aadhaar images", () => {
  it("lets staff see photos but never Aadhaar images", async () => {
    const c = await createCaregiver(admin, base());
    await saveStaffFiles(admin, c.id, { PHOTO: jpeg(), AADHAAR: jpeg() });
    await expect(getStaffFile(staff, c.id, "PHOTO")).resolves.toMatchObject({ mimeType: "image/jpeg" });
    await expect(getStaffFile(staff, c.id, "AADHAAR")).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getStaffFile(admin, c.id, "AADHAAR")).resolves.toMatchObject({ mimeType: "image/jpeg" });
  });

  it("rejects staff uploading Aadhaar and files that are not images", async () => {
    const c = await createCaregiver(admin, base());
    await expect(saveStaffFiles(staff, c.id, { AADHAAR: jpeg() })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(saveStaffFiles(admin, c.id, { PHOTO: new File(["<script>"], "x.jpg", { type: "image/jpeg" }) })).rejects.toThrow(/JPG, PNG or WebP/);
  });

  it("treats an empty file input as keeping the current image", async () => {
    const c = await createCaregiver(admin, base());
    await saveStaffFiles(admin, c.id, { PHOTO: jpeg() });
    await saveStaffFiles(admin, c.id, { PHOTO: new File([], "") });
    expect(await db.staffFile.count({ where: { caregiverId: c.id } })).toBe(1);
  });
});
