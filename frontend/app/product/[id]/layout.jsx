import StructuredData from "@/components/StructuredData";
import { getCurrentPrice } from "@/lib/pricing";
import {
  DEFAULT_SEO_DESCRIPTION,
  SITE_LANGUAGE,
  absoluteUrl,
  buildMetadata,
  buildNoIndexMetadata,
  toAbsoluteAssetUrl,
  truncateMetaText,
} from "@/lib/seo";
import { getProductSeoData } from "@/lib/serverSeo";

export const revalidate = 300;

function buildProductDescription(product) {
  const compatibilityLabel = [product?.brand, product?.model].filter(Boolean).join(" ");
  const baseText =
    product?.description ||
    `${product?.name || "Avtomobil ehtiyat hissesi"} ${compatibilityLabel ? `ucun ${compatibilityLabel} modeli ile uygunluq melumati` : ""} ve sifaris imkanlari.`;

  return truncateMetaText(baseText || DEFAULT_SEO_DESCRIPTION, 170);
}

function buildProductJsonLd(product, id) {
  const imageUrls = Array.isArray(product?.images) ? product.images.map((image) => toAbsoluteAssetUrl(image)) : [];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: buildProductDescription(product),
    sku: product.oemCode || String(product.id || id),
    image: imageUrls,
    category: product.category || "Avtomobil detallari",
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.id || id}`),
      priceCurrency: "AZN",
      price: String(getCurrentPrice(product)),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: product.seller?.name
        ? {
            "@type": "Organization",
            name: product.seller.name,
          }
        : undefined,
    },
    additionalProperty: [
      product.model
        ? {
            "@type": "PropertyValue",
            name: "Model",
            value: product.model,
          }
        : null,
      product.oemCode
        ? {
            "@type": "PropertyValue",
            name: "OEM kodu",
            value: product.oemCode,
          }
        : null,
    ].filter(Boolean),
    inLanguage: SITE_LANGUAGE,
  };
}

export async function generateMetadata({ params }) {
  const routeParams = await params;
  const productId = Array.isArray(routeParams?.id) ? routeParams.id[0] : routeParams?.id;
  const product = await getProductSeoData(productId);

  if (!product) {
    return buildNoIndexMetadata({
      title: "Mehsul tapilmadi",
      description: "Axtardiginiz mehsul hazirda movcud deyil.",
      path: `/product/${productId || ""}`,
    });
  }

  const compatibilityLabel = [product.brand, product.model].filter(Boolean).join(" / ");
  const title = compatibilityLabel ? `${product.name} - ${compatibilityLabel}` : product.name;

  return buildMetadata({
    title,
    description: buildProductDescription(product),
    path: `/product/${product.id || productId}`,
    image: product.image,
    keywords: [product.category, product.brand, product.model, product.oemCode, product.name],
    type: "website",
  });
}

export default async function ProductLayout({ children, params }) {
  const routeParams = await params;
  const productId = Array.isArray(routeParams?.id) ? routeParams.id[0] : routeParams?.id;
  const product = await getProductSeoData(productId);
  const jsonLd = product ? buildProductJsonLd(product, productId) : null;

  return (
    <>
      <StructuredData data={jsonLd} />
      {children}
    </>
  );
}
