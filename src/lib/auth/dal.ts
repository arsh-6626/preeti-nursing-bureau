import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionActor } from "./session";
import { AuthorizationError, can, type Actor, type Permission } from "./permissions";

/** Current signed-in actor for this request (memoised per request). */
export const currentActor = cache(getSessionActor);

/** For pages: redirects to the login page when not signed in. */
export async function requireActorPage(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) redirect("/admin/login");
  return actor;
}

/** For pages: requires a permission, otherwise renders the forbidden screen. */
export async function requirePermissionPage(permission: Permission): Promise<Actor> {
  const actor = await requireActorPage();
  if (!can(actor, permission)) redirect("/admin/forbidden");
  return actor;
}

/** For server actions: throws when not signed in. */
export async function requireActor(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) throw new AuthorizationError("Your session has ended. Please sign in again.");
  return actor;
}
