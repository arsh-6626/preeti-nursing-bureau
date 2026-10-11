import "server-only";
import type { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan, DomainError, NotFoundError, type Actor } from "@/lib/auth/permissions";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { userCreateSchema } from "@/lib/validation/admin";

export async function listUsers(actor: Actor) {
  assertCan(actor, "users:manage");
  return db.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
}

export async function createUser(actor: Actor, input: z.input<typeof userCreateSchema>) {
  assertCan(actor, "users:manage");
  const data = userCreateSchema.parse(input);
  const policy = passwordPolicyError(data.password);
  if (policy) throw new DomainError(policy);
  if (await db.user.findUnique({ where: { email: data.email } })) throw new DomainError("A user with this email already exists.");
  const passwordHash = await hashPassword(data.password);
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name: data.name, email: data.email, role: data.role, passwordHash } });
    await audit({ actorId: actor.id, action: "user.create", entityType: "User", entityId: user.id, summary: `Created ${data.role.toLowerCase()} account for ${data.name}` }, tx);
  });
}

export async function setUserActive(actor: Actor, userId: string, isActive: boolean) {
  assertCan(actor, "users:manage");
  if (userId === actor.id && !isActive) throw new DomainError("You cannot deactivate your own account.");
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found.");
    if (!isActive && user.role === "ADMIN") {
      const admins = await tx.user.count({ where: { role: "ADMIN", isActive: true } });
      if (admins <= 1) throw new DomainError("At least one active administrator is required.");
    }
    await tx.user.update({ where: { id: userId }, data: { isActive } });
    if (!isActive) await tx.session.deleteMany({ where: { userId } });
    await audit({ actorId: actor.id, action: isActive ? "user.activate" : "user.deactivate", entityType: "User", entityId: userId, summary: `${isActive ? "Activated" : "Deactivated"} ${user.name}` }, tx);
  });
}

export async function resetUserPassword(actor: Actor, userId: string, password: string) {
  if (actor.id !== userId) assertCan(actor, "users:manage");
  const policy = passwordPolicyError(password);
  if (policy) throw new DomainError(policy);
  const passwordHash = await hashPassword(password);
  await db.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { userId } });
    await audit({ actorId: actor.id, action: "user.password_reset", entityType: "User", entityId: userId, summary: `Password changed for ${user.name}` }, tx);
  });
}

export async function listAuditLog(actor: Actor, page: number, entityType?: string) {
  assertCan(actor, "audit:read");
  const size = 50;
  const where = entityType ? { entityType } : {};
  const [total, rows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * size, take: size, include: { actor: { select: { name: true } } } }),
  ]);
  return { total, rows, page, pageCount: Math.max(1, Math.ceil(total / size)) };
}
