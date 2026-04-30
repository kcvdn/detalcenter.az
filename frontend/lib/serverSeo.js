import {
  defaultHeroContent,
  normalizeHeroContent,
  normalizeProductsResponse,
} from "@/lib/marketplaceData";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "";
const resolvedApiUrl = apiUrl || "http://localhost:5000";

async function fetchSeoJson(pathname, { revalidate = 300, searchParams } = {}) {
  const url = new URL(pathname, resolvedApiUrl);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  try {
    const response = await fetch(url, {
      next: { revalidate },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function getHomeSeoData() {
  const contentData = await fetchSeoJson("/api/content", { revalidate: 300 });
  return normalizeHeroContent(contentData || defaultHeroContent);
}

export async function getCatalogSeoData() {
  const [productsData, categoriesData] = await Promise.all([
    fetchSeoJson("/api/products", { revalidate: 120 }),
    fetchSeoJson("/api/categories", { revalidate: 300 }),
  ]);

  return {
    products: normalizeProductsResponse(productsData),
    categories: Array.isArray(categoriesData?.categories)
      ? categoriesData.categories
      : Array.isArray(categoriesData)
        ? categoriesData
        : [],
  };
}

export async function getProductSeoData(id) {
  if (!id) {
    return null;
  }

  return fetchSeoJson(`/api/products/${id}`, { revalidate: 300 });
}

export async function getSellerSeoData(id) {
  if (!id) {
    return null;
  }

  return fetchSeoJson(`/api/sellers/${id}`, { revalidate: 300 });
}

export async function getPublicSitemapData() {
  const [productsData, sellersData] = await Promise.all([
    fetchSeoJson("/api/products", { revalidate: 120 }),
    fetchSeoJson("/api/sellers", { revalidate: 300 }),
  ]);

  return {
    products: normalizeProductsResponse(productsData),
    sellers: Array.isArray(sellersData) ? sellersData : [],
  };
}
