import { expect, test } from "@playwright/test";
import { ADMIN, centered, isoDate, login } from "./helpers";

test.describe.configure({ mode: "serial" });

test("admin runs a lead from inquiry to confirmed assignment and payment", async ({ page }) => {
  await login(page, ADMIN);

  // 1. Record a phone lead.
  await page.goto("/admin/leads/new");
  await page.getByLabel("Name", { exact: true }).fill("Rohan Mehta");
  await page.getByLabel("Mobile number").fill("9812345678");
  await page.getByLabel("Lead source").selectOption("PHONE");
  await page.getByLabel("Service", { exact: true }).selectOption({ label: "General Duty Assistant (GDA)" });
  await page.getByLabel("Care needed").fill("Father needs help with bathing and walking after knee surgery.");
  await page.getByText("12 hours", { exact: true }).click();
  await page.getByLabel("Start date").fill(isoDate(4));
  await page.getByLabel("City").selectOption("Delhi");
  await page.getByLabel("Listed locality").selectOption({ label: "Dwarka" });
  await (await centered(page.getByRole("checkbox"))).check();
  await page.getByRole("button", { name: "Create lead" }).click();
  await page.waitForURL(/\/admin\/leads\/[0-9a-f-]{36}$/);
  const leadUrl = page.url();
  await expect(page.getByText("Rohan Mehta").first()).toBeVisible();

  // 2. Update the status; history records it.
  await page.getByLabel("Move to").selectOption("CONTACTED");
  await page.getByRole("textbox", { name: "Note (optional)", exact: true }).fill("Spoke to son");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText("Status updated.")).toBeVisible();
  await expect(page.getByText("Spoke to son")).toBeVisible();

  // 3. Add a living area, then a caregiver who lives there and works 12-hour shifts in the area.
  await page.goto("/admin/settings#living");
  await page.getByLabel("Area name").fill("Shakti Nagar");
  await page.getByRole("button", { name: "Add living area" }).click();
  await expect(page.getByText("Living area added.")).toBeVisible();
  await page.goto("/admin/caregivers/new");
  await page.getByLabel("Full name").fill("Lata Verma");
  await page.getByLabel("Mobile number").fill("9898989898");
  await page.getByLabel("Gender").selectOption("FEMALE");
  await page.getByLabel("Years of experience").fill("6");
  await page.getByLabel("General Duty Assistant (GDA)").check();
  await page.getByLabel("12 hours").check();
  await page.getByLabel("Education").selectOption("PASS_10TH");
  await page.getByLabel("BP check").check();
  await page.getByLabel("Paralysis").check();
  await page.getByLabel("Shakti Nagar").check();
  await page.getByLabel("Dwarka", { exact: true }).check();
  await page.getByLabel("Photo", { exact: true }).setInputFiles("e2e/fixtures/photo.jpg");
  await expect(page.getByText("Preparing image…")).toHaveCount(0);
  await page.getByRole("button", { name: "Create caregiver" }).click();
  await expect(page.getByText("Caregiver saved.")).toBeVisible();
  await expect(page.getByAltText("Photo of Lata Verma")).toBeVisible();
  await expect(page.getByText("Shakti Nagar")).toBeVisible();
  await expect(page.getByText("Not started").first()).toBeVisible();

  // 4. Match and propose.
  await page.goto(`${leadUrl}/match`);
  await expect(page.getByText("Lata Verma")).toBeVisible();
  await expect(page.getByText("Works 12 hours shifts")).toBeVisible();
  await page.getByRole("link", { name: "Propose" }).first().click();
  await page.getByLabel("Agreed customer amount").fill("15000");
  await page.getByLabel("Agreed caregiver payout").fill("11000");
  await page.getByRole("button", { name: "Create proposal" }).click();
  await page.waitForURL(/\/admin\/assignments\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Proposed").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm assignment" })).toHaveCount(0);

  // 5. Record both acceptances, then confirm explicitly.
  await page.getByRole("button", { name: "Record customer acceptance" }).click();
  await expect(page.getByText("Acceptance recorded.")).toBeVisible();
  await page.getByRole("button", { name: "Record caregiver acceptance" }).click();
  await expect(page.getByRole("button", { name: "Confirm assignment" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm assignment" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm assignment" }).click();
  await expect(page.getByText("Assignment confirmed.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Confirmed");
  await expect(page.getByText("Commission earned")).toBeVisible();
  await expect(page.getByText("₹1,500").first()).toBeVisible();

  // 6. Record a partial payment; outstanding updates.
  await page.getByLabel("Amount (₹)").first().fill("6000");
  await page.getByLabel("Transaction reference").fill("UPI-TEST-001");
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText("Payment recorded.")).toBeVisible();
  await expect(page.getByText("₹9,000").first()).toBeVisible();

  // 7. Lead reflects the placement; dashboard counts it.
  await page.goto(leadUrl);
  await expect(page.getByText("Caregiver assigned").first()).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByText("Customer collections in period")).toBeVisible();
});

