import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

/** Client IP (best effort, from the reverse proxy), hashed so raw IPs are never stored. */
export async function clientFingerprint(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}|${process.env.SESSION_SECRET ?? ""}`).digest("hex").slice(0, 32);
}
