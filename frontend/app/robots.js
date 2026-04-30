import { SITE_URL, absoluteUrl } from "@/lib/seo";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalog", "/product/", "/seller/", "/uploads/", "/favicon.svg", "/og-cover.svg"],
        disallow: [
          "/api/",
          "/dashboard",
          "/login",
          "/register",
          "/cart",
          "/checkout",
          "/favorites",
          "/orders",
          "/profile",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