test("dashboard shows website requests and the callback request", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/admin/leads");
  await expect(page.getByText("Meera Kapoor")).toBeVisible();
  await expect(page.getByText("Harpreet Gill")).toBeVisible();
});

test("nurses are a separate list with their own codes", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/admin/nurses/new");
  await expect(page.getByLabel("Education")).toHaveCount(0);
  await page.getByLabel("Full name").fill("Rekha Singh");
  await page.getByLabel("Mobile number").fill("9876501234");
  await page.getByLabel("Gender").selectOption("FEMALE");
  await page.getByLabel("Years of experience").fill("8");
  await page.getByLabel("Home Nursing").check();
  await page.getByLabel("24 hours").check();
  await page.getByLabel("Noida", { exact: true }).check();
  await page.getByRole("button", { name: "Create nurse" }).click();
  await expect(page.getByText("Nurse saved.")).toBeVisible();
  await expect(page.getByText(/NR-\d{4}/).first()).toBeVisible();
  await page.goto("/admin/nurses");
  await expect(page.getByRole("link", { name: "Rekha Singh" })).toBeVisible();
  await page.goto("/admin/caregivers");
  await expect(page.getByRole("link", { name: "Rekha Singh" })).toHaveCount(0);
});

/** Puts a large, hard-to-compress camera-size photo into a file input, as a phone would. */
async function attachLargePhoto(page: import("@playwright/test").Page, label: string) {
  const input = page.getByLabel(label, { exact: true });
  await input.evaluate(async (el: HTMLInputElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = 3000;
    canvas.height = 4000;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < img.data.length; i++) img.data[i] = (i % 4 === 3 ? 255 : Math.random() * 255) | 0;
    ctx.putImageData(img, 0, 0);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.95));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], "camera.jpg", { type: "image/jpeg" }));
    el.files = dt.files;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

test("large phone photos for photo and Aadhaar save together", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/admin/caregivers/new");
  await page.getByLabel("Full name").fill("Kiran Bala");
  await page.getByLabel("Mobile number").fill("9876505678");
  await page.getByLabel("12 hours").check();
  await attachLargePhoto(page, "Photo");
  await attachLargePhoto(page, "Aadhaar card");
  await expect(page.getByText("Preparing image…")).toHaveCount(0, { timeout: 20_000 });
  await page.getByRole("button", { name: "Create caregiver" }).click();
  await expect(page.getByText("Caregiver saved.")).toBeVisible();
  await expect(page.getByAltText("Photo of Kiran Bala")).toBeVisible();
  await expect(page.getByRole("link", { name: "View Aadhaar image" })).toBeVisible();
});

test("a file that is not a real image is rejected without creating a profile", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/admin/caregivers/new");
  await page.getByLabel("Full name").fill("Not Created");
  await page.getByLabel("Mobile number").fill("9876509999");
  await page.getByLabel("12 hours").check();
  // Named and typed like a photo, but not one (as with a HEIC the browser cannot read).
  await page.getByLabel("Photo", { exact: true }).setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not really an image") });
  await page.getByRole("button", { name: "Create caregiver" }).click();
  await expect(page.getByText(/Upload a JPG, PNG or WebP image/)).toBeVisible();
  await page.goto("/admin/caregivers?q=Not+Created");
  await expect(page.getByText("No caregivers match these filters")).toBeVisible();
});
