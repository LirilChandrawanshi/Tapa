import { request, type FullConfig } from "@playwright/test";

const BACKEND = "http://localhost:8080";

export const PHONES = {
  admin: "9876543210",
  member: "9812399999",
  saver: "9812366666",
  nonAdmin: "9812388888",
} as const;

export const OTP_MASTER = "000000";

/**
 * 1. Fail fast (with a clear message) if the backend on :8080 is down.
 * 2. Normalise the feature flags to their documented default (OFF) — the
 *    suite asserts the pre-launch, gate-closed states. Nothing in the suite
 *    turns a flag on, so nothing is left flipped afterwards.
 * 3. Pre-create the non-admin OTP users so UI logins skip the one-time
 *    "Welcome to Tapa" profile step deterministically.
 */
export default async function globalSetup(_config: FullConfig) {
  /* ── 1. backend health ── */
  let healthy = false;
  try {
    const res = await fetch(`${BACKEND}/actuator/health`);
    const body = (await res.json()) as { status?: string };
    healthy = res.ok && body.status === "UP";
  } catch {
    healthy = false;
  }
  if (!healthy) {
    throw new Error(
      `The Tapa backend is not reachable on ${BACKEND} (GET /actuator/health did not return {"status":"UP"}).\n` +
        `Start it first (make backend) — the E2E suite runs against the seeded Spring API.`,
    );
  }

  const api = await request.newContext({ baseURL: BACKEND });
  try {
    /* ── 2. feature flags must be OFF (the documented default) ── */
    const flagsRes = await api.get("/api/v1/flags");
    const flags = ((await flagsRes.json()) as {
      data?: Record<string, boolean>;
    }).data;
    const stuckOn = ["kits_launched", "purohit_tab_visible"].filter(
      (key) => flags?.[key] === true,
    );
    if (stuckOn.length > 0) {
      console.warn(
        `[e2e] Feature flags ${stuckOn.join(", ")} were ON — resetting to their documented OFF default before the run.`,
      );
      await signIn(api, PHONES.admin);
      for (const key of stuckOn) {
        const res = await api.put(`/api/v1/admin/flags/${key}`, {
          data: { value: false },
        });
        if (!res.ok()) {
          throw new Error(
            `Could not reset feature flag ${key} to OFF (HTTP ${res.status()}). ` +
              `The suite asserts the pre-launch gated states and needs both flags OFF.`,
          );
        }
      }
    }

    /* ── 3. pre-create OTP users ── */
    for (const phone of [PHONES.member, PHONES.saver, PHONES.nonAdmin]) {
      await signIn(api, phone);
    }
  } finally {
    await api.dispose();
  }
}

async function signIn(
  api: Awaited<ReturnType<typeof request.newContext>>,
  phone: string,
) {
  // The request may report otp_throttled on quick re-runs; the dev master
  // code still verifies, so we only assert on the verify step.
  await api.post("/api/v1/auth/otp/request", {
    data: { phone: `+91${phone}` },
  });
  const verify = await api.post("/api/v1/auth/otp/verify", {
    data: { phone: `+91${phone}`, code: OTP_MASTER },
  });
  if (!verify.ok()) {
    throw new Error(
      `Dev OTP sign-in failed for +91${phone} (HTTP ${verify.status()}). ` +
        `Is the ConsoleSmsProvider active (master code ${OTP_MASTER})?`,
    );
  }
}
