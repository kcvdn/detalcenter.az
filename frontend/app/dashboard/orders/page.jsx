"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Toast from "@/app/dashboard/components/Toast";
import { getAuthHeaders, getStoredSession } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const statuses = ["PENDING", "CONFIRMED", "SHIPPED", "DONE"];
const statusClasses = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
};

export default function DashboardOrdersPage() {
  const { t, locale } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [role, setRole] = useState("");

  useEffect(() => {
    setRole(getStoredSession().role || "");
  }, []);

  const loadOrders = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await axios.get(`${apiUrl}/api/admin/orders`, {
        headers: getAuthHeaders(),
      });

      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch {
      setToast({ message: "Sifarisleri yuklemek olmadi.", type: "error" });
      if (!silent) {
        setOrders([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

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

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);

    try {
      const response = await axios.put(
        `${apiUrl}/api/orders/${orderId}`,
        { status },
        {
          headers: getAuthHeaders(),
        },
      );

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? response.data : order)),
      );
      await loadOrders(true);
      setToast({ message: "Order status yenilendi.", type: "success" });
    } catch {
      setToast({ message: "Order status yenilenmedi.", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status) => {
    const key = `status_${String(status || "").toLowerCase()}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          {role === "SELLER_ADMIN"
            ? "Oz magazana aid sifarisleri ve satislari izle"
            : "Butun sifarisleri izleyib statusu deyis"}
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
          Orders yuklenir...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
          Hele sifaris yoxdur.
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <article key={order.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Order #{order.id}
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    {Number(order.total || 0).toLocaleString(locale)} AZN
                  </h2>
                  <p className="text-sm text-slate-500">
                    User ID: {order.user_id} | {t("created")}:{" "}
                    {new Date(order.createdAt).toLocaleString(locale)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t("details")}
                  </Link>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      statusClasses[order.status] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {getStatusLabel(order.status)}
                  </span>

                  {role === "ADMIN" ? (
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(event) => updateStatus(order.id, event.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-2xl bg-slate-50 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Customer info
                  </h3>

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

                    {order.note ? (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {t("note")}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{order.note}</p>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-2xl bg-slate-50 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Order items
                  </h3>

                  <div className="mt-4 space-y-3">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-white bg-white px-4 py-3"
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
                </section>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
