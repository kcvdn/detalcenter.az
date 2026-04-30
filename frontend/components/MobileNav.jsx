"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useTranslation from "@/hooks/useTranslation";

function HomeIcon({ active = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${active ? "text-current" : "text-slate-500"}`} aria-hidden="true">
      <path
        d="M4 10.5L12 4L20 10.5V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V10.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 20V13H15V20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon({ active = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${active ? "text-current" : "text-slate-500"}`} aria-hidden="true">
      <path
        d="M3 4H5L7.4 14.5C7.50518 14.9602 7.83495 15.3353 8.27713 15.498C8.71931 15.6607 9.21437 15.5903 9.595 15.31L18.45 8.75C18.8482 8.45518 19.0582 7.96944 19.0002 7.47696C18.9422 6.98449 18.6254 6.55947 18.17 6.36L6.5 1.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CatalogIcon({ active = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${active ? "text-current" : "text-slate-500"}`} aria-hidden="true">
      <path
        d="M4 6H20M4 10H20M4 14H14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 18H18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ active = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${active ? "text-current" : "text-slate-500"}`} aria-hidden="true">
      <path
        d="M12 20.5C12 20.5 4.5 16 4.5 9.75C4.5 7.12665 6.62665 5 9.25 5C10.8064 5 12.1877 5.74838 13 6.90578C13.8123 5.74838 15.1936 5 16.75 5C19.3734 5 21.5 7.12665 21.5 9.75C21.5 16 14 20.5 12 20.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({ active = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${active ? "text-current" : "text-slate-500"}`} aria-hidden="true">
      <path
        d="M20 21C20 18.2386 16.866 16 13 16H11C7.13401 16 4 18.2386 4 21M16 7.5C16 9.70914 14.2091 11.5 12 11.5C9.79086 11.5 8 9.70914 8 7.5C8 5.29086 9.79086 3.5 12 3.5C14.2091 3.5 16 5.29086 16 7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getNavItemClass(active) {
  return `press-feedback flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 pb-1 pt-2 text-[11px] font-semibold transition ${
    active ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10" : "text-slate-500 hover:bg-slate-100"
  }`;
}

function shouldHideMobileNav(pathname) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/product/")
  );
}

export default function MobileNav() {
  const pathname = usePathname() || "/";
  const { t } = useTranslation();

  if (shouldHideMobileNav(pathname)) {
    return null;
  }

  const isHomeActive = pathname === "/" || pathname.startsWith("/product/");
  const isCatalogActive = pathname === "/catalog";
  const isCartActive = pathname === "/cart" || pathname.startsWith("/checkout");
  const isFavoritesActive = pathname.startsWith("/favorites");
  const isProfileActive = pathname.startsWith("/profile") || pathname.startsWith("/orders");

  return (
    <>
      <div className="h-[calc(5.25rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden="true" />

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-3">
          <Link href="/" className={getNavItemClass(isHomeActive)} aria-label={t("home")}>
            <HomeIcon active={isHomeActive} />
            <span>{t("home")}</span>
          </Link>

          <Link href="/catalog" className={getNavItemClass(isCatalogActive)} aria-label="Kataloq">
            <CatalogIcon active={isCatalogActive} />
            <span>Kataloq</span>
          </Link>

          <Link href="/cart" className={getNavItemClass(isCartActive)} aria-label={t("cart")}>
            <CartIcon active={isCartActive} />
            <span>{t("cart")}</span>
          </Link>

          <Link href="/favorites" className={getNavItemClass(isFavoritesActive)} aria-label={t("favorites")}>
            <HeartIcon active={isFavoritesActive} />
            <span>{t("favorites")}</span>
          </Link>

          <Link href="/profile" className={getNavItemClass(isProfileActive)} aria-label={t("profile")}>
            <UserIcon active={isProfileActive} />
            <span>{t("profile")}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
