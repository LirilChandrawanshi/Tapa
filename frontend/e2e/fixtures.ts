import { test as base, expect } from "@playwright/test";

/**
 * Shared test fixture.
 *
 * Environment quirk this papers over: the Spring backend's dev CORS
 * allowlist contains only http://localhost:3000, and the Next `/api/v1`
 * rewrite proxy forwards the browser's Origin header verbatim. From the
 * :3100 test server every browser POST through the proxy therefore bounces
 * off Spring's CORS filter with a non-JSON 403 — even though the request is
 * same-origin by construction. Stripping the Origin header at the browser
 * boundary restores the same-origin semantics the proxy is meant to give.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    // route.continue() cannot override Origin (CORS-sensitive header), so
    // re-issue via the context's request API — it shares the cookie jar with
    // the browser, so httpOnly session cookies still flow both ways.
    await context.route("**/api/v1/**", async (route) => {
      const headers = { ...route.request().headers() };
      delete headers.origin;
      try {
        const response = await route.fetch({ headers });
        await route.fulfill({ response });
      } catch {
        // The test ended with this call in flight — nobody to serve.
        await route.abort().catch(() => {});
      }
    });
    await use(context);
    await context
      .unrouteAll({ behavior: "ignoreErrors" })
      .catch(() => {});
  },
});

export { expect };
