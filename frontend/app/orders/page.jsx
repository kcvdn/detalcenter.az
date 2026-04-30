"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SkeletonBlock from "@/components/SkeletonBlock";
import { navigateWithProgress } from "@/lib/navigationProgress";
import { clearStoredSession, getAuthHeaders, getStoredSession } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const statusClasses = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
};
const trackingSteps = ["PENDING", "CONFIRMED", "SHIPPED", "DONE"];

function OrderProgress({ status, getStatusLabel }) {
  const currentIndex = Math.max(trackingSteps.indexOf(status), 0);

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {trackingSteps.map((step, index) => {
        const isReached = index <= currentIndex;
        const isCurrent = step === status;

        return (
          <div
            key={step}
            className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold transition ${
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
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 2 }).map((_, index) => (
        <article key={index} className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-8 w-40" />
              <SkeletonBlock className="h-4 w-44" />
            </div>
            <div className="space-y-3">
              <SkeletonBlock className="h-7 w-24 rounded-full" />
              <SkeletonBlock className="h-12 w-36 rounded-xl" />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="grid gap-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((__, stepIndex) => (
                <SkeletonBlock key={stepIndex} className="h-12 w-full rounded-xl" />
              ))}
            </div>

            <div className="space-y-3">
              {Array.from({ length: 3 }).map((__, itemIndex) => (
                <div key={itemIndex} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <SkeletonBlock className="h-4 w-2/3" />
                  <SkeletonBlock className="mt-2 h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();

    if (!session.token || !session.userId) {
      navigateWithProgress(router, "/login", "replace");
      return undefined;
    }

    let ignore = false;

    const loadOrders = async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await axios.get(`${apiUrl}/api/orders`, {
          headers: getAuthHeaders(),
        });

        if (!ignore) {
          setOrders(Array.isArray(response.data) ? response.data : []);
        }
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

    loadOrders();

    const intervalId = window.setInterval(() => {
      loadOrders(true);
    }, 15000);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [router]);

  const getStatusLabel = (status) => {
    const key = `status_${String(status || "").toLowerCase()}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  const filteredOrders = orders.filter((order) => {
    const normalizedSearch = search.toLowerCase();

    return (
      String(order.id).includes(search) ||
      order.items?.some((item) => item.product?.name?.toLowerCase().includes(normalizedSearch))
    );
  });

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar search={search} setSearch={setSearch} isLoading={loading} />

      <section className="mx-auto max-w-7xl px-4 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-8 md:pb-10">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">{t("my_orders")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("orders_desc")}</p>
        </div>

        {loading ? (
          <OrdersSkeleton />
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
            {t("no_orders")}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => (
              <article key={order.id} className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {t("order_number")} #{order.id}
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-950">
                      {Number(order.total || 0).toLocaleString(locale)} AZN
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {t("created")}: {new Date(order.createdAt).toLocaleString(locale)}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusClasses[order.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {getStatusLabel(order.status)}
                    </span>

                    <Link
                      href={`/orders/${order.id}`}
                      className="press-feedback touch-target inline-flex rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {t("view_order_details")}
                    </Link>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <OrderProgress status={order.status} getStatusLabel={getStatusLabel} />

                  <div className="grid gap-3">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {item.product?.name}
                          </p>
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
