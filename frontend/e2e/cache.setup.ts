import { test as setup } from "@playwright/test";

/**
 * Purge the ISR caches before the suite runs: build-time prerenders bake in
 * whatever flag state existed at `next build`, and the backend's revalidation
 * webhook only reaches :3000 — never this test server.
 *
 * (The admin sign-in setup that used to live here went with the in-repo admin
 * panel; the console is now a separate app under ~/tapa-cms.)
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
