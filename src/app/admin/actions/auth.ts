"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { requireActor } from "@/lib/auth/dal";
import { clearRateLimit, rateLimit } from "@/lib/rate-limit";
import { clientFingerprint } from "@/lib/request-context";
import { loginSchema } from "@/lib/validation/admin";
import { failure, success, toActionState, type ActionState } from "@/lib/actions/state";
import { resetUserPassword } from "@/lib/services/users";

const GENERIC = "Email or password is incorrect.";

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success || !parsed.data.email || !parsed.data.password) return failure("Enter your email and password.");
  const { email, password } = parsed.data;
  const fp = await clientFingerprint();
  const ipOk = await rateLimit(`login-ip:${fp}`, 20, 15 * 60_000);
  const emailOk = await rateLimit(`login-email:${email}`, 8, 15 * 60_000);
  if (!ipOk || !emailOk) return failure("Too many sign-in attempts. Please wait 15 minutes and try again.");

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    await burnPasswordCheck(password);
    return failure(GENERIC);
  }
  if (!(await verifyPassword(password, user.passwordHash))) return failure(GENERIC);

  await clearRateLimit(`login-email:${email}`);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await db.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } });
  await createSession(user.id);
  await audit({ actorId: user.id, action: "auth.login", entityType: "User", entityId: user.id, summary: `${user.name} signed in` });
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function changeOwnPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const current = String(formData.get("currentPassword") ?? "");
    const next = String(formData.get("newPassword") ?? "");
    const user = await db.user.findUniqueOrThrow({ where: { id: actor.id } });
    if (!(await verifyPassword(current, user.passwordHash))) return failure("Your current password is incorrect.", { currentPassword: "Incorrect password" });
    await resetUserPassword(actor, actor.id, next);
    await createSession(actor.id);
    return success("Password changed. Other sessions have been signed out.");
  } catch (error) {
    return toActionState(error);
  }
}
