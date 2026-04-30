import { SITE_NAME, DEFAULT_SEO_DESCRIPTION } from "@/lib/seo";

export default function manifest() {
  return {
    name: SITE_NAME,
    short_name: "Detalcenter",
    description: DEFAULT_SEO_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
