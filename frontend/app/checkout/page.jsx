"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppImage from "@/components/AppImage";
import Navbar from "@/components/Navbar";
import SkeletonBlock from "@/components/SkeletonBlock";
import { productPlaceholderSrc, resolveImageSrc } from "@/lib/images";
import { navigateWithProgress } from "@/lib/navigationProgress";
import { clearStoredSession, getAuthHeaders, getStoredSession } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-red-500"
      aria-hidden="true"
    />
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6 md:p-8">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="mt-3 h-4 w-64 max-w-full" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full md:col-span-2" />
          <SkeletonBlock className="h-36 w-full md:col-span-2" />
        </div>
      </section>

      <aside className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6 md:p-8">
        <SkeletonBlock className="h-6 w-36" />
        <SkeletonBlock className="mt-3 h-4 w-32" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <SkeletonBlock className="h-16 w-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="h-3 w-1/3" />
              </div>
              <SkeletonBlock className="h-4 w-16" />
            </div>
          ))}
        </div>
        <SkeletonBlock className="mt-6 h-24 w-full rounded-2xl" />
        <SkeletonBlock className="mt-6 h-14 w-full rounded-xl" />
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    const session = getStoredSession();

    if (!session.token || !session.userId) {
      navigateWithProgress(router, "/login", "replace");
      return;
    }

    let ignore = false;

    const loadCheckoutData = async () => {
      setLoading(true);

      try {
        const [cartResponse, meResponse] = await Promise.all([
          axios.get(`${apiUrl}/api/cart/${session.userId}`, {
            headers: getAuthHeaders(),
          }),
          axios.get(`${apiUrl}/api/me`, {
            headers: getAuthHeaders(),
          }),
        ]);

        if (ignore) {
          return;
        }

        setCartItems(Array.isArray(cartResponse.data) ? cartResponse.data : []);
        setForm((current) => ({
          ...current,
          name: meResponse.data?.name || "",
          email: meResponse.data?.email || "",
        }));
      } catch {
        if (!ignore) {
          clearStoredSession();
          navigateWithProgress(router, "/login", "replace");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadCheckoutData();

    return () => {
      ignore = true;
    };
  }, [router]);

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast.message]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + Number(item.product?.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [cartItems]);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleConfirmOrder = async () => {
    if (submitting) {
      return;
    }

    const session = getStoredSession();

    if (!session.token || !session.userId) {
      navigateWithProgress(router, "/login", "replace");
      return;
    }

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setToast({ message: t("required_fields_checkout"), type: "error" });
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${apiUrl}/api/orders`,
        {
          user_id: Number(session.userId),
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          note: form.note.trim(),
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setToast({ message: t("order_created_success"), type: "success" });

      window.setTimeout(() => {
        navigateWithProgress(router, "/orders");
      }, 700);
    } catch (error) {
      setToast({
        message: error.response?.data?.error || t("could_not_create_order"),
        type: "error",
      });
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar search={search} setSearch={setSearch} isLoading={loading} />

      <section className="mx-auto max-w-7xl px-4 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-10 md:pb-10">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-500">
            {t("checkout")}
          </p>
          <h1 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
            {t("checkout_title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">{t("checkout_desc")}</p>
        </div>

        {toast.message ? (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              toast.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        {loading ? (
          <CheckoutSkeleton />
        ) : cartItems.length === 0 ? (
          <div className="rounded-[28px] bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
            <p>{t("checkout_empty")}</p>
            <Link
              href="/cart"
              className="press-feedback touch-target mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {t("back_to_cart")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-950">{t("contact_information")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("delivery_details")}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">{t("name")}</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-red-300"
                  />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">{t("email_address")}</span>
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500 outline-none"
                  />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">{t("phone")}</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-red-300"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">{t("address")}</span>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) => handleChange("address", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-red-300"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">{t("note")}</span>
                  <textarea
                    value={form.note}
                    onChange={(event) => handleChange("note", event.target.value)}
                    rows={5}
                    placeholder={t("note_placeholder")}
                    className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-red-300"
                  />
                </label>
              </div>
            </section>

            <aside className="h-fit rounded-[28px] bg-white p-5 shadow-sm sm:p-6 md:p-8 lg:sticky lg:top-24">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-950">{t("order_summary")}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("product_count_label")}: {cartItems.length}
                </p>
              </div>

              <div className="space-y-3">
                {cartItems.map((item) => {
                  const imageUrl = resolveImageSrc(item.product?.image, productPlaceholderSrc);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="h-16 w-16 overflow-hidden rounded-xl bg-white">
                        {imageUrl ? (
                          <AppImage
                            src={imageUrl}
                            alt={item.product?.name}
                            fallbackSrc={productPlaceholderSrc}
                            width={64}
                            height={64}
                            sizes="64px"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">
                            {t("no_image")}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.product?.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {t("quantity")}: {item.quantity}
                        </p>
                      </div>

                      <p className="text-sm font-bold text-red-600">
                        {Number(item.product?.price || 0).toLocaleString(locale)} AZN
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {t("total")}
                </p>
                <p className="mt-2 text-3xl font-black">
                  {Number(totalPrice || 0).toLocaleString(locale)} AZN
                </p>
              </div>

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={submitting}
                className="press-feedback touch-target mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Spinner /> : null}
                {submitting ? t("confirming_order") : t("confirm_order")}
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
