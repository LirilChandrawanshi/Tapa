import type { NextConfig } from "next";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // `next build` and `next dev` share .next by default, so a verification
  // build run while the dev server is up replaces the chunks it is serving —
  // the dev page then dies with "Cannot find module './NNNN.js'". `make build`
  // and `make test` set NEXT_DIST_DIR so their output lands somewhere else.
  // Unset (a real deploy) it stays .next.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async redirects() {
    // the PRD's printed/WA references use /subscribe; the page lives at /tapa-circle
    return [{ source: "/subscribe", destination: "/tapa-circle", permanent: true }];
  },
  async rewrites() {
    // Proxy API calls in dev so auth cookies stay first-party.
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_BASE}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
