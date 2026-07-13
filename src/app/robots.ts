import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/es", "/en"],
        disallow: ["/admin/", "/api/", "/prototype/public-site"],
      },
    ],
    sitemap: "https://wakayaecolodge.com/sitemap.xml",
    host: "https://wakayaecolodge.com",
  };
}
