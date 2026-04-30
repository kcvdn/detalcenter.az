"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import SkeletonCard from "@/components/SkeletonCard";
import useTranslation from "@/hooks/useTranslation";
import { clearStoredSession, getAuthHeaders, getStoredSession } from "@/lib/session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function FavoritesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    const session = getStoredSession();

    if (!session.token || !session.userId) {
      router.replace("/login");
      return;
    }

    try {
      const response = await axios.get(`${apiUrl}/api/favorites/${session.userId}`, {
        headers: getAuthHeaders(),
      });

      setFavorites(Array.isArray(response.data) ? response.data : []);
    } catch {
      clearStoredSession();
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleFavoriteChange = useCallback((productId, favorite) => {
    if (favorite) {
      return;
    }

    setFavorites((current) => current.filter((item) => item.product_id !== productId));
  }, []);

  const filteredFavorites = useMemo(() => {
    return favorites.filter((favorite) =>
      favorite.product?.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [favorites, search]);

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar search={search} setSearch={setSearch} />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
              {t("favorites_title")}
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">{t("favorites_page_title")}</h1>
            <p className="mt-2 text-sm text-slate-500">{t("favorites_page_desc")}</p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            {t("favorite_items_total")}: {filteredFavorites.length} {t("products").toLowerCase()}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            {t("no_favorites")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filteredFavorites.map((favorite) => (
              <ProductCard
                key={favorite.id}
                product={favorite.product}
                favoriteId={favorite.id}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
