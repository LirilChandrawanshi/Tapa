/**
 * Media pipeline client (W1-C). Assets are uploaded via the admin API and
 * served publicly by id; ids are immutable, so `mediaUrl` responses are
 * cacheable forever (the backend sends `Cache-Control: immutable`).
 */

export interface MediaUploadResult {
  id: string;
  /** Auto-derived 800×418 WhatsApp/OG center-crop (images only, when decodable). */
  waAssetId?: string;
  width?: number;
  height?: number;
  mime: string;
  bytes: number;
  url: string;
}

export type MediaResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

/** Public streaming URL for an asset id (same-origin `/api/v1` proxy). */
export const mediaUrl = (id?: string | null): string =>
  id ? `/api/v1/media/${encodeURIComponent(id)}` : "";

const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp";
const ACCEPT_AUDIO = "audio/mpeg,.mp3";
export const MEDIA_ACCEPT = { image: ACCEPT_IMAGE, audio: ACCEPT_AUDIO } as const;

interface Envelope<T> {
  data?: T | null;
  error?: { code?: string; message?: string } | null;
}

/**
 * Admin multipart upload. Images wider than 1600px are downscaled server-side;
 * decodable images also return `waAssetId` for the WhatsApp variant.
 */
export async function uploadMedia(
  file: File,
): Promise<MediaResult<MediaUploadResult>> {
  const form = new FormData();
  form.append("file", file);
  let res: Response;
  try {
    res = await fetch("/api/v1/admin/media", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      body: form, // browser sets the multipart boundary
    });
  } catch {
    return { ok: false, status: 0, message: "Could not reach the API." };
  }
  let envelope: Envelope<MediaUploadResult> | null = null;
  try {
    envelope = (await res.json()) as Envelope<MediaUploadResult>;
  } catch {
    envelope = null;
  }
  if (!res.ok || envelope?.error || !envelope?.data) {
    return {
      ok: false,
      status: res.status,
      message: envelope?.error?.message ?? `Upload failed (HTTP ${res.status}).`,
    };
  }
  return { ok: true, data: envelope.data };
}

/** Admin delete — removes both the document and the stored bytes. */
export async function deleteMedia(
  id: string,
): Promise<MediaResult<{ deleted: boolean }>> {
  let res: Response;
  try {
    res = await fetch(`/api/v1/admin/media/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, message: "Could not reach the API." };
  }
  if (!res.ok) {
    return { ok: false, status: res.status, message: `Delete failed (HTTP ${res.status}).` };
  }
  return { ok: true, data: { deleted: true } };
}
