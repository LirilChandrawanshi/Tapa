import { expect, test } from "./fixtures";

/**
 * While kits_launched / purohit_tab_visible are OFF (their default), every
 * commerce surface — including direct URLs — lands on the PhaseClosed
 * pre-launch state. This spec never flips a flag.
 */
test.describe("feature-flag gates (flags off)", () => {
  for (const path of ["/ritual-pujans", "/cart", "/checkout"]) {
    test(`${path} shows the kits pre-booking-closed state`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(
        page.getByRole("heading", {
          name: "Pre-booking has not opened yet",
        }),
      ).toBeVisible();
      await expect(
        page.getByText("Read the free guides meanwhile", { exact: false }),
      ).toBeVisible();
    });
  }

  test("/pujan-with-purohit shows the purohit-closed state", async ({
    page,
  }) => {
    await page.goto("/pujan-with-purohit");
    await expect(
      page.getByRole("heading", { name: "Purohit booking opens soon" }),
    ).toBeVisible();
    await expect(
      page.getByText("Read the free guides meanwhile", { exact: false }),
    ).toBeVisible();
  });
});
