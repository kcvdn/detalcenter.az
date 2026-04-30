"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import AppImage from "@/components/AppImage";
import Navbar from "@/components/Navbar";
import SkeletonCard from "@/components/SkeletonCard";
import { productPlaceholderSrc, resolveImageSrc } from "@/lib/images";
import { navigateWithProgress } from "@/lib/navigationProgress";
import { clearStoredSession, getAuthHeaders, getStoredSession } from "@/lib/session";
import useTranslation from "@/hooks/useTranslation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-red-500"
      aria-hidden="true"
    />
  );
}

export default function CartPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [goingCheckout, setGoingCheckout] = useState(false);

  const loadCart = async () => {
    const session = getStoredSession();

    if (!session.token || !session.userId) {
      navigateWithProgress(router, "/login", "replace");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(`${apiUrl}/api/cart/${session.userId}`, {
        headers: getAuthHeaders(),
      });

      setCartItems(Array.isArray(response.data) ? response.data : []);
    } catch {
      clearStoredSession();
      navigateWithProgress(router, "/login", "replace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const removeItem = async (id) => {
    setRemovingId(id);

    try {
      await axios.delete(`${apiUrl}/api/cart/${id}`, {
        headers: getAuthHeaders(),
      });

      setCartItems((current) => current.filter((item) => item.id !== id));
    } catch {
      window.alert("Could not remove cart item.");
    } finally {
      setRemovingId(null);
    }
  };

  const updateItemQuantity = async (id, nextQuantity) => {
    if (nextQuantity < 1 || updatingId === id) {
      return;
    }

    const previousItems = cartItems;
    setUpdatingId(id);
    setCartItems((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity: nextQuantity } : item)),
    );

    try {
      const response = await axios.patch(
        `${apiUrl}/api/cart/${id}`,
        { quantity: nextQuantity },
        {
          headers: getAuthHeaders(),
          timeout: 10000,
        },
      );

      setCartItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...response.data } : item)),
      );
    } catch {
      setCartItems(previousItems);
      window.alert("Could not update quantity.");
    } finally {
      setUpdatingId(null);
    }
  };

  const goToCheckout = () => {
    if (goingCheckout || filteredItems.length === 0) {
      return;
    }

    setGoingCheckout(true);
    navigateWithProgress(router, "/checkout");
  };

  const filteredItems = cartItems.filter((item) =>
    item.product?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPrice = useMemo(() => {
    return filteredItems.reduce((sum, item) => {
      return sum + Number(item.product?.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [filteredItems]);

  const totalUnits = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [filteredItems]);

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar search={search} setSearch={setSearch} isLoading={loading} />

      <section className="mx-auto max-w-7xl px-4 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-8 md:pb-10">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">{t("cart_title")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("cart_desc")}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
            {t("cart_empty")}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const imageUrl = resolveImageSrc(item.product?.image, productPlaceholderSrc);

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center">
                    <div className="h-32 w-full overflow-hidden rounded-2xl bg-slate-100 md:h-28 md:w-36">
                      {imageUrl ? (
                        <AppImage
                          src={imageUrl}
                          alt={item.product?.name}
                          fallbackSrc={productPlaceholderSrc}
                          width={144}
                          height={112}
                          sizes="(max-width: 767px) 100vw, 144px"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          {t("no_image")}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                          {item.product?.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.product?.seller?.name || t("seller_none")}
                        </p>
                        <p className="mt-2 text-lg font-black text-red-600">
                          {Number(item.product?.price || 0).toLocaleString(locale)} AZN
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, Number(item.quantity || 1) - 1)}
                            disabled={updatingId === item.id || Number(item.quantity || 1) <= 1}
                            className="h-11 w-11 text-lg font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <div className="flex h-11 min-w-20 flex-col items-center justify-center border-x border-slate-200 px-3 text-slate-900">
                            {updatingId === item.id ? (
                              <Spinner />
                            ) : (
                              <>
                                <span className="text-sm font-bold leading-none">{item.quantity}</span>
                                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                  {t("quantity")}
                                </span>
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, Number(item.quantity || 1) + 1)}
                            disabled={updatingId === item.id}
                            className="h-11 w-11 text-lg font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-semibold text-slate-900">
                          Cem: {(Number(item.product?.price || 0) * Number(item.quantity || 0)).toLocaleString(locale)} AZN
                        </p>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={removingId === item.id}
                          className="press-feedback touch-target w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {removingId === item.id ? t("removing") : t("remove")}
                        </button>
                      </div>
                    </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t("total")}
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {Number(totalPrice || 0).toLocaleString(locale)} AZN
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {t("product_count_label")}: {filteredItems.length} | {t("quantity")}: {totalUnits}
              </p>

              <button
                type="button"
                onClick={goToCheckout}
                disabled={goingCheckout || filteredItems.length === 0}
                className="press-feedback touch-target mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {goingCheckout ? <Spinner /> : null}
                {goingCheckout ? t("loading") : t("proceed_to_checkout")}
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
