"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import AppImage from "@/components/AppImage";
import { productPlaceholderSrc } from "@/lib/images";
import { getAuthHeaders, getStoredSession } from "@/lib/session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
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

const emptyForm = {
  name: "",
  category: "",
  price: "",
  oemCode: "",
  description: "",
  sellerId: "",
  imageFiles: [],
};

function normalizeCompatibilityPayload(rows) {
  return rows
    .map((row) => ({
      brand: row.brand.trim(),
      model: row.model.trim(),
      bodyType: row.bodyType.trim() || "UNKNOWN",
      yearFrom: Number(row.yearFrom),
      yearTo: Number(row.yearTo),
      engine: row.engine.trim(),
      fuelType: row.fuelType.trim() || "UNKNOWN",
    }))
    .filter((row) => row.brand || row.model || row.engine || row.yearFrom || row.yearTo || row.bodyType);
}

function formatCompatibilityLabel(item) {
  return [
    item.brand,
    item.model,
    item.bodyType && item.bodyType !== "UNKNOWN" ? item.bodyType : "",
    item.yearFrom && item.yearTo ? `${item.yearFrom}-${item.yearTo}` : "",
    item.engine,
    item.fuelType,
  ]
    .filter(Boolean)
    .join(" / ");
}

export default function CreateProductPage() {
  const [form, setForm] = useState(emptyForm);
  const [compatibility, setCompatibility] = useState([createEmptyCompatibility()]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [role, setRole] = useState("");
  const [sessionSellerId, setSessionSellerId] = useState("");

  useEffect(() => {
    const loadSellers = async () => {
      setLoadingSellers(true);

      try {
        const session = getStoredSession();
        setRole(session.role || "");
        setSessionSellerId(session.sellerId || "");

        const response = await axios.get(`${apiUrl}/api/sellers`, {
          headers: getAuthHeaders(),
        });
        const sellerList = Array.isArray(response.data) ? response.data : [];

        setSellers(sellerList);
        if (session.role === "SELLER_ADMIN" && sellerList[0]?.id) {
          setForm((current) => ({
            ...current,
            sellerId: String(sellerList[0].id),
          }));
        }
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
        const [categoriesResponse, vehicleResponse] = await Promise.all([
          axios.get(`${apiUrl}/api/categories`),
          axios.get(`${apiUrl}/api/products/vehicle-options`),
        ]);

        const categoryList = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : [];
        const brandList = Array.isArray(vehicleResponse.data?.brands)
          ? vehicleResponse.data.brands
          : [];

        setCategories(categoryList);
        setVehicleOptions(brandList);
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
    if (!Array.isArray(form.imageFiles) || form.imageFiles.length === 0) {
      setPreviewUrls([]);
      return undefined;
    }

    const objectUrls = form.imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [form.imageFiles]);

  const normalizedCompatibility = useMemo(
    () => normalizeCompatibilityPayload(compatibility),
    [compatibility],
  );

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

  const updateField = (field) => (event) => {
    const value =
      field === "imageFiles" ? Array.from(event.target.files || []) : event.target.value;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCompatibilityField = (index, field, value) => {
    setCompatibility((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...(field === "brand" ? { model: "" } : {}),
              [field]: value,
            }
          : item,
      ),
    );
  };

  const addCompatibilityRow = () => {
    setCompatibility((current) => [...current, createEmptyCompatibility()]);
  };

  const removeCompatibilityRow = (index) => {
    setCompatibility((current) =>
      current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      sellerId: role === "SELLER_ADMIN" ? sessionSellerId : "",
    });
    setCompatibility([createEmptyCompatibility()]);
    setPreviewUrls([]);
    setFileInputKey((current) => current + 1);
  };

  const uploadImage = async (file) => {
    const uploadForm = new FormData();
    uploadForm.append("image", file);

    const response = await axios.post(`${apiUrl}/api/upload`, uploadForm, {
      headers: getAuthHeaders(),
    });

    return response.data?.url || "";
  };

  const uploadImages = async (files) => {
    return Promise.all(files.map((file) => uploadImage(file)));
  };

  const validateCompatibility = () => {
    if (normalizedCompatibility.length === 0) {
      return "En azi bir compatibility setri doldurulmalidir.";
    }

    const invalidEntry = normalizedCompatibility.find((item) => {
      return (
        !item.brand ||
        !item.model ||
        !item.engine ||
        !Number.isInteger(item.yearFrom) ||
        !Number.isInteger(item.yearTo) ||
        item.yearFrom > item.yearTo
      );
    });

    if (invalidEntry) {
      return "Compatibility setrlerinde marka, model, il araligi ve muherrik tam olmalidir.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setToast({ message: "Mehsul adi vacibdir.", type: "error" });
      return;
    }

    if (!form.category.trim()) {
      setToast({ message: "Kateqoriya vacibdir.", type: "error" });
      return;
    }

    if (form.price === "" || Number.isNaN(Number(form.price))) {
      setToast({ message: "Qiymet vacibdir.", type: "error" });
      return;
    }

    const compatibilityError = validateCompatibility();

    if (compatibilityError) {
      setToast({ message: compatibilityError, type: "error" });
      return;
    }

    setSubmitting(true);

    try {
      const uploadedImageUrls = form.imageFiles.length > 0 ? await uploadImages(form.imageFiles) : [];
      const imageUrls = uploadedImageUrls.filter(Boolean);

      if (imageUrls.length === 0) {
        setToast({ message: "En azi bir mehsul sekli yuklemek vacibdir.", type: "error" });
        setSubmitting(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        oemCode: form.oemCode.trim() || null,
        description: form.description.trim() || null,
        imageUrls,
        compatibility: normalizedCompatibility,
        ...((role === "SELLER_ADMIN" ? sessionSellerId : form.sellerId)
          ? { seller_id: Number(role === "SELLER_ADMIN" ? sessionSellerId : form.sellerId) }
          : {}),
      };

      await axios.post(`${apiUrl}/api/products`, payload, {
        headers: getAuthHeaders(),
      });

      resetForm();
      setToast({ message: "Mehsul ugurla yaradildi.", type: "success" });
    } catch (error) {
      const message =
        error.response?.data?.error || "Mehsul yaratmaq olmadi. Yeniden cehd et.";
      setToast({ message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {(submitting || loadingSellers || loadingCatalog) && <Loader />}
      <Toast message={toast.message} type={toast.type} />

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Product Management
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Vehicle mapping ile mehsul yarat</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Mehsulu kategoriya ve avtomobil uygunlugu ile yarat. Brand, model, il araligi,
          kuza novu ve muherrik melumatlari filtreleme ve axtaris ucun istifade olunur.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="product-name">
                Mehsul adi
              </label>
              <input
                id="product-name"
                value={form.name}
                onChange={updateField("name")}
                placeholder="Meselen, Brake Pad Set"
                disabled={submitting}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="product-category">
                Kateqoriya
              </label>
              <select
                id="product-category"
                value={form.category}
                onChange={updateField("category")}
                disabled={submitting || loadingCatalog}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Kateqoriya sec</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Yeni kateqoriya lazimdisa admin panelde `Categories` hissesinden elave et.
              </p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="product-price">
                Qiymet
              </label>
              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={updateField("price")}
                placeholder="0.00"
                disabled={submitting}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="product-oem-code">
                OEM kodu
              </label>
              <input
                id="product-oem-code"
                value={form.oemCode}
                onChange={updateField("oemCode")}
                placeholder="Meselen, 123ABC"
                disabled={submitting}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-2 text-xs text-slate-500">
                Mecburi deyil. Bos saxlasan da mehsul elave olunacaq.
              </p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="product-seller">
                Seller
              </label>
              <select
                id="product-seller"
                value={role === "SELLER_ADMIN" ? sessionSellerId : form.sellerId}
                onChange={updateField("sellerId")}
                disabled={submitting || loadingSellers || role === "SELLER_ADMIN"}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">{role === "SELLER_ADMIN" ? "Oz magazan" : "Seller secme (optional)"}</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="product-description">
                Tesvir
              </label>
              <textarea
                id="product-description"
                rows={5}
                value={form.description}
                onChange={updateField("description")}
                placeholder="Mehsul haqqinda qisa ve aydin tesvir yaz..."
                disabled={submitting}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="product-image">
                Mehsul sekilleri
              </label>
              <input
                key={fileInputKey}
                id="product-image"
                type="file"
                accept="image/*"
                multiple
                onChange={updateField("imageFiles")}
                disabled={submitting}
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
              />
              <p className="mt-2 text-xs text-slate-500">
                URL yazmaga ehtiyac yoxdur. Birden cox sekil secib birbasa upload ede bilersen.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Compatibility
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Avtomobil uyğunluqlarını əlavə et
                </h2>
              </div>

              <button
                type="button"
                onClick={addCompatibilityRow}
                disabled={submitting}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                + Yeni setr
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {compatibility.map((item, index) => (
                <div
                  key={`compatibility-${index}`}
                  className="rounded-[22px] border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      Uyğunluq #{index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeCompatibilityRow(index)}
                      disabled={submitting || compatibility.length === 1}
                      className="text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sil
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <select
                      value={item.brand}
                      onChange={(event) =>
                        updateCompatibilityField(index, "brand", event.target.value)
                      }
                      disabled={submitting || loadingCatalog}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                        updateCompatibilityField(index, "model", event.target.value)
                      }
                      disabled={submitting || loadingCatalog || !item.brand}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                        updateCompatibilityField(index, "bodyType", event.target.value)
                      }
                      disabled={submitting}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                        updateCompatibilityField(index, "engine", event.target.value)
                      }
                      placeholder="Engine"
                      disabled={submitting}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      value={item.yearFrom}
                      onChange={(event) =>
                        updateCompatibilityField(index, "yearFrom", event.target.value)
                      }
                      placeholder="Year from"
                      disabled={submitting}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      value={item.yearTo}
                      onChange={(event) =>
                        updateCompatibilityField(index, "yearTo", event.target.value)
                      }
                      placeholder="Year to"
                      disabled={submitting}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <select
                      value={item.fuelType}
                      onChange={(event) =>
                        updateCompatibilityField(index, "fuelType", event.target.value)
                      }
                      disabled={submitting}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Yaradilir..." : "Mehsulu yarat"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Formu temizle
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Preview
            </p>
            <div className="mt-4 overflow-hidden rounded-3xl bg-slate-100">
              {previewUrls[0] ? (
                <AppImage
                  src={previewUrls[0]}
                  alt="Product preview"
                  fallbackSrc={productPlaceholderSrc}
                  width={1200}
                  height={900}
                  sizes="(max-width: 1279px) 100vw, 480px"
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-slate-400">
                  Sekil sec, preview burada gorunsun.
                </div>
              )}
            </div>
            {previewUrls.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {previewUrls.map((previewUrl, index) => (
                  <div key={`${previewUrl}-${index}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <AppImage
                      src={previewUrl}
                      alt={`Preview ${index + 1}`}
                      fallbackSrc={productPlaceholderSrc}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Mehsul
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {form.name.trim() || "Hele mehsul adi daxil edilmeyib"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {form.category.trim() || "Kateqoriya secilmeyib"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Qiymet
                </p>
                <p className="mt-1 text-2xl font-black text-red-600">
                  {form.price !== ""
                    ? `${Number(form.price || 0).toLocaleString("az-AZ")} AZN`
                    : "0 AZN"}
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
              Compatibility Summary
            </p>
            <h2 className="mt-2 text-2xl font-bold">Secilmis avtomobiller</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {normalizedCompatibility.length === 0 ? (
                <p>Hele compatibility setri tamamlanmayib.</p>
              ) : (
                normalizedCompatibility.map((item, index) => (
                  <p key={`summary-${index}`}>{formatCompatibilityLabel(item)}</p>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
