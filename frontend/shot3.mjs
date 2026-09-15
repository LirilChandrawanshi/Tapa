import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })).newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
// scroll gradually so the reveal observer actually fires
for (let y = 0; y < 2600; y += 300) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(160); }
await p.waitForTimeout(1200);
const sec = p.locator('section:has-text("What\'s coming, and when")').first();
const box = await sec.boundingBox();
await p.screenshot({ path: process.argv[2], clip: { x: box.x, y: Math.max(0, box.y) + 120, width: box.width, height: 360 } });
console.log("still pending in this section:", await sec.locator('[data-reveal="pending"]').count());
await b.close();
