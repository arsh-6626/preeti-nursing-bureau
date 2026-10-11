/**
 * Role-based permissions. Every server action, route handler and service
 * function checks these on the server; the UI only hides what a role cannot do.
 */
import type { Role } from "@/generated/prisma/enums";

export const PERMISSIONS = [
  "lead:read:any",
  "lead:read:assigned",
  "lead:write",
  "lead:assign",
  "lead:create",
  "customer:read",
  "customer:write",
  "caregiver:read",
  "caregiver:write",
  "caregiver:verification",
  "caregiver:compensation",
  "assignment:read",
  "assignment:write",
  "assignment:confirm",
  "finance:read",
  "finance:write",
  "reports:read",
  "settings:write",
  "users:manage",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const STAFF_PERMISSIONS: readonly Permission[] = [
  "lead:read:assigned",
  "lead:write",
  "lead:create",
  "customer:read",
  "caregiver:read",
  "assignment:read",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  STAFF: STAFF_PERMISSIONS,
};

export type Actor = { id: string; role: Role; name: string; email: string };

export function can(actor: Pick<Actor, "role"> | null | undefined, permission: Permission): boolean {
  if (!actor) return false;
  return ROLE_PERMISSIONS[actor.role].includes(permission);
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Business-rule violation with a message safe to show to the user. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export function assertCan(actor: Actor | null | undefined, permission: Permission): asserts actor is Actor {
  if (!actor) throw new AuthorizationError("Please sign in.");
  if (!can(actor, permission)) throw new AuthorizationError();
}
