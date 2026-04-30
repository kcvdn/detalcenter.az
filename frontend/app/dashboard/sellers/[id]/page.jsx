"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import AppImage from "@/components/AppImage";
import SkeletonCard from "@/components/SkeletonCard";
import { productPlaceholderSrc, resolveImageSrc } from "@/lib/images";
import { getAuthHeaders } from "@/lib/session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const Toast = dynamic(() => import("@/app/dashboard/components/Toast"), {
  ssr: false,
});

const emptyEditForm = {
  name: "",
  price: "",
  imageFile: null,
  currentImage: "",
};

export default function DashboardSellerDetailPage() {
  const params = useParams();
  const sellerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editPreviewUrl, setEditPreviewUrl] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (!editForm.imageFile) {
      setEditPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(editForm.imageFile);
    setEditPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [editForm.imageFile]);

  const getImageUrl = (image) => {
    return resolveImageSrc(image);
  };

  const normalizeProductsResponse = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.products)) {
      return data.products;
    }

    return [];
  };

  const loadSellerDetail = async (currentSellerId) => {
    if (!currentSellerId) {
      setSeller(null);
      setProducts([]);
      setLoading(false);
      setError("Seller melumati yuklenmedi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [sellerResponse, productsResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/sellers/${currentSellerId}`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${apiUrl}/api/products`, {
          params: {
            seller_id: currentSellerId,
          },
        }),
      ]);

      setSeller(sellerResponse.data || null);
      setProducts(normalizeProductsResponse(productsResponse.data));
    } catch {
      setSeller(null);
      setProducts([]);
      setError("Seller melumati yuklenmedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerDetail(sellerId);
  }, [sellerId]);

  const uploadImage = async (file) => {
    const uploadForm = new FormData();
    uploadForm.append("image", file);

    const response = await axios.post(`${apiUrl}/api/upload`, uploadForm, {
      headers: getAuthHeaders(),
    });

    return response.data?.url || "";
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      imageFile: null,
      currentImage: getImageUrl(product.image),
    });
  };

  const resetEdit = () => {
    setEditingId(null);
    setEditForm(emptyEditForm);
    setEditPreviewUrl("");
  };

  const saveEdit = async (product) => {
    if (!editForm.name.trim() || editForm.price === "") {
      setToast({ message: "Ad ve qiymet vacibdir.", type: "error" });
      return;
    }

    setSavingId(product.id);

    try {
      const payload = {
        name: editForm.name.trim(),
        price: Number(editForm.price),
      };

      if (editForm.imageFile) {
        payload.imageUrl = await uploadImage(editForm.imageFile);
      }

      await axios.put(`${apiUrl}/api/products/${product.id}`, payload, {
        headers: getAuthHeaders(),
      });

      setToast({ message: "Mehsul yenilendi.", type: "success" });
      resetEdit();
      await loadSellerDetail(sellerId);
    } catch {
      setToast({ message: "Mehsulu yenilemek olmadi.", type: "error" });
    } finally {
      setSavingId(null);
    }
  };

  const logoUrl = getImageUrl(seller?.logo);
  const createdLabel = seller?.createdAt
    ? new Date(seller.createdAt).toLocaleDateString("az-AZ")
    : "-";
  const editPreview = editPreviewUrl || editForm.currentImage;

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-10 text-center text-red-600">
          {error}
        </div>
      ) : seller ? (
        <>
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                {logoUrl ? (
                  <AppImage
                    src={logoUrl}
                    alt={seller.name}
                    width={96}
                    height={96}
                    sizes="96px"
                    className="h-24 w-24 rounded-3xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 text-lg font-bold text-slate-400">
                    SL
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Seller detail
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-950">{seller.name}</h1>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Mehsul sayi: {products.length}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Yaradilma: {createdLabel}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Telefon: {seller.phone || "Qeyd edilmeyib"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{seller.address || "Unvan qeyd edilmeyib"}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Seller mehsullari</h2>
              <p className="mt-1 text-sm text-slate-500">
                Bu seller-e aid mehsullari buradan izleyib redakte ede bilersen.
              </p>
            </div>

            {products.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
                Bu seller ucun hele mehsul yoxdur.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => {
                  const imageUrl = getImageUrl(product.image);
                  const isEditing = editingId === product.id;
                  const isSaving = savingId === product.id;

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
                            width={800}
                            height={600}
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
                                  width={800}
                                  height={600}
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
                                setEditForm((current) => ({
                                  ...current,
                                  name: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 px-4 py-3"
                              placeholder="Product name"
                            />

                            <input
                              type="number"
                              value={editForm.price}
                              onChange={(event) =>
                                setEditForm((current) => ({
                                  ...current,
                                  price: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 px-4 py-3"
                              placeholder="Price"
                            />

                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                setEditForm((current) => ({
                                  ...current,
                                  imageFile: event.target.files?.[0] ?? null,
                                }))
                              }
                              disabled={isSaving}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3"
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                            <p className="text-2xl font-bold text-red-600">
                              {Number(product.price || 0).toLocaleString("az-AZ")} AZN
                            </p>
                          </>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit(product)}
                                disabled={isSaving}
                                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={resetEdit}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(product)}
                              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="rounded-[28px] bg-slate-50 p-10 text-center text-slate-500">
          Seller tapilmadi.
        </div>
      )}
    </div>
  );
}
