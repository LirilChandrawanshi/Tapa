import { test as setup } from "@playwright/test";
import { ADMIN_STORAGE_STATE, PHONES, signInViaApi } from "./helpers";

/**
 * Setup project: sign in once as the seeded admin (9876543210) through the
 * :3100 proxy and persist the httpOnly session cookies as storageState for
 * admin.spec.ts.
 */
setup("authenticate as admin", async ({ request }) => {
  await signInViaApi(request, PHONES.admin);
  await request.storageState({ path: ADMIN_STORAGE_STATE });
});

/**
 * Purge the ISR caches before the suite runs: build-time prerenders bake in
 * whatever flag state existed at `next build`, and the backend's revalidation
 * webhook only reaches :3000 — never this test server.
 */
setup("purge ISR caches", async ({ request }) => {
  const res = await request.post("/api/revalidate", {
    data: {
      token: process.env.REVALIDATE_TOKEN ?? "dev-revalidate-token",
      tags: ["flags", "home", "articles", "panchang", "glossary"],
      paths: ["/"],
    },
  });
  if (!res.ok()) {
    throw new Error(`ISR purge failed: ${res.status()}`);
  }
});
