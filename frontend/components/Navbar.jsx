"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppImage from "@/components/AppImage";
import BrandLockup from "@/components/BrandLockup";
import { resolveImageSrc } from "@/lib/images";
import { navigateWithProgress } from "@/lib/navigationProgress";
import { storeProductPreview } from "@/lib/productTransitionCache";
import { clearStoredSession, getStoredSession } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-400" aria-hidden="true">
      <path
        d="M21 21L16.65 16.65M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ active = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${active ? "text-red-500" : "text-slate-500"}`}
      fill={active ? "currentColor" : "none"}
      aria-hidden="true"
    >
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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
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

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
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

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 3L20 7V17L12 21L4 17V7L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 7L12 11L20 7M12 11V21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-red-500"
      aria-hidden="true"
    />
  );
}

const SearchResultImage = memo(function SearchResultImage({ src, alt, fallback }) {
  if (!src) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-400">
        {fallback}
      </div>
    );
  }

  return (
    <AppImage
      src={src}
      alt={alt}
      width={48}
      height={48}
      sizes="48px"
      className="h-12 w-12 rounded-xl object-cover"
    />
  );
});

export default function Navbar({
  search = "",
  setSearch,
  isLoading = false,
  searchResults = { products: [], sellers: [] },
  showSearchDropdown = false,
  searchDropdownLoading = false,
  showSearch = true,
}) {
  const router = useRouter();
  const { lang, t } = useTranslation();
  const [session, setSession] = useState({
    token: "",
    role: "",
    userId: "",
  });

  useEffect(() => {
    const syncSession = () => {
      setSession(getStoredSession());
    };

    syncSession();
    window.addEventListener("sessionchange", syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener("sessionchange", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  const handleLogout = useCallback(() => {
    clearStoredSession();
    setSession({
      token: "",
      role: "",
      userId: "",
    });
    navigateWithProgress(router, "/", "replace");
  }, [router]);

  const handleLanguageChange = useCallback((language) => {
    localStorage.setItem("lang", language);
    window.dispatchEvent(new Event("langchange"));
  }, []);

  const isLoggedIn = Boolean(session.token && session.userId);
  const isAdmin = session.role === "ADMIN";
  const languages = ["az", "en", "ru"];
  const searchUiCopy = {
    az: {
      products: "Mehsullar",
      sellers: "Sellerler",
      nothingFound: "Heç nə tapılmadı",
    },
    en: {
      products: "Products",
      sellers: "Sellers",
      nothingFound: "Nothing found",
    },
    ru: {
      products: "Tovary",
      sellers: "Prodavtsy",
      nothingFound: "Ничего не найдено",
    },
  };
  const activeSearchCopy = searchUiCopy[lang] || searchUiCopy.az;
  const productResults = Array.isArray(searchResults?.products) ? searchResults.products : [];
  const sellerResults = Array.isArray(searchResults?.sellers) ? searchResults.sellers : [];
  const hasSearchResults = productResults.length > 0 || sellerResults.length > 0;
  const shouldShowDropdown = showSearchDropdown && Boolean(search.trim());
  const mappedProductResults = useMemo(() => {
    return productResults.slice(0, 6).map((product) => ({
      ...product,
      imageUrl: resolveImageSrc(product.image),
    }));
  }, [productResults]);
  const mappedSellerResults = useMemo(() => {
    return sellerResults.slice(0, 6).map((seller) => ({
      ...seller,
      logoUrl: resolveImageSrc(seller.logo),
    }));
  }, [sellerResults]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:gap-3 md:py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
        <div className="flex items-center justify-between gap-2.5">
          <Link href="/" className="press-feedback flex items-center gap-2.5 rounded-xl">
            <BrandLockup
              className="min-w-0"
              needleRotation={-2}
              markClassName="h-10 w-auto shrink-0 sm:h-11"
              titleClassName="text-sm sm:text-base"
              taglineClassName="hidden sm:block"
            />
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            {isAdmin ? (
              <Link
                href="/dashboard"
                className="press-feedback touch-target inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50"
              >
                {t("dashboard")}
              </Link>
            ) : null}

            {isLoggedIn ? (
              <>
                <Link
                  href="/orders"
                  className="press-feedback touch-target inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  {t("orders")}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="press-feedback touch-target inline-flex items-center rounded-xl bg-slate-950 px-3 py-2 text-[11px] font-semibold text-white transition duration-200 hover:bg-slate-800"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="press-feedback touch-target rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="press-feedback touch-target rounded-xl bg-slate-950 px-3 py-2 text-[11px] font-semibold text-white transition duration-200 hover:bg-slate-800"
                >
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </div>

        {showSearch ? (
          <div className="relative w-full lg:max-w-xl">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>

            <input
              id="navbar-search-input"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-red-300 focus:bg-white"
              placeholder={t("search_products")}
              value={search}
              onChange={(event) => (typeof setSearch === "function" ? setSearch(event.target.value) : null)}
            />

            {isLoading ? (
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <Spinner />
              </span>
            ) : null}

            {shouldShowDropdown ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {searchDropdownLoading ? (
                  <div className="flex items-center gap-3 px-4 py-4 text-sm text-slate-500">
                    <Spinner />
                    <span>{t("loading")}</span>
                  </div>
                ) : hasSearchResults ? (
                  <div className="max-h-[420px] overflow-y-auto p-2">
                    {mappedProductResults.length > 0 ? (
                      <div>
                        <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {activeSearchCopy.products}
                        </p>
                        <div className="space-y-1">
                          {mappedProductResults.map((product) => (
                            <Link
                              key={`product-${product.id}`}
                              href={`/product/${product.id}`}
                              onClick={() => {
                                storeProductPreview(product);
                              }}
                              className="flex items-center gap-3 rounded-xl px-3 py-3 transition duration-200 hover:bg-slate-50"
                            >
                              <SearchResultImage
                                src={product.imageUrl}
                                alt={product.name}
                                fallback="PR"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {product.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {Number(product.price || 0).toLocaleString("az-AZ")} AZN
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {mappedSellerResults.length > 0 ? (
                      <div className={mappedProductResults.length > 0 ? "mt-2 border-t border-slate-100 pt-2" : ""}>
                        <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {activeSearchCopy.sellers}
                        </p>
                        <div className="space-y-1">
                          {mappedSellerResults.map((seller) => (
                            <Link
                              key={`seller-${seller.id}`}
                              href={`/dashboard/sellers/${seller.id}`}
                              className="flex items-center gap-3 rounded-xl px-3 py-3 transition duration-200 hover:bg-slate-50"
                            >
                              <SearchResultImage
                                src={seller.logoUrl}
                                alt={seller.name}
                                fallback="SL"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {seller.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {activeSearchCopy.sellers}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-sm text-slate-500">
                    {activeSearchCopy.nothingFound}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="hidden flex-wrap items-center gap-2 md:justify-end md:flex">
          <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:flex">
            {languages.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => handleLanguageChange(language)}
                className={`press-feedback rounded-lg px-2.5 py-1 text-xs font-semibold uppercase transition ${
                  lang === language
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {language}
              </button>
            ))}
          </div>

          {isLoggedIn ? (
            <>
              {isAdmin ? (
                <Link
                  href="/dashboard"
                  className="press-feedback touch-target hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
                >
                  {t("dashboard")}
                </Link>
              ) : null}
              <Link
                href="/cart"
                className="press-feedback touch-target hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
              >
                <CartIcon />
                {t("cart")}
              </Link>
              <Link
                href="/orders"
                className="press-feedback touch-target hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
              >
                <BoxIcon />
                {t("orders")}
              </Link>
              <Link
                href="/favorites"
                className="press-feedback touch-target hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
              >
                <HeartIcon />
                {t("favorites")}
              </Link>
              <Link
                href="/profile"
                className="press-feedback touch-target hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
              >
                <UserIcon />
                {t("profile")}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="press-feedback touch-target rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-slate-800 sm:px-4 sm:text-sm"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="press-feedback touch-target hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50 sm:px-4 sm:text-sm md:inline-flex"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="press-feedback touch-target hidden rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-slate-800 sm:px-4 sm:text-sm md:inline-flex"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
