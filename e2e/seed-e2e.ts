/** Test-only setup: empties the TEST database, runs the base seed and adds test accounts. */
import "dotenv/config";
import { execSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL!;
if (!url.includes("pnb_test") && process.env.ALLOW_E2E_RESET !== "true") {
  throw new Error("Refusing to reset a database that does not look like the test database.");
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: { ...process.env, SEED_ADMIN_EMAIL: "", SEED_ADMIN_PASSWORD: "" } });
  await db.user.create({ data: { email: "e2e-admin@test.local", name: "Asha Admin", role: "ADMIN", passwordHash: await bcrypt.hash("E2eAdminPass123", 4) } });
  await db.user.create({ data: { email: "e2e-staff@test.local", name: "Sam Staff", role: "STAFF", passwordHash: await bcrypt.hash("E2eStaffPass123", 4) } });
  await db.businessSettings.update({ where: { id: 1 }, data: { phone: "+91 98100 00000", whatsapp: "+91 98100 00000" } });
}

main().finally(() => db.$disconnect());
