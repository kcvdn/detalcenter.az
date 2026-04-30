"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/app/dashboard/components/Loader";
import Toast from "@/app/dashboard/components/Toast";
import { clearStoredSession, getAuthHeaders, getStoredSession } from "@/lib/session";
import { safeDelete, safeGet, safePost, safePut } from "@/lib/apiClient";

const defaultStats = {
  brands: 0,
  models: 0,
  cars: 0,
};

export default function DashboardCatalogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [brands, setBrands] = useState([]);
  const [brandForm, setBrandForm] = useState("");
  const [modelDrafts, setModelDrafts] = useState({});
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [editingBrandName, setEditingBrandName] = useState("");
  const [editingModelId, setEditingModelId] = useState(null);
  const [editingModelName, setEditingModelName] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  const loadCatalog = async () => {
    setLoading(true);

    const session = getStoredSession();
    if (!session.token) {
      clearStoredSession();
      router.replace("/login");
      return;
    }

    try {
      const data = await safeGet(
        "/api/admin/catalog",
        {
          headers: getAuthHeaders(),
        },
        "Kataloq melumatlarini yuklemek olmadi.",
      );

      setStats(data?.stats || defaultStats);
      setBrands(Array.isArray(data?.brands) ? data.brands : []);
    } catch (error) {
      const errorMessage = error.message || "Kataloq melumatlarini yuklemek olmadi.";

      if (error.response?.status === 401 || error.response?.status === 403) {
        clearStoredSession();
        router.replace("/login");
        return;
      }

      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const totalVisibleModels = useMemo(() => {
    return brands.reduce((sum, brand) => sum + (Array.isArray(brand.models) ? brand.models.length : 0), 0);
  }, [brands]);

  const updateModelDraft = (brandId, value) => {
    setModelDrafts((current) => ({
      ...current,
      [brandId]: value,
    }));
  };

  const createBrand = async (event) => {
    event.preventDefault();

    if (!brandForm.trim()) {
      setToast({ message: "Marka adi bos ola bilmez.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      await safePost(
        "/api/admin/catalog/brands",
        { name: brandForm.trim() },
        {
          headers: getAuthHeaders(),
        },
        "Markani elave etmek olmadi.",
      );

      setBrandForm("");
      setToast({ message: "Marka elave edildi.", type: "success" });
      await loadCatalog();
    } catch (error) {
      setToast({
        message: error.message || "Markani elave etmek olmadi.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveBrand = async (brandId) => {
    if (!editingBrandName.trim()) {
      setToast({ message: "Marka adi bos ola bilmez.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      await safePut(
        `/api/admin/catalog/brands/${brandId}`,
        { name: editingBrandName.trim() },
        {
          headers: getAuthHeaders(),
        },
        "Markani yenilemek olmadi.",
      );

      setEditingBrandId(null);
      setEditingBrandName("");
      setToast({ message: "Marka yenilendi.", type: "success" });
      await loadCatalog();
    } catch (error) {
      setToast({
        message: error.message || "Markani yenilemek olmadi.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteBrand = async (brandId) => {
    if (!window.confirm("Bu markani silmek isteyirsen?")) {
      return;
    }

    setSaving(true);

    try {
      await safeDelete(
        `/api/admin/catalog/brands/${brandId}`,
        {
          headers: getAuthHeaders(),
        },
        "Markani silmek olmadi.",
      );

      setToast({ message: "Marka silindi.", type: "success" });
      await loadCatalog();
    } catch (error) {
      setToast({
        message: error.message || "Markani silmek olmadi.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const createModel = async (brandId) => {
    const modelName = String(modelDrafts[brandId] || "").trim();

    if (!modelName) {
      setToast({ message: "Model adi bos ola bilmez.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      await safePost(
        "/api/admin/catalog/models",
        { brandId, name: modelName },
        {
          headers: getAuthHeaders(),
        },
        "Modeli elave etmek olmadi.",
      );

      updateModelDraft(brandId, "");
      setToast({ message: "Model elave edildi.", type: "success" });
      await loadCatalog();
    } catch (error) {
      setToast({
        message: error.message || "Modeli elave etmek olmadi.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveModel = async (modelId) => {
    if (!editingModelName.trim()) {
      setToast({ message: "Model adi bos ola bilmez.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      await safePut(
        `/api/admin/catalog/models/${modelId}`,
        { name: editingModelName.trim() },
        {
          headers: getAuthHeaders(),
        },
        "Modeli yenilemek olmadi.",
      );

      setEditingModelId(null);
      setEditingModelName("");
      setToast({ message: "Model yenilendi.", type: "success" });
      await loadCatalog();
    } catch (error) {
      setToast({
        message: error.message || "Modeli yenilemek olmadi.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteModel = async (modelId) => {
    if (!window.confirm("Bu modeli silmek isteyirsen?")) {
      return;
    }

    setSaving(true);

    try {
      await safeDelete(
        `/api/admin/catalog/models/${modelId}`,
        {
          headers: getAuthHeaders(),
        },
        "Modeli silmek olmadi.",
      );

      setToast({ message: "Model silindi.", type: "success" });
      await loadCatalog();
    } catch (error) {
      setToast({
        message: error.message || "Modeli silmek olmadi.",
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
            Vehicle Catalog
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Marka ve model idaresi</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Saytin axtaris, filter ve mehsul uygunlugu ucun istifade olunan marka ve model
            siyahisini buradan idare et.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCatalog}
          disabled={loading || saving}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Yenile
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Markalar</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{stats.brands}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Modeller</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{stats.models}</p>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Vehicle rows</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{stats.cars}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Yeni marka
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Kataloqa marka elave et</h2>

          <form onSubmit={createBrand} className="mt-6 space-y-4">
            <input
              value={brandForm}
              onChange={(event) => setBrandForm(event.target.value)}
              placeholder="Meselen: Toyota"
              disabled={loading || saving}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={loading || saving}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Marka elave et
            </button>
          </form>

          <div className="mt-6 rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Qisa xulase
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hazirda {stats.brands} marka ve {totalVisibleModels} model gorunur. Buradaki
              deyisiklikler ana sehife filterlerinde de hiss olunacaq.
            </p>
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Kataloq siyahisi
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Markalar ve modeller</h2>
            </div>
            <p className="text-sm text-slate-500">Markani redakte et, modele elave et, lazim olmayani sil</p>
          </div>

          <div className="mt-6 space-y-4">
            {brands.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                Hele marka yoxdur.
              </div>
            ) : (
              brands.map((brand) => (
                <div key={brand.id} className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      {editingBrandId === brand.id ? (
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <input
                            value={editingBrandName}
                            onChange={(event) => setEditingBrandName(event.target.value)}
                            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveBrand(brand.id)}
                              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Saxla
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBrandId(null);
                                setEditingBrandName("");
                              }}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Legv et
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-slate-950">{brand.name}</h3>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                            {brand._count?.models || 0} model
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                            {brand._count?.cars || 0} vehicle row
                          </span>
                        </div>
                      )}
                    </div>

                    {editingBrandId !== brand.id ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBrandId(brand.id);
                            setEditingBrandName(brand.name);
                          }}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBrand(brand.id)}
                          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Sil
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={modelDrafts[brand.id] || ""}
                      onChange={(event) => updateModelDraft(brand.id, event.target.value)}
                      placeholder={`${brand.name} ucun yeni model`}
                      disabled={loading || saving}
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => createModel(brand.id)}
                      disabled={loading || saving}
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Model elave et
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.isArray(brand.models) && brand.models.length > 0 ? (
                      brand.models.map((model) => (
                        <div
                          key={model.id}
                          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2"
                        >
                          {editingModelId === model.id ? (
                            <>
                              <input
                                value={editingModelName}
                                onChange={(event) => setEditingModelName(event.target.value)}
                                className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => saveModel(model.id)}
                                className="text-xs font-semibold text-slate-950"
                              >
                                Saxla
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingModelId(null);
                                  setEditingModelName("");
                                }}
                                className="text-xs font-semibold text-slate-500"
                              >
                                Legv
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-medium text-slate-800">{model.name}</span>
                              <span className="text-[11px] text-slate-400">
                                {model._count?.cars || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingModelId(model.id);
                                  setEditingModelName(model.name);
                                }}
                                className="text-xs font-semibold text-slate-500"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteModel(model.id)}
                                className="text-xs font-semibold text-red-600"
                              >
                                Sil
                              </button>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-400">
                        Bu marka ucun hele model yoxdur.
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
