import { expect, test } from "./fixtures";
import { ADMIN_STORAGE_STATE, PHONES, signInViaApi } from "./helpers";

test.describe("admin panel (read-only checks — never flips anything)", () => {
  test.describe("as the seeded admin", () => {
    test.use({ storageState: ADMIN_STORAGE_STATE });

    test("/admin loads the shell and the seeded Articles list", async ({
      page,
    }) => {
      await page.goto("/admin");
      // /admin redirects to the articles workbench.
      await page.waitForURL("**/admin/articles");
      await expect(page.getByText("Tapa · Admin")).toBeVisible();
      // Left nav (the <aside> complementary region) is complete.
      const sideNav = page.getByRole("complementary");
      for (const label of ["Orders", "Articles", "Glossary", "Flags"]) {
        await expect(
          sideNav.getByRole("link", { name: label, exact: true }),
        ).toBeVisible();
      }
      // Seeded rows are visible.
      await expect(
        page.getByRole("link", { name: "sawan-somwar-vrat" }),
      ).toBeVisible();
      expect(await page.locator("tbody tr").count()).toBeGreaterThan(0);
    });

    test("Flags page lists both phase toggles (without flipping them)", async ({
      page,
    }) => {
      await page.goto("/admin/flags");
      await expect(page.getByText("Feature flags")).toBeVisible();
      await expect(page.getByText("kits_launched")).toBeVisible();
      await expect(page.getByText("purohit_tab_visible")).toBeVisible();
      const toggles = page.getByRole("button", { name: /Turn (ON|OFF)/ });
      expect(await toggles.count()).toBeGreaterThanOrEqual(2);
      // Both flags sit at their documented OFF default during the run.
      expect(
        await page.getByText("OFF", { exact: true }).count(),
      ).toBeGreaterThanOrEqual(2);
    });
  });

  test("a non-admin member sees the role explanation, not the panel", async ({
    page,
  }) => {
    await signInViaApi(page.request, PHONES.nonAdmin);
    await page.goto("/admin");
    await expect(
      page.getByText(/does not carry the EDITOR\/ADMIN role/),
    ).toBeVisible();
    // No admin nav for them.
    await expect(
      page.getByRole("link", { name: "Flags", exact: true }),
    ).toHaveCount(0);
  });
});
