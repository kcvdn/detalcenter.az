import StructuredData from "@/components/StructuredData";
import HomePageClient from "@/components/HomePageClient";
import { SITE_LANGUAGE, SITE_NAME, absoluteUrl, buildMetadata } from "@/lib/seo";
import { getHomeSeoData } from "@/lib/serverSeo";
import { getHomePageInitialData } from "@/lib/serverMarketplace";

export const revalidate = 300;

export async function generateMetadata() {
  const seoData = await getHomeSeoData();

  return buildMetadata({
    title: "Avtomobil ehtiyat hisseleri ve online sifaris",
    description: seoData.heroDesc,
    path: "/",
    image: seoData.heroImage,
    keywords: ["onlayn avto hisseleri", "vin axtarisi", "marka model uzre axtaris"],
  });
}

export default async function HomePage() {
  const initialData = await getHomePageInitialData();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${SITE_NAME} ana sehife`,
    description: initialData.initialContent?.heroDesc,
    url: absoluteUrl("/"),
    inLanguage: SITE_LANGUAGE,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
  };

  return (
    <>
      <StructuredData data={jsonLd} />
      <HomePageClient {...initialData} />
    </>
  );
}
