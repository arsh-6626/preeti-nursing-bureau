import "dotenv/config";
import { vi } from "vitest";

// Point every Prisma client created during tests at the isolated test database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.BCRYPT_COST = "4";

// next/headers and next/navigation are only available inside a Next.js request.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
  headers: async () => new Headers(),
}));
