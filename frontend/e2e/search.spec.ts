import { expect, test } from "./fixtures";
import { expectVerticalOrder } from "./helpers";

test.describe("search", () => {
  test("ekadashi: definition card first, then guides, then dates; no kits group", async ({
    page,
  }) => {
    await page.goto("/search?q=ekadashi");

    const definitionCard = page.getByText("Definition · from the glossary");
    await expect(definitionCard).toBeVisible();

    await expectVerticalOrder([
      ["glossary definition card", definitionCard],
      [
        "Ritual Guides group",
        page.getByRole("heading", { name: /RITUAL GUIDES · \d+/ }),
      ],
      [
        "Panchang dates group",
        page.getByRole("heading", { name: /PANCHANG · \d+/ }),
      ],
    ]);

    // Kits stay out of results while kits_launched is off.
    await expect(
      page.getByRole("heading", { name: /RITUAL KITS · \d+/ }),
    ).toHaveCount(0);
  });

  test("typo 'ekadasi' still resolves to results", async ({ page }) => {
    await page.goto("/search?q=ekadasi");
    await expect(
      page.getByText("Definition · from the glossary"),
    ).toBeVisible();
    await expect(page.getByText(/\d+ results? for/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /RITUAL GUIDES · \d+/ }),
    ).toBeVisible();
  });

  test("gibberish shows the empty state with the request capture", async ({
    page,
  }) => {
    await page.goto("/search?q=zzxqvbnak");
    await expect(
      page.getByRole("heading", { name: /No results for/ }),
    ).toBeVisible();
    await expect(page.getByText("Tell us what you needed")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send it to us" }),
    ).toBeVisible();
  });
});
