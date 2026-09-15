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

/** Fired on sign-in/sign-out so chrome like the TopNav can refresh itself. */
export const AUTH_EVENT = "tapa:auth-change";

function announceAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }
}

/** Verifies the OTP; on success the API sets the httpOnly session cookies. */
export const verifyOtp = async (phone: string, code: string) => {
  const result = await call<{ user: AuthUser }>("/auth/otp/verify", "POST", {
    phone,
    code,
  });
  if (result.ok) announceAuthChange();
  return result;
};

export const logout = async () => {
  const result = await call<{ loggedOut: boolean }>("/auth/logout", "POST");
  if (result.ok) announceAuthChange();
  return result;
};

/** 401/403 (result.ok === false) simply means signed out — not an error state. */
export const getMe = () => call<Me>("/me");

let mePromise: Promise<AuthResult<Me>> | null = null;

/**
 * getMe() de-duplicated across components. A rail can hold several cards that
 * each need to know "is this visitor signed in?"; they share one request.
 * Cleared on sign-in/sign-out (AUTH_EVENT) so it never serves a stale session.
 */
export function getMeCached(): Promise<AuthResult<Me>> {
  if (!mePromise) {
    mePromise = getMe();
  }
  return mePromise;
}

export function clearMeCache() {
  mePromise = null;
}

if (typeof window !== "undefined") {
  window.addEventListener(AUTH_EVENT, clearMeCache);
}

export const updateMe = (
  patch: Partial<Pick<Me, "name" | "languagePref" | "city">>,
) => call<{ updated: boolean }>("/me", "PUT", patch);

/** Sorted by the API: closest upcoming observance first, past items last. */
export const getSavedRituals = () => call<SavedRitual[]>("/me/saved");

export const saveRitual = (articleSlug: string) =>
  call<{ saved: boolean }>(`/me/saved/${articleSlug}`, "POST");

export const unsaveRitual = (articleSlug: string) =>
  call<{ saved: boolean }>(`/me/saved/${articleSlug}`, "DELETE");
