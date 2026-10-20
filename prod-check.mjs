import { chromium } from "playwright";
const base = "https://preeti-nursing-bureau.vercel.app";
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(base + "/admin/login");
await p.getByLabel("Email").fill("arsh@preetinursing.com");
await p.getByLabel("Password").fill("preetinursing@06#");
await p.getByRole("button", { name: /sign in/i }).click();
await p.waitForURL(/\/admin$/, { timeout: 20000 });
for (const [path, text] of [["/admin/nurses", "Nurses"], ["/admin/caregivers", "Caregivers"], ["/admin/nurses/new", "Add nurse"], ["/admin/caregivers/new", "Can look after"], ["/admin/settings", "Staff living areas"]]) {
  const r = await p.goto(base + path);
  const ok = await p.getByText(text).first().isVisible().catch(() => false);
  console.log(path, r.status(), ok ? "ok" : "MISSING " + text);
}
await b.close();
