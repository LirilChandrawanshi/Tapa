import { expect, test } from "./fixtures";
import {
  ARTICLE_PATH,
  ARTICLE_TITLE_EN,
  ARTICLE_TITLE_HI,
} from "./helpers";

test.describe("EN / हिं language toggle", () => {
  test("swaps the article title to Devanagari and back", async ({ page }) => {
    await page.goto(ARTICLE_PATH);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(ARTICLE_TITLE_EN);

    // Toggles exist in the top nav and the breadcrumb row — any will do.
    const toggle = page
      .getByRole("group", { name: "Language" })
      .first();
    await toggle.getByRole("button", { name: "हिं" }).click();
    await expect(h1).toHaveText(ARTICLE_TITLE_HI);
    await expect(
      toggle.getByRole("button", { name: "हिं" }),
    ).toHaveAttribute("aria-pressed", "true");

    await toggle.getByRole("button", { name: "EN" }).click();
    await expect(h1).toHaveText(ARTICLE_TITLE_EN);
  });

  test("choice persists across navigation via the tapa-lang cookie", async ({
    page,
    context,
  }) => {
    await page.goto(ARTICLE_PATH);
    await page
      .getByRole("group", { name: "Language" })
      .first()
      .getByRole("button", { name: "हिं" })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      ARTICLE_TITLE_HI,
    );

    const cookies = await context.cookies();
    const lang = cookies.find((c) => c.name === "tapa-lang");
    expect(lang?.value).toBe("hi");

    // Navigate away and back — a brand-new document must read the cookie.
    await page.goto("/");
    await page.goto(ARTICLE_PATH);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      ARTICLE_TITLE_HI,
    );
    await expect(
      page
        .getByRole("group", { name: "Language" })
        .first()
        .getByRole("button", { name: "हिं" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
