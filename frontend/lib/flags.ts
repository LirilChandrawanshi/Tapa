/**
 * Feature flags — DB-driven, served by the backend. Never deploy-driven.
 *
 * The endpoint 404s until the backend flags module ships, so every failure
 * path falls back to the defaults below. Short revalidate keeps the header
 * responsive to flag flips without hammering the API.
 */

export interface Flags {
  readonly kits_launched: boolean;
  readonly purohit_tab_visible: boolean;
}

export const DEFAULT_FLAGS: Flags = {
  kits_launched: false,
  purohit_tab_visible: false,
};

const API_BASE =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

export async function getFlags(): Promise<Flags> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/flags`, {
      next: { revalidate: 300, tags: ["flags"] },
    });
    if (!res.ok) return DEFAULT_FLAGS;
    const body: unknown = await res.json();
    if (typeof body !== "object" || body === null) return DEFAULT_FLAGS;
    // the API envelope is {data: {...flags}}; tolerate a bare object too
    const envelope = body as Record<string, unknown>;
    const inner = envelope.data;
    const record = (
      typeof inner === "object" && inner !== null ? inner : envelope
    ) as Record<string, unknown>;
    return {
      kits_launched:
        typeof record.kits_launched === "boolean"
          ? record.kits_launched
          : DEFAULT_FLAGS.kits_launched,
      purohit_tab_visible:
        typeof record.purohit_tab_visible === "boolean"
          ? record.purohit_tab_visible
          : DEFAULT_FLAGS.purohit_tab_visible,
    };
  } catch {
    return DEFAULT_FLAGS;
  }
}
