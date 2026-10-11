import { expect, test } from "@playwright/test";
import { centered, isoDate } from "./helpers";

test("a family can submit a care request from a phone and gets a reference", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('a[href^="tel:"]:visible').first()).toBeVisible();
  await expect(page.locator('a[href^="https://wa.me/"]:visible').first()).toBeVisible();

  // Hero call to action opens the request form; choose the service there.
  await page.locator("main").getByRole("link", { name: "Find a Caregiver" }).first().click();
  await expect(page).toHaveURL(/\/request$/);
  await page.getByText("Elderly Care", { exact: true }).click();

  // Step 1: service chosen.
  await expect(page.getByRole("heading", { name: "What kind of care do you need?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: validation shows clear errors first.
  await expect(page.getByRole("heading", { name: "Tell us about the patient's needs" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Tell us how the patient moves around")).toBeVisible();
  await page.getByText("Needs help moving").click();
  await page.getByLabel("Briefly, what help is needed?").fill("My mother needs help walking, bathing and with meals after a fall.");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: exactly two shift options exist; choose 24 hours.
  await expect(page.getByRole("heading", { name: "Choose the shift and dates" })).toBeVisible();
  await expect(page.locator('input[name="shiftType"]')).toHaveCount(2);
  await page.getByText("Round-the-clock care arrangement", { exact: false }).click();
  await expect(page.locator('input[name="shiftType"][value="24_HOURS"]')).toBeChecked();
  await expect(page.getByText(/8[- ]hour/i)).toHaveCount(0);
  await page.getByLabel("Preferred start date").fill(isoDate(5));
  await page.getByText("Long-term").click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4: location.
  await page.getByLabel("City").selectOption("Noida");
  await page.getByLabel("Locality").selectOption({ label: "Sector 62" });
  await expect(page.getByLabel("Pincode")).toHaveValue("201309");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 5: contact details; consent is required.
  await page.getByLabel("Your name").fill("Meera Kapoor");
  await page.getByLabel("Mobile number").fill("98111 22334");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Please agree so we can contact you about this request")).toBeVisible();
  await (await centered(page.getByText("I agree to be contacted", { exact: false }))).click();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 6: review then submit.
  await expect(page.getByRole("heading", { name: "Check your request" })).toBeVisible();
  await expect(page.getByText("24 hours", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Send request" }).click();

  await expect(page).toHaveURL(/\/request\/status\//);
  await expect(page.getByText("Your request has been received")).toBeVisible();
  const reference = (await page.locator("p.tabular").first().textContent())?.trim();
  expect(reference).toMatch(/^PNB-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  await expect(page.getByText(/not a confirmed booking/)).toBeVisible();
});

test("the contact page saves a callback request", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Harpreet Gill");
  await page.getByLabel("Mobile number").fill("9876543210");
  await (await centered(page.getByText("I agree to be contacted", { exact: false }))).click();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: "Request a call back" }).click();
  await expect(page.getByText("We will call you back")).toBeVisible();
});

test("public pages and policy pages load", async ({ page }) => {
  for (const path of ["/services", "/services/home-nursing", "/about", "/legal/privacy-policy", "/legal/service-limitations"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
  }
  await expect(page.getByText(/112/).first()).toBeVisible();
});
