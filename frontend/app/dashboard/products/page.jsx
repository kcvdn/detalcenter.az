"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import AppImage from "@/components/AppImage";
import { logApiUrl, safeDelete, safeGet, safePost, safePut } from "@/lib/apiClient";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { productPlaceholderSrc, resolveImageSrc } from "@/lib/images";
import { getAuthHeaders, getStoredSession } from "@/lib/session";
const Loader = dynamic(() => import("@/app/dashboard/components/Loader"), {
  ssr: false,
});
const Toast = dynamic(() => import("@/app/dashboard/components/Toast"), {
  ssr: false,
});

const fuelTypes = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "UNKNOWN"];
const bodyTypes = [
  "Sedan",
  "Hatchback",
  "SUV",
  "Crossover",
  "Coupe",
  "Wagon",
  "Pickup",
  "Van",
  "Minivan",
  "Liftback",
  "Fastback",
  "Cabriolet",
  "Roadster",
  "MPV",
  "Other",
];

const createEmptyCompatibility = () => ({
  brand: "",
  model: "",
  bodyType: "",
  yearFrom: "",
  yearTo: "",
  engine: "",
  fuelType: "PETROL",
});

const emptyEditForm = {
  name: "",
  category: "",
  price: "",
  oemCode: "",
  description: "",
  sellerId: "",
  imageFiles: [],
  currentImages: [],
  compatibility: [createEmptyCompatibility()],
};

function normalizeProductsResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  return [];
}

function compatibilityPreview(product) {
  const rows = Array.isArray(product.compatibility) ? product.compatibility : [];

  if (rows.length === 0) {
    return [];
  }

  return rows.slice(0, 2).map((item) => {
    return [
      item.brand,
      item.model,
      item.bodyType && item.bodyType !== "UNKNOWN" ? item.bodyType : "",
      item.yearFrom && item.yearTo ? `${item.yearFrom}-${item.yearTo}` : "",
      item.engine,
    ]
      .filter(Boolean)
      .join(" / ");
  });
}

