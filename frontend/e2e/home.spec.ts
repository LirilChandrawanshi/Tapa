import { expect, test } from "./fixtures";
import { expectVerticalOrder } from "./helpers";

test.describe("homepage", () => {
  test("sections render in the locked order", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main");

    await expectVerticalOrder([
      // 3 — hero (real card or fallback both carry the eyebrow)
      ["hero eyebrow", main.getByText(/Today.s Ritual ·/).first()],
      // 4 — trust badge strip
      ["trust strip", main.getByText("Scripturally sourced").first()],
      // 5 — panchang first fold
      ["panchang fold", main.getByText(/Today.s Panchang/).first()],
      // 6 — kits teaser (flag off ⇒ pre-booking teaser)
      [
        "kits teaser",
        main.getByText("Ritual Pujans — pre-booking opens soon"),
      ],
      // 7 — journey stepper
      ["journey stepper", main.getByText("Six steps, start to finish")],
      // 8 — from ritual guides
      [
        "guides rail",
        main.getByText("The complete vidhi, before the date arrives"),
      ],
      // 9 — purohit strip
      ["purohit strip", main.getByText("Pujan with Purohit — Coming soon")],
      // 11 — explore by category
      ["category tiles", main.getByText("Start wherever you are")],
    ]);
  });

  test("nav shows the LAUNCHING SOON pill for the gated Ritual Pujans tab", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation").first();
    const gated = nav.locator("span", { hasText: "Ritual Pujans" }).first();
    await expect(gated).toBeVisible();
    await expect(gated.getByText("LAUNCHING SOON")).toBeVisible();
    // The gated tab is a pill, not a working nav button.
    await expect(
      nav.getByRole("button", { name: /Ritual Pujans/ }),
    ).toHaveCount(0);
  });

  test("footer carries the Grievance Officer block", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer").first();
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByText(/GRIEVANCE OFFICER/i)).toBeVisible();
    await expect(
      footer.getByText(/grievance@thetapaco\.com/).first(),
    ).toBeVisible();
  });
});
