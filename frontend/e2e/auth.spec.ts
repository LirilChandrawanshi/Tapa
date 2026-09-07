import { expect, test } from "./fixtures";
import {
  ARTICLE_PATH,
  completeOtpUi,
  PHONES,
} from "./helpers";

test.describe("phone-OTP auth", () => {
  test("sign in on /sign-in lands on /account, shows the phone, and logs out", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await expect(
      page.getByRole("heading", { name: "Sign in to Tapa" }),
    ).toBeVisible();

    await completeOtpUi(page, PHONES.member);

    await page.waitForURL("**/account");
    await expect(page.getByText(new RegExp(PHONES.member))).toBeVisible();
    await expect(page.getByText("Saved Rituals").first()).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(
      page.getByRole("heading", { name: "Your Tapa account" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("Save on an article while signed out opens the OTP sheet, then saves", async ({
    page,
  }) => {
    await page.goto(ARTICLE_PATH);

    const saveButton = page.getByRole("button", { name: "Save", exact: true }).first();
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByText(/Save .* to your rituals/),
    ).toBeVisible();

    await completeOtpUi(page, PHONES.saver, sheet);

    await expect(sheet).toBeHidden();
    const savedButton = page.getByRole("button", {
      name: "Saved",
      exact: true,
    });
    await expect(savedButton).toBeVisible();
    await expect(savedButton).toHaveAttribute("aria-pressed", "true");
  });
});
