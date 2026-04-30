"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import AppImage from "@/components/AppImage";
import { logApiUrl, safeDelete, safeGet, safePost, safePut } from "@/lib/apiClient";
import { resolveImageSrc } from "@/lib/images";
import { getAuthHeaders } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";
const Toast = dynamic(() => import("@/app/dashboard/components/Toast"), {
  ssr: false,
});
const emptyForm = {
  name: "",
  logo: "",
  phone: "",
  address: "",
  description: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export default function SellersPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [sellers, setSellers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [fetchingId, setFetchingId] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const loadSellers = async () => {
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
    }
  };

  useEffect(() => {
    logApiUrl();
    loadSellers();
  }, []);

  useEffect(() => {
    if (!logoFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [logoFile]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const data = await safePost(
        "/api/upload",
        formData,
        {
          headers: {
            ...getAuthHeaders(),
          },
        },
        "Logo yuklemek olmadi.",
      );

      return data?.url || "";
    } catch (error) {
      setToast({ message: error.message || "Logo yuklemek olmadi.", type: "error" });
      throw new Error("UPLOAD_FAILED");
    }
  };

  const addSeller = async () => {
    if (!form.name.trim()) {
      setToast({ message: "Seller name vacibdir.", type: "error" });
      return;
    }

    if (!editingId && (!form.adminName.trim() || !form.adminEmail.trim() || !form.adminPassword.trim())) {
      setToast({ message: "Magaza admin melumatlari vacibdir.", type: "error" });
      return;
    }

    setSubmitting(true);

    try {
      const nextLogo = logoFile ? await uploadImage(logoFile) : form.logo || "";

      if (editingId) {
        await safePut(
          `/api/sellers/${editingId}`,
          {
            name: form.name.trim(),
            logo: nextLogo || null,
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
            description: form.description.trim() || null,
            adminName: form.adminName.trim() || undefined,
            adminEmail: form.adminEmail.trim() || undefined,
            adminPassword: form.adminPassword.trim() || undefined,
          },
          {
            headers: getAuthHeaders(),
          },
          "Seller yenilemek olmadi.",
        );
        setToast({ message: "Seller yenilendi.", type: "success" });
      } else {
        await safePost(
          "/api/sellers",
          {
            name: form.name.trim(),
            logo: nextLogo || null,
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
            description: form.description.trim() || null,
            adminName: form.adminName.trim(),
            adminEmail: form.adminEmail.trim(),
            adminPassword: form.adminPassword.trim(),
          },
          {
            headers: getAuthHeaders(),
          },
          "Seller yaratmaq olmadi.",
        );
        setToast({ message: "Seller yaradildi.", type: "success" });
      }

      setForm(emptyForm);
      setLogoFile(null);
      setPreviewUrl("");
      setEditingId(null);
      setFileInputKey((current) => current + 1);
      await loadSellers();
    } catch (error) {
      if (error.message !== "UPLOAD_FAILED") {
        setToast({
          message: editingId ? "Seller yenilemek olmadi." : "Seller yaratmaq olmadi.",
          type: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id) => {
    if (!id) {
      setToast({ message: "Seller melumati yuklenmedi.", type: "error" });
      return;
    }

    setFetchingId(id);

    try {
      const data = await safeGet(
        `/api/sellers/${id}`,
        {
          headers: getAuthHeaders(),
        },
        "Seller melumati yuklenmedi",
      );

      setForm({
        name: data?.name || "",
        logo: data?.logo || "",
        phone: data?.phone || "",
        address: data?.address || "",
        description: data?.description || "",
        adminName: data?.adminUsers?.[0]?.name || "",
        adminEmail: data?.adminUsers?.[0]?.email || "",
        adminPassword: "",
      });
      setEditingId(id);
      setLogoFile(null);
      setPreviewUrl("");
      setFileInputKey((current) => current + 1);
    } catch (error) {
      setToast({ message: error.message || "Seller melumati yuklenmedi.", type: "error" });
    } finally {
      setFetchingId(null);
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setLogoFile(null);
    setPreviewUrl("");
    setEditingId(null);
    setFetchingId(null);
    setFileInputKey((current) => current + 1);
  };

  const deleteSeller = async (sellerId) => {
    if (deletingId === sellerId) {
      return;
    }

    if (!window.confirm(t("seller_delete_confirm"))) {
      return;
    }

    setDeletingId(sellerId);

    try {
      await safeDelete(
        `/api/sellers/${sellerId}`,
        {
          headers: getAuthHeaders(),
        },
        "Seller silmek olmadi.",
      );
      setToast({ message: t("seller_deleted"), type: "success" });
      await loadSellers();
    } catch (error) {
      const message =
        error.message === "Seller has products and cannot be deleted"
          ? t("seller_has_products")
          : t("seller_delete_error");
      setToast({ message, type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sellers</h1>
        <p className="mt-1 text-sm text-slate-500">Magaza yarat, magaza admini ver ve siyahini izle</p>
      </div>

      <div className="grid gap-4 rounded-3xl bg-slate-50 p-6 md:grid-cols-2 xl:grid-cols-3">
        <input
          className="rounded-xl border border-slate-200 px-4 py-3"
          placeholder="Seller name"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          disabled={submitting || fetchingId !== null}
        />

        <label className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
          <span className="mb-2 block font-medium text-slate-700">Seller logo</span>
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
            disabled={submitting || fetchingId !== null}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          </label>

        <input
          className="rounded-xl border border-slate-200 px-4 py-3"
          placeholder="Store admin name"
          value={form.adminName}
          onChange={(event) =>
            setForm((current) => ({ ...current, adminName: event.target.value }))
          }
          disabled={submitting || fetchingId !== null}
        />

        <input
          className="rounded-xl border border-slate-200 px-4 py-3"
          placeholder="Phone number"
          value={form.phone}
          onChange={(event) =>
            setForm((current) => ({ ...current, phone: event.target.value }))
          }
          disabled={submitting || fetchingId !== null}
        />

        <input
          className="rounded-xl border border-slate-200 px-4 py-3"
          placeholder="Store address"
          value={form.address}
          onChange={(event) =>
            setForm((current) => ({ ...current, address: event.target.value }))
          }
          disabled={submitting || fetchingId !== null}
        />

        <textarea
          className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2 xl:col-span-3"
          placeholder="Store description"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          disabled={submitting || fetchingId !== null}
          rows={3}
        />

        <input
          className="rounded-xl border border-slate-200 px-4 py-3"
          placeholder="Store admin email"
          type="email"
          value={form.adminEmail}
          onChange={(event) =>
            setForm((current) => ({ ...current, adminEmail: event.target.value }))
          }
          disabled={submitting || fetchingId !== null}
        />

        <input
          className="rounded-xl border border-slate-200 px-4 py-3"
          placeholder={editingId ? "New password (optional)" : "Store admin password"}
          type="password"
          value={form.adminPassword}
          onChange={(event) =>
            setForm((current) => ({ ...current, adminPassword: event.target.value }))
          }
          disabled={submitting || fetchingId !== null}
        />
      </div>

      {previewUrl || form.logo ? (
        <div className="w-full max-w-xs overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-3 text-sm font-medium text-slate-600">Preview</p>
          <AppImage
            src={resolveImageSrc(previewUrl || form.logo)}
            alt="Seller preview"
            width={384}
            height={288}
            sizes="(max-width: 767px) 100vw, 384px"
            className="h-48 w-full rounded-2xl object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addSeller}
          disabled={submitting || fetchingId !== null}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {fetchingId !== null ? "Loading..." : submitting ? "Uploading..." : editingId ? "Save Seller" : "Add Seller"}
        </button>

        {editingId ? (
          <button
            type="button"
            onClick={cancelEdit}
            disabled={submitting}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="space-y-3">
        {sellers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No data found
          </div>
        ) : (
          sellers.map((seller) => (
            <div
              key={seller.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
            >
              <Link href={`/dashboard/sellers/${seller.id}`} className="min-w-0 flex-1 pr-4">
                <p className="font-semibold text-slate-900 transition hover:text-blue-600">
                  {seller.name}
                </p>
                <p className="truncate text-sm text-slate-500">{seller.logo || "Logo yoxdur"}</p>
                <p className="mt-1 text-xs text-slate-500">{seller.phone || "Nomre yoxdur"}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Admin: {seller.adminUsers?.[0]?.name || "-"} / {seller.adminUsers?.[0]?.email || "-"}
                </p>
              </Link>

              {seller.logo ? (
                <div className="flex items-center gap-3">
                  <AppImage
                    src={resolveImageSrc(seller.logo)}
                    alt={seller.name}
                    width={48}
                    height={48}
                    sizes="48px"
                    className="h-12 w-12 rounded-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => handleEdit(seller.id)}
                    disabled={fetchingId === seller.id || submitting}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {fetchingId === seller.id ? "Loading..." : "Edit"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSeller(seller.id)}
                    disabled={deletingId === seller.id || fetchingId === seller.id}
                    className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === seller.id ? t("loading") : t("delete")}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">
                    No Logo
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEdit(seller.id)}
                    disabled={fetchingId === seller.id || submitting}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {fetchingId === seller.id ? "Loading..." : "Edit"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSeller(seller.id)}
                    disabled={deletingId === seller.id || fetchingId === seller.id}
                    className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === seller.id ? t("loading") : t("delete")}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
