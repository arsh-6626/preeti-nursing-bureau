/**
 * Sets a new password (and optionally a new email) for an administrator and
 * signs them out everywhere. Values come from the environment and are never
 * stored in the repo.
 *
 *   DATABASE_URL=... NEW_PASSWORD='...' [NEW_EMAIL=...] [ADMIN_EMAIL=...] npx tsx prisma/reset-admin-password.ts
 *
 * Without ADMIN_EMAIL it resets the only active administrator, and refuses
 * if there is more than one.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const password = process.env.NEW_PASSWORD;
  if (!password || password.length < 12) throw new Error("NEW_PASSWORD must be at least 12 characters");
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const admins = await db.user.findMany({ where: email ? { email } : { role: "ADMIN", isActive: true } });
  if (admins.length === 0) throw new Error(email ? `No user ${email}` : "No active administrator found");
  if (admins.length > 1) throw new Error(`Several administrators (${admins.map((a) => a.email).join(", ")}): set ADMIN_EMAIL`);
  const [admin] = admins;
  const newEmail = process.env.NEW_EMAIL?.trim().toLowerCase() || admin.email;
  await db.$transaction([
    db.user.update({ where: { id: admin.id }, data: { email: newEmail, passwordHash: await bcrypt.hash(password, 12), isActive: true } }),
    db.session.deleteMany({ where: { userId: admin.id } }),
  ]);
  console.log(`Administrator ${newEmail}: password updated, existing sessions signed out.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
