import StructuredData from "@/components/StructuredData";
import {
  DEFAULT_SEO_DESCRIPTION,
  SITE_LANGUAGE,
  absoluteUrl,
  buildMetadata,
  buildNoIndexMetadata,
  toAbsoluteAssetUrl,
  truncateMetaText,
} from "@/lib/seo";
import { getSellerSeoData } from "@/lib/serverSeo";

export const revalidate = 300;

function buildSellerDescription(seller) {
  const baseText =
    seller?.description ||
    [seller?.name, seller?.address, seller?.phone].filter(Boolean).join(" - ") ||
    DEFAULT_SEO_DESCRIPTION;

  return truncateMetaText(baseText, 170);
}

function buildSellerJsonLd(seller, id) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: seller.name,
    description: buildSellerDescription(seller),
    url: absoluteUrl(`/seller/${seller.id || id}`),
    image: seller.logo ? [toAbsoluteAssetUrl(seller.logo)] : undefined,
    telephone: seller.phone || undefined,
    address: seller.address
      ? {
          "@type": "PostalAddress",
          streetAddress: seller.address,
          addressCountry: "AZ",
        }
      : undefined,
    inLanguage: SITE_LANGUAGE,
  };
}

export async function generateMetadata({ params }) {
  const routeParams = await params;
  const sellerId = Array.isArray(routeParams?.id) ? routeParams.id[0] : routeParams?.id;
  const seller = await getSellerSeoData(sellerId);

  if (!seller) {
    return buildNoIndexMetadata({
      title: "Magaza tapilmadi",
      description: "Axtardiginiz magaza hazirda movcud deyil.",
      path: `/seller/${sellerId || ""}`,
    });
  }

  return buildMetadata({
    title: `${seller.name} magazasi`,
    description: buildSellerDescription(seller),
    path: `/seller/${seller.id || sellerId}`,
    image: seller.logo,
    keywords: [seller.name, seller.address, "avtomobil hisseleri magazasi"],
  });
}

export default async function SellerLayout({ children, params }) {
  const routeParams = await params;
  const sellerId = Array.isArray(routeParams?.id) ? routeParams.id[0] : routeParams?.id;
  const seller = await getSellerSeoData(sellerId);
  const jsonLd = seller ? buildSellerJsonLd(seller, sellerId) : null;

  return (
    <>
      <StructuredData data={jsonLd} />
      {children}
    </>
  );
}
