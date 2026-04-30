export const defaultSiteContent = {
  heroTitle: "Onlayn ehtiyat hissesi magazasi",
  heroDesc: "Butun seher ve rayonlara suretli catdirilma ve rahat sifaris imkani",
  heroButton: "Axtar",
  heroImage:
    "https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=1200&q=80",
  footerDescription: "Keyfiyyetli ehtiyat hisseleri, rahat sifaris ve suretli destek bir yerde.",
  footerHighlightLabel: "Destek xidmeti",
  footerHighlightValue: "24/7",
  footerWorkHoursLabel: "Is gunleri",
  footerWorkHoursValue: "Be. - Ce. / 09:00 - 18:00",
  footerPhoneLabel: "Elaqe nomresi",
  footerPhoneValue: "+994 55 738 00 13",
  footerEmailLabel: "E-poct",
  footerEmailValue: "info@avtopro.az",
  footerSocialLabel: "Bizi izleyin",
  footerFacebookUrl: "https://facebook.com",
  footerInstagramUrl: "https://instagram.com",
  footerLinkedinUrl: "https://linkedin.com",
  footerTiktokUrl: "https://tiktok.com",
  footerCopyright: "Detalcenter.az 2026, Butun huquqlar qorunur.",
  footerPrivacyLabel: "Mexfilik siyaseti",
  footerTermsLabel: "Sertler ve qaydalar",
  footerAboutLabel: "Haqqimizda",
  footerFaqLabel: "Tez-tez verilen suallar",
};

export const defaultHeroContent = defaultSiteContent;

function sanitizeHeroText(value) {
  const text = String(value || "").trim();

  return text.replace(/Guvenli secim, seller paneli ve VIN axtarisi bir yerde\.?/gi, "").trim();
}

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeUrl(value, fallback = "") {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return fallback;
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized.replace(/^\/+/, "")}`;
}

function flattenCategories(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const category = {
      id: item.id || item._id || String(item.name || item.title || item.label || Math.random()),
      name: String(item.name || item.title || item.label || "").trim(),
      imageUrl: String(item.imageUrl || item.icon || "").trim(),
      parentId: item.parentId || null,
      source: item.source || "category",
    };

    const children = Array.isArray(item.children) ? item.children : [];
    const childCategories = flattenCategories(children);

    return category.name ? [category, ...childCategories] : childCategories;
  });
}

export function normalizeProductsResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  return [];
}

export function normalizeCategoriesResponse(data) {
  const categorySource = Array.isArray(data)
    ? data
    : Array.isArray(data?.categories)
      ? data.categories
      : [];

  return flattenCategories(categorySource).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function normalizeSearchResults(data) {
  return {
    products: normalizeProductsResponse(data),
    sellers: !Array.isArray(data) && Array.isArray(data?.sellers) ? data.sellers : [],
  };
}

export function normalizeSearchMeta(data) {
  if (Array.isArray(data) || !data?.searchMeta || typeof data.searchMeta !== "object") {
    return null;
  }

  return {
    inputType: data.searchMeta.inputType || "",
    label: data.searchMeta.label || "",
    resultCount: Number(data.searchMeta.resultCount || 0),
    summary: data.searchMeta.summary || "",
    parsed: {
      brand: data.searchMeta.parsed?.brand || "",
      model: data.searchMeta.parsed?.model || "",
      year: data.searchMeta.parsed?.year || null,
      engine: data.searchMeta.parsed?.engine || "",
      part: data.searchMeta.parsed?.part || "",
      vin: data.searchMeta.parsed?.vin || "",
      keywords: Array.isArray(data.searchMeta.parsed?.keywords)
        ? data.searchMeta.parsed.keywords
        : [],
    },
  };
}

export function normalizeSiteContent(data) {
  return {
    heroTitle: sanitizeHeroText(data?.heroTitle) || defaultSiteContent.heroTitle,
    heroDesc: sanitizeHeroText(data?.heroDesc) || defaultSiteContent.heroDesc,
    heroButton: normalizeText(data?.heroButton, defaultSiteContent.heroButton),
    heroImage: normalizeText(data?.heroImage, defaultSiteContent.heroImage),
    footerDescription: normalizeText(data?.footerDescription, defaultSiteContent.footerDescription),
    footerHighlightLabel: normalizeText(
      data?.footerHighlightLabel,
      defaultSiteContent.footerHighlightLabel,
    ),
    footerHighlightValue: normalizeText(
      data?.footerHighlightValue,
      defaultSiteContent.footerHighlightValue,
    ),
    footerWorkHoursLabel: normalizeText(
      data?.footerWorkHoursLabel,
      defaultSiteContent.footerWorkHoursLabel,
    ),
    footerWorkHoursValue: normalizeText(
      data?.footerWorkHoursValue,
      defaultSiteContent.footerWorkHoursValue,
    ),
    footerPhoneLabel: normalizeText(data?.footerPhoneLabel, defaultSiteContent.footerPhoneLabel),
    footerPhoneValue: normalizeText(data?.footerPhoneValue, defaultSiteContent.footerPhoneValue),
    footerEmailLabel: normalizeText(data?.footerEmailLabel, defaultSiteContent.footerEmailLabel),
    footerEmailValue: normalizeText(data?.footerEmailValue, defaultSiteContent.footerEmailValue),
    footerSocialLabel: normalizeText(
      data?.footerSocialLabel,
      defaultSiteContent.footerSocialLabel,
    ),
    footerFacebookUrl: normalizeUrl(
      data?.footerFacebookUrl,
      defaultSiteContent.footerFacebookUrl,
    ),
    footerInstagramUrl: normalizeUrl(
      data?.footerInstagramUrl,
      defaultSiteContent.footerInstagramUrl,
    ),
    footerLinkedinUrl: normalizeUrl(
      data?.footerLinkedinUrl,
      defaultSiteContent.footerLinkedinUrl,
    ),
    footerTiktokUrl: normalizeUrl(data?.footerTiktokUrl, defaultSiteContent.footerTiktokUrl),
    footerCopyright: normalizeText(
      data?.footerCopyright,
      defaultSiteContent.footerCopyright,
    ),
    footerPrivacyLabel: normalizeText(
      data?.footerPrivacyLabel,
      defaultSiteContent.footerPrivacyLabel,
    ),
    footerTermsLabel: normalizeText(data?.footerTermsLabel, defaultSiteContent.footerTermsLabel),
    footerAboutLabel: normalizeText(data?.footerAboutLabel, defaultSiteContent.footerAboutLabel),
    footerFaqLabel: normalizeText(data?.footerFaqLabel, defaultSiteContent.footerFaqLabel),
  };
}

export function normalizeHeroContent(data) {
  return normalizeSiteContent(data);
}
