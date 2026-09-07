import { expect, test } from "./fixtures";
import { ARTICLE_PATH, ARTICLE_TITLE_EN } from "./helpers";

test.describe("Sawan Somwar article", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ARTICLE_PATH);
    await expect(
      page.getByRole("heading", { level: 1, name: ARTICLE_TITLE_EN }),
    ).toBeVisible();
  });

  test("DPB badge, source-of-truth card and per-step pills", async ({
    page,
  }) => {
    // Core DPB badge: DHARMA · 4/5 (hero + source-of-truth card + sidebar)
    await expect(page.getByText(/DHARMA · 4\/5/).first()).toBeVisible();

    // Source-of-truth card names the scripture
    const sourceCard = page
      .locator("div")
      .filter({ hasText: "SOURCE OF TRUTH" })
      .filter({ hasText: "CORE PRACTICE" })
      .last();
    await expect(sourceCard.getByText("CORE PRACTICE").first()).toBeVisible();
    await expect(
      sourceCard.getByText(/Shiva Purana/).first(),
    ).toBeVisible();

    // Vidhi steps present, each with its pills; at least one is PRATHA
    // exact:true keeps these off the intelligence-table rows ("Step 1 — …")
    await expect(
      page.getByText("Bathe and clean the puja space", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Take the sankalp", { exact: true }),
    ).toBeVisible();
    const prathaPills = page.getByText(/^PRATHA(\s·\s\d\/5)?$/);
    expect(await prathaPills.count()).toBeGreaterThan(0);
  });

  test("japa counter increments and persists across reload", async ({
    page,
  }) => {
    const increase = page.getByRole("button", { name: "Increase count" });
    await increase.scrollIntoViewIfNeeded();
    // The count sits directly above the "of <target>" caption.
    const countValue = page
      .getByText(/^of \d+$/)
      .locator("xpath=preceding-sibling::p[1]");
    await expect(countValue).toHaveText("0");

    await increase.click();
    await increase.click();
    await increase.click();
    await expect(countValue).toHaveText("3");

    await page.reload();
    await expect(
      page.getByText(/^of \d+$/).locator("xpath=preceding-sibling::p[1]"),
    ).toHaveText("3"); // sessionStorage survives a same-tab reload
  });

  test("samagri checkbox state persists across reload", async ({ page }) => {
    const firstBox = page.getByRole("checkbox").first();
    await firstBox.scrollIntoViewIfNeeded();
    await expect(firstBox).not.toBeChecked();
    await firstBox.check();
    await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible();

    await page.reload();
    await expect(page.getByRole("checkbox").first()).toBeChecked();
    await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible();
  });

  test("myths render as question then correction answer", async ({ page }) => {
    const question = page.getByText(
      /I broke my fast by mistake\. Is the vrat ruined/,
    );
    await question.scrollIntoViewIfNeeded();
    await expect(question).toBeVisible();
    const correctionTags = page.getByText("CORRECTION", { exact: true });
    expect(await correctionTags.count()).toBeGreaterThan(0);

    // The answer panel follows its question in the layout.
    const answer = page.getByText(
      /No text attaches punishment to an honest lapse/,
    );
    await expect(answer).toBeVisible();
    const qBox = await question.boundingBox();
    const aBox = await answer.boundingBox();
    expect(qBox).not.toBeNull();
    expect(aBox).not.toBeNull();
    expect(aBox!.y).toBeGreaterThan(qBox!.y);
  });

  test("intelligence layer expands to the full claims table", async ({
    page,
  }) => {
    const details = page.locator("details", {
      hasText: "TAPA INTELLIGENCE LAYER",
    });
    await details.scrollIntoViewIfNeeded();
    await expect(details).not.toHaveAttribute("open", "");
    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");
    await expect(
      details.getByRole("cell", { name: /Core practice \(this guide\)/ }),
    ).toBeVisible();
    // Core row + every DPB-tagged vidhi step
    expect(await details.locator("tbody tr").count()).toBeGreaterThan(1);
  });

  test("JSON-LD includes an FAQPage for the myths", async ({ page }) => {
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(jsonLd).toBeTruthy();
    const parsed = JSON.parse(jsonLd!) as Array<{ "@type": string }>;
    const types = parsed.map((entry) => entry["@type"]);
    expect(types).toContain("Article");
    expect(types).toContain("FAQPage");
  });
});
