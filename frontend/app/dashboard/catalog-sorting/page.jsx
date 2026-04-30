"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { getAuthHeaders } from "@/lib/session";
import { safeGet, safePut } from "@/lib/apiClient";

const Loader = dynamic(() => import("@/app/dashboard/components/Loader"), {
  ssr: false,
});
const Toast = dynamic(() => import("@/app/dashboard/components/Toast"), {
  ssr: false,
});

const suggestedCategories = [
  "Mator hisseleri",
  "Yag ve filtrler",
  "Asqi ve amortizator",
  "Eyləc sistemi",
  "Elektrik ve sensorlar",
  "Kuzov ve salon",
  "Radiator ve soyutma",
  "Aksesuarlar",
];

function normalizeProductsResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  return [];
}

export default function DashboardCatalogSortingPage() {
  const [search, setSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [targetCategory, setTargetCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    const loadSellers = async () => {
      setLoadingSellers(true);

      try {
        const data = await safeGet(
          "/api/sellers",
          {
            headers: getAuthHeaders(),
          },
          "Seller siyahisini yuklemek olmadi.",
        );

        setSellers(Array.isArray(data) ? data : []);
      } catch (error) {
        setSellers([]);
        setToast({ message: error.message || "Seller siyahisini yuklemek olmadi.", type: "error" });
      } finally {
        setLoadingSellers(false);
      }
    };

    loadSellers();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);

      try {
        const data = await safeGet(
          "/api/products/manage",
          {
            headers: getAuthHeaders(),
            params: {
              ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
              ...(sellerFilter ? { seller_id: sellerFilter } : {}),
            },
          },
          "Mehsullari yuklemek olmadi.",
        );

        setProducts(normalizeProductsResponse(data));
      } catch (error) {
        setProducts([]);
        setToast({ message: error.message || "Mehsullari yuklemek olmadi.", type: "error" });
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [debouncedSearch, sellerFilter]);

  const allCategories = useMemo(() => {
    const categorySet = new Set(suggestedCategories);

    products.forEach((product) => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });

    return Array.from(categorySet).sort((left, right) => left.localeCompare(right));
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (!categoryFilter) {
      return products;
    }

    return products.filter((product) => String(product.category || "") === categoryFilter);
  }, [categoryFilter, products]);

  const groupedCounts = useMemo(() => {
    const counts = new Map();

    products.forEach((product) => {
      const category = String(product.category || "Kateqoriyasiz");
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  }, [products]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => visibleProducts.some((product) => product.id === id)));
  }, [visibleProducts]);

  const toggleProductSelection = (productId) => {
    setSelectedIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = visibleProducts.map((product) => product.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])));
  };

  const applyCategory = async () => {
    const nextCategory = (customCategory.trim() || targetCategory).trim();

    if (!nextCategory) {
      setToast({ message: "Yeni katalog adini sec ve ya yaz.", type: "error" });
      return;
    }

    if (selectedIds.length === 0) {
      setToast({ message: "Evvelce en azi bir mehsul sec.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      const selectedProducts = products.filter((product) => selectedIds.includes(product.id));

      await Promise.all(
        selectedProducts.map((product) =>
          safePut(
            `/api/products/${product.id}`,
            {
              category: nextCategory,
            },
            {
              headers: getAuthHeaders(),
            },
            "Mehsul kateqoriyasini yenilemek olmadi.",
          ),
        ),
      );

      setProducts((current) =>
        current.map((product) =>
          selectedIds.includes(product.id)
            ? {
                ...product,
                category: nextCategory,
              }
            : product,
        ),
      );
      setSelectedIds([]);
      setTargetCategory(nextCategory);
      setCustomCategory("");
      setToast({ message: "Secilen mehsullar kataloga ayirildi.", type: "success" });
    } catch (error) {
      const detailsMessage = error?.details?.fieldErrors
        ? Object.values(error.details.fieldErrors)
            .flat()
            .filter(Boolean)
            .join(" ")
        : "";

      setToast({
        message: detailsMessage || error.message || "Mehsullari kataloga ayirmaq olmadi.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = selectedIds.length;
  const visibleIds = visibleProducts.map((product) => product.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  return (
    <div className="space-y-6">
      {(loadingProducts || saving) && <Loader />}
      <Toast message={toast.message} type={toast.type} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Catalog Sorting
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Detallari kataloqa ayir</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Mehsullari sec, cari kateqoriyasini gor ve toplu sekilde yeni katalog bolmesine kecir.
            Bu sehife katalogun strukturunu elle duzeltmek ucundur.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
          Secilen mehsul: {selectedCount}
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Katalog xulasəsi
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Hazir kateqoriyalar</h2>

          <div className="mt-5 space-y-2">
            {groupedCounts.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Hele mehsul yoxdur.
              </div>
            ) : (
              groupedCounts.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setCategoryFilter(item.name === "Kateqoriyasiz" ? "" : item.name)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                    categoryFilter === item.name
                      ? "bg-slate-950 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs">{item.count}</span>
                </button>
              ))
            )}
          </div>
        </article>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1fr]">
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="catalog-product-search">
                  Mehsul axtar
                </label>
                <input
                  id="catalog-product-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Mehsul adi ile axtar..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="catalog-seller-filter">
                  Seller filter
                </label>
                <select
                  id="catalog-seller-filter"
                  value={sellerFilter}
                  onChange={(event) => setSellerFilter(event.target.value)}
                  disabled={loadingSellers}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Butun sellerler</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="catalog-category-filter">
                  Cari kateqoriya
                </label>
                <select
                  id="catalog-category-filter"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Butun kateqoriyalar</option>
                  {allCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="catalog-target-category">
                  Hazir katalog bolmesi
                </label>
                <select
                  id="catalog-target-category"
                  value={targetCategory}
                  onChange={(event) => setTargetCategory(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Kateqoriya sec</option>
                  {allCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="catalog-custom-category">
                  Yeni katalog bolmesi
                </label>
                <input
                  id="catalog-custom-category"
                  value={customCategory}
                  onChange={(event) => setCustomCategory(event.target.value)}
                  placeholder="Meselen: Yag ve filtrler"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="button"
                onClick={applyCategory}
                disabled={saving}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Secilenlere tetbiq et
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {suggestedCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setTargetCategory(category);
                    setCustomCategory("");
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Mehsul siyahisi
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Kataloqa ayrilacaq mehsullar</h2>
              </div>

              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {allVisibleSelected ? "Secimi legv et" : "Hamısını sec"}
              </button>
            </div>

            <div className="space-y-3">
              {loadingProducts ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Mehsullar yuklenir...
                </div>
              ) : visibleProducts.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Bu filterlere uygun mehsul yoxdur.
                </div>
              ) : (
                visibleProducts.map((product) => {
                  const checked = selectedIds.includes(product.id);

                  return (
                    <label
                      key={product.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-[24px] border px-4 py-4 transition ${
                        checked ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProductSelection(product.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-bold text-slate-950">{product.name}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Seller: {product.seller?.name || "Seller yoxdur"}
                            </p>
                          </div>

                          <div className="text-sm font-semibold text-slate-700">
                            {Number(product.price || 0).toLocaleString("az-AZ")} AZN
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            Cari: {product.category || "Kateqoriyasiz"}
                          </span>
                          {product.compatibility?.[0]?.brand ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {product.compatibility[0].brand} / {product.compatibility[0].model}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
