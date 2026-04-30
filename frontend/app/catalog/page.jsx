import StructuredData from "@/components/StructuredData";
import HomePageClient from "@/components/HomePageClient";
import { SITE_LANGUAGE, SITE_NAME, absoluteUrl, buildMetadata } from "@/lib/seo";
import { getHomePageInitialData } from "@/lib/serverMarketplace";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Avtomobil ehtiyat hisseleri kataloqu",
  description:
    "Detalcenter.az kataloqunda avtomobil ehtiyat hisselerini kateqoriya, marka ve model uzre daha rahat tapin.",
  path: "/catalog",
  keywords: ["avto hisseleri kataloqu", "marka model ehtiyat hisseleri", "kateqoriya uzre hisseler"],
  type: "website",
});

export default async function CatalogPage() {
  const initialData = await getHomePageInitialData();
  const itemList = (initialData.initialCategories || []).slice(0, 12).map((category, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: category.name,
    url: absoluteUrl("/catalog"),
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${SITE_NAME} katalog`,
    description:
      "Avtomobil ehtiyat hisseleri katalogu, kateqoriyalar ve marka-model secimi ile bir yerde.",
    url: absoluteUrl("/catalog"),
    inLanguage: SITE_LANGUAGE,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: itemList,
    },
  };

  return (
    <>
      <StructuredData data={jsonLd} />
      <HomePageClient {...initialData} pageVariant="catalog" />
    </>
  );
}
