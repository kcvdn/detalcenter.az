"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Loader from "@/app/dashboard/components/Loader";
import Toast from "@/app/dashboard/components/Toast";
import { getAuthHeaders, getStoredSession } from "@/lib/session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("az-AZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} AZN`;

const formatCompactCurrency = (value) =>
  Number(value || 0).toLocaleString("az-AZ", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

const getStatCards = (analytics) => [
  {
    id: "total-orders",
    label: "Butun sifarisler",
    value: Number(analytics.totalOrders || 0).toLocaleString("az-AZ"),
    subtext: "Butun sifarislerin sayi",
    accent: "from-blue-500 to-cyan-400",
    icon: "🧾",
  },
  {
    id: "total-revenue",
    label: "Butun gelir",
    value: formatCurrency(analytics.totalRevenue),
    subtext: "Toplam satis dovriyesi",
    accent: "from-emerald-500 to-teal-400",
    icon: "₼",
  },
  {
    id: "today-orders",
    label: "Bugunku sifarisler",
    value: Number(analytics.todayOrders || 0).toLocaleString("az-AZ"),
    subtext: "Bugun yaradilan sifarisler",
    accent: "from-amber-500 to-orange-400",
    icon: "📦",
  },
  {
    id: "today-revenue",
    label: "Bugunku gelir",
    value: formatCurrency(analytics.todayRevenue),
    subtext: "Bugunku satis geliri",
    accent: "from-violet-500 to-fuchsia-400",
    icon: "📈",
  },
];

const adminQuickLinks = [
  {
    href: "/dashboard/content",
    label: "Ana sehife",
    description: "Ana sehifenin basliq, tesvir ve sekilini idare et",
  },
  {
    href: "/dashboard/footer",
    label: "Footer",
    description: "Alt hissedeki elaqe, sosial linkler ve footer yazilarini yenile",
  },
  {
    href: "/dashboard/categories",
    label: "Kateqoriyalar",
    description: "Detallari secib katalog bolmelerine ayir",
  },
  {
    href: "/dashboard/products",
    label: "Mehsullar",
    description: "Mehsullari redakte et, seller uzre yoxla",
  },
  {
    href: "/dashboard/sellers",
    label: "Magazalar",
    description: "Magazalari ve seller adminlerini idare et",
  },
];

export default function DashboardPage() {
  const [role, setRole] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [storeForm, setStoreForm] = useState({
    name: "",
    phone: "",
    address: "",
    description: "",
  });
  const [storeSaving, setStoreSaving] = useState(false);
  const [analytics, setAnalytics] = useState({
    scope: "marketplace",
    scopeLabel: "Marketplace",
    totalOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    weeklySalesByDay: [],
    monthlySalesByDay: [],
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    const session = getStoredSession();
    setRole(session.role || "");
    setSellerId(session.sellerId || "");
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);

      try {
        const response = await axios.get(`${apiUrl}/api/admin/analytics`, {
          headers: getAuthHeaders(),
        });

        setAnalytics({
          scope: response.data?.scope || "marketplace",
          scopeLabel: response.data?.scopeLabel || "Marketplace",
          totalOrders: response.data?.totalOrders || 0,
          totalRevenue: response.data?.totalRevenue || 0,
          todayOrders: response.data?.todayOrders || 0,
          todayRevenue: response.data?.todayRevenue || 0,
          weeklySalesByDay: Array.isArray(response.data?.weeklySalesByDay)
            ? response.data.weeklySalesByDay
            : [],
          monthlySalesByDay: Array.isArray(response.data?.monthlySalesByDay)
            ? response.data.monthlySalesByDay
            : [],
        });
      } catch {
        setToast({ message: "Analytics melumatlarini yuklemek olmadi.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  useEffect(() => {
    if (role !== "SELLER_ADMIN" || !sellerId) {
      return;
    }

    const loadStoreProfile = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/sellers/${sellerId}`, {
          headers: getAuthHeaders(),
        });

        setStoreForm({
          name: response.data?.name || "",
          phone: response.data?.phone || "",
          address: response.data?.address || "",
          description: response.data?.description || "",
        });
      } catch {
        setToast({ message: "Magaza melumatlarini yuklemek olmadi.", type: "error" });
      }
    };

    loadStoreProfile();
  }, [role, sellerId]);

  const handleStoreFieldChange = (field) => (event) => {
    const value = event.target.value;
    setStoreForm((current) => ({ ...current, [field]: value }));
  };

  const handleStoreSave = async () => {
    if (!sellerId || !storeForm.name.trim()) {
      setToast({ message: "Magaza adi bos ola bilmez.", type: "error" });
      return;
    }

    setStoreSaving(true);

    try {
      await axios.put(
        `${apiUrl}/api/sellers/${sellerId}`,
        {
          name: storeForm.name.trim(),
          phone: storeForm.phone.trim() || null,
          address: storeForm.address.trim() || null,
          description: storeForm.description.trim() || null,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setToast({ message: "Magaza melumatlari yenilendi.", type: "success" });
    } catch (error) {
      setToast({
        message: error.response?.data?.error || "Magaza melumatlarini yenilemek olmadi.",
        type: "error",
      });
    } finally {
      setStoreSaving(false);
    }
  };

  const statCards = useMemo(() => getStatCards(analytics), [analytics]);
  const maxWeeklyRevenue = useMemo(() => {
    return Math.max(...analytics.weeklySalesByDay.map((day) => Number(day.revenue || 0)), 1);
  }, [analytics.weeklySalesByDay]);

  const maxMonthlyRevenue = useMemo(() => {
    return Math.max(...analytics.monthlySalesByDay.map((day) => Number(day.revenue || 0)), 1);
  }, [analytics.monthlySalesByDay]);

  const bestDay = useMemo(() => {
    if (!analytics.monthlySalesByDay.length) {
      return null;
    }

    return analytics.monthlySalesByDay.reduce((best, current) => {
      return Number(current.revenue || 0) > Number(best.revenue || 0) ? current : best;
    }, analytics.monthlySalesByDay[0]);
  }, [analytics.monthlySalesByDay]);

  return (
    <div className="space-y-8">
      {loading ? <Loader /> : null}
      <Toast message={toast.message} type={toast.type} />

      <section className="overflow-hidden rounded-[32px] bg-slate-950 px-6 py-7 text-white shadow-xl md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
              {analytics.scope === "seller" ? "Store Analytics" : "Analytics Overview"}
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-white md:text-4xl">
              {analytics.scope === "seller"
                ? `${analytics.scopeLabel} magazasinin performansini izle`
                : "Marketplace performansini bir baxisda izle"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              {analytics.scope === "seller"
                ? "Oz magazanin sifarislerini, satislarini ve hefte-ay uzre hereketini bu panelden izle."
                : "Sifaris sayi, gelir ve gunluk hereketleri bu panelden izleyib biznes ritmini daha rahat idare ede bilersen."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm text-slate-300">7 gunluk gelir</p>
              <p className="mt-3 text-3xl font-black text-white">
                {formatCompactCurrency(analytics.weeklySalesByDay.reduce((sum, day) => {
                  return sum + Number(day.revenue || 0);
                }, 0))}{" "}
                AZN
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm text-slate-300">En guclu gun</p>
              <p className="mt-3 text-xl font-bold text-white">
                {bestDay
                  ? new Date(bestDay.date).toLocaleDateString("az-AZ", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Melumat yoxdur"}
              </p>
              <p className="mt-2 text-sm text-cyan-200">
                {bestDay ? formatCurrency(bestDay.revenue) : "Satis qeydi yoxdur"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.id}
            className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`}
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  {card.value}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl shadow-inner">
                {card.icon}
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-500">{card.subtext}</p>
          </article>
        ))}
      </section>

      {role === "ADMIN" ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Admin Tools
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Sayt idareetme bolmeleri</h2>
            </div>
            <p className="text-sm text-slate-500">
              Esas funksiyalari bir yerde daha rahat idare et
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {adminQuickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
              >
                <p className="text-lg font-bold text-slate-950">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {role === "SELLER_ADMIN" ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Store Profile
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Magaza melumatlari</h2>
            </div>
            <p className="text-sm text-slate-500">Nomre ve unvani buradan edit ede bilersen</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Magaza adi"
              value={storeForm.name}
              onChange={handleStoreFieldChange("name")}
              disabled={storeSaving}
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Telefon nomresi"
              value={storeForm.phone}
              onChange={handleStoreFieldChange("phone")}
              disabled={storeSaving}
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"
              placeholder="Unvan"
              value={storeForm.address}
              onChange={handleStoreFieldChange("address")}
              disabled={storeSaving}
            />
            <textarea
              className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"
              placeholder="Magaza haqqinda qisa melumat"
              value={storeForm.description}
              onChange={handleStoreFieldChange("description")}
              disabled={storeSaving}
            />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleStoreSave}
              disabled={storeSaving}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {storeSaving ? "Yadda saxlanir..." : "Yadda saxla"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Sales Trend
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Son 7 gunun geliri</h2>
            </div>
            <p className="text-sm text-slate-500">
              Sifaris dinamikasini gun uzre qisa olaraq izle
            </p>
          </div>

          <div className="mt-8 grid h-72 grid-cols-7 items-end gap-3">
            {analytics.weeklySalesByDay.map((day) => {
              const revenue = Number(day.revenue || 0);
              const barHeight = `${Math.max((revenue / maxWeeklyRevenue) * 100, revenue > 0 ? 12 : 4)}%`;

              return (
                <div key={day.date} className="flex h-full flex-col justify-end gap-3">
                  <div className="text-center text-xs font-semibold text-slate-400">
                    {revenue > 0 ? formatCompactCurrency(revenue) : "0"}
                  </div>
                  <div className="relative flex-1 rounded-3xl bg-slate-100 p-2">
                    <div
                      className="absolute inset-x-2 bottom-2 rounded-2xl bg-gradient-to-t from-blue-600 via-cyan-500 to-sky-300 transition-all duration-200"
                      style={{ height: barHeight }}
                    />
                  </div>
                  <div className="text-center text-xs font-medium text-slate-500">
                    {new Date(day.date).toLocaleDateString("az-AZ", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="text-center text-[11px] text-slate-400">
                    {day.orders} sifaris
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Quick Summary
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Bu gunun gostericileri
          </h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-700">Today&apos;s Orders</p>
              <p className="mt-3 text-3xl font-black text-amber-950">
                {Number(analytics.todayOrders || 0).toLocaleString("az-AZ")}
              </p>
            </div>

            <div className="rounded-3xl bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">Today&apos;s Revenue</p>
              <p className="mt-3 text-3xl font-black text-emerald-950">
                {formatCurrency(analytics.todayRevenue)}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Orta sifaris meblegi</p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {analytics.totalOrders
                  ? formatCurrency(Number(analytics.totalRevenue || 0) / Number(analytics.totalOrders || 1))
                  : "0 AZN"}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section>
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Monthly Trend
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Son 30 gunun geliri</h2>
            </div>
            <p className="text-sm text-slate-500">
              Ayliq hereketi gunluk olaraq izle
            </p>
          </div>

          <div className="mt-8 grid h-72 grid-cols-10 items-end gap-2 md:grid-cols-15 xl:grid-cols-30">
            {analytics.monthlySalesByDay.map((day) => {
              const revenue = Number(day.revenue || 0);
              const barHeight = `${Math.max((revenue / maxMonthlyRevenue) * 100, revenue > 0 ? 10 : 3)}%`;

              return (
                <div key={day.date} className="flex h-full flex-col justify-end gap-2">
                  <div className="relative flex-1 rounded-3xl bg-slate-100 p-1.5">
                    <div
                      className="absolute inset-x-1.5 bottom-1.5 rounded-2xl bg-gradient-to-t from-emerald-600 via-teal-500 to-cyan-300 transition-all duration-200"
                      style={{ height: barHeight }}
                    />
                  </div>
                  <div className="text-center text-[10px] font-medium text-slate-500">
                    {new Date(day.date).toLocaleDateString("az-AZ", {
                      day: "numeric",
                      month: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
