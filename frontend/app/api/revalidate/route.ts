import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand ISR revalidation — called by the backend (RevalidationNotifier)
 * whenever an article is published or a panchang day changes, and usable
 * manually for cache-busting during ops.
 *
 * POST { token, tags?: string[], paths?: string[] }
 *   → 200 { revalidated: true, tags: n, paths: n }
 *   → 401 on a bad token, 400 on a malformed body.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    token?: unknown;
    tags?: unknown;
    paths?: unknown;
  } | null;

  if (!body || typeof body.token !== "string") {
    return NextResponse.json(
      { error: "malformed body — expected { token, tags?, paths? }" },
      { status: 400 },
    );
  }

  const expected = process.env.REVALIDATE_TOKEN ?? "dev-revalidate-token";
  if (body.token !== expected) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string" && t.length > 0)
    : [];
  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p): p is string => typeof p === "string" && p.startsWith("/"))
    : [];

  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({
    revalidated: true,
    tags: tags.length,
    paths: paths.length,
  });
}
