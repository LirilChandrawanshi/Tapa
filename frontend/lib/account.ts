/**
 * Account management client helpers (W1-F): DPDP deletion, vrat reminders,
 * notification preferences.
 *
 * Same contract as lib/auth.ts: every call goes through the same-origin
 * `/api/v1` proxy (httpOnly cookies stay first-party) and resolves to an
 * `{ ok }` result — network failures and API errors never throw.
 */

export interface DeletionPreview {
  savedRituals: number;
  reminders: number;
  orders: number;
  bookings: number;
  mandaliRequests: number;
  /** Orders not yet DELIVERED / CANCELLED / REFUNDED. */
  inFlightOrders: number;
}

export interface DeletionResult {
  deleted: boolean;
  retained: { orders: number; bookings: number };
}

export interface Reminder {
  id: string;
  title: string;
  /** Linked ritual guide slug, or empty string. */
  articleSlug: string;
  observanceSlug: string;
  /** ISO date of the observance itself. */
  observanceDate: string;
  /** ISO instant — evening before, 7:00 PM IST. */
  sendAt: string;
  channel: string;
  enabled: boolean;
}

/** Keys are fixed server-side; unknown keys are rejected. */
export type NotificationPrefs = {
  ritual_reminders_whatsapp: boolean;
  ritual_reminders_sms_fallback: boolean;
  updates_new_guides: boolean;
  updates_kit_launches: boolean;
};

export type AccountResult<T> =
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
): Promise<AccountResult<T>> {
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

/* ---------- DPDP deletion (#182) ---------- */

/** Itemised counts for the confirmation screen. Read-only. */
export const getDeletionPreview = () =>
  call<DeletionPreview>("/me/deletion-preview");

/**
 * Deletes the account immediately. The API clears the auth cookies in the
 * same response; the caller should still announce the auth change and go home.
 */
export const deleteAccount = () => call<DeletionResult>("/me", "DELETE");

/* ---------- vrat reminders (#180) ---------- */

/** Sorted by the API: soonest observance first. */
export const getReminders = () => call<Reminder[]>("/me/reminders");

/** Pass one of the two slugs — the API resolves the next upcoming date. */
export const addReminder = (ref: {
  articleSlug?: string;
  observanceSlug?: string;
}) => call<Reminder>("/me/reminders", "POST", ref);

export const setReminderEnabled = (id: string, enabled: boolean) =>
  call<Reminder>(`/me/reminders/${id}`, "PUT", { enabled });

export const removeReminder = (id: string) =>
  call<{ removed: boolean }>(`/me/reminders/${id}`, "DELETE");

/* ---------- notification preferences (#181) ---------- */

/** Always returns the full map — server merges stored values over defaults. */
export const getNotificationPrefs = () =>
  call<NotificationPrefs>("/me/prefs");

export const updateNotificationPrefs = (patch: Partial<NotificationPrefs>) =>
  call<NotificationPrefs>("/me/prefs", "PUT", patch);
