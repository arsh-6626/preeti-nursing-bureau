import { chromium } from "playwright";
const S = process.argv[2];
const b = await chromium.launch({ args: ["--font-render-hinting=none"] });
for (const [n, w, h] of [["d", 1440, 900], ["m", 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3300/", { waitUntil: "networkidle" });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${S}/h2-${n}.png` });
  await p.screenshot({ path: `${S}/h2-${n}-full.png`, fullPage: true });
}
await b.close();
