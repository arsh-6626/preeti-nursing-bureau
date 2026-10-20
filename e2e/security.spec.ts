import { expect, test } from "@playwright/test";
import { STAFF, login } from "./helpers";

test("unauthenticated visitors cannot reach the admin area", async ({ page }) => {
  for (const path of ["/admin", "/admin/leads", "/admin/finance", "/admin/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
  // A forged cookie does not grant access either.
  await page.context().addCookies([{ name: "pnb_session", value: "forged-token-value", url: "http://localhost:3200" }]);
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("guessed status links reveal nothing", async ({ page }) => {
  const res1 = await page.goto("/request/status/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  expect(res1?.status()).toBe(404);
  const res2 = await page.goto("/request/status/1");
  expect(res2?.status()).toBe(404);
});

test("wrong passwords are rejected with a generic message", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(STAFF.email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
});

test("staff cannot open finance, settings, users or unassigned leads", async ({ page }) => {
  await login(page, STAFF);
  await expect(page.getByRole("link", { name: "Finance" })).toHaveCount(0);
  for (const path of ["/admin/finance", "/admin/settings", "/admin/users", "/admin/audit"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/forbidden/);
  }
  await page.goto("/admin/leads");
  await expect(page.getByText(/No leads/)).toBeVisible();
});

test("staff images are never served without signing in", async ({ request }) => {
  const res = await request.get("/admin/files/staff/00000000-0000-0000-0000-000000000000/aadhaar", { maxRedirects: 0 });
  expect(res.status()).not.toBe(200);
  expect(res.headers()["content-type"] ?? "").not.toMatch(/^image\//);
});
