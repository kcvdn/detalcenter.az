const express = require("express");
const { auth, role } = require("../middleware/auth");
const { normalizeAssetUrl } = require("../utils/assetUrls");
const prisma = require("../src/lib/prisma");

const router = express.Router();

const defaultContent = {
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

function sanitizeHeroText(value) {
  return String(value || "")
    .replace(/Guvenli secim, seller paneli ve VIN axtarisi bir yerde\.?/gi, "")
    .trim();
}

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function sanitizeUrl(value, fallback = "") {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return fallback;
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized.replace(/^\/+/, "")}`;
}

function sanitizeContent(content) {
  return {
    ...content,
    heroTitle: sanitizeHeroText(content?.heroTitle) || defaultContent.heroTitle,
    heroDesc: sanitizeHeroText(content?.heroDesc) || defaultContent.heroDesc,
    heroButton: normalizeText(content?.heroButton, defaultContent.heroButton),
    heroImage: normalizeText(content?.heroImage, defaultContent.heroImage),
    footerDescription: normalizeText(content?.footerDescription, defaultContent.footerDescription),
    footerHighlightLabel: normalizeText(content?.footerHighlightLabel, defaultContent.footerHighlightLabel),
    footerHighlightValue: normalizeText(content?.footerHighlightValue, defaultContent.footerHighlightValue),
    footerWorkHoursLabel: normalizeText(content?.footerWorkHoursLabel, defaultContent.footerWorkHoursLabel),
    footerWorkHoursValue: normalizeText(content?.footerWorkHoursValue, defaultContent.footerWorkHoursValue),
    footerPhoneLabel: normalizeText(content?.footerPhoneLabel, defaultContent.footerPhoneLabel),
    footerPhoneValue: normalizeText(content?.footerPhoneValue, defaultContent.footerPhoneValue),
    footerEmailLabel: normalizeText(content?.footerEmailLabel, defaultContent.footerEmailLabel),
    footerEmailValue: normalizeText(content?.footerEmailValue, defaultContent.footerEmailValue),
    footerSocialLabel: normalizeText(content?.footerSocialLabel, defaultContent.footerSocialLabel),
    footerFacebookUrl: sanitizeUrl(content?.footerFacebookUrl, defaultContent.footerFacebookUrl),
    footerInstagramUrl: sanitizeUrl(content?.footerInstagramUrl, defaultContent.footerInstagramUrl),
    footerLinkedinUrl: sanitizeUrl(content?.footerLinkedinUrl, defaultContent.footerLinkedinUrl),
    footerTiktokUrl: sanitizeUrl(content?.footerTiktokUrl, defaultContent.footerTiktokUrl),
    footerCopyright: normalizeText(content?.footerCopyright, defaultContent.footerCopyright),
    footerPrivacyLabel: normalizeText(content?.footerPrivacyLabel, defaultContent.footerPrivacyLabel),
    footerTermsLabel: normalizeText(content?.footerTermsLabel, defaultContent.footerTermsLabel),
    footerAboutLabel: normalizeText(content?.footerAboutLabel, defaultContent.footerAboutLabel),
    footerFaqLabel: normalizeText(content?.footerFaqLabel, defaultContent.footerFaqLabel),
  };
}

router.get("/", async (req, res) => {
  try {
    const content = await prisma.siteContent.findFirst({
      orderBy: {
        id: "asc",
      },
    });

    const normalizedContent = sanitizeContent(content || defaultContent);

    res.json({
      ...normalizedContent,
      heroImage: normalizeAssetUrl(normalizedContent.heroImage, req),
    });
  } catch (error) {
    console.error("GET CONTENT ERROR:", error);
    res.status(500).json({ error: "Could not fetch content" });
  }
});

router.put("/", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const existingContent = await prisma.siteContent.findFirst({
      orderBy: {
        id: "asc",
      },
    });
    const sourceContent = existingContent || defaultContent;

    const data = sanitizeContent({
      ...sourceContent,
      ...req.body,
      heroImage:
        normalizeAssetUrl(req.body?.heroImage, req) ||
        sourceContent.heroImage ||
        defaultContent.heroImage,
    });

    if (!existingContent) {
      const createdContent = await prisma.siteContent.create({ data });
      return res.json(createdContent);
    }

    const updatedContent = await prisma.siteContent.update({
      where: {
        id: existingContent.id,
      },
      data,
    });

    res.json(updatedContent);
  } catch (error) {
    console.error("UPDATE CONTENT ERROR:", error);
    res.status(500).json({ error: "Could not update content" });
  }
});

module.exports = router;
