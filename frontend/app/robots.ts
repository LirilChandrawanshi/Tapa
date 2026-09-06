import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/staticExtras";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/dev"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
