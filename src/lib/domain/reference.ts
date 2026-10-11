import { createHash, randomBytes, randomInt } from "node:crypto";

// Unambiguous characters (no 0/O, 1/I/L) so references are easy to read aloud on the phone.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Generates a random, non-sequential request reference such as PNB-7KQ3-M9XD. */
export function generateReference(): string {
  const pick = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `PNB-${pick(4)}-${pick(4)}`;
}

export function isReferenceFormat(value: string): boolean {
  return /^PNB-[23456789A-HJKMNP-Z]{4}-[23456789A-HJKMNP-Z]{4}$/.test(value);
}

/** Generates an unguessable token (256 bits) for the customer's status link. */
export function generatePublicToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isPublicTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
