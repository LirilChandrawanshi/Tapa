import { expect, test } from "./fixtures";
import { ARTICLE_PATH, ARTICLE_TITLE_EN } from "./helpers";

const NUDGE_CTA = "Join the Tapa Circle";

test.describe("WhatsApp / Tapa Circle nudge", () => {
  test("visible on a first article visit and counts its impression", async ({
    page,
  }) => {
    await page.goto(ARTICLE_PATH);
    await expect(
      page.getByRole("link", { name: new RegExp(NUDGE_CTA) }).first(),
    ).toBeVisible();
    const impressions = await page.evaluate(() =>
      localStorage.getItem("tapa-nudge-impressions"),
    );
    expect(Number(impressions)).toBeGreaterThanOrEqual(1);
  });

  test("stops rendering after 3 recorded impressions", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("tapa-nudge-impressions", "3");
    });
    await page.goto(ARTICLE_PATH);
    // Page is fully interactive before we assert absence.
    await expect(
      page.getByRole("heading", { level: 1, name: ARTICLE_TITLE_EN }),
    ).toBeVisible();
    await expect(page.getByText("CORRECTION").first()).toBeAttached();
    // Give hydration a beat so a would-be nudge had its chance to mount.
    await page.waitForTimeout(750);
    await expect(
      page.getByRole("link", { name: new RegExp(NUDGE_CTA) }),
    ).toHaveCount(0);
  });

  test("suppressed once the user has joined the Circle", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("tapa-circle-joined", "true");
    });
    await page.goto(ARTICLE_PATH);
    await expect(
      page.getByRole("heading", { level: 1, name: ARTICLE_TITLE_EN }),
    ).toBeVisible();
    await expect(page.getByText("CORRECTION").first()).toBeAttached();
    // Give hydration a beat so a would-be nudge had its chance to mount.
    await page.waitForTimeout(750);
    await expect(
      page.getByRole("link", { name: new RegExp(NUDGE_CTA) }),
    ).toHaveCount(0);
    // And it never burned an impression for a joined member.
    expect(
      await page.evaluate(() =>
        localStorage.getItem("tapa-nudge-impressions"),
      ),
    ).toBeNull();
  });
});
