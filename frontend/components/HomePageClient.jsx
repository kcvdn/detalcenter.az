"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppImage from "@/components/AppImage";
import BrandLockup from "@/components/BrandLockup";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import SkeletonCard from "@/components/SkeletonCard";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { apiClient, cachedGet, clearCachedGet } from "@/lib/apiClient";
import {
  defaultHeroContent,
  normalizeHeroContent,
  normalizeSearchMeta,
  normalizeProductsResponse,
  normalizeSearchResults,
} from "@/lib/marketplaceData";
import { resolveImageSrc } from "@/lib/images";
import { getAuthHeaders, getStoredSession } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";
import { CategoryIcon, SearchEmptyIcon, SearchIcon } from "@/components/Icons";

const emptyVehicleFilters = { brand: "", model: "" };

function CatalogArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getCatalogBadge(name) {
  const normalizedName = String(name || "").toLowerCase();

  if (normalizedName.includes("mator") || normalizedName.includes("muherrik")) {
    return { label: "MH", tone: "from-slate-800 to-slate-600" };
  }

  if (normalizedName.includes("filter") || normalizedName.includes("filtr")) {
    return { label: "FL", tone: "from-amber-500 to-orange-400" };
  }

  if (normalizedName.includes("sensor") || normalizedName.includes("elektrik")) {
    return { label: "EL", tone: "from-sky-500 to-cyan-400" };
  }

  if (normalizedName.includes("govde") || normalizedName.includes("interyer") || normalizedName.includes("eksteryer")) {
    return { label: "GV", tone: "from-rose-500 to-pink-400" };
  }

  if (normalizedName.includes("eylec") || normalizedName.includes("hereketli")) {
    return { label: "EY", tone: "from-indigo-500 to-blue-500" };
  }

  return { label: "DT", tone: "from-slate-700 to-slate-500" };
}

function CategoryVisual({
  category,
  sizeClassName = "h-14 w-14",
  labelClassName = "text-sm",
}) {
  const badge = getCatalogBadge(category?.name);
  const imageUrl = resolveImageSrc(category?.imageUrl, "");

  if (imageUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.45)] ${sizeClassName}`.trim()}
      >
        <AppImage
          src={imageUrl}
          alt={category?.name || "Category icon"}
          fill
          sizes="64px"
          className="object-contain p-3"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${badge.tone} text-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.45)] ${sizeClassName}`.trim()}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        <CategoryIcon />
        <span className={`font-black tracking-[0.14em] ${labelClassName}`.trim()}>{badge.label}</span>
      </div>
    </div>
  );
}

function appendSelectedOption(options, selectedValue, compareFn) {
  if (!selectedValue) {
    return options;
  }

  const hasSelectedValue = options.some((option) =>
    compareFn ? compareFn(option, selectedValue) : option === selectedValue,
  );

  if (hasSelectedValue) {
    return options;
  }

  return [selectedValue, ...options];
}

function normalizeVehicleOptions(data) {
  const brands = Array.isArray(data) ? data : [];

  return brands
    .map((entry) => ({
      brand: String(entry?.brand || "").trim(),
      models: Array.isArray(entry?.models)
        ? entry.models.map((model) => String(model || "").trim()).filter(Boolean)
        : [],
    }))
    .filter((entry) => entry.brand);
}

function extractCompatibilityEntries(product) {
  const compatibilityRows = Array.isArray(product?.compatibility) ? product.compatibility : [];

  if (compatibilityRows.length > 0) {
    return compatibilityRows
      .map((item) => ({
        brand: item.brand || "",
        model: item.model || "",
        engine: item.engine || "",
        yearFrom: Number(item.yearFrom || 0),
        yearTo: Number(item.yearTo || 0),
      }))
      .filter((item) => item.brand || item.model || item.engine || item.yearFrom || item.yearTo);
  }

  if (!product?.brand && !product?.model && !product?.engine && !product?.year) {
    return [];
  }

  return [
    {
      brand: product.brand || "",
      model: product.model || "",
      engine: product.engine || "",
      yearFrom: Number(product.year || 0),
      yearTo: Number(product.yearTo || product.year || 0),
    },
  ];
}

function FilterSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="touch-target min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.4)] outline-none transition duration-200 focus:border-orange-300 focus:bg-white focus:shadow-[0_20px_40px_-30px_rgba(249,115,22,0.35)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={`${label}-${option}`} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function HomePageClient({
  hasInitialContent = false,
  hasInitialProducts = false,
  initialContent = defaultHeroContent,
  initialProducts = [],
  initialSearchResults = { products: [], sellers: [] },
  initialVehicleOptions = [],
  initialCategories = [],
  pageVariant = "home",
}) {
  const { lang, t } = useTranslation();
  const isCatalogPage = pageVariant === "catalog";
  const [products, setProducts] = useState(initialProducts);
  const [catalogProducts, setCatalogProducts] = useState(initialProducts);
  const [searchResults, setSearchResults] = useState(initialSearchResults);
  const [searchMeta, setSearchMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filters, setFilters] = useState(emptyVehicleFilters);
  const debouncedSearch = useDebouncedValue(search, 300);
  const debouncedFilterKey = useDebouncedValue(JSON.stringify(filters), 300);
  const [favoriteMap, setFavoriteMap] = useState({});
  const [session, setSession] = useState({
    token: "",
    role: "",
    userId: "",
  });
  const [loading, setLoading] = useState(!hasInitialProducts);
  const [errorKey, setErrorKey] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [content, setContent] = useState(initialContent);
  const [contentLoading, setContentLoading] = useState(!hasInitialContent);
  const [categories, setCategories] = useState(initialCategories);
  const [vehicleOptions, setVehicleOptions] = useState(() => normalizeVehicleOptions(initialVehicleOptions));
  const debouncedFilters = useMemo(() => {
    try {
      return JSON.parse(debouncedFilterKey);
    } catch {
      return emptyVehicleFilters;
    }
  }, [debouncedFilterKey]);

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

  useEffect(() => {
    if (hasInitialContent) {
      setContent(initialContent);
      setContentLoading(false);
      return undefined;
    }

    let ignore = false;

    setContentLoading(true);

    cachedGet("/api/content", { ttl: 300_000 })
      .then((data) => {
        if (!ignore) {
          setContent(normalizeHeroContent(data));
        }
      })
      .catch(() => {
        if (!ignore) {
          setContent(defaultHeroContent);
        }
      })
      .finally(() => {
        if (!ignore) {
          setContentLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [hasInitialContent, initialContent]);

  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      return undefined;
    }

    let ignore = false;

    function flattenCategories(categoryNodes) {
      if (!Array.isArray(categoryNodes)) {
        return [];
      }

      return categoryNodes.flatMap((item) => {
        if (!item || typeof item !== "object") {
          return [];
        }

        const category = {
          id: item.id || item._id || String(item.name || item.title || item.label || Math.random()),
          name: String(item.name || item.title || item.label || "").trim(),
          imageUrl: String(item.imageUrl || item.icon || "").trim(),
          parentId: item.parentId || null,
          source: item.source || "category",
        };

        const children = Array.isArray(item.children) ? item.children : [];
        const childItems = flattenCategories(children);

        return category.name ? [category, ...childItems] : childItems;
      });
    }

    cachedGet("/api/categories", { ttl: 300_000 })
      .then((data) => {
        if (ignore) {
          return;
        }

        let nextCategories = [];
        if (Array.isArray(data)) {
          nextCategories = data;
        } else if (data && Array.isArray(data.categories)) {
          nextCategories = data.categories;
        }

        setCategories(flattenCategories(nextCategories));
      })
      .catch((error) => {
        console.error("Kateqoriya yukleme xetasi:", error);
        if (!ignore) {
          setCategories([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, [initialCategories]);

  useEffect(() => {
    if (initialProducts.length > 0) {
      setCatalogProducts(initialProducts);
    }
  }, [initialProducts]);

  useEffect(() => {
    const normalizedOptions = normalizeVehicleOptions(initialVehicleOptions);

    if (normalizedOptions.length > 0) {
      setVehicleOptions(normalizedOptions);
    }
  }, [initialVehicleOptions]);

  useEffect(() => {
    if (vehicleOptions.length > 0) {
      return undefined;
    }

    let ignore = false;

    cachedGet("/api/products/vehicle-options", { ttl: 300_000 })
      .then((data) => {
        if (ignore) {
          return;
        }

        setVehicleOptions(normalizeVehicleOptions(data?.brands));
      })
      .catch(() => {
        if (!ignore) {
          setVehicleOptions([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, [vehicleOptions.length]);

  useEffect(() => {
    let ignore = false;
    const normalizedSearch = debouncedSearch.trim();
    const normalizedCategory = selectedCategory.trim();
    const hasVehicleFilters = Object.values(debouncedFilters).some(Boolean);
    const shouldReuseInitialData =
      hasInitialProducts &&
      normalizedSearch === "" &&
      normalizedCategory === "" &&
      !hasVehicleFilters &&
      refreshToken === 0;

    if (shouldReuseInitialData) {
      setProducts(initialProducts);
      setCatalogProducts(initialProducts);
      setSearchResults(initialSearchResults);
      setSearchMeta(null);
      setLoading(false);
      setErrorKey("");
      return undefined;
    }

    setLoading(true);
    setErrorKey("");

    cachedGet("/api/products", {
      params: {
        ...(normalizedSearch ? { search: normalizedSearch } : {}),
        ...(normalizedCategory ? { category: normalizedCategory } : {}),
        ...Object.entries(debouncedFilters).reduce((next, [key, value]) => {
          if (value) {
            next[key] = value;
          }

          return next;
        }, {}),
      },
      ttl: normalizedSearch || normalizedCategory || hasVehicleFilters ? 30_000 : 120_000,
    })
      .then((data) => {
        if (ignore) {
          return;
        }

        const nextProducts = normalizeProductsResponse(data);

        setProducts(nextProducts);
        setSearchResults(normalizeSearchResults(data));
        setSearchMeta(normalizeSearchMeta(data));

        if (!normalizedSearch && !normalizedCategory && !hasVehicleFilters) {
          setCatalogProducts(nextProducts);
        }
      })
      .catch(() => {
        if (!ignore) {
          setErrorKey("could_not_load_products");
          setProducts([]);
          setSearchResults({ products: [], sellers: [] });
          setSearchMeta(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    debouncedFilters,
    debouncedSearch,
    hasInitialProducts,
    initialProducts,
    initialSearchResults,
    refreshToken,
    selectedCategory,
  ]);

  useEffect(() => {
    let ignore = false;

    if (!session.token || !session.userId) {
      setFavoriteMap({});
      return undefined;
    }

    apiClient
      .get(`/api/favorites/${session.userId}`, {
        headers: getAuthHeaders(),
      })
      .then((response) => {
        if (ignore) {
          return;
        }

        const nextMap = {};

        (Array.isArray(response.data) ? response.data : []).forEach((favorite) => {
          nextMap[favorite.product_id] = favorite.id;
        });

        setFavoriteMap(nextMap);
      })
      .catch(() => {
        if (!ignore) {
          setFavoriteMap({});
        }
      });

    return () => {
      ignore = true;
    };
  }, [session.token, session.userId]);

  const handleFavoriteChange = useCallback((productId, favorite) => {
    setFavoriteMap((current) => {
      const next = { ...current };

      if (!favorite) {
        delete next[productId];
        return next;
      }

      next[productId] = favorite.id;
      return next;
    });
  }, []);

  const scrollToProducts = useCallback(() => {
    document.getElementById("products-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const focusSearch = useCallback(() => {
    const heroSearchInput = document.getElementById("homepage-search-input");

    if (heroSearchInput instanceof HTMLInputElement) {
      heroSearchInput.focus();
      heroSearchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const searchInput = document.getElementById("navbar-search-input");

    if (searchInput instanceof HTMLInputElement) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    scrollToProducts();
  }, [scrollToProducts]);

  useEffect(() => {
    const shouldFocusSearch = window.sessionStorage.getItem("focus-marketplace-search");

    if (shouldFocusSearch !== "1") {
      return undefined;
    }

    window.sessionStorage.removeItem("focus-marketplace-search");

    const frameId = window.requestAnimationFrame(() => {
      focusSearch();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [focusSearch]);

  const homeUiCopy = useMemo(() => {
    const copy = {
      az: {
        filtersTitle: "Marka ve model",
        selectionTitle: "Secime gore mehsullar",
        searchPlaceholder: "Mehsul, kod ve ya acarsöz yaz",
        searchAction: "Mehsullari goster",
        categoriesTitle: "Kateqoriyalar",
        categoriesDescription: "Kateqoriyaya gore hissələrə bax",
      },
      en: {
        filtersTitle: "Brand and model",
        selectionTitle: "Products for your selection",
        searchPlaceholder: "Search by product, code, or keyword",
        searchAction: "Show products",
        categoriesTitle: "Categories",
        categoriesDescription: "Browse parts by category",
      },
      ru: {
        filtersTitle: "Marka i model",
        selectionTitle: "Tovary po vybrannym parametram",
        searchPlaceholder: "Poisk po tovaru, kodu ili klyuchevomu slovu",
        searchAction: "Pokazat tovary",
        categoriesTitle: "Kategorii",
        categoriesDescription: "Prosmotr detaley po kategoriyam",
      },
    };

    return copy[lang] || copy.az;
  }, [lang]);

  const filterUiCopy = useMemo(() => {
    const copy = {
      az: {
        title: "Avtomobil filtrəri",
        subtitle: "Marka, model, il və mühərrik seçərək uyğun hissələri daralt.",
        manualDivider: "və ya avtomobil seç",
        manualResultsTitle: "Seçilmiş avtomobil üçün uyğun hissələr",
        selectedVehicle: "Seçilmiş avtomobil",
        resetSelection: "Seçimi sıfırla",
        brand: "Marka",
        model: "Model",
        year: "İl",
        engine: "Mühərrik",
        allBrands: "Marka seç",
        allModels: "Model seç",
        allYears: "Bütün illər",
        allEngines: "Bütün mühərriklər",
        selectBrandFirst: "Əvvəl marka seç",
        open: "Filtrlər",
        close: "Bağla",
      },
      en: {
        title: "Vehicle filters",
        subtitle: "Pick brand, model, year, and engine to narrow compatible parts.",
        manualDivider: "or select your vehicle",
        manualResultsTitle: "Compatible parts for the selected vehicle",
        selectedVehicle: "Selected vehicle",
        resetSelection: "Reset selection",
        brand: "Brand",
        model: "Model",
        year: "Year",
        engine: "Engine",
        allBrands: "All brands",
        allModels: "All models",
        allYears: "All years",
        allEngines: "All engines",
        selectBrandFirst: "Select brand first",
        open: "Filters",
        close: "Close",
      },
      ru: {
        title: "Фильтры автомобиля",
        subtitle: "Выберите марку, модель, год и двигатель, чтобы сузить совместимые детали.",
        brand: "Марка",
        model: "Модель",
        year: "Год",
        engine: "Двигатель",
        allBrands: "Все марки",
        allModels: "Все модели",
        allYears: "Все годы",
        allEngines: "Все двигатели",
        selectBrandFirst: "Сначала выберите марку",
        open: "Фильтры",
        close: "Закрыть",
      },
    };

    return copy[lang] || copy.az;
  }, [lang]);

  const smartSearchUiCopy = useMemo(() => {
    const copy = {
      az: {
        resultsTitle: "Uyğun hissələr tapıldı",
        resultsFallback: "Ağıllı uyğunluq axtarışı nəticələri burada göstərilir.",
        interpretedAs: "Axtarış belə başa düşüldü",
        noResults: "Sorğuya uyğun hissə tapılmadı",
        noResultsDesc: "Marka, model, il və hissə adını daha dəqiq yazın.",
      },
      en: {
        resultsTitle: "Compatible parts found",
        resultsFallback: "Smart compatibility results appear here.",
        interpretedAs: "Search interpreted as",
        noResults: "No compatible parts were found",
        noResultsDesc: "Try a clearer brand, model, year, or part name.",
      },
      ru: {
        resultsTitle: "Найдены подходящие запчасти",
        resultsFallback: "Здесь показываются результаты умного подбора.",
        interpretedAs: "Поиск распознан как",
        noResults: "Подходящие детали не найдены",
        noResultsDesc: "Уточните марку, модель, год и название детали.",
      },
    };

    return copy[lang] || copy.az;
  }, [lang]);

  const catalogSource = catalogProducts.length > 0 ? catalogProducts : initialProducts;
  const vehicleCatalogEntries = useMemo(() => {
    return catalogSource.flatMap((product) => extractCompatibilityEntries(product));
  }, [catalogSource]);
  const brandOptions = useMemo(() => {
    const optionSource =
      vehicleOptions.length > 0
        ? vehicleOptions.map((entry) => entry.brand)
        : vehicleCatalogEntries.map((entry) => entry.brand);
    const options = [...new Set(optionSource.filter(Boolean))].sort((left, right) => left.localeCompare(right));

    return appendSelectedOption(options, filters.brand);
  }, [filters.brand, vehicleCatalogEntries, vehicleOptions]);
  const modelOptions = useMemo(() => {
    if (!filters.brand) {
      return appendSelectedOption([], filters.model);
    }

    const optionSource =
      vehicleOptions.find((entry) => entry.brand === filters.brand)?.models ||
      vehicleCatalogEntries.filter((entry) => entry.brand === filters.brand).map((entry) => entry.model);
    const options = [...new Set(optionSource.filter(Boolean))].sort((left, right) => left.localeCompare(right));

    return appendSelectedOption(options, filters.model);
  }, [filters.brand, filters.model, vehicleCatalogEntries, vehicleOptions]);
  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(Boolean),
    [filters],
  );
  const hasCategorySelection = Boolean(selectedCategory);
  const hasVehicleSelection = hasActiveFilters;
  const hasManualVehicleSelection = hasActiveFilters;
  const manualVehicleSummary = useMemo(
    () => [filters.brand, filters.model].filter(Boolean).join(" / "),
    [filters.brand, filters.model],
  );
  const hasSmartSearch = Boolean(search.trim());
  const isCatalogLanding = isCatalogPage && !hasSmartSearch && !hasCategorySelection && !hasVehicleSelection;
  const smartSearchSummary = useMemo(() => {
    const parsed = searchMeta?.parsed || {};
    const summary = [
      parsed.brand,
      parsed.model,
      parsed.year,
      parsed.engine,
      parsed.part,
    ]
      .filter(Boolean)
      .join(" / ");

    return summary || searchMeta?.summary || search.trim() || smartSearchUiCopy.resultsFallback;
  }, [search, searchMeta, smartSearchUiCopy.resultsFallback]);
  const activeProducts = products;
  const activeLoading = loading;
  const activeSectionTitle = hasSmartSearch
    ? smartSearchUiCopy.resultsTitle
    : hasCategorySelection
      ? selectedCategory
    : hasManualVehicleSelection
      ? homeUiCopy.selectionTitle
      : "Mehsullar";
  const activeSectionDescription = hasSmartSearch
    ? smartSearchSummary
    : hasCategorySelection
      ? homeUiCopy.categoriesDescription
    : hasManualVehicleSelection
      ? manualVehicleSummary
      : "";
  const desktopHomeCategories = useMemo(() => {
    const baseCategories = categories.filter((category) => category?.source !== "product");
    const rootCategories = baseCategories.filter((category) => !category?.parentId);
    const categorySource = rootCategories.length > 0 ? rootCategories : baseCategories;

    return categorySource.slice(0, 8);
  }, [categories]);
  const handleSearchChange = useCallback(
    (value) => {
      setSearchMeta(null);
      setSearch(value);
    },
    [],
  );

  const handleFilterChange = useCallback(
    (field, value) => {
      setFilters((current) => {
        if (field === "brand") {
          return {
            brand: value,
            model: "",
          };
        }

        return {
          ...current,
          [field]: value,
        };
      });
    },
    [],
  );

  const handleResetVehicleSelection = useCallback(() => {
    setFilters(emptyVehicleFilters);
  }, []);

  const handleRetry = useCallback(() => {
    clearCachedGet("/api/products");
    setRefreshToken((current) => current + 1);
  }, []);

  const handleCategorySelect = useCallback((categoryName) => {
    setSelectedCategory(categoryName);
    document.getElementById("products-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleClearCatalogSelection = useCallback(() => {
    setSelectedCategory("");
  }, []);

  const productCards = useMemo(() => {
    return activeProducts.map((product) => (
      <ProductCard
        key={product.id}
        product={product}
        favoriteId={favoriteMap[product.id] || null}
        onFavoriteChange={handleFavoriteChange}
      />
    ));
  }, [activeProducts, favoriteMap, handleFavoriteChange]);

  return (
    <main className="min-h-screen pb-8 text-slate-900 md:pb-10">
      <Navbar
        search={search}
        setSearch={handleSearchChange}
        isLoading={Boolean(search.trim()) && loading}
        searchResults={searchResults}
        showSearchDropdown={Boolean(search.trim())}
        searchDropdownLoading={Boolean(search.trim()) && loading}
        showSearch={false}
      />

      {isCatalogPage ? null : (
      <section className="mx-auto max-w-7xl px-4 pb-6 pt-4 md:px-6 md:pt-6">
        <div className="overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-[0_30px_90px_-52px_rgba(15,23,42,0.32)]">
          {contentLoading ? (
            <div className="space-y-4 p-4 sm:p-5 md:p-7">
              <div className="h-10 max-w-xl animate-pulse rounded-2xl bg-slate-700/80" />
              <div className="h-4 max-w-lg animate-pulse rounded-full bg-slate-700/80" />
              <div className="h-40 animate-pulse rounded-[24px] bg-slate-700/80" />
            </div>
          ) : (
            <div>
              <div className="relative overflow-hidden px-4 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_28%)]" />
                <div className="relative space-y-6">
                  <div className="hidden">
                    <BrandLockup
                      inverse
                      needleRotation={-5}
                      markClassName="brand-mark--glow h-12 w-auto shrink-0 sm:h-14"
                      titleClassName="text-lg tracking-[0.16em] sm:text-xl"
                      taglineClassName="text-[10px] tracking-[0.34em] text-slate-400 sm:text-[11px]"
                    />
                    <div className="hidden">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950">
                        DC
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] text-slate-300">detalcenter.az</p>
                        <p className="text-[11px] text-slate-400">Ehtiyat hissəsi mağazası</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                      {content.heroTitle}
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-slate-200">
                      {content.heroDesc}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="group block">
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-white/10 px-4 py-3 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)] transition duration-200 focus-within:border-amber-300 focus-within:bg-white/20">
                        <span className="text-slate-200">
                          <SearchIcon />
                        </span>
                        <input
                          id="homepage-search-input"
                          value={search}
                          onChange={(event) => handleSearchChange(event.target.value)}
                          placeholder={homeUiCopy.searchPlaceholder}
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-300"
                        />
                      </div>
                    </label>
                    <div className="rounded-[26px] border border-slate-800 bg-slate-900/95 p-4 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.35)] sm:p-5">
                      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Avtomobilinə uyğun ehtiyat hissə axtar
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FilterSelect
                          label={filterUiCopy.brand}
                          placeholder={filterUiCopy.allBrands}
                          value={filters.brand}
                          options={brandOptions}
                          onChange={(value) => handleFilterChange("brand", value)}
                        />
                        <FilterSelect
                          label={filterUiCopy.model}
                          placeholder={filters.brand ? filterUiCopy.allModels : filterUiCopy.selectBrandFirst}
                          value={filters.model}
                          options={modelOptions}
                          onChange={(value) => handleFilterChange("model", value)}
                          disabled={!filters.brand}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      )}

      {!isCatalogPage && desktopHomeCategories.length > 0 ? (
        <section className="mx-auto hidden max-w-7xl px-4 pb-6 md:px-6 lg:block">
          <div className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.2)] backdrop-blur">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {homeUiCopy.categoriesTitle}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">
                  Kateqoriyalara gore axtaris et
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  {homeUiCopy.categoriesDescription}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {desktopHomeCategories.map((category) => (
                <button
                  key={`home-category-${category.id}`}
                  type="button"
                  onClick={() => handleCategorySelect(category.name)}
                  className="press-feedback group flex items-center gap-4 rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] px-4 py-4 text-left shadow-[0_16px_38px_-28px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_50px_-30px_rgba(15,23,42,0.4)]"
                >
                  <CategoryVisual category={category} />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-6 text-slate-900">
                      {category.name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Kateqoriya
                    </p>
                  </div>
                  <div className="shrink-0 text-slate-300 transition duration-200 group-hover:text-slate-500">
                    <CatalogArrowIcon />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {isCatalogPage ? (
        <section className="mx-auto max-w-7xl px-4 pb-6 pt-4 md:px-6 md:pt-6">
          <div>
            {isCatalogLanding ? (
                <section className="space-y-4" id="products-section">
                  <div className="space-y-3">
                    {categories.map((category) => {
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategorySelect(category.name)}
                          className="press-feedback flex w-full items-center gap-4 rounded-[18px] border border-slate-300 bg-white px-3 py-3 text-left shadow-sm transition duration-200 hover:border-slate-400 hover:bg-slate-50"
                        >
                          <CategoryVisual category={category} />
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold leading-6 text-slate-800">
                              {category.name}
                            </p>
                          </div>
                          <div className="shrink-0 text-slate-400">
                            <CatalogArrowIcon />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <>
                  <div className="mb-5 flex flex-col gap-3 rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.18)] backdrop-blur md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Mehsullar
                      </p>
                      <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-slate-950 md:text-2xl">
                        {activeSectionTitle}
                      </h2>
                      {activeSectionDescription ? (
                        <p className="mt-2 max-w-2xl text-sm text-slate-500">{activeSectionDescription}</p>
                      ) : null}
                    </div>

                    {hasVehicleSelection || hasCategorySelection ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleResetVehicleSelection();
                          handleClearCatalogSelection();
                        }}
                        className="press-feedback inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-50"
                      >
                        Temizle
                      </button>
                    ) : null}
                  </div>

                  {errorKey ? (
                    <div className="mb-5 flex items-start justify-between gap-4 rounded-[24px] border border-red-200/80 bg-white/80 p-4 text-sm text-red-700 shadow-[0_22px_50px_-36px_rgba(239,68,68,0.45)] backdrop-blur">
                      <div>
                        <p className="font-semibold">{t("could_not_load_products")}</p>
                        <p className="mt-1">{t(errorKey)}</p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRetry}
                        className="press-feedback touch-target rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold transition duration-200 hover:bg-red-100"
                      >
                        {t("retry")}
                      </button>
                    </div>
                  ) : null}

                  <section id="products-section">
                    {activeLoading ? (
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-3">
                        {Array.from({ length: 9 }).map((_, index) => (
                          <SkeletonCard key={index} />
                        ))}
                      </div>
                    ) : activeProducts.length === 0 ? (
                      <div className="glass-panel flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-white/80 p-8 text-center shadow-[0_28px_70px_-48px_rgba(15,23,42,0.45)]">
                        <SearchEmptyIcon />
                        <h3 className="mt-4 text-xl font-bold text-slate-900">
                          {hasSmartSearch ? smartSearchUiCopy.noResults : t("no_products")}
                        </h3>
                        <p className="mt-2 max-w-md text-sm text-slate-500">
                          {hasSmartSearch ? smartSearchUiCopy.noResultsDesc : t("try_change_search")}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-3">
                        {productCards}
                      </div>
                    )}
                  </section>
                </>
              )}
          </div>
        </section>
      ) : null}

      {!isCatalogPage ? (
      <section id="products-section" className="mx-auto max-w-7xl px-4 pb-10 md:px-6">
        {errorKey ? (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-[24px] border border-red-200/80 bg-white/80 p-4 text-sm text-red-700 shadow-[0_22px_50px_-36px_rgba(239,68,68,0.45)] backdrop-blur">
            <div>
              <p className="font-semibold">{t("could_not_load_products")}</p>
              <p className="mt-1">{t(errorKey)}</p>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              className="press-feedback touch-target rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold transition duration-200 hover:bg-red-100"
            >
              {t("retry")}
            </button>
          </div>
        ) : null}

        <div className="mb-5 flex flex-col gap-3 rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.32)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Mehsullar
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-slate-950 md:text-2xl">
              {activeSectionTitle}
            </h2>
            {activeSectionDescription ? (
              <p className="mt-2 max-w-2xl text-sm text-slate-500">{activeSectionDescription}</p>
            ) : null}
          </div>

          {hasVehicleSelection || hasCategorySelection ? (
            <button
              type="button"
              onClick={() => {
                handleResetVehicleSelection();
                handleClearCatalogSelection();
              }}
              className="press-feedback touch-target hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-50 sm:inline-flex"
            >
              Temizle
            </button>
          ) : null}
        </div>

        {activeLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : activeProducts.length === 0 ? (
          <div className="glass-panel flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-white/80 p-8 text-center shadow-[0_28px_70px_-48px_rgba(15,23,42,0.45)]">
            <SearchEmptyIcon />
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              {hasSmartSearch ? smartSearchUiCopy.noResults : t("no_products")}
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              {hasSmartSearch ? smartSearchUiCopy.noResultsDesc : t("try_change_search")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {productCards}
          </div>
        )}
      </section>
      ) : null}

    </main>
  );
}
