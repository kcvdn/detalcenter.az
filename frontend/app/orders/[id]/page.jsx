"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SkeletonBlock from "@/components/SkeletonBlock";
import { navigateWithProgress } from "@/lib/navigationProgress";
import { clearStoredSession, getAuthHeaders, getStoredSession } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const trackingSteps = ["PENDING", "CONFIRMED", "SHIPPED", "DONE"];
const statusClasses = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
};

function TrackingProgress({ status, getStatusLabel }) {
  const currentIndex = Math.max(trackingSteps.indexOf(status), 0);

  return (
    <div className="space-y-3">
      <div className="hidden items-center gap-3 md:flex">
        {trackingSteps.map((step, index) => {
          const isReached = index <= currentIndex;
          const isCurrent = step === status;

          return (
            <div key={step} className="flex flex-1 items-center gap-3">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    isReached
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-300 bg-white text-slate-400"
                  } ${isCurrent ? "ring-4 ring-red-100" : ""}`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isReached ? "text-slate-950" : "text-slate-400"
                  }`}
                >
                  {getStatusLabel(step)}
                </span>
              </div>

              {index < trackingSteps.length - 1 ? (
                <div
                  className={`mb-6 h-1 flex-1 rounded-full ${
                    index < currentIndex ? "bg-slate-950" : "bg-slate-200"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 md:hidden">
        {trackingSteps.map((step, index) => {
          const isReached = index <= currentIndex;
          const isCurrent = step === status;

          return (
            <div
              key={step}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                isReached
                  ? "border-transparent bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-400"
              } ${isCurrent ? "ring-2 ring-red-200" : ""}`}
            >
              {getStatusLabel(step)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3 border-b border-slate-200 pb-5">
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-40" />
      </div>

      <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <SkeletonBlock className="h-6 w-44" />
        <SkeletonBlock className="mt-3 h-4 w-36" />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <SkeletonBlock className="h-6 w-32" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SkeletonBlock className="h-16 w-full" />
            <SkeletonBlock className="h-16 w-full" />
            <SkeletonBlock className="h-16 w-full sm:col-span-2" />
            <SkeletonBlock className="h-20 w-full sm:col-span-2" />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <SkeletonBlock className="h-6 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="mt-2 h-3 w-20" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function UserOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();

    if (!session.token || !session.userId) {
      navigateWithProgress(router, "/login", "replace");
      return undefined;
    }

    let ignore = false;

    const loadOrder = async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await axios.get(`${apiUrl}/api/orders/${params.id}`, {
          headers: getAuthHeaders(),
        });

        if (ignore) {
          return;
        }

        setOrder(response.data || null);
      } catch {
        if (!ignore) {
          clearStoredSession();
          navigateWithProgress(router, "/login", "replace");
        }
      } finally {
        if (!ignore && !silent) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    const intervalId = window.setInterval(() => {
      loadOrder(true);
    }, 15000);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [params.id, router]);

  const getStatusLabel = (status) => {
    const key = `status_${String(status || "").toLowerCase()}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Navbar search={search} setSearch={setSearch} isLoading />

        <section className="mx-auto max-w-7xl px-4 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-8 md:pb-10">
          <OrderDetailSkeleton />
        </section>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Navbar search={search} setSearch={setSearch} />

        <section className="mx-auto max-w-5xl px-4 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-8 md:pb-10">
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
            <p className="text-lg font-semibold text-slate-900">{t("order_not_found")}</p>
            <Link
              href="/orders"
              className="press-feedback touch-target mt-4 inline-flex rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("orders")}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar search={search} setSearch={setSearch} />

      <section className="mx-auto max-w-7xl px-4 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-8 md:pb-10">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-500">
              {t("details")}
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              {t("order_number")} #{order.id}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{t("tracking_live")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusClasses[order.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {getStatusLabel(order.status)}
            </span>

            <Link
              href="/orders"
              className="press-feedback touch-target inline-flex rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("orders")}
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{t("tracking_progress")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("current_status")}: {getStatusLabel(order.status)}</p>
              </div>
            </div>

            <TrackingProgress status={order.status} getStatusLabel={getStatusLabel} />
          </section>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-slate-950">{t("order_info")}</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {t("status")}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{getStatusLabel(order.status)}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {t("total")}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {Number(order.total || 0).toLocaleString(locale)} AZN
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {t("created")}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {new Date(order.createdAt).toLocaleString(locale)}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {t("address")}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{order.address}</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-slate-950">{t("order_items")}</h2>

              <div className="mt-4 space-y-3">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{item.product?.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {t("quantity")}: {item.quantity}
                      </p>
                    </div>

                    <p className="shrink-0 font-semibold text-red-600">
                      {Number(item.product?.price || 0).toLocaleString(locale)} AZN
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
