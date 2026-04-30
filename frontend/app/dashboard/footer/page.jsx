"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import SiteFooterContent from "@/components/SiteFooterContent";
import { clearCachedGet } from "@/lib/apiClient";
import { normalizeSiteContent } from "@/lib/marketplaceData";
import { getAuthHeaders } from "@/lib/session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const Loader = dynamic(() => import("@/app/dashboard/components/Loader"), {
  ssr: false,
});
const Toast = dynamic(() => import("@/app/dashboard/components/Toast"), {
  ssr: false,
});

const defaultForm = {
  footerDescription: "",
  footerWorkHoursLabel: "",
  footerWorkHoursValue: "",
  footerPhoneLabel: "",
  footerPhoneValue: "",
  footerEmailLabel: "",
  footerEmailValue: "",
  footerSocialLabel: "",
  footerFacebookUrl: "",
  footerInstagramUrl: "",
  footerLinkedinUrl: "",
  footerTiktokUrl: "",
  footerCopyright: "",
  footerPrivacyLabel: "",
  footerTermsLabel: "",
  footerAboutLabel: "",
  footerFaqLabel: "",
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

export default function DashboardFooterPage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);

      try {
        const response = await axios.get(`${apiUrl}/api/content`);
        setForm(buildFormState(response.data));
      } catch {
        setToast({ message: "Footer kontentini yuklemek olmadi.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      const payload = fieldNames.reduce((next, field) => {
        next[field] = form[field].trim();
        return next;
      }, {});

      const response = await axios.put(`${apiUrl}/api/content`, payload, {
        headers: getAuthHeaders(),
      });

      clearCachedGet("/api/content");
      setForm(buildFormState(response.data));
      setToast({ message: "Footer kontenti yenilendi.", type: "success" });
    } catch (error) {
      const message =
        error.response?.data?.error || "Footer kontentini yadda saxlamaq mumkun olmadi.";
      setToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const footerPreviewContent = useMemo(() => normalizeSiteContent(form), [form]);

  return (
    <div className="space-y-6">
      {(loading || saving) && <Loader />}
      <Toast message={toast.message} type={toast.type} />

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Footer CMS
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Footer idaresi</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Saytin en asagisindaki elaqe melumatlari, sosial linkler ve alt kecidler bu bolmeden idare olunur.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="space-y-8">
            <SectionHeading
              eyebrow="Melumatlar"
              title="Footer-in esas hissesi"
              description="Alt blokda gosterilen tesvir, is saati, telefon, email ve sosial basliq yazilarini buradan deyis."
            />

            <div className="space-y-5">
              <TextareaField
                id="footer-description"
                label="Footer qisa tesviri"
                rows={3}
                value={form.footerDescription}
                onChange={updateField("footerDescription")}
                disabled={loading || saving}
                placeholder="Keyfiyyetli ehtiyat hisseleri, rahat sifaris ve suretli destek bir yerde."
              />

              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  id="footer-hours-label"
                  label="Is gunleri etiketi"
                  value={form.footerWorkHoursLabel}
                  onChange={updateField("footerWorkHoursLabel")}
                  disabled={loading || saving}
                  placeholder="Is gunleri"
                />
                <InputField
                  id="footer-hours-value"
                  label="Is gunleri deyeri"
                  value={form.footerWorkHoursValue}
                  onChange={updateField("footerWorkHoursValue")}
                  disabled={loading || saving}
                  placeholder="Be. - Ce. / 09:00 - 18:00"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  id="footer-phone-label"
                  label="Telefon etiketi"
                  value={form.footerPhoneLabel}
                  onChange={updateField("footerPhoneLabel")}
                  disabled={loading || saving}
                  placeholder="Elaqe nomresi"
                />
                <InputField
                  id="footer-phone-value"
                  label="Telefon nomresi"
                  value={form.footerPhoneValue}
                  onChange={updateField("footerPhoneValue")}
                  disabled={loading || saving}
                  placeholder="+994 55 738 00 13"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  id="footer-email-label"
                  label="Email etiketi"
                  value={form.footerEmailLabel}
                  onChange={updateField("footerEmailLabel")}
                  disabled={loading || saving}
                  placeholder="E-poct"
                />
                <InputField
                  id="footer-email-value"
                  label="Email unvani"
                  value={form.footerEmailValue}
                  onChange={updateField("footerEmailValue")}
                  disabled={loading || saving}
                  placeholder="info@avtopro.az"
                />
              </div>

              <InputField
                id="footer-social-label"
                label="Sosial sebeke etiketi"
                value={form.footerSocialLabel}
                onChange={updateField("footerSocialLabel")}
                disabled={loading || saving}
                placeholder="Bizi izleyin"
              />
            </div>

            <div className="h-px bg-slate-200" />

            <SectionHeading
              eyebrow="Linkler"
              title="Sosial sebeke linkleri"
              description="Footer ikonlarina klik edilende acilacaq unvanlari daxil et."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                id="footer-facebook"
                label="Facebook linki"
                value={form.footerFacebookUrl}
                onChange={updateField("footerFacebookUrl")}
                disabled={loading || saving}
                placeholder="https://facebook.com/seninsehifen"
                type="url"
              />
              <InputField
                id="footer-instagram"
                label="Instagram linki"
                value={form.footerInstagramUrl}
                onChange={updateField("footerInstagramUrl")}
                disabled={loading || saving}
                placeholder="https://instagram.com/seninsehifen"
                type="url"
              />
              <InputField
                id="footer-linkedin"
                label="LinkedIn linki"
                value={form.footerLinkedinUrl}
                onChange={updateField("footerLinkedinUrl")}
                disabled={loading || saving}
                placeholder="https://linkedin.com/company/seninsehifen"
                type="url"
              />
              <InputField
                id="footer-tiktok"
                label="TikTok linki"
                value={form.footerTiktokUrl}
                onChange={updateField("footerTiktokUrl")}
                disabled={loading || saving}
                placeholder="https://tiktok.com/@seninsehifen"
                type="url"
              />
            </div>

            <div className="h-px bg-slate-200" />

            <SectionHeading
              eyebrow="Alt kecidler"
              title="Footer-in son setri"
              description="Copyright metni ve altda gosterilen 4 kecidin adlari bu hisseden deyisdirilir."
            />

            <div className="space-y-5">
              <InputField
                id="footer-copyright"
                label="Copyright metni"
                value={form.footerCopyright}
                onChange={updateField("footerCopyright")}
                disabled={loading || saving}
                placeholder="Detalcenter.az 2026, Butun huquqlar qorunur."
              />

              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  id="footer-privacy"
                  label="Mexfilik basligi"
                  value={form.footerPrivacyLabel}
                  onChange={updateField("footerPrivacyLabel")}
                  disabled={loading || saving}
                  placeholder="Mexfilik siyaseti"
                />
                <InputField
                  id="footer-terms"
                  label="Sertler basligi"
                  value={form.footerTermsLabel}
                  onChange={updateField("footerTermsLabel")}
                  disabled={loading || saving}
                  placeholder="Sertler ve qaydalar"
                />
                <InputField
                  id="footer-about"
                  label="Haqqimizda basligi"
                  value={form.footerAboutLabel}
                  onChange={updateField("footerAboutLabel")}
                  disabled={loading || saving}
                  placeholder="Haqqimizda"
                />
                <InputField
                  id="footer-faq"
                  label="FAQ basligi"
                  value={form.footerFaqLabel}
                  onChange={updateField("footerFaqLabel")}
                  disabled={loading || saving}
                  placeholder="Tez-tez verilen suallar"
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
              {saving ? "Yaddasda saxlanilir..." : "Footer deyisikliklerini saxla"}
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="px-2 pb-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Footer Preview
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Burada public sehifede gorunecek footer-in canli gorunusunu izleyebilersen.
              </p>
            </div>

            <div className="mt-3">
              <SiteFooterContent content={footerPreviewContent} preview embedded />
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
              Footer Qeyd
            </p>
            <h2 className="mt-2 text-2xl font-bold">Alt hisseni ayri idare et</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <p>Buradaki yazilar saytin butun public sehifelerinde eyni gosterilir.</p>
              <p>Altdaki 4 kecid artiq real sehifelere baglidir.</p>
              <p>Sosial link bos qalarsa, ikon qalacaq amma link default fallback ile doldurula biler.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
