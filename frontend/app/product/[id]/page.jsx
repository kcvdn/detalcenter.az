"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import AppImage from "@/components/AppImage";
import ProductCard from "@/components/ProductCard";
import { cachedGet } from "@/lib/apiClient";
import { BRAND_NAME } from "@/lib/brand";
import { productPlaceholderSrc, resolveImageSrc } from "@/lib/images";
import { navigateWithProgress } from "@/lib/navigationProgress";
import { formatCurrency, getCurrentPrice, getDiscountPercent, getRegularPrice, hasDiscount } from "@/lib/pricing";
import { getProductPreview, storeProductPreview } from "@/lib/productTransitionCache";
import { getAuthHeaders, getStoredSession } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const AddToCartModal = dynamic(() => import("@/components/AddToCartModal"), {
  ssr: false,
});

const sharedImageTransition = {
  layout: {
    duration: 0.4,
    ease: [0.22, 1, 0.36, 1],
  },
};

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-red-500"
      aria-hidden="true"
    />
  );
}

function HeartIcon({ active = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${active ? "text-red-500" : "text-slate-700"}`}
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

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M15 8L9 11.5M15 16L9 12.5M17 5.5C17 6.88071 15.8807 8 14.5 8C13.1193 8 12 6.88071 12 5.5C12 4.11929 13.1193 3 14.5 3C15.8807 3 17 4.11929 17 5.5ZM17 18.5C17 19.8807 15.8807 21 14.5 21C13.1193 21 12 19.8807 12 18.5C12 17.1193 13.1193 16 14.5 16C15.8807 16 17 17.1193 17 18.5ZM8 12C8 13.3807 6.88071 14.5 5.5 14.5C4.11929 14.5 3 13.3807 3 12C3 10.6193 4.11929 9.5 5.5 9.5C6.88071 9.5 8 10.6193 8 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 7H14V16H3V7ZM14 10H18L21 13V16H14V10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4 7.5C4 6.67157 4.67157 6 5.5 6H18.5C19.3284 6 20 6.67157 20 7.5V16.5C20 17.3284 19.3284 18 18.5 18H5.5C4.67157 18 4 17.3284 4 16.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M16 12H20V9.5C20 8.67157 19.3284 8 18.5 8H5.5C4.67157 8 4 8.67157 4 9.5V14.5C4 15.3284 4.67157 16 5.5 16H20V12H16Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="16.5" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M6.8 4.5H9.2C9.6348 4.5 10.0182 4.78603 10.1417 5.20291L10.9571 7.95358C11.0666 8.32294 10.9651 8.72165 10.6937 8.99304L9.24327 10.4435C10.1883 12.3469 11.6531 13.8117 13.5565 14.7567L15.007 13.3063C15.2784 13.0349 15.6771 12.9334 16.0464 13.0429L18.7971 13.8583C19.214 13.9818 19.5 14.3652 19.5 14.8V17.2C19.5 17.917 18.917 18.5 18.2 18.5H17C10.0964 18.5 4.5 12.9036 4.5 6V5.8C4.5 5.083 5.083 4.5 5.8 4.5H6.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M7 18.5L3.5 20V6.8C3.5 5.80589 4.30589 5 5.3 5H18.7C19.6941 5 20.5 5.80589 20.5 6.8V15.2C20.5 16.1941 19.6941 17 18.7 17H8.5L7 18.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 9.5H16M8 13H13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function normalizeDescriptionLine(text) {
  return String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function getDescriptionLeadSplitIndex(text) {
  return [":", ".", ";"]
    .map((marker) => text.lastIndexOf(marker))
    .filter((index) => index >= 18 && text.length - index <= 64)
    .sort((left, right) => right - left)[0] ?? -1;
}

function formatDescriptionBlocks(rawDescription) {
  const normalized = String(rawDescription || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/([.!?])\s+(?=[A-Z0-9ƏÖÜĞÇŞİ])/g, "$1\n\n")
    .trim();

  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => normalizeDescriptionLine(paragraph))
    .filter(Boolean)
    .flatMap((paragraph) => {
      if ((paragraph.match(/~/g) || []).length < 2) {
        return [{ type: "paragraph", text: paragraph }];
      }

      const firstSeparatorIndex = paragraph.indexOf("~");
      const leadText = normalizeDescriptionLine(paragraph.slice(0, firstSeparatorIndex));
      const splitIndex = getDescriptionLeadSplitIndex(leadText);
      const introText = splitIndex >= 0 ? normalizeDescriptionLine(leadText.slice(0, splitIndex + 1)) : "";
      const firstItem = splitIndex >= 0 ? normalizeDescriptionLine(leadText.slice(splitIndex + 1)) : leadText;
      const remainingItems = paragraph
        .slice(firstSeparatorIndex + 1)
        .split(/\s*~\s*/)
        .map((item) => normalizeDescriptionLine(item))
        .filter(Boolean);
      const listItems = [firstItem, ...remainingItems].filter(Boolean);
      const blocks = [];

      if (introText) {
        blocks.push({ type: "paragraph", text: introText });
      }

      if (listItems.length) {
        blocks.push({ type: "list", items: listItems });
      }

      return blocks.length ? blocks : [{ type: "paragraph", text: paragraph }];
    });
}

function ProductDetailSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-10">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
        <div className="min-h-[340px] animate-pulse rounded-[24px] bg-slate-200" />
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-[24px] bg-slate-200" />
          <div className="h-40 animate-pulse rounded-[24px] bg-slate-200" />
          <div className="h-48 animate-pulse rounded-[24px] bg-slate-200" />
        </div>
        <div className="h-96 animate-pulse rounded-[24px] bg-slate-200" />
      </div>
    </main>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { t, locale } = useTranslation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [currentFavoriteId, setCurrentFavoriteId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const imageUrl = resolveImageSrc(product?.image, productPlaceholderSrc);
  const sellerLogoUrl = resolveImageSrc(product?.seller?.logo, "");

  useEffect(() => {
    let ignore = false;
    const previewProduct = getProductPreview(productId);

    if (!productId) {
      setProduct(null);
      setLoading(false);
      return undefined;
    }

    setProduct(previewProduct);
    setLoading(true);

    cachedGet(`/api/products/${productId}`, {
      ttl: 300_000,
    })
      .then((data) => {
        if (!ignore) {
          setProduct(data);
          storeProductPreview(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setProduct((current) => current || previewProduct || null);
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
  }, [productId]);

  useEffect(() => {
    const { token, userId } = getStoredSession();

    if (!token || !userId || !productId) {
      setCurrentFavoriteId(null);
      return undefined;
    }

    let ignore = false;

    axios
      .get(`${apiUrl}/api/favorites/${userId}`, {
        headers: getAuthHeaders(),
      })
      .then((response) => {
        if (ignore) {
          return;
        }

        const matchedFavorite = (Array.isArray(response.data) ? response.data : []).find(
          (favorite) => favorite.product_id === Number(productId),
        );

        setCurrentFavoriteId(matchedFavorite?.id || null);
      })
      .catch(() => {
        if (!ignore) {
          setCurrentFavoriteId(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, [productId]);

  useEffect(() => {
    let ignore = false;

    if (!product?.id) {
      setRelatedProducts([]);
      setRelatedLoading(false);
      return undefined;
    }

    setRelatedLoading(true);

    cachedGet("/api/products", {
      ttl: 300_000,
    })
      .then((data) => {
        if (ignore) {
          return;
        }

        const items = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : [];
        const currentCategory = String(product.category || "").trim().toLowerCase();
        const currentBrand = String(product.brand || "").trim().toLowerCase();
        const currentModel = String(product.model || "").trim().toLowerCase();
        const currentSellerId = Number(product.seller?.id || 0);
        const currentPrice = getCurrentPrice(product);

        const rankedProducts = items
          .filter((item) => Number(item?.id) !== Number(product.id))
          .map((item) => {
            const itemCategory = String(item?.category || "").trim().toLowerCase();
            const itemBrand = String(item?.brand || "").trim().toLowerCase();
            const itemModel = String(item?.model || "").trim().toLowerCase();
            const itemSellerId = Number(item?.seller?.id || 0);
            const itemPrice = getCurrentPrice(item);
            let score = 0;

            if (currentCategory && itemCategory === currentCategory) {
              score += 3;
            }

            if (currentBrand && itemBrand === currentBrand) {
              score += 4;
            }

            if (currentModel && itemModel === currentModel) {
              score += 2;
            }

            if (currentSellerId && itemSellerId === currentSellerId) {
              score += 1;
            }

            if (currentPrice > 0 && itemPrice > 0) {
              const priceDeltaRatio = Math.abs(itemPrice - currentPrice) / currentPrice;

              if (priceDeltaRatio <= 0.15) {
                score += 2;
              } else if (priceDeltaRatio <= 0.3) {
                score += 1;
              }
            }

            return { item, score };
          })
          .sort((left, right) => right.score - left.score)
          .map(({ item }) => item);

        const matchedProducts = rankedProducts.filter((item) => {
          const itemCategory = String(item?.category || "").trim().toLowerCase();
          const itemBrand = String(item?.brand || "").trim().toLowerCase();
          const itemModel = String(item?.model || "").trim().toLowerCase();

          return (
            (currentCategory && itemCategory === currentCategory) ||
            (currentBrand && itemBrand === currentBrand) ||
            (currentModel && itemModel === currentModel)
          );
        });

        const fallbackProducts = rankedProducts.filter(
          (item) => !matchedProducts.some((matchedItem) => matchedItem.id === item.id),
        );

        setRelatedProducts([...matchedProducts, ...fallbackProducts].slice(0, 8));
      })
      .catch(() => {
        if (!ignore) {
          setRelatedProducts([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setRelatedLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [product?.id, product?.category, product?.brand, product?.model]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id]);

  const handleAddToCart = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (cartLoading) {
      return;
    }

    const { token, userId } = getStoredSession();

    if (!token || !userId) {
      navigateWithProgress(router, "/login");
      return;
    }

    setCartLoading(true);

    try {
      await axios.post(
        `${apiUrl}/api/cart`,
        { product_id: Number(productId) },
        {
          headers: getAuthHeaders(),
          timeout: 10000,
        },
      );

      setShowModal(true);
    } catch (error) {
      if (error.response?.status === 401) {
        navigateWithProgress(router, "/login");
      } else {
        window.alert("Could not add product to cart.");
      }
    } finally {
      setCartLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (favoriteLoading) {
      return;
    }

    const { token, userId } = getStoredSession();

    if (!token || !userId) {
      navigateWithProgress(router, "/login");
      return;
    }

    setFavoriteLoading(true);

    try {
      if (currentFavoriteId) {
        await axios.delete(`${apiUrl}/api/favorites/${currentFavoriteId}`, {
          headers: getAuthHeaders(),
        });

        setCurrentFavoriteId(null);
      } else {
        const response = await axios.post(
          `${apiUrl}/api/favorites`,
          { product_id: Number(productId) },
          { headers: getAuthHeaders() },
        );

        setCurrentFavoriteId(response.data?.id || null);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        navigateWithProgress(router, "/login");
      } else {
        window.alert("Could not update favorites right now.");
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name || BRAND_NAME,
          text: product?.name || "Mehsula bax",
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        window.alert("Link kopyalandi.");
      }
    } catch {}
  };

  const handleBack = useCallback(() => {
    if (typeof window === "undefined") {
      navigateWithProgress(router, "/catalog");
      return;
    }

    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    try {
      if (document.referrer) {
        const referrerUrl = new URL(document.referrer);
        const target = `${referrerUrl.pathname}${referrerUrl.search}${referrerUrl.hash}`;

        if (referrerUrl.origin === window.location.origin && target && target !== currentUrl) {
          navigateWithProgress(router, target);
          return;
        }
      }
    } catch {}

    if (window.history.length > 1) {
      router.back();
      return;
    }

    navigateWithProgress(router, "/catalog");
  }, [router]);

  if (loading && !product) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-[28px] bg-white p-10 text-center text-slate-500 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">{t("product_not_found")}</p>
          <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-red-600 hover:underline">
            {t("back_home")}
          </Link>
        </div>
      </main>
    );
  }

  const breadcrumbItems = [
    { href: "/", label: "Ana sehife" },
    { href: "/catalog", label: "Butun mehsullar" },
    { href: "/catalog", label: product.category || "Detallar" },
  ];

  const compatibilityItems = Array.isArray(product.compatibility) ? product.compatibility : [];
  const galleryImages = Array.from(
    new Set(
      (Array.isArray(product.images) ? product.images : [imageUrl || productPlaceholderSrc])
        .map((image) => resolveImageSrc(image, productPlaceholderSrc))
        .filter(Boolean),
    ),
  );
  const selectedImage = galleryImages[selectedImageIndex] || galleryImages[0] || productPlaceholderSrc;
  const sellerPhone = String(product.seller?.phone || "").trim();
  const sellerPhoneHref = sellerPhone ? `tel:${sellerPhone.replace(/\s+/g, "")}` : "";
  const sellerWhatsappHref = sellerPhone
    ? `https://wa.me/${sellerPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`${product.name} mehsulu barede melumat isteyirem`)}` 
    : "";
  const isFreshProduct = Date.now() - new Date(product.createdAt || Date.now()).getTime() < 1000 * 60 * 60 * 24 * 14;
  const descriptionBlocks = formatDescriptionBlocks(product.description);
  const hasProductDiscount = hasDiscount(product);
  const regularPrice = getRegularPrice(product);
  const currentPrice = getCurrentPrice(product);
  const discountPercent = getDiscountPercent(product);
  return (
    <>
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            aria-label="Geri"
          >
            <BackIcon />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
              <span className={`font-semibold ${hasProductDiscount ? "text-red-600" : "text-slate-500"}`}>
                {formatCurrency(currentPrice, locale)}
              </span>
              {hasProductDiscount ? (
                <span className="text-slate-400 line-through">{formatCurrency(regularPrice, locale)}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl overflow-x-hidden px-3 pb-28 pt-3 md:px-6 md:py-8">
        <nav className="mb-4 hidden flex-wrap items-center gap-2 text-sm text-slate-500 md:flex">
          {breadcrumbItems.map((item, index) => (
            <div key={`${item.href}-${item.label}`} className="flex items-center gap-2">
              <Link href={item.href} className="transition hover:text-slate-950">
                {item.label}
              </Link>
              {index < breadcrumbItems.length - 1 ? <span>|</span> : null}
            </div>
          ))}
          <span className="font-medium text-lime-700">{product.name}</span>
        </nav>

        <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px] lg:gap-5">
          <div className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-[20px] border border-slate-300 bg-white shadow-sm md:rounded-[24px]">
              <motion.div
                layoutId={`product-${product.id}`}
                transition={sharedImageTransition}
                className="relative min-h-[220px] overflow-hidden bg-slate-100 sm:min-h-[320px] md:min-h-[420px]"
              >
                <AppImage
                  src={selectedImage}
                  alt={product.name}
                  fallbackSrc={productPlaceholderSrc}
                  fill
                  sizes="(max-width: 1023px) 100vw, 320px"
                  className="object-contain"
                />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                    {selectedImageIndex + 1}/{galleryImages.length}
                  </span>
                  {isFreshProduct ? (
                    <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800 shadow-sm">
                      Yeni
                    </span>
                  ) : null}
                </div>
              </motion.div>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="flex gap-3">
                {galleryImages.map((galleryImage, index) => {
                  const isActive = index === selectedImageIndex;

                  return (
                    <button
                      key={`${galleryImage}-${index}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                        isActive ? "border-lime-500 ring-2 ring-lime-100" : "border-slate-300 hover:border-slate-400"
                      }`}
                      aria-label={`Sekil ${index + 1}`}
                    >
                      <AppImage
                        src={galleryImage}
                        alt={`${product.name} ${index + 1}`}
                        fallbackSrc={productPlaceholderSrc}
                        fill
                        sizes="80px"
                        className="object-contain"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="min-w-0 space-y-4">
            <div className="min-w-0 overflow-hidden rounded-[20px] border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h1 className="text-[1.45rem] font-semibold leading-tight text-slate-950 sm:text-[1.7rem] md:text-[2.05rem]">
                    {product.name}
                  </h1>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <span className="text-base">* * * * *</span>
                    <span className="text-slate-600">Reytinq yoxdur</span>
                  </div>
                </div>

                <div className="shrink-0 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 md:text-right">
                  {hasProductDiscount ? (
                    <>
                      <div className="flex items-center gap-2 md:justify-end">
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600">
                          -{discountPercent}%
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Endirimli qiymet
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-black text-red-600 sm:text-3xl md:text-[2.1rem]">
                        {formatCurrency(currentPrice, locale)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-400 line-through">
                        {formatCurrency(regularPrice, locale)}
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-black text-slate-900 sm:text-3xl md:text-[2.1rem]">
                      {formatCurrency(regularPrice, locale)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-slate-500">Mehsul nomresi: </span>
                  <span className="font-semibold">{product.id}</span>
                </div>
                <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-slate-500">Yerleshme tarixi: </span>
                  <span className="font-semibold">
                    {new Date(product.createdAt || Date.now()).toLocaleDateString("az-AZ")}
                  </span>
                </div>
                <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-slate-500">Son yenilenme: </span>
                  <span className="font-semibold">
                    {new Date(product.updatedAt || product.createdAt || Date.now()).toLocaleDateString("az-AZ")}
                  </span>
                </div>
                <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-slate-500">Status: </span>
                  <span className="font-semibold text-lime-700">Movcuddur</span>
                </div>
                <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-slate-500">OEM kodu: </span>
                  <span className="font-semibold">{product.oemCode || "Qeyd edilmeyib"}</span>
                </div>
                <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-slate-500">Uygunluq sayi: </span>
                  <span className="font-semibold">{compatibilityItems.length || 0}</span>
                </div>
                <button
                  type="button"
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  className="col-span-full inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-60 sm:col-span-1"
                >
                  {favoriteLoading ? <Spinner /> : <HeartIcon active={Boolean(currentFavoriteId)} />}
                  <span className="truncate sm:hidden">Secilmisler</span>
                  <span className="hidden truncate sm:inline">Secilmislere elave et</span>
                </button>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden bg-slate-100 text-sm font-semibold text-slate-700 md:grid md:grid-cols-3">
                  <div className="px-4 py-3">Marka</div>
                  <div className="px-4 py-3">Model</div>
                  <div className="px-4 py-3">Istehsal tarixi</div>
                </div>
                <div className="grid min-w-0 text-sm text-slate-700 md:grid-cols-3">
                  <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 md:block md:border-b-0"><span className="font-medium text-slate-500 md:hidden">Marka</span><span className="min-w-0 truncate text-right md:text-left">{product.brand || "-"}</span></div>
                  <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 md:block md:border-b-0"><span className="font-medium text-slate-500 md:hidden">Model</span><span className="min-w-0 truncate text-right md:text-left">{product.model || "-"}</span></div>
                  <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 md:block">
                    <span className="font-medium text-slate-500 md:hidden">Istehsal tarixi</span>
                    <span className="text-right md:text-left">{product.yearFrom && product.yearTo ? `${product.yearFrom}-${product.yearTo}` : "Daxil edilmeyib"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-lime-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-lime-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                >
                  {cartLoading ? <Spinner /> : null}
                  {cartLoading ? t("adding") : "Sebete elave et"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="relative inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-transparent transition hover:bg-slate-50 sm:text-base after:pointer-events-none after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-sm after:font-semibold after:text-lime-700 after:content-['Paylas'] sm:after:text-base"
                >
                  <ShareIcon />
                  Paylas
                </button>
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-[20px] border border-slate-300 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">Uygun oldugu avtomobiller</h3>
                  <p className="mt-1 text-sm text-slate-500">Sadalanmis uygunluqlar</p>
                </div>
                <span className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700">
                  {compatibilityItems.length}
                </span>
              </div>

              {compatibilityItems.length > 0 ? (
                <div className="mt-4 space-y-2">
                    {compatibilityItems.map((item, index) => (
                      <div
                        key={`${item.carId || index}-${item.brand}-${item.model}-${item.yearFrom}-${item.yearTo}`}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                          <div className="min-w-0">
                            <p className="text-[15px] font-semibold text-slate-900">
                              {[item.brand, item.model].filter(Boolean).join(" / ") || "-"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {[item.bodyType, item.engine, item.fuelType].filter(Boolean).join(" • ") || "Melumat yoxdur"}
                            </p>
                          </div>
                          <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {item.yearFrom && item.yearTo ? `${item.yearFrom}-${item.yearTo}` : "Il yoxdur"}
                          </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                    Bu mehsul ucun hele avtomobil uygunlugu daxil edilmeyib.
                  </div>
              )}

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/70 px-5 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-6">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">Tesvir</h3>
                    <p className="mt-1 text-sm text-slate-500">Mehsul haqqinda esas melumat.</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-lime-700 shadow-sm">
                    #{product.id}
                  </span>
                </div>
                <div className="mt-5 space-y-4">
                  {descriptionBlocks.length ? (
                    descriptionBlocks.map((block, index) =>
                      block.type === "list" ? (
                        <div key={`description-list-${index}`} className="grid gap-2 sm:grid-cols-2">
                          {block.items.map((item, itemIndex) => (
                            <div
                              key={`description-item-${index}-${itemIndex}`}
                              className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-700"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p key={`description-text-${index}`} className="text-[15px] leading-8 text-slate-700">
                          {block.text}
                        </p>
                      ),
                    )
                  ) : (
                    <p className="text-[15px] leading-8 text-slate-700">
                      Bu mehsul ucun hele etrafli tesvir elave edilmeyib.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="min-w-0 space-y-4">
            <div className="min-w-0 overflow-hidden rounded-[20px] border border-lime-500/70 bg-white shadow-sm">
              <div className="bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.22),transparent_42%),linear-gradient(135deg,#f7fee7,#ffffff_62%)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">Satici</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_10px_30px_rgba(132,204,22,0.15)]">
                    {sellerLogoUrl ? (
                      <div className="relative h-full w-full">
                        <AppImage
                          src={sellerLogoUrl}
                          alt={product.seller?.name || "Seller logo"}
                          fill
                          sizes="80px"
                          className="object-contain p-3"
                        />
                      </div>
                    ) : (
                      <span className="text-xl font-black uppercase text-lime-700">
                        {String(product.seller?.name || "S").trim().charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-slate-950">
                      {product.seller?.name || "Qeyd edilməyib"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">Ehtiyat hissəsi satıcısı</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Telefon</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {product.seller?.phone || "Qeyd edilməyib"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ünvan</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {product.seller?.address || "Qeyd edilməyib"}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
                <a
                  href={sellerPhoneHref || "#"}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    sellerPhoneHref
                      ? "bg-slate-950 text-white hover:bg-slate-800"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                  aria-disabled={!sellerPhoneHref}
                >
                  <PhoneIcon />
                  Zeng et
                </a>
                <a
                  href={sellerWhatsappHref || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    sellerWhatsappHref
                      ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                  aria-disabled={!sellerWhatsappHref}
                >
                  <ChatIcon />
                  WhatsApp
                </a>
              </div>
              {product.seller?.id ? (
                <Link
                  href={`/seller/${product.seller.id}`}
                  className="mx-5 mb-5 inline-flex min-h-11 w-[calc(100%-2.5rem)] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Magazadaki diger mehsullar
                </Link>
              ) : null}
            </div>

            <div className="rounded-[20px] bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-950">Çatdırılma</h2>
              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <TruckIcon />
                  <div>
                    <p className="font-semibold text-slate-900">Kuryer ilə</p>
                    <p className="text-sm text-slate-500">100 ₼-dan yuxarı pulsuz</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <TruckIcon />
                  <div>
                    <p className="font-semibold text-slate-900">Yerində al</p>
                    <p className="text-sm text-slate-500">Pulsuz</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <TruckIcon />
                  <div>
                    <p className="font-semibold text-slate-900">Ekspress çatdırılma</p>
                    <p className="text-sm text-slate-500">5 ₼</p>
                  </div>
                </div>
                <div className="flex gap-3 border-b border-slate-200 pb-5">
                  <TruckIcon />
                  <div>
                    <p className="font-semibold text-slate-900">Azərpoçt</p>
                    <p className="text-sm text-slate-500">0.96 ₼-dan başlayaraq</p>
                  </div>
                </div>
              </div>

              <h2 className="mt-7 text-2xl font-bold text-slate-950">Ödəniş</h2>
              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <WalletIcon />
                  <div>
                    <p className="font-semibold text-slate-900">Nağd</p>
                    <p className="text-sm text-slate-500">Təhvil alarkən ödəmək</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <WalletIcon />
                  <div>
                    <p className="font-semibold text-slate-900">Bank kartı ilə ödəmək</p>
                    <p className="text-sm text-slate-500">Pulsuz</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/96 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div
          className={`mx-auto grid max-w-7xl items-center gap-2.5 px-3 py-3 ${
            sellerPhoneHref ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-1"
          }`}
        >
          {sellerPhoneHref ? (
            <a
              href={sellerPhoneHref}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm"
              aria-label="Zeng et"
            >
              <PhoneIcon />
            </a>
          ) : null}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={cartLoading}
            className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cartLoading ? <Spinner /> : null}
            <span className="truncate">{cartLoading ? t("adding") : t("add_to_cart")}</span>
          </button>
        </div>
      </div>

      {relatedLoading || relatedProducts.length > 0 ? (
        <section className="mx-auto mt-8 max-w-7xl px-3 pb-8 md:px-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">Oxsar mehsullar</h2>
                <p className="mt-1 text-sm text-slate-500">Sola saga firladib diger uygun tekliflere baxa bilersiniz.</p>
              </div>
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
                {relatedLoading ? "Yuklenir" : `${relatedProducts.length} mehsul`}
              </span>
            </div>

            {relatedLoading ? (
              <div className="mt-5 flex gap-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`related-skeleton-${index}`}
                    className="h-[320px] min-w-[240px] animate-pulse rounded-[20px] bg-slate-100 sm:min-w-[260px]"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5">
                <div className="flex snap-x snap-mandatory gap-4">
                  {relatedProducts.map((relatedProduct) => (
                    <div
                      key={relatedProduct.id}
                      className="min-w-[240px] max-w-[240px] snap-start sm:min-w-[260px] sm:max-w-[260px]"
                    >
                      <ProductCard product={relatedProduct} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <AddToCartModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onGoToCart={() => {
          setShowModal(false);
          navigateWithProgress(router, "/cart");
        }}
      />
    </>
  );
}



