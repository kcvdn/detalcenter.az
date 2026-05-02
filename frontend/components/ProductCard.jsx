"use client";

import { memo, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productPlaceholderSrc, resolveImageSrc } from "@/lib/images";
import { navigateWithProgress } from "@/lib/navigationProgress";
import { formatCurrency, getCurrentPrice, getDiscountPercent, getRegularPrice, hasDiscount } from "@/lib/pricing";
import { storeProductPreview } from "@/lib/productTransitionCache";
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

function HeartIcon({ active = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${active ? "text-red-500" : "text-slate-600"}`}
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

function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-red-500"
      aria-hidden="true"
    />
  );
}

function ProductCardComponent({ product, favoriteId = null, onFavoriteChange }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [currentFavoriteId, setCurrentFavoriteId] = useState(favoriteId);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setCurrentFavoriteId(favoriteId);
  }, [favoriteId]);

  const imageUrl = resolveImageSrc(product.image, productPlaceholderSrc);
  const imageSrc = imageUrl || productPlaceholderSrc;
  const hasProductDiscount = hasDiscount(product);
  const currentPrice = getCurrentPrice(product);
  const regularPrice = getRegularPrice(product);
  const discountPercent = getDiscountPercent(product);

  const handleFavoriteClick = useCallback(async (event) => {
    event.preventDefault();
    event.stopPropagation();

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
        onFavoriteChange?.(product.id, null);
      } else {
        const response = await axios.post(
          `${apiUrl}/api/favorites`,
          {
            product_id: product.id,
          },
          {
            headers: getAuthHeaders(),
          },
        );

        const nextFavoriteId = response.data?.id || null;
        setCurrentFavoriteId(nextFavoriteId);
        onFavoriteChange?.(product.id, response.data);
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
  }, [currentFavoriteId, onFavoriteChange, product.id, router]);

  const handleAddToCart = useCallback(async (event) => {
    event.preventDefault();
    event.stopPropagation();

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
        {
          product_id: product.id,
        },
        {
          headers: getAuthHeaders(),
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
  }, [cartLoading, product.id, router]);

  return (
    <>
      <Link
        href={`/product/${product.id}`}
        onClick={() => {
          storeProductPreview(product);
        }}
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
      >
        <article className="press-feedback group h-full overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="relative h-44 overflow-hidden bg-slate-100">
            <button
              type="button"
              onClick={handleFavoriteClick}
              disabled={favoriteLoading}
              className={`press-feedback touch-target absolute right-2.5 top-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-white/95 shadow-sm transition duration-200 md:h-9 md:w-9 ${
                currentFavoriteId ? "border-red-100" : "border-slate-200"
              } ${favoriteLoading ? "cursor-not-allowed opacity-70" : "hover:scale-105 hover:shadow-md"}`}
              aria-label={currentFavoriteId ? "Remove favorite" : "Add favorite"}
            >
              {favoriteLoading ? <Spinner /> : <HeartIcon active={Boolean(currentFavoriteId)} />}
            </button>

            <motion.div
              layoutId={`product-${product.id}`}
              transition={sharedImageTransition}
              className="relative h-full w-full"
            >
              <img
                src={imageSrc}
                alt={product.name}
                loading="lazy"
                className="h-full w-full rounded object-cover transition duration-200 group-hover:scale-105"
                onError={(event) => {
                  if (event.currentTarget.src !== window.location.origin + productPlaceholderSrc) {
                    event.currentTarget.src = productPlaceholderSrc;
                  }
                }}
              />
            </motion.div>
          </div>

          <div className="space-y-2.5 p-3.5">
            <h3
              className="min-h-[2.5rem] text-[13px] font-semibold leading-5 text-slate-900"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product.name}
            </h3>

            <div className="flex items-start gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-bold text-red-600 ${hasProductDiscount ? "text-lg" : "text-base"}`}>
                    {formatCurrency(currentPrice, locale)}
                  </p>
                  {hasProductDiscount ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-red-600">
                      -{discountPercent}%
                    </span>
                  ) : null}
                </div>
                {hasProductDiscount ? (
                  <p className="mt-0.5 text-[11px] text-slate-400 line-through">
                    {formatCurrency(regularPrice, locale)}
                  </p>
                ) : null}
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {product.seller?.name || t("seller_none")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="press-feedback touch-target inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2.5 text-[13px] font-semibold text-white transition duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-4 sm:text-sm"
            >
              {cartLoading ? <Spinner /> : <CartIcon />}
              <span className="truncate">{cartLoading ? t("adding") : t("add_to_cart")}</span>
            </button>
          </div>
        </article>
      </Link>

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

export default memo(ProductCardComponent);
