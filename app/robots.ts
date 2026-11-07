import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

// Staff screens, sign-in and personal pages stay out of search results, in every language.
const PRIVATE_PAGES = ["/sign-in", "/test-drive/booked/", "/service/booked/", "/stop-messages"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/consultant", ...routing.locales.flatMap((locale) => PRIVATE_PAGES.map((page) => `/${locale}${page}`))],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
