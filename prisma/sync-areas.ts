/**
 * Adds any locality in prisma/areas.ts that the database does not have yet.
 * Existing areas are left exactly as they are. Run with: npx tsx prisma/sync-areas.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { AREAS } from "./areas";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const before = await db.serviceArea.count();
  for (const [city, localities] of Object.entries(AREAS)) {
    for (const [i, [locality, pincode]] of localities.entries()) {
      await db.serviceArea.upsert({
        where: { city_locality: { city, locality } },
        update: {},
        create: { city, locality, pincode, sortOrder: i },
      });
    }
  }
  console.log(`${(await db.serviceArea.count()) - before} areas added.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
