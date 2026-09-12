import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const L = { "/panchang": "Today", "/panchang/vrat-calendar": "Vrat Calendar", "/panchang/festival-calendar": "Festival Calendar", "/panchang/eclipses": "Eclipses" };
let pass = 0, fail = 0;
async function go(from, to, scrollTo, expect) {
  await p.goto(`http://localhost:3000${from}`, { waitUntil: "networkidle" });
  await p.evaluate((y) => window.scrollTo(0, y === -1 ? document.documentElement.scrollHeight - 1000 : y), scrollTo);
  await p.waitForTimeout(400);
  const before = await p.evaluate(() => window.scrollY);
  await p.getByRole("navigation", { name: "Panchang sections" }).getByRole("link", { name: L[to], exact: true }).click();
  await p.waitForURL(u => u.pathname === to, { timeout: 20000 });
  await p.waitForTimeout(1800);
  const after = await p.evaluate(() => window.scrollY);
  const navTop = await p.evaluate(() => document.querySelector('nav[aria-label="Panchang sections"]').getBoundingClientRect().top);
  const ok = expect === "tabs" ? (navTop >= 60 && navTop <= 90) : after === 0;
  ok ? pass++ : fail++;
  console.log(`${L[from]} (y=${before}) → ${L[to]}: y=${after}, tabs at ${Math.round(navTop)}  ${ok ? "✓" : "✗"}`);
}
await go("/panchang/eclipses", "/panchang/festival-calendar", -1, "tabs");  // worst case
await go("/panchang", "/panchang/vrat-calendar", 1200, "tabs");
await go("/panchang/festival-calendar", "/panchang/eclipses", 2000, "tabs");
await go("/panchang/vrat-calendar", "/panchang", 3000, "tabs");
await go("/panchang/eclipses", "/panchang", -1, "tabs");
await go("/panchang", "/panchang/eclipses", 0, "top");                      // at the hero — must not move
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
