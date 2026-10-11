import bcrypt from "bcryptjs";

// Cost 12 in production; tests may lower it via BCRYPT_COST (minimum 4).
const COST = Math.max(4, Math.min(15, Number(process.env.BCRYPT_COST) || 12));

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Used to keep login timing similar whether or not the email exists.
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= bcrypt.hash("timing-equaliser", COST);
  await bcrypt.compare(password, await dummyHash);
}

export function passwordPolicyError(password: string): string | null {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.length > 128) return "Use 128 characters or fewer.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Use letters and at least one number.";
  return null;
}
