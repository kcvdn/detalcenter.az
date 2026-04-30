"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";
import useTranslation from "@/hooks/useTranslation";
import { navigateWithProgress } from "@/lib/navigationProgress";
import { clearStoredSession, getStoredSession } from "@/lib/session";

const adminNavItems = [
  { href: "/dashboard", label: "Panel" },
  { href: "/dashboard/content", label: "Ana sehife" },
  { href: "/dashboard/footer", label: "Footer" },
  { href: "/dashboard/catalog", label: "Marka ve model" },
  { href: "/dashboard/categories", label: "Kateqoriyalar" },
  { href: "/dashboard/orders", label: "Sifarisler" },
  { href: "/dashboard/products", label: "Mehsullar" },
  { href: "/dashboard/products/create", label: "Mehsul elave et" },
  { href: "/dashboard/sellers", label: "Magazalar" },
  { href: "/dashboard/users", label: "Istifadeciler" },
];

const sellerNavItems = [
  { href: "/dashboard", label: "Magaza paneli" },
  { href: "/dashboard/orders", label: "Sifarisler" },
  { href: "/dashboard/products", label: "Mehsullarim" },
  { href: "/dashboard/products/create", label: "Mehsul elave et" },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [authState, setAuthState] = useState("checking");
  const [role, setRole] = useState("");

  useEffect(() => {
    const session = getStoredSession();
    const { token, role: sessionRole, userId, sellerId } = session;

    if (
      token &&
      userId &&
      (sessionRole === "ADMIN" || (sessionRole === "SELLER_ADMIN" && sellerId))
    ) {
      setRole(sessionRole);
      setAuthState("allowed");
      return;
    }

    clearStoredSession();

    setAuthState("denied");
    navigateWithProgress(router, sessionRole ? "/" : "/login", "replace");
  }, [router]);

  const activePath = useMemo(() => pathname || "/dashboard", [pathname]);
  const navItems = role === "SELLER_ADMIN" ? sellerNavItems : adminNavItems;

  const handleLogout = useCallback(() => {
    clearStoredSession();
    navigateWithProgress(router, "/", "replace");
  }, [router]);

  useEffect(() => {
    if (authState !== "allowed" || role !== "SELLER_ADMIN") {
      return;
    }

    const blockedPaths = [
      "/dashboard/content", 
      "/dashboard/footer",
      "/dashboard/categories",
      "/dashboard/sellers", 
      "/dashboard/users"
    ];

    if (blockedPaths.some((path) => activePath.startsWith(path))) {
      navigateWithProgress(router, "/dashboard", "replace");
    }
  }, [activePath, authState, role, router]);

  if (authState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-3xl bg-white px-6 py-5 text-sm font-medium text-slate-500 shadow-sm">
          {t("dashboard_checking")}
        </div>
      </div>
    );
  }

  if (authState !== "allowed") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 md:grid md:grid-cols-[280px_1fr]">
      <aside className="border-r border-slate-200 bg-slate-950 p-6 text-white">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-300">
            {role === "SELLER_ADMIN" ? "Magaza paneli" : t("admin_panel")}
          </p>
          <h2 className="mt-3 text-2xl font-bold">Detal Dashboard</h2>
          <p className="mt-2 text-sm text-slate-400">
            {role === "SELLER_ADMIN"
              ? "Oz magazanin sifarislerini, satislarini ve mehsullarini idare et"
              : "Marketplace mehsul ve seller idaresi"}
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = activePath === item.href;

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
                {item.href === "/dashboard/orders" ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 block w-full rounded-2xl border border-red-400/30 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 md:hidden"
                  >
                    {t("logout")}
                  </button>
                ) : null}
              </div>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-10 hidden rounded-2xl border border-red-400/30 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 md:block"
        >
          {t("logout")}
        </button>
      </aside>

      <div className="p-6 md:p-8">
        <div className="rounded-[28px] bg-white p-6 shadow-sm md:p-8">
          <PageTransition groupId="dashboard-page-transition">{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}
