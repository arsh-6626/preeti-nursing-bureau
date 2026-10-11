import type { Page } from "@playwright/test";

export const ADMIN = { email: "e2e-admin@test.local", password: "E2eAdminPass123" };
export const STAFF = { email: "e2e-staff@test.local", password: "E2eStaffPass123" };

export async function login(page: Page, who: { email: string; password: string }) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

export function isoDate(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

/** Scrolls an element to the middle of the viewport (clear of the sticky header) before acting on it. */
export async function centered<T extends { evaluate: (fn: (el: Element) => void) => Promise<void> }>(locator: T): Promise<T> {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center" }));
  return locator;
}
