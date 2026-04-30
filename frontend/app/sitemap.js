import { absoluteUrl } from "@/lib/seo";
import { getPublicSitemapData } from "@/lib/serverSeo";

export const revalidate = 300;

export default async function sitemap() {
  const { products, sellers } = await getPublicSitemapData();
  const now = new Date();

  const staticRoutes = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/catalog"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const productRoutes = products.map((product) => ({
    url: absoluteUrl(`/product/${product.id}`),
    lastModified: product.updatedAt || product.createdAt || now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const sellerRoutes = sellers.map((seller) => ({
    url: absoluteUrl(`/seller/${seller.id}`),
    lastModified: seller.createdAt || now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...sellerRoutes];
}
