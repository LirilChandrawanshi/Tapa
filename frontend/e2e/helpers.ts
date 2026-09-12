import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test";

export const OTP_MASTER = "000000";

/** Dev phone numbers (master OTP works for any 10-digit number). */
export const PHONES = {
  admin: "9876543210", // seeded ADMIN role
  member: "9812399999", // plain member used by auth.spec sign-in flow
  saver: "9812366666", // plain member used by the article save-gate flow
  nonAdmin: "9812388888", // plain member without the EDITOR/ADMIN role
} as const;

export const ARTICLE_PATH =
  "/ritual-guides/festive-pujans/sawan-somwar-vrat";
export const ARTICLE_TITLE_EN = "Sawan Somwar Vrat — the complete guide";
export const ARTICLE_TITLE_HI = "सावन सोमवार व्रत — सम्पूर्ण विधि";

/**
 * Completes the phone → OTP UI flow rendered inside `scope` (the inline
 * /sign-in card or the contextual bottom sheet). Handles the one-time
 * profile step for brand-new numbers, though global-setup pre-creates the
 * test users so it normally never appears.
 */
export async function completeOtpUi(
  page: Page,
  phone: string,
  scope?: Locator,
) {
  const root = scope ?? page.locator("body");
  await root.getByLabel("Your WhatsApp number").fill(phone);
  await root.getByRole("button", { name: "Send OTP" }).click();
  const firstBox = root.getByRole("textbox", { name: "OTP digit 1" });
  await expect(firstBox).toBeVisible();
  // Typing the whole code into box 1 fills all six (paste behaviour) and
  // auto-verifies.
  await firstBox.fill(OTP_MASTER);
  const profileName = root.locator("#tapa-name");
  try {
    await profileName.waitFor({ state: "visible", timeout: 3_000 });
    await profileName.fill("Tapa Tester");
    await root.getByRole("button", { name: "Save & continue" }).click();
  } catch {
    // Existing user — no profile step, already signed in.
  }
}

/**
 * Signs a browser context in through the same-origin API proxy without any
 * UI. Use `page.request` / `context.request` so the httpOnly session
 * cookies land in the browser's cookie jar.
 */
export async function signInViaApi(api: APIRequestContext, phone: string) {
  await api.post("/api/v1/auth/otp/request", {
    data: { phone: `+91${phone}` },
  }); // may be throttled on re-runs — the master code verifies regardless
  const verify = await api.post("/api/v1/auth/otp/verify", {
    data: { phone: `+91${phone}`, code: OTP_MASTER },
  });
  expect(
    verify.ok(),
    `dev OTP verify for +91${phone} (HTTP ${verify.status()})`,
  ).toBeTruthy();
}

/**
 * Asserts the given elements are stacked strictly top-to-bottom in the
 * viewport/page — layout-based so it survives class-name churn.
 */
export async function expectVerticalOrder(items: Array<[string, Locator]>) {
  let lastY = Number.NEGATIVE_INFINITY;
  let lastName = "(top of page)";
  for (const [name, locator] of items) {
    await expect(locator, `${name} should be on the page`).toBeVisible();
    const box = await locator.boundingBox();
    expect(box, `${name} should be laid out`).not.toBeNull();
    expect(
      box!.y,
      `"${name}" should appear below "${lastName}"`,
    ).toBeGreaterThan(lastY);
    lastY = box!.y;
    lastName = name;
  }
}
