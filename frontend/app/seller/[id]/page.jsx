"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppImage from "@/components/AppImage";
import ProductCard from "@/components/ProductCard";
import SkeletonCard from "@/components/SkeletonCard";
import { cachedGet } from "@/lib/apiClient";
import { normalizeProductsResponse } from "@/lib/marketplaceData";
import { productPlaceholderSrc, resolveImageSrc } from "@/lib/images";

function SellerPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-sm md:p-8">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-4 w-72 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}

export default function PublicSellerPage() {
  const params = useParams();
  const sellerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    if (!sellerId) {
      setLoading(false);
      setError("Magaza tapilmadi.");
      return undefined;
    }

    setLoading(true);
    setError("");

    Promise.all([
      cachedGet(`/api/sellers/${sellerId}`, { ttl: 300_000 }),
      cachedGet("/api/products", { params: { seller_id: sellerId }, ttl: 300_000 }),
    ])
      .then(([sellerData, productsData]) => {
        if (ignore) {
          return;
        }

        setSeller(sellerData || null);
        setProducts(normalizeProductsResponse(productsData));
      })
      .catch(() => {
        if (!ignore) {
          setSeller(null);
          setProducts([]);
          setError("Magaza melumatini yuklemek olmadi.");
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
  }, [sellerId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <SellerPageSkeleton />
      </main>
    );
  }

  if (error || !seller) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-[28px] bg-white p-10 text-center text-slate-500 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">{error || "Magaza tapilmadi."}</p>
          <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-red-600 hover:underline">
            Ana sehifeye qayit
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <Link href="/" className="inline-flex text-sm font-semibold text-red-600 hover:underline">
        Ana sehifeye qayit
      </Link>

      <section className="mt-4 rounded-[28px] bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-3xl bg-slate-100">
              <AppImage
                src={resolveImageSrc(seller.logo, productPlaceholderSrc)}
                alt={seller.name}
                width={96}
                height={96}
                sizes="96px"
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Magaza</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">{seller.name}</h1>
              <p className="mt-2 text-sm text-slate-500">
                {seller.description || "Bu magazanin mehsullarina buradan baxa bilersen."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Telefon</p>
              <p className="mt-1 font-semibold text-slate-900">{seller.phone || "Qeyd edilmeyib"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Unvan</p>
              <p className="mt-1 font-semibold text-slate-900">{seller.address || "Qeyd edilmeyib"}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="seller-products" className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Magazanin mehsullari</h2>
            <p className="mt-1 text-sm text-slate-500">Bu saticiya aid butun elanlar.</p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
            {products.length} mehsul
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
            Bu magazada hele mehsul yoxdur.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
