import "server-only";
import type { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan, can, NotFoundError, type Actor } from "@/lib/auth/permissions";
import { customerSchema } from "@/lib/validation/admin";

export const CUSTOMERS_PAGE_SIZE = 25;

/** Staff see only customers linked to leads assigned to them. */
function customerScope(actor: Actor): Prisma.CustomerWhereInput {
  assertCan(actor, "customer:read");
  if (can(actor, "lead:read:any")) return {};
  return { requests: { some: { assignedToId: actor.id } } };
}

export async function listCustomers(actor: Actor, q: string | undefined, page: number) {
  const and: Prisma.CustomerWhereInput[] = [customerScope(actor)];
  if (q) {
    const digits = q.replace(/\D/g, "");
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-10) } }] : []),
      ],
    });
  }
  const where = { AND: and };
  const [total, rows] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * CUSTOMERS_PAGE_SIZE,
      take: CUSTOMERS_PAGE_SIZE,
      include: { _count: { select: { requests: true } } },
    }),
  ]);
  return { total, rows, page, pageCount: Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE)) };
}

export async function getCustomerDetail(actor: Actor, id: string) {
  const customer = await db.customer.findFirst({
    where: { AND: [{ id }, customerScope(actor)] },
    include: {
      requests: {
        where: can(actor, "lead:read:any") ? {} : { assignedToId: actor.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reference: true,
          status: true,
          createdAt: true,
          shiftType: true,
          serviceCategory: { select: { name: true } },
          otherServiceText: true,
        },
      },
    },
  });
  if (!customer) throw new NotFoundError("Customer not found.");
  return customer;
}

export async function createCustomer(actor: Actor, input: z.input<typeof customerSchema>) {
  assertCan(actor, "customer:write");
  const data = customerSchema.parse(input);
  return db.$transaction(async (tx) => {
    const customer = await tx.customer.create({ data });
    await audit({ actorId: actor.id, action: "customer.create", entityType: "Customer", entityId: customer.id, summary: `Created customer record` }, tx);
    return customer;
  });
}

export async function updateCustomer(actor: Actor, id: string, input: z.input<typeof customerSchema>) {
  assertCan(actor, "customer:write");
  const data = customerSchema.parse(input);
  await db.$transaction(async (tx) => {
    const existing = await tx.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Customer not found.");
    await tx.customer.update({ where: { id }, data });
    await audit({ actorId: actor.id, action: "customer.update", entityType: "Customer", entityId: id, summary: `Updated customer record` }, tx);
  });
}
