import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { submitPublicRequest, getPublicRequestStatus, createManualLead } from "@/lib/services/requests";
import { getLeadDetail, listLeads, updateLeadStatus, addLeadNote, scheduleFollowUp, completeFollowUp, logCall } from "@/lib/services/leads";
import { AuthorizationError, DomainError, NotFoundError } from "@/lib/auth/permissions";
import { generatePublicToken } from "@/lib/domain/reference";
import { makeCatalogue, makeUser, resetDb, validRequestPayload } from "../support/db";

let cat: Awaited<ReturnType<typeof makeCatalogue>>;
beforeEach(async () => {
  await resetDb();
  cat = await makeCatalogue();
});

describe("public care requests", () => {
  it("persists a valid 12-hour request with a reference and status token", async () => {
    const result = await submitPublicRequest(validRequestPayload({ serviceCategoryId: cat.gda.id, serviceAreaId: cat.area.id }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reference).toMatch(/^PNB-/);
    const row = await db.serviceRequest.findUniqueOrThrow({ where: { reference: result.reference }, include: { customer: true, statusChanges: true } });
    expect(row.shiftType).toBe("TWELVE_HOURS");
    expect(row.status).toBe("NEW");
    expect(row.customer.phone).toBe("9810023456");
    expect(row.statusChanges).toHaveLength(1);
    expect(row.publicTokenHash).not.toBe(result.token);
  });

  it("persists a valid 24-hour request", async () => {
    const result = await submitPublicRequest(validRequestPayload({ shiftType: "24_HOURS", serviceCategoryId: cat.gda.id }));
    expect(result.ok).toBe(true);
    const row = await db.serviceRequest.findFirstOrThrow();
    expect(row.shiftType).toBe("TWENTY_FOUR_HOURS");
  });

  it("rejects an 8-hour request and saves nothing", async () => {
    const result = await submitPublicRequest(validRequestPayload({ shiftType: "8_HOURS", serviceCategoryId: cat.gda.id }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors?.shiftType).toMatch(/12 hours or 24 hours/);
    expect(await db.serviceRequest.count()).toBe(0);
  });

  it("rejects invalid requests with field errors", async () => {
    const result = await submitPublicRequest(validRequestPayload({ phone: "123", pincode: "abc", contactConsent: false, careDescription: "" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors ?? {})).toEqual(expect.arrayContaining(["phone", "pincode", "contactConsent", "careDescription"]));
  });

  it("rejects inactive services and past start dates", async () => {
    await db.serviceCategory.update({ where: { id: cat.gda.id }, data: { isActive: false } });
    const r1 = await submitPublicRequest(validRequestPayload({ serviceCategoryId: cat.gda.id }));
    expect(r1.ok).toBe(false);
    const r2 = await submitPublicRequest(validRequestPayload({ serviceCategoryId: cat.nursing.id, startDate: "2020-01-01" }));
    expect(r2.ok).toBe(false);
    expect(await db.serviceRequest.count()).toBe(0);
  });

  it("handles duplicate submissions idempotently", async () => {
    const payload = validRequestPayload({ serviceCategoryId: cat.gda.id });
    const [a, b] = await Promise.all([submitPublicRequest(payload), submitPublicRequest(payload)]);
    const c = await submitPublicRequest(payload);
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (!a.ok || !b.ok || !c.ok) return;
    expect(new Set([a.reference, b.reference, c.reference]).size).toBe(1);
    // Every issued status link keeps working; none is invalidated by a repeat.
    for (const r of [a, b, c]) expect((await getPublicRequestStatus(r.token))?.reference).toBe(a.reference);
    expect(await db.serviceRequest.count()).toBe(1);
    expect(await db.customer.count()).toBe(1);
  });

  it("enforces the two shift values in the database itself", async () => {
    await submitPublicRequest(validRequestPayload({ serviceCategoryId: cat.gda.id }));
    const row = await db.serviceRequest.findFirstOrThrow();
    await expect(
      db.$executeRawUnsafe(`UPDATE "ServiceRequest" SET "shiftType" = '8_HOURS' WHERE id = '${row.id}'`),
    ).rejects.toThrow();
    await expect(
      db.$executeRawUnsafe(`UPDATE "ServiceRequest" SET "shiftType" = '24_HOURS' WHERE id = '${row.id}'`),
    ).resolves.toBe(1);
  });

  it("shows a limited public status only for the correct unguessable token", async () => {
    const result = await submitPublicRequest(validRequestPayload({ serviceCategoryId: cat.gda.id }));
    if (!result.ok) throw new Error("submit failed");
    const status = await getPublicRequestStatus(result.token);
    expect(status?.reference).toBe(result.reference);
    expect(status).not.toHaveProperty("careDescription");
    expect(status).not.toHaveProperty("customer");
    expect(JSON.stringify(status)).not.toContain("9810023456");
    expect(await getPublicRequestStatus(generatePublicToken())).toBeNull();
    const row = await db.serviceRequest.findFirstOrThrow();
    expect(await getPublicRequestStatus(row.id)).toBeNull();
    expect(await getPublicRequestStatus(result.reference)).toBeNull();
  });
});

describe("lead management", () => {
  async function seedLead() {
    const r = await submitPublicRequest(validRequestPayload({ serviceCategoryId: cat.gda.id }));
    if (!r.ok) throw new Error("seed failed");
    return db.serviceRequest.findUniqueOrThrow({ where: { reference: r.reference } });
  }

  it("records status changes with the actor and enforces transitions", async () => {
    const admin = await makeUser("ADMIN");
    const lead = await seedLead();
    await updateLeadStatus(admin, { requestId: lead.id, toStatus: "CONTACTED", note: "Spoke to daughter" });
    await expect(updateLeadStatus(admin, { requestId: lead.id, toStatus: "COMPLETED" })).rejects.toBeInstanceOf(DomainError);
    await expect(updateLeadStatus(admin, { requestId: lead.id, toStatus: "CAREGIVER_ASSIGNED" })).rejects.toBeInstanceOf(DomainError);
    const history = await db.statusChange.findMany({ where: { requestId: lead.id }, orderBy: { createdAt: "asc" } });
    expect(history.map((h) => h.toStatus)).toEqual(["NEW", "CONTACTED"]);
    expect(history[1].changedById).toBe(admin.id);
    expect(await db.auditLog.count({ where: { action: "lead.status" } })).toBe(1);
  });

  it("requires a reason to cancel a lead and closes pending follow-ups", async () => {
    const admin = await makeUser("ADMIN");
    const lead = await seedLead();
    await scheduleFollowUp(admin, { requestId: lead.id, dueAt: new Date(Date.now() + 3600_000).toISOString() });
    await expect(updateLeadStatus(admin, { requestId: lead.id, toStatus: "CANCELLED" })).rejects.toBeInstanceOf(DomainError);
    await updateLeadStatus(admin, { requestId: lead.id, toStatus: "CANCELLED", closedReason: "Family arranged care themselves" });
    expect(await db.followUp.count({ where: { requestId: lead.id, status: "PENDING" } })).toBe(0);
  });

  it("does not let staff read or change leads that are not assigned to them", async () => {
    const staff = await makeUser("STAFF");
    const lead = await seedLead();
    await expect(getLeadDetail(staff, lead.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateLeadStatus(staff, { requestId: lead.id, toStatus: "CONTACTED" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(addLeadNote(staff, lead.id, { body: "x" })).rejects.toBeInstanceOf(NotFoundError);
    expect((await listLeads(staff, {})).total).toBe(0);
    await db.serviceRequest.update({ where: { id: lead.id }, data: { assignedToId: staff.id } });
    const detail = await getLeadDetail(staff, lead.id);
    expect(detail.id).toBe(lead.id);
    expect((await listLeads(staff, {})).total).toBe(1);
  });

  it("searches by reference, name and phone", async () => {
    const admin = await makeUser("ADMIN");
    const lead = await seedLead();
    expect((await listLeads(admin, { q: lead.reference })).total).toBe(1);
    expect((await listLeads(admin, { q: "ritika" })).total).toBe(1);
    expect((await listLeads(admin, { q: "23456" })).total).toBe(1);
    expect((await listLeads(admin, { q: "nobody" })).total).toBe(0);
    expect((await listLeads(admin, { shift: "24_HOURS" })).total).toBe(0);
  });

  it("tracks follow-ups and call outcomes", async () => {
    const admin = await makeUser("ADMIN");
    const lead = await seedLead();
    await scheduleFollowUp(admin, { requestId: lead.id, dueAt: new Date(Date.now() - 60_000).toISOString(), notes: "Call back" });
    expect((await listLeads(admin, { view: "overdue" })).total).toBe(1);
    const fu = await db.followUp.findFirstOrThrow({ where: { requestId: lead.id } });
    await completeFollowUp(admin, { followUpId: fu.id, outcome: "NO_ANSWER" });
    await logCall(admin, { requestId: lead.id, outcome: "REACHED", notes: "Needs care from Monday" });
    const updated = await db.serviceRequest.findUniqueOrThrow({ where: { id: lead.id } });
    expect(updated.status).toBe("CONTACTED");
    expect(updated.lastCallOutcome).toBe("REACHED");
  });

  it("creates manual phone leads and rejects unsupported shifts there too", async () => {
    const staff = await makeUser("STAFF");
    const bad = await createManualLead(staff, { ...validRequestPayload({ shiftType: "8_HOURS", serviceCategoryId: cat.gda.id }), source: "PHONE" });
    expect(bad.ok).toBe(false);
    const ok = await createManualLead(staff, { ...validRequestPayload({ serviceCategoryId: cat.gda.id }), source: "PHONE" });
    expect(ok.ok).toBe(true);
    const row = await db.serviceRequest.findFirstOrThrow();
    expect(row.source).toBe("PHONE");
    expect(row.assignedToId).toBe(staff.id);
  });

  it("refuses unauthenticated actors", async () => {
    await expect(listLeads(null as never, {})).rejects.toBeInstanceOf(AuthorizationError);
  });
});
