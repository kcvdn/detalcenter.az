"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import Toast from "@/app/dashboard/components/Toast";
import { getAuthHeaders, getStoredSession } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const statusClasses = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
};

export default function DashboardOrderDetailPage() {
  const params = useParams();
  const { t, locale } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [role, setRole] = useState("");

  useEffect(() => {
    setRole(getStoredSession().role || "");
    let ignore = false;

    const loadOrder = async () => {
      setLoading(true);

      try {
        const response = await axios.get(`${apiUrl}/api/orders/${params.id}`, {
          headers: getAuthHeaders(),
        });

        if (!ignore) {
          setOrder(response.data);
        }
      } catch {
        if (!ignore) {
          setOrder(null);
          setToast({ message: "Order detail yuklenmedi.", type: "error" });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      ignore = true;
    };
  }, [params.id]);

  const getStatusLabel = (status) => {
    const key = `status_${String(status || "").toLowerCase()}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  const handleDownloadInvoice = async () => {
    if (downloading) {
      return;
    }

    setDownloading(true);

    try {
      const response = await axios.get(`${apiUrl}/api/orders/${params.id}/invoice`, {
        headers: getAuthHeaders(),
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `order-${params.id}-invoice.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setToast({ message: t("invoice_download_error"), type: "error" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-slate-50 p-10 text-center text-slate-500">
        {t("loading")}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Toast message={toast.message} type={toast.type} />
        <div className="rounded-3xl bg-slate-50 p-10 text-center text-slate-500">
          Order not found.
        </div>
        <Link
          href="/dashboard/orders"
          className="inline-flex rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} />

      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t("details")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Order #{order.id}</h1>
          <p className="mt-2 text-sm text-slate-500">
            User ID: {order.user_id} | {t("created")}: {new Date(order.createdAt).toLocaleString(locale)}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              statusClasses[order.status] || "bg-slate-100 text-slate-700"
            }`}
          >
            {getStatusLabel(order.status)}
          </span>

          {role === "ADMIN" ? (
            <button
              type="button"
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? t("downloading") : t("download_pdf")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl bg-slate-50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t("customer_info")}
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t("name")}
              </p>
              <p className="mt-1 font-semibold text-slate-900">{order.name}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t("phone")}
              </p>
              <p className="mt-1 font-semibold text-slate-900">{order.phone}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t("address")}
              </p>
              <p className="mt-1 font-semibold text-slate-900">{order.address}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t("note")}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{order.note || t("no_note")}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t("order_info")}
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Order ID
              </p>
              <p className="mt-1 font-semibold text-slate-900">#{order.id}</p>
            </div>

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

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t("created")}
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {new Date(order.createdAt).toLocaleString(locale)}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl bg-slate-50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          {t("order_items")}
        </h2>

        <div className="mt-4 space-y-3">
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white bg-white px-4 py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{item.product?.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {t("price")}: {Number(item.product?.price || 0).toLocaleString(locale)} AZN
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-600">
                  {t("quantity")}: {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
