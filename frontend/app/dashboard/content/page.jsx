"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import AppImage from "@/components/AppImage";
import { clearCachedGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const Loader = dynamic(() => import("@/app/dashboard/components/Loader"), {
  ssr: false,
});
const Toast = dynamic(() => import("@/app/dashboard/components/Toast"), {
  ssr: false,
});

const defaultForm = {
  heroTitle: "",
  heroDesc: "",
  heroButton: "",
  heroImage: "",
};

const fieldNames = Object.keys(defaultForm);

function buildFormState(data = {}) {
  return fieldNames.reduce((next, field) => {
    next[field] = String(data?.[field] ?? "");
    return next;
  }, {});
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-3 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 4,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-3 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

export default function DashboardContentPage() {
  const [form, setForm] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);

      try {
        const response = await axios.get(`${apiUrl}/api/content`);
        setForm(buildFormState(response.data));
      } catch {
        setToast({ message: "Ana sehife kontentini yuklemek olmadi.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const uploadImage = async (file) => {
    const uploadForm = new FormData();
    uploadForm.append("image", file);

    const response = await axios.post(`${apiUrl}/api/upload`, uploadForm, {
      headers: getAuthHeaders(),
    });

    return response.data?.url || "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.heroTitle.trim() || !form.heroDesc.trim() || !form.heroButton.trim()) {
      setToast({ message: "Hero ucun basliq, tesvir ve duyme metni vacibdir.", type: "error" });
      return;
    }

    setSaving(true);

    try {
      let heroImage = form.heroImage.trim();

      if (imageFile) {
        heroImage = await uploadImage(imageFile);
      }

      if (!heroImage) {
        setToast({ message: "Hero sekli secmek vacibdir.", type: "error" });
        setSaving(false);
        return;
      }

      const payload = fieldNames.reduce(
        (next, field) => {
          next[field] = form[field].trim();
          return next;
        },
        { heroImage },
      );

      payload.heroImage = heroImage;

      const response = await axios.put(`${apiUrl}/api/content`, payload, {
        headers: getAuthHeaders(),
      });

      clearCachedGet("/api/content");
      setForm(buildFormState(response.data));
      setImageFile(null);
      setPreviewUrl("");
      setFileInputKey((current) => current + 1);
      setToast({ message: "Ana sehife kontenti yenilendi.", type: "success" });
    } catch (error) {
      const message =
        error.response?.data?.error || "Kontenti yadda saxlamaq mumkun olmadi.";
      setToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const currentPreview = previewUrl || form.heroImage;

  return (
    <div className="space-y-6">
      {(loading || saving) && <Loader />}
      <Toast message={toast.message} type={toast.type} />

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Homepage CMS
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Ana sehife kontenti</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Yalniz hero hissesi buradan idare olunur. Footer ucun ayrica admin bolmesinden istifade et.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="space-y-8">
            <SectionHeading
              eyebrow="Hero"
              title="Ana banner"
              description="Basliq, qisa tesvir, duyme metni ve banner sekli ana sehifenin ust hissesinde gosterilir."
            />

            <div className="space-y-5">
              <InputField
                id="hero-title"
                label="Hero basligi"
                value={form.heroTitle}
                onChange={updateField("heroTitle")}
                disabled={loading || saving}
                placeholder="Onlayn ehtiyat hissesi magazasi"
              />

              <TextareaField
                id="hero-desc"
                label="Hero tesviri"
                rows={4}
                value={form.heroDesc}
                onChange={updateField("heroDesc")}
                disabled={loading || saving}
                placeholder="Butun seher ve rayonlara suretli catdirilma ve rahat sifaris imkani"
              />

              <InputField
                id="hero-button"
                label="Duyme metni"
                value={form.heroButton}
                onChange={updateField("heroButton")}
                disabled={loading || saving}
                placeholder="Axtar"
              />

              <div>
                <label
                  htmlFor="hero-image"
                  className="mb-3 block text-sm font-semibold text-slate-700"
                >
                  Hero sekli
                </label>
                <input
                  key={fileInputKey}
                  id="hero-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  disabled={loading || saving}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading || saving}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Yaddasda saxlanilir..." : "Deyisiklikleri saxla"}
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Hero Preview
            </p>

            <div className="mt-4 overflow-hidden rounded-[28px] bg-slate-100">
              {currentPreview ? (
                <AppImage
                  src={currentPreview}
                  alt="Hero preview"
                  width={1200}
                  height={720}
                  sizes="(max-width: 1279px) 100vw, 480px"
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-slate-400">
                  Hero sekli secilenden sonra preview burada gorunecek.
                </div>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Basliq
                </p>
                <p className="mt-1 text-xl font-bold text-slate-950">
                  {form.heroTitle || "Hero basligi hele daxil edilmeyib"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Tesvir
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {form.heroDesc || "Hero tesviri hele daxil edilmeyib"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Duyme
                </p>
                <div className="mt-2 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                  {form.heroButton || "Duyme metni"}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
