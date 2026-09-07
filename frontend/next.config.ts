import type { NextConfig } from "next";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
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