function normalizeCompatibilityPayload(rows) {
  return rows
    .map((row) => ({
      brand: String(row.brand || "").trim(),
      model: String(row.model || "").trim(),
      bodyType: String(row.bodyType || "").trim() || "UNKNOWN",
      yearFrom: Number(row.yearFrom),
      yearTo: Number(row.yearTo),
      engine: String(row.engine || "").trim(),
      fuelType: String(row.fuelType || "").trim() || "UNKNOWN",
    }))
    .filter((row) => row.brand || row.model || row.engine || row.yearFrom || row.yearTo || row.bodyType);
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editPreviewUrls, setEditPreviewUrls] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [role, setRole] = useState("");
  const [sessionSellerId, setSessionSellerId] = useState("");

  useEffect(() => {
    logApiUrl();
    const session = getStoredSession();
    setRole(session.role || "");
    setSessionSellerId(String(session.sellerId || ""));
  }, []);

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
      } catch {
        setSellers([]);
        setToast({ message: "Seller siyahisini yuklemek olmadi.", type: "error" });
      } finally {
        setLoadingSellers(false);
      }
    };

    loadSellers();
  }, []);

  useEffect(() => {
    const loadCatalogData = async () => {
      setLoadingCatalog(true);

      try {
        const [categoriesData, vehicleData] = await Promise.all([
          safeGet("/api/categories", {}, "Kateqoriyalari yuklemek olmadi."),
          safeGet("/api/products/vehicle-options", {}, "Avtomobil kataloqunu yuklemek olmadi."),
        ]);

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setVehicleOptions(Array.isArray(vehicleData?.brands) ? vehicleData.brands : []);
      } catch {
        setCategories([]);
        setVehicleOptions([]);
        setToast({ message: "Kateqoriya ve avtomobil kataloqunu yuklemek olmadi.", type: "error" });
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadCatalogData();
  }, []);

  useEffect(() => {
    if (!Array.isArray(editForm.imageFiles) || editForm.imageFiles.length === 0) {
      const currentPreviewUrls = (Array.isArray(editForm.currentImages) ? editForm.currentImages : [])
        .map((image) => resolveImageSrc(image))
        .filter(Boolean);
      setEditPreviewUrls(Array.from(new Set(currentPreviewUrls)));
      return undefined;
    }

    const objectUrls = editForm.imageFiles.map((file) => URL.createObjectURL(file));
    setEditPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [editForm.imageFiles, editForm.currentImages]);

  const categoryOptions = useMemo(() => {
    return categories
      .map((category) => String(category?.name || "").trim())
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
      .sort((left, right) => left.localeCompare(right));
  }, [categories]);

  const brandOptions = useMemo(() => {
    return vehicleOptions
      .map((entry) => ({
        brand: String(entry?.brand || "").trim(),
        models: Array.isArray(entry?.models)
          ? entry.models.map((model) => String(model || "").trim()).filter(Boolean)
          : [],
      }))
      .filter((entry) => entry.brand);
  }, [vehicleOptions]);

  const refreshProducts = async () => {
    setLoadingProducts(true);

    try {
      const data = await safeGet(
        "/api/products/manage",
        {
          headers: getAuthHeaders(),
          params: {
            ...(search.trim() ? { search: search.trim() } : {}),
            ...(sellerFilter ? { seller_id: sellerFilter } : {}),
          },
        },
        "Mehsullari yenilemek olmadi.",
      );

      setProducts(normalizeProductsResponse(data));
    } catch {
      setProducts([]);
      setToast({ message: "Mehsullari yenilemek olmadi.", type: "error" });
    } finally {
      setLoadingProducts(false);
    }
  };

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
      } catch {
        setProducts([]);
        setToast({ message: "Mehsullari yuklemek olmadi.", type: "error" });
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [debouncedSearch, sellerFilter]);

  const uploadImage = async (file) => {
    const uploadForm = new FormData();
    uploadForm.append("image", file);

    const data = await safePost(
      "/api/upload",
      uploadForm,
      {
        headers: {
          ...getAuthHeaders(),
        },
      },
      "Sekil yuklemek olmadi.",
    );

    return data?.url || "";
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      oemCode: product.oemCode || "",
      description: product.description || "",
      sellerId: String(product.seller_id || product.seller?.id || ""),
      imageFiles: [],
      currentImages: Array.isArray(product.images)
        ? product.images.map((image) => resolveImageSrc(image)).filter(Boolean)
        : [resolveImageSrc(product.image || product.imageUrl)].filter(Boolean),
      compatibility:
        Array.isArray(product.compatibility) && product.compatibility.length > 0
          ? product.compatibility.map((item) => ({
              brand: item.brand || "",
              model: item.model || "",
              bodyType: item.bodyType || "",
              yearFrom: item.yearFrom || "",
              yearTo: item.yearTo || "",
              engine: item.engine || "",
              fuelType: item.fuelType || "PETROL",
            }))
          : [createEmptyCompatibility()],
    });
  };

  const resetEditForm = () => {
    setEditingId(null);
    setEditForm(emptyEditForm);
    setEditPreviewUrls([]);
  };

  const updateEditCompatibilityField = (index, field, value) => {
    setEditForm((current) => ({
      ...current,
      compatibility: current.compatibility.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...(field === "brand" ? { model: "" } : {}),
              [field]: value,
            }
          : item,
      ),
    }));
  };

  const addEditCompatibilityRow = () => {
    setEditForm((current) => ({
      ...current,
      compatibility: [...current.compatibility, createEmptyCompatibility()],
    }));
  };

  const removeEditCompatibilityRow = (index) => {
    setEditForm((current) => ({
      ...current,
      compatibility:
        current.compatibility.length === 1
          ? current.compatibility
          : current.compatibility.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveEdit = async (productId) => {
    if (!editForm.name.trim() || !editForm.category.trim() || editForm.price === "") {
      setToast({ message: "Ad, kateqoriya ve qiymet vacibdir.", type: "error" });
      return;
    }

    const normalizedCompatibility = normalizeCompatibilityPayload(editForm.compatibility);

    if (normalizedCompatibility.length === 0) {
      setToast({ message: "En azi bir uygun masin setri daxil et.", type: "error" });
      return;
    }

    const invalidCompatibility = normalizedCompatibility.find((item) => {
      return (
        !item.brand ||
        !item.model ||
        !item.engine ||
        !Number.isInteger(item.yearFrom) ||
        !Number.isInteger(item.yearTo) ||
        item.yearFrom > item.yearTo
      );
    });

    if (invalidCompatibility) {
      setToast({ message: "Marka, model, il araligi ve muherrik saheleri tam doldurulmalidir.", type: "error" });
      return;
    }

    setSavingId(productId);

    try {
      const payload = {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        price: Number(editForm.price),
        oemCode: editForm.oemCode.trim() || null,
        description: editForm.description.trim() || null,
        compatibility: normalizedCompatibility,
        sellerId:
          role === "SELLER_ADMIN"
            ? Number(sessionSellerId || 0) || undefined
            : editForm.sellerId
              ? Number(editForm.sellerId)
              : undefined,
      };

      if (editForm.imageFiles.length > 0) {
        payload.imageUrls = await Promise.all(editForm.imageFiles.map((file) => uploadImage(file)));
      }

      await safePut(
        `/api/products/${productId}`,
        payload,
        {
          headers: getAuthHeaders(),
        },
        "Mehsulu yenilemek olmadi.",
      );

      setToast({ message: "Mehsul yenilendi.", type: "success" });
      resetEditForm();
      await refreshProducts();
    } catch (error) {
      const message = error.message || "Mehsulu yenilemek olmadi.";
      setToast({ message, type: "error" });
    } finally {
      setSavingId(null);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await safeDelete(
        `/api/products/${productId}`,
        {
          headers: getAuthHeaders(),
        },
        "Mehsulu silmek olmadi.",
      );
      setToast({ message: "Mehsul silindi.", type: "success" });
      await refreshProducts();
    } catch (error) {
      const message = error.message || "Mehsulu silmek olmadi.";
      setToast({ message, type: "error" });
    }
  };

  const statusLabel = useMemo(() => {
    if (loadingProducts) {
      return "Mehsullar yenilenir...";
    }

    return `Gosterilen mehsul sayi: ${products.length}`;
  }, [loadingProducts, products.length]);

  return (
    <div className="space-y-6">
      {(loadingProducts || savingId) && <Loader />}
      <Toast message={toast.message} type={toast.type} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            {role === "SELLER_ADMIN" ? "Store Product Control" : "Product Control"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Products</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Məhsulları axtar, seller üzrə filtrlə, sürətli düzəliş et və yeni
            vehicle mapping ilə məhsul yaratmaq üçün ayrı formaya keç.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
            {statusLabel}
          </div>
          <Link
            href="/dashboard/products/create"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Yeni mehsul yarat
          </Link>
        </div>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className={`grid gap-4 ${role === "SELLER_ADMIN" ? "" : "lg:grid-cols-[1.1fr_0.9fr]"}`}>
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="product-search">
              Mehsul axtar
            </label>
            <input
              id="product-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Mehsul axtar..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {role !== "SELLER_ADMIN" ? (
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="seller-filter">
                Seller filter
              </label>
              <select
                id="seller-filter"
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
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        {loadingProducts ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Mehsullar yuklenir...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">Mehsul tapilmadi</p>
            <p className="mt-2 text-sm text-slate-500">
              Axtaris və seller filterini dəyişib yenidən yoxla.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const isEditing = editingId === product.id;
              const isSaving = savingId === product.id;
              const imageUrl = resolveImageSrc(product.image);
              const compatibilityRows = compatibilityPreview(product);
              const editPreview = editPreviewUrls[0] || editForm.currentImages?.[0] || "";

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="aspect-[4/3] bg-slate-100">
                    {imageUrl ? (
                      <AppImage
                        src={imageUrl}
                        alt={product.name}
                        fallbackSrc={productPlaceholderSrc}
                        width={900}
                        height={700}
                        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Sekil yoxdur
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {editPreview ? (
                            <AppImage
                              src={editPreview}
                              alt={editForm.name || product.name}
                              fallbackSrc={productPlaceholderSrc}
                              width={900}
                              height={700}
                              sizes="(max-width: 1279px) 100vw, 33vw"
                              className="h-48 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                              Sekil yoxdur
                            </div>
                          )}
                        </div>
                        <input
                          value={editForm.name}
                          onChange={(event) =>
                            setEditForm((current) => ({ ...current, name: event.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                          placeholder="Product name"
                        />
                        <select
                          value={editForm.category}
                          onChange={(event) =>
                            setEditForm((current) => ({ ...current, category: event.target.value }))
                          }
                          disabled={isSaving || loadingCatalog}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                        >
                          <option value="">{loadingCatalog ? "Kateqoriyalar yuklenir..." : "Kateqoriya sec"}</option>
                          {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(event) =>
                            setEditForm((current) => ({ ...current, price: event.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                          placeholder="Price"
                        />
                        <input
                          value={editForm.oemCode}
                          onChange={(event) =>
                            setEditForm((current) => ({ ...current, oemCode: event.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                          placeholder="OEM kodu"
                        />
                        <textarea
                          rows={4}
                          value={editForm.description}
                          onChange={(event) =>
                            setEditForm((current) => ({ ...current, description: event.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                          placeholder="Tesvir"
                        />
                        <select
                          value={role === "SELLER_ADMIN" ? sessionSellerId : editForm.sellerId}
                          onChange={(event) =>
                            setEditForm((current) => ({ ...current, sellerId: event.target.value }))
                          }
                          disabled={isSaving || loadingSellers || role === "SELLER_ADMIN"}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                        >
                          <option value="">{role === "SELLER_ADMIN" ? "Oz magazan" : "Seller sec"}</option>
                          {sellers.map((seller) => (
                            <option key={seller.id} value={seller.id}>
                              {seller.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              imageFiles: Array.from(event.target.files || []),
                            }))
                          }
                          disabled={isSaving}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                        />
                        <p className="text-xs text-slate-500">
                          Yeni sekiller upload etsən, mehsulun sekil qalereyasi bunlarla yenilenecek.
                        </p>
                        {editPreviewUrls.length > 1 ? (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {editPreviewUrls.map((previewUrl, index) => (
                              <div
                                key={`${previewUrl}-${index}`}
                                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
                              >
                                <AppImage
                                  src={previewUrl}
                                  alt={`Preview ${index + 1}`}
                                  fallbackSrc={productPlaceholderSrc}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">Uygun masinlar</p>
                            <button
                              type="button"
                              onClick={addEditCompatibilityRow}
                              disabled={isSaving}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                              + Setr
                            </button>
                          </div>

                          {editForm.compatibility.map((item, index) => (
                            <div
                              key={`edit-compatibility-${product.id}-${index}`}
                              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Setr {index + 1}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => removeEditCompatibilityRow(index)}
                                  disabled={isSaving || editForm.compatibility.length === 1}
                                  className="text-xs font-semibold text-red-600 disabled:opacity-40"
                                >
                                  Sil
                                </button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <select
                                  value={item.brand}
                                  onChange={(event) =>
                                    updateEditCompatibilityField(index, "brand", event.target.value)
                                  }
                                  disabled={isSaving || loadingCatalog}
                                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                >
                                  <option value="">Marka sec</option>
                                  {brandOptions.map((brandEntry) => (
                                    <option key={brandEntry.brand} value={brandEntry.brand}>
                                      {brandEntry.brand}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={item.model}
                                  onChange={(event) =>
                                    updateEditCompatibilityField(index, "model", event.target.value)
                                  }
                                  disabled={isSaving || loadingCatalog || !item.brand}
                                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                >
                                  <option value="">{item.brand ? "Model sec" : "Evvel marka sec"}</option>
                                  {brandOptions
                                    .find((brandEntry) => brandEntry.brand === item.brand)
                                    ?.models.map((modelName) => (
                                      <option key={`${item.brand}-${modelName}`} value={modelName}>
                                        {modelName}
                                      </option>
                                    ))}
                                </select>
                                <select
                                  value={item.bodyType}
                                  onChange={(event) =>
                                    updateEditCompatibilityField(index, "bodyType", event.target.value)
                                  }
                                  disabled={isSaving}
                                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                >
                                  <option value="">Kuza novu</option>
                                  {bodyTypes.map((bodyType) => (
                                    <option key={bodyType} value={bodyType}>
                                      {bodyType}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  value={item.engine}
                                  onChange={(event) =>
                                    updateEditCompatibilityField(index, "engine", event.target.value)
                                  }
                                  disabled={isSaving}
                                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                  placeholder="Muherrik"
                                />
                                <input
                                  type="number"
                                  min="1900"
                                  max="2100"
                                  value={item.yearFrom}
                                  onChange={(event) =>
                                    updateEditCompatibilityField(index, "yearFrom", event.target.value)
                                  }
                                  disabled={isSaving}
                                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                  placeholder="Il baslangic"
                                />
                                <input
                                  type="number"
                                  min="1900"
                                  max="2100"
                                  value={item.yearTo}
                                  onChange={(event) =>
                                    updateEditCompatibilityField(index, "yearTo", event.target.value)
                                  }
                                  disabled={isSaving}
                                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                  placeholder="Il son"
                                />
                                <select
                                  value={item.fuelType}
                                  onChange={(event) =>
                                    updateEditCompatibilityField(index, "fuelType", event.target.value)
                                  }
                                  disabled={isSaving}
                                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm md:col-span-2"
                                >
                                  {fuelTypes.map((fuelType) => (
                                    <option key={fuelType} value={fuelType}>
                                      {fuelType}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                {product.seller?.name || "Seller yoxdur"}
                              </p>
                              <h2 className="text-lg font-semibold text-slate-900">
                                {product.name}
                              </h2>
                            </div>
                            <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {product.category}
                            </span>
                          </div>

                          <p className="text-2xl font-bold text-red-600">
                            {Number(product.price || 0).toLocaleString("az-AZ")} AZN
                          </p>
                        </div>

                        <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Compatibility
                          </p>
                          {compatibilityRows.length === 0 ? (
                            <p className="text-sm text-slate-500">Uyğunluq qeyd edilmeyib.</p>
                          ) : (
                            compatibilityRows.map((row) => (
                              <p key={`${product.id}-${row}`} className="text-sm text-slate-600">
                                {row}
                              </p>
                            ))
                          )}
                          {Number(product.compatibilityCount || 0) > compatibilityRows.length ? (
                            <p className="text-xs font-semibold text-blue-600">
                              +{Number(product.compatibilityCount) - compatibilityRows.length} daha
                            </p>
                          ) : null}
                        </div>
                      </>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(product.id)}
                            disabled={isSaving}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={resetEditForm}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(product.id)}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                          >
                            Delete
                          </button>
                          <Link
                            href="/dashboard/products/create"
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Yeni create
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
