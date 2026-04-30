import { BRAND_DOMAIN, BRAND_NAME } from "@/lib/brand";

export const SITE_NAME = BRAND_NAME;
export const SITE_DOMAIN = BRAND_DOMAIN;
export const SITE_URL = String(process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_DOMAIN}`)
  .trim()
  .replace(/\/+$/, "");
export const SITE_LOCALE = "az_AZ";
export const SITE_LANGUAGE = "az-AZ";
export const DEFAULT_SEO_DESCRIPTION =
  "Detalcenter.az avtomobil ehtiyat hisseleri, OEM kodu ile axtaris, marka-model secimi ve guvenli sifaris ucun online platformadir.";
export const DEFAULT_OG_IMAGE = absoluteUrl("/og-cover.svg");
export const DEFAULT_KEYWORDS = [
  "detalcenter",
  "detalcenter.az",
  "avtomobil detallari",
  "ehtiyat hisseleri",
  "avto hisseleri",
  "oem kodu ile axtaris",
  "avtomobil ehtiyat hissesi",
  "bakida avto hisseleri",
];

export function absoluteUrl(pathname = "/") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, SITE_URL).toString();
}

export function toAbsoluteAssetUrl(value, fallback = DEFAULT_OG_IMAGE) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return fallback;
  }

  try {
    return new URL(normalizedValue, SITE_URL).toString();
  } catch {
    return fallback;
  }
}

export function normalizeMetaText(value, fallback = "") {
  const normalizedValue = String(value || fallback || "")
    .replace(/\s+/g, " ")
    .trim();

  return normalizedValue || fallback;
}

export function truncateMetaText(value, maxLength = 160) {
  const normalizedValue = normalizeMetaText(value);

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength - 1).trimEnd()}…`;
}

export function toFullTitle(title) {
  const normalizedTitle = normalizeMetaText(title);

  if (!normalizedTitle) {
    return SITE_NAME;
  }

  return normalizedTitle === SITE_NAME ? SITE_NAME : `${normalizedTitle} | ${SITE_NAME}`;
}

export function mergeKeywords(...keywordSets) {
  return [...new Set(keywordSets.flat().map((item) => normalizeMetaText(item)).filter(Boolean))];
}

export function buildRobots(noIndex = false) {
  if (noIndex) {
    return {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    };
  }

  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxImagePreview: "large",
      maxSnippet: -1,
      maxVideoPreview: -1,
    },
  };
}

export function buildMetadata({
  title = "",
  description = DEFAULT_SEO_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  keywords = [],
  type = "website",
  noIndex = false,
} = {}) {
  const normalizedDescription = truncateMetaText(description, 170);
  const canonicalUrl = absoluteUrl(path);
  const imageUrl = toAbsoluteAssetUrl(image, DEFAULT_OG_IMAGE);
  const fullTitle = toFullTitle(title);

  return {
    title: normalizeMetaText(title),
    description: normalizedDescription,
    keywords: mergeKeywords(DEFAULT_KEYWORDS, keywords),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description: normalizedDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: normalizedDescription,
      images: [imageUrl],
    },
    robots: buildRobots(noIndex),
  };
}

export function buildNoIndexMetadata({
  title = "",
  description = DEFAULT_SEO_DESCRIPTION,
  path = "/",
} = {}) {
  return buildMetadata({
    title,
    description,
    path,
    noIndex: true,
  });
}
