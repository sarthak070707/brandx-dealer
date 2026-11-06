import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Staff screens and personal confirmation pages stay out of search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/consultant", "/sign-in", "/test-drive/booked/", "/stop-messages"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
