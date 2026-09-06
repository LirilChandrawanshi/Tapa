/**
 * Auth + account client helpers (M6).
 *
 * Every call goes through the same-origin `/api/v1` proxy (see next.config.ts)
 * so the httpOnly session cookies stay first-party, and every helper resolves
 * to an `{ ok }` result — network failures and API errors never throw.
 */

export interface AuthUser {
  phone: string;
  /** Empty string until the user tells us their name. */
  name: string;
  languagePref: string;
  isNew: boolean;
}

export interface Me {
  phone: string;
  name: string;
  languagePref: string;
  city: string;
  savedCount: number;
}

export interface SavedRitual {
  articleSlug: string;
  title: string;
  category: string;
  /** ISO date, or empty string for undated content. */
  observanceDate: string;
  past: boolean;
  savedAt: string;
}

export interface OtpRequested {
  sent: boolean;
  resendAfterSeconds: number;
}

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

interface Envelope<T> {
  data?: T | null;
  error?: { code?: string; message?: string } | null;
}

const NETWORK_COPY =
  "We couldn't reach Tapa just now. Check your connection and try again.";
const GENERIC_COPY = "Something didn't go through. Please try again.";

async function call<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
): Promise<AuthResult<T>> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, code: "network", message: NETWORK_COPY };
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await res.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }

  if (!res.ok || envelope?.error) {
    return {
      ok: false,
      status: res.status,
      code: envelope?.error?.code ?? "unknown",
      message: envelope?.error?.message ?? GENERIC_COPY,
    };
  }
  return { ok: true, data: (envelope?.data ?? null) as T };
}

/** Requests a 6-digit OTP for a +91 number. 10 digits are enough — the API normalises. */
export const requestOtp = (phone: string) =>
  call<OtpRequested>("/auth/otp/request", "POST", { phone });

/** Verifies the OTP; on success the API sets the httpOnly session cookies. */
export const verifyOtp = (phone: string, code: string) =>
  call<{ user: AuthUser }>("/auth/otp/verify", "POST", { phone, code });

export const logout = () =>
  call<{ loggedOut: boolean }>("/auth/logout", "POST");

/** 401/403 (result.ok === false) simply means signed out — not an error state. */
export const getMe = () => call<Me>("/me");

export const updateMe = (
  patch: Partial<Pick<Me, "name" | "languagePref" | "city">>,
) => call<{ updated: boolean }>("/me", "PUT", patch);

/** Sorted by the API: closest upcoming observance first, past items last. */
export const getSavedRituals = () => call<SavedRitual[]>("/me/saved");

export const saveRitual = (articleSlug: string) =>
  call<{ saved: boolean }>(`/me/saved/${articleSlug}`, "POST");

export const unsaveRitual = (articleSlug: string) =>
  call<{ saved: boolean }>(`/me/saved/${articleSlug}`, "DELETE");
