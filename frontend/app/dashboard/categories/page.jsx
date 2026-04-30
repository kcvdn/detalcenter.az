"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import AppImage from "@/components/AppImage";
import { CategoryIcon } from "@/components/Icons";
import { safeDelete, safeGet, safePost, safePut } from "@/lib/apiClient";
import { resolveImageSrc } from "@/lib/images";
import { getAuthHeaders } from "@/lib/session";

const Loader = dynamic(() => import("@/app/dashboard/components/Loader"), {
  ssr: false,
});
const Toast = dynamic(() => import("@/app/dashboard/components/Toast"), {
  ssr: false,
});

function CategoryThumb({ imageUrl, name, previewSrc = "", sizeClassName = "h-14 w-14" }) {
  const resolvedSrc = resolveImageSrc(previewSrc || imageUrl || "", "");

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 ${sizeClassName}`}
    >
      {resolvedSrc ? (
        <AppImage
          src={resolvedSrc}
          alt={name || "Category icon"}
          fill
          sizes="80px"
          className="object-contain p-3"
        />
      ) : (
        <span className="text-slate-400">
          <CategoryIcon />
        </span>
      )}
    </div>
  );
}

export default function DashboardCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [createImageFile, setCreateImageFile] = useState(null);
  const [createPreviewUrl, setCreatePreviewUrl] = useState("");
  const [createFileInputKey, setCreateFileInputKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingParentId, setEditingParentId] = useState("");
  const [editingImageUrl, setEditingImageUrl] = useState("");
  const [editingImageFile, setEditingImageFile] = useState(null);
  const [editingPreviewUrl, setEditingPreviewUrl] = useState("");
  const [editingFileInputKey, setEditingFileInputKey] = useState(0);
  const [draftChildren, setDraftChildren] = useState({});
  const [toast, setToast] = useState({ message: "", type: "success" });

  const loadCategories = async () => {
    setLoading(true);

    try {
      const data = await safeGet("/api/categories", {}, "Kateqoriyalari yuklemek olmadi.");
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setCategories([]);
      setToast({
        message: error.message || "Kateqoriyalari yuklemek olmadi.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!createImageFile) {
      setCreatePreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(createImageFile);
    setCreatePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [createImageFile]);

  useEffect(() => {
    if (!editingImageFile) {
      setEditingPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(editingImageFile);
    setEditingPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [editingImageFile]);

  const managedCategories = useMemo(() => {
    return categories.filter((category) => category.source !== "product");
  }, [categories]);

  const categoryTree = useMemo(() => {
    const byParent = new Map();
    const existingIds = new Set(managedCategories.map((category) => category.id));

    managedCategories.forEach((category) => {
      const key =
        category.parentId && existingIds.has(category.parentId) ? category.parentId : "root";
      const siblings = byParent.get(key) || [];
      siblings.push(category);
      byParent.set(key, siblings);
    });

    const buildTree = (parentKey = "root") => {
      return (byParent.get(parentKey) || []).map((category) => ({
        ...category,
        children: buildTree(category.id),
      }));
    };

    return buildTree();
  }, [managedCategories]);

  const productOnlyCategories = useMemo(() => {
    return categories.filter((category) => category.source === "product");
  }, [categories]);

  const resetCreateIcon = () => {
    setCreateImageFile(null);
    setCreatePreviewUrl("");
    setCreateFileInputKey((current) => current + 1);
  };

  const resetEditingFile = () => {
    setEditingImageFile(null);
    setEditingPreviewUrl("");
    setEditingFileInputKey((current) => current + 1);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setEditingParentId("");
    setEditingImageUrl("");
    resetEditingFile();
  };

  const startEditing = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingParentId(category.parentId ? String(category.parentId) : "");
    setEditingImageUrl(category.imageUrl || "");
    setEditingImageFile(null);
    setEditingPreviewUrl("");
    setEditingFileInputKey((current) => current + 1);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const data = await safePost(
        "/api/upload",
        formData,
        {
          headers: getAuthHeaders(),
        },
        "Ikonu yuklemek olmadi.",
      );

      return data?.url || "";
    } catch (error) {
      setToast({ message: error.message || "Ikonu yuklemek olmadi.", type: "error" });
      throw new Error("UPLOAD_FAILED");
    }
  };

  const createCategory = async (event) => {
    event.preventDefault();

    if (!categoryName.trim()) {
      setToast({ message: "Kateqoriya adi bos ola bilmez.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      let imageUrl = "";

      if (createImageFile) {
        imageUrl = await uploadImage(createImageFile);
      }

      const createdCategory = await safePost(
        "/api/categories",
        {
          name: categoryName.trim(),
          parentId: parentCategoryId || null,
          ...(imageUrl ? { imageUrl } : {}),
        },
        {
          headers: getAuthHeaders(),
        },
        "Kateqoriyani elave etmek olmadi.",
      );

      if (createdCategory?.id) {
        setCategories((current) => {
          const nextItem = {
            ...createdCategory,
            name: String(createdCategory.name || "").trim(),
            imageUrl: createdCategory.imageUrl || imageUrl || "",
            parentId: createdCategory.parentId || null,
            source: "category",
          };

          return [...current.filter((item) => item.id !== nextItem.id), nextItem];
        });
      }

      setCategoryName("");
      setParentCategoryId("");
      resetCreateIcon();
      setToast({ message: "Kateqoriya elave edildi.", type: "success" });
      await loadCategories();
    } catch (error) {
      if (error.message !== "UPLOAD_FAILED") {
        setToast({
          message: error.message || "Kateqoriyani elave etmek olmadi.",
          type: "error",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async (categoryId) => {
    if (!editingName.trim()) {
      setToast({ message: "Kateqoriya adi bos ola bilmez.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      let nextImageUrl = editingImageUrl;

      if (editingImageFile) {
        nextImageUrl = await uploadImage(editingImageFile);
      }

      const updatedCategory = await safePut(
        `/api/categories/${categoryId}`,
        {
          name: editingName.trim(),
          parentId: editingParentId || null,
          imageUrl: nextImageUrl || "",
        },
        {
          headers: getAuthHeaders(),
        },
        "Kateqoriyani yenilemek olmadi.",
      );

      if (updatedCategory?.id) {
        setCategories((current) =>
          current.map((item) =>
            item.id === categoryId
              ? {
                  ...item,
                  ...updatedCategory,
                  source: item.source || "category",
                }
              : item,
          ),
        );
      }

      cancelEditing();
      setToast({ message: "Kateqoriya yenilendi.", type: "success" });
      await loadCategories();
    } catch (error) {
      if (error.message !== "UPLOAD_FAILED") {
        setToast({
          message: error.message || "Kateqoriyani yenilemek olmadi.",
          type: "error",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const createChildCategory = async (parentId) => {
    const draftName = String(draftChildren[parentId] || "").trim();

    if (!draftName) {
      setToast({ message: "Alt kateqoriya adi bos ola bilmez.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      const createdCategory = await safePost(
        "/api/categories",
        {
          name: draftName,
          parentId,
        },
        {
          headers: getAuthHeaders(),
        },
        "Alt kateqoriyani elave etmek olmadi.",
      );

      if (createdCategory?.id) {
        setCategories((current) => {
          const nextItem = {
            ...createdCategory,
            name: String(createdCategory.name || "").trim(),
            imageUrl: createdCategory.imageUrl || "",
            parentId: createdCategory.parentId || null,
            source: "category",
          };

          return [...current.filter((item) => item.id !== nextItem.id), nextItem];
        });
      }

      setDraftChildren((current) => ({
        ...current,
        [parentId]: "",
      }));
      setToast({ message: "Alt kateqoriya elave edildi.", type: "success" });
      await loadCategories();
    } catch (error) {
      setToast({
        message: error.message || "Alt kateqoriyani elave etmek olmadi.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryNode = (category, depth = 0) => {
    const childDraftValue = draftChildren[category.id] || "";
    const currentEditPreview = editingPreviewUrl || editingImageUrl;

    return (
      <div key={category.id} className="space-y-3">
        <div
          className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
          style={{ marginLeft: depth > 0 ? `${Math.min(depth, 3) * 20}px` : 0 }}
        >
          {editingId === category.id ? (
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <CategoryThumb
                  imageUrl={editingImageUrl}
                  name={editingName || category.name}
                  previewSrc={editingPreviewUrl}
                  sizeClassName="h-20 w-20"
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <select
                    value={editingParentId}
                    onChange={(event) => setEditingParentId(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Ana kateqoriya</option>
                    {managedCategories
                      .filter((item) => item.id !== category.id)
                      .map((item) => (
                        <option key={`parent-option-${item.id}`} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Kateqoriya ikonu
                    </label>
                    <input
                      key={editingFileInputKey}
                      type="file"
                      accept="image/*"
                      onChange={(event) => setEditingImageFile(event.target.files?.[0] ?? null)}
                      disabled={loading || saving}
                      className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {currentEditPreview ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingImageUrl("");
                            resetEditingFile();
                          }}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Ikonu sil
                        </button>
                      ) : null}
                      <p className="text-xs text-slate-500">
                        Ikon yuklense ana sehifede ve katalog kartlarinda gosterilecek.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveCategory(category.id)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Saxla
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Legv et
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <CategoryThumb imageUrl={category.imageUrl} name={category.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-slate-900">{category.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {category.parentId ? "Alt kateqoriya" : "Esas kateqoriya"}
                      {category.imageUrl ? " • ikon var" : " • standart ikon"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(category)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category.id)}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Sil
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={childDraftValue}
                  onChange={(event) =>
                    setDraftChildren((current) => ({
                      ...current,
                      [category.id]: event.target.value,
                    }))
                  }
                  placeholder={`${category.name} ucun alt kateqoriya`}
                  disabled={loading || saving}
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => createChildCategory(category.id)}
                  disabled={loading || saving}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Alt kateqoriya elave et
                </button>
              </div>
            </>
          )}
        </div>

        {Array.isArray(category.children) && category.children.length > 0 ? (
          <div className="space-y-3">
            {category.children.map((child) => renderCategoryNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm("Bu kateqoriyani silmek isteyirsen?")) {
      return;
    }

    setSaving(true);

    try {
      await safeDelete(
        `/api/categories/${categoryId}`,
        {
          headers: getAuthHeaders(),
        },
        "Kateqoriyani silmek olmadi.",
      );

      setToast({ message: "Kateqoriya silindi.", type: "success" });
      await loadCategories();
    } catch (error) {
      setToast({
        message: error.message || "Kateqoriyani silmek olmadi.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {(loading || saving) && <Loader />}
      <Toast message={toast.message} type={toast.type} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Categories
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Kateqoriya idaresi</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Mehsul yaradanda secilecek kateqoriyalari buradan elave et, redakte et ve sil.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCategories}
          disabled={loading || saving}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Yenile
        </button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Yeni kateqoriya
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Kateqoriya elave et</h2>

          <form onSubmit={createCategory} className="mt-6 space-y-4">
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Meselen: Eylec sistemi"
              disabled={loading || saving}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <select
              value={parentCategoryId}
              onChange={(event) => setParentCategoryId(event.target.value)}
              disabled={loading || saving}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Esas kateqoriya yarat</option>
              {managedCategories.map((category) => (
                <option key={`parent-${category.id}`} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Kateqoriya ikonu
              </label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <CategoryThumb
                  imageUrl=""
                  name={categoryName}
                  previewSrc={createPreviewUrl}
                  sizeClassName="h-20 w-20"
                />
                <div className="min-w-0 flex-1">
                  <input
                    key={createFileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={(event) => setCreateImageFile(event.target.files?.[0] ?? null)}
                    disabled={loading || saving}
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {createPreviewUrl ? (
                      <button
                        type="button"
                        onClick={resetCreateIcon}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Secileni sil
                      </button>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      Ikon secmesen standart ikon gosterilecek.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || saving}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Kateqoriya elave et
            </button>
          </form>

          <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Idare olunan kateqoriyalar: {managedCategories.length}
            <br />
            Mehsullardan gelen elave adlar: {productOnlyCategories.length}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Kateqoriya siyahisi
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Secim ucun hazir kateqoriyalar
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Mehsul yaratma formasi bu siyahidan istifade edir
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {managedCategories.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                Hele elave olunmus kateqoriya yoxdur.
              </div>
            ) : (
              categoryTree.map((category) => renderCategoryNode(category))
            )}
          </div>

          {productOnlyCategories.length > 0 ? (
            <div className="mt-8 rounded-[24px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Mehsullardan gelen kateqoriyalar</p>
              <p className="mt-2 text-sm text-amber-800">
                Bunlar databasedeki `Category` siyahisinda yoxdur, amma movcud mehsullarda
                istifade olunub.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {productOnlyCategories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-amber-900"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
