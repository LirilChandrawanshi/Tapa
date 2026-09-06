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
