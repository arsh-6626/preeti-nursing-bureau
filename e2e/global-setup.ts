import { execSync } from "node:child_process";
import "dotenv/config";

/** Resets the isolated test database and loads the base seed plus test users. */
export default function globalSetup() {
  const env = { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL };
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
  execSync("npx tsx e2e/seed-e2e.ts", { stdio: "inherit", env });
}
