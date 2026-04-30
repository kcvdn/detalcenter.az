import {
  defaultHeroContent,
  normalizeCategoriesResponse,
  normalizeHeroContent,
  normalizeProductsResponse,
  normalizeSearchResults,
} from "@/lib/marketplaceData";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "";
const resolvedApiUrl = apiUrl || "http://localhost:5000";

async function fetchJson(pathname, { revalidate = 300, searchParams } = {}) {
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

export async function getHomePageInitialData() {
  const [contentData, productsData, vehicleOptionsData, categoriesData] = await Promise.all([
    fetchJson("/api/content", { revalidate: 300 }),
    fetchJson("/api/products", { revalidate: 120 }),
    fetchJson("/api/products/vehicle-options", { revalidate: 300 }),
    fetchJson("/api/categories", { revalidate: 300 }),
  ]);

  const initialProducts = normalizeProductsResponse(productsData);
  const initialSearchResults = normalizeSearchResults(productsData);
  const initialCategories = normalizeCategoriesResponse(categoriesData);

  return {
    hasInitialContent: Boolean(contentData),
    hasInitialProducts: initialProducts.length > 0,
    initialContent: contentData ? normalizeHeroContent(contentData) : defaultHeroContent,
    initialProducts,
    initialSearchResults,
    initialVehicleOptions: Array.isArray(vehicleOptionsData?.brands) ? vehicleOptionsData.brands : [],
    initialCategories,
  };
}
