import type { MetadataRoute } from "next";

const SITE_URL = "https://www.pickthebrick.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Authenticated dashboards and internal tooling - nothing here is
        // meant to be indexed, and most of it 404s/redirects for a crawler
        // without a session anyway.
        disallow: ["/admin", "/captain", "/contractor", "/designer", "/my-quotes", "/profile", "/login", "/staff-login"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
