const {
  canonicalizeBrand,
  decodeVin,
  decodeVinWithApi,
  inferProductVehicleData,
  isValidVin,
  normalizeComparable,
  normalizeVin,
  parseVinCodes,
  vinPatternMatches,
} = require("./vinService");

const SEARCH_ANALYSIS_CACHE_TTL_MS = Number(
  process.env.SMART_SEARCH_CACHE_TTL_MS || 1000 * 60 * 5,
);
const searchAnalysisCache = new Map();

const BRAND_ALIASES = [
  {
    brand: "BMW",
    aliases: ["bmw"],
  },
  {
    brand: "Mercedes-Benz",
    aliases: ["mercedes", "benz", "mercedes benz"],
  },
  {
    brand: "Audi",
    aliases: ["audi"],
  },
  {
    brand: "Volkswagen",
    aliases: ["volkswagen", "vw"],
  },
  {
    brand: "Toyota",
    aliases: ["toyota"],
  },
  {
    brand: "Hyundai",
    aliases: ["hyundai"],
  },
  {
    brand: "Kia",
    aliases: ["kia"],
  },
];

const KNOWN_MODEL_TOKENS = [
  "X1",
  "X3",
  "X5",
  "X6",
  "E36",
  "E39",
  "E46",
  "E53",
  "E60",
  "E90",
  "F10",
  "F30",
  "G30",
  "C180",
  "C200",
  "C220",
  "E200",
  "E240",
  "W204",
  "W205",
  "W211",
  "A3",
  "A4",
  "A5",
  "A6",
  "Q3",
  "Q5",
  "Q7",
  "B8",
  "B9",
  "GOLF",
  "PASSAT",
  "JETTA",
  "TIGUAN",
  "POLO",
  "MK6",
  "MK7",
  "COROLLA",
  "CAMRY",
  "RAV4",
  "E150",
  "E210",
  "ELANTRA",
  "SONATA",
  "TUCSON",
  "CERATO",
  "RIO",
  "SPORTAGE",
];

const GENERIC_STOP_WORDS = new Set([
  "and",
  "for",
  "ile",
  "ilə",
  "the",
  "part",
  "parts",
  "avto",
  "avtomobil",
  "masin",
  "mawin",
  "car",
]);

const PART_KEYWORD_FAMILIES = [
  {
    canonical: "brake",
    aliases: ["brake", "brakes", "pad", "pads", "disc", "discs", "rotor", "rotors"],
    expansions: [
      "brake",
      "brake pad",
      "brake pads",
      "brake disc",
      "brake discs",
      "brake rotor",
      "brake rotors",
    ],
    related: ["caliper", "calipers"],
  },
  {
    canonical: "filter",
    aliases: ["filter", "filters", "oil filter", "air filter", "cabin filter", "fuel filter"],
    expansions: ["filter", "oil filter", "air filter", "cabin filter", "fuel filter"],
    related: ["oil", "air", "cabin", "fuel"],
  },
  {
    canonical: "headlight",
    aliases: ["headlight", "headlights", "fara", "far", "lamp", "lampa"],
    expansions: ["headlight", "headlights", "front lamp", "left headlight", "right headlight"],
    related: ["light", "lamp"],
  },
  {
    canonical: "bumper",
    aliases: ["bumper", "bamp", "bamper"],
    expansions: ["bumper", "front bumper", "rear bumper"],
    related: ["grille", "trim"],
  },
  {
    canonical: "mirror",
    aliases: ["mirror", "ayna", "side mirror"],
    expansions: ["mirror", "side mirror", "mirror cover"],
    related: ["glass", "cover"],
  },
];

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSearchText(value) {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

function getCachedSearchAnalysis(cacheKey) {
  const cacheEntry = searchAnalysisCache.get(cacheKey);

  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.expiresAt <= Date.now()) {
    searchAnalysisCache.delete(cacheKey);
    return null;
  }

  return cacheEntry.data;
}

function setCachedSearchAnalysis(cacheKey, data) {
  searchAnalysisCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + SEARCH_ANALYSIS_CACHE_TTL_MS,
  });
}

function levenshtein(left, right) {
  const source = String(left || "");
  const target = String(right || "");

  if (source === target) {
    return 0;
  }

  if (!source.length) {
    return target.length;
  }

  if (!target.length) {
    return source.length;
  }

  const previousRow = Array.from({ length: target.length + 1 }, (_, index) => index);

  for (let sourceIndex = 0; sourceIndex < source.length; sourceIndex += 1) {
    let previousValue = sourceIndex;
    previousRow[0] = sourceIndex + 1;

    for (let targetIndex = 0; targetIndex < target.length; targetIndex += 1) {
      const nextValue = previousRow[targetIndex + 1];
      const substitutionCost = source[sourceIndex] === target[targetIndex] ? 0 : 1;

      previousRow[targetIndex + 1] = Math.min(
        previousRow[targetIndex + 1] + 1,
        previousRow[targetIndex] + 1,
        previousValue + substitutionCost,
      );
      previousValue = nextValue;
    }
  }

  return previousRow[target.length];
}

function isTranspositionMatch(left, right) {
  const source = String(left || "");
  const target = String(right || "");

  if (source.length !== target.length || source.length < 2) {
    return false;
  }

  const differingIndexes = [];

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== target[index]) {
      differingIndexes.push(index);
    }

    if (differingIndexes.length > 2) {
      return false;
    }
  }

  if (differingIndexes.length !== 2) {
    return false;
  }

  const [firstIndex, secondIndex] = differingIndexes;

  return (
    source[firstIndex] === target[secondIndex] &&
    source[secondIndex] === target[firstIndex]
  );
}

function isFuzzyTokenMatch(left, right) {
  const normalizedLeft = normalizeSearchText(left);
  const normalizedRight = normalizeSearchText(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  if (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  ) {
    return true;
  }

  if (isTranspositionMatch(normalizedLeft, normalizedRight)) {
    return true;
  }

  const maxDistance =
    normalizedLeft.length <= 4 || normalizedRight.length <= 4 ? 1 : 2;

  return levenshtein(normalizedLeft, normalizedRight) <= maxDistance;
}

function getCreatedAtValue(product) {
  const dateValue = new Date(product?.createdAt || 0).getTime();
  return Number.isFinite(dateValue) ? dateValue : 0;
}

function compareModelValues(left, right) {
  const normalizedLeft = normalizeComparable(left);
  const normalizedRight = normalizeComparable(right);

  if (!normalizedLeft || !normalizedRight) {
    return {
      exact: false,
      similar: false,
    };
  }

  if (normalizedLeft === normalizedRight) {
    return {
      exact: true,
      similar: true,
    };
  }

  if (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  ) {
    return {
      exact: false,
      similar: true,
    };
  }

  return {
    exact: false,
    similar:
      isFuzzyTokenMatch(normalizedLeft, normalizedRight) ||
      normalizedLeft.slice(0, 2) === normalizedRight.slice(0, 2),
  };
}

function compareEngineValues(left, right) {
  const normalizedLeft = normalizeComparable(left);
  const normalizedRight = normalizeComparable(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  ) {
    return true;
  }

  const leftTokens = tokenizeSearchText(left);
  const rightTokens = tokenizeSearchText(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return false;
  }

  return rightTokens.every((rightToken) =>
    leftTokens.some((leftToken) => isFuzzyTokenMatch(leftToken, rightToken)),
  );
}

function extractBrandFromQuery(query) {
  const normalizedQuery = normalizeSearchText(query);
  const matchedBrand = BRAND_ALIASES.find((entry) =>
    entry.aliases.some((alias) => normalizedQuery.includes(normalizeSearchText(alias))),
  );

  return matchedBrand?.brand || "";
}

function extractModelFromTokens(tokens) {
  const matchedKnownToken = tokens.find((token) => KNOWN_MODEL_TOKENS.includes(token.toUpperCase()));

  if (matchedKnownToken) {
    return matchedKnownToken.toUpperCase();
  }

  const matchedPattern = tokens.find((token) =>
    /^(?:[A-Z]\d{1,3}|E\d{2,3}|F\d{2,3}|G\d{2,3}|W\d{3}|MK\d{1,2})$/i.test(token),
  );

  return matchedPattern ? matchedPattern.toUpperCase() : "";
}

function extractYearFromQuery(query) {
  const matchedYear = String(query || "").match(/\b(19|20)\d{2}\b/);

  return matchedYear ? Number(matchedYear[0]) : null;
}

function extractEngineFromQuery(query) {
  const matchedEngine = String(query || "").match(/\b\d(?:\.\d)?(?:\s?l)?\b/i);

  return matchedEngine ? matchedEngine[0].replace(/\s+/g, "").toUpperCase() : "";
}

function extractPartSignals(query, rawTokens, excludedTokens) {
  const normalizedQuery = normalizeSearchText(query);
  const matchedFamilies = PART_KEYWORD_FAMILIES.filter((family) =>
    family.aliases.some((alias) => normalizedQuery.includes(normalizeSearchText(alias))),
  );
  const remainingTokens = rawTokens.filter((token) => {
    const normalizedToken = normalizeSearchText(token);

    if (!normalizedToken || excludedTokens.has(normalizedToken)) {
      return false;
    }

    return !GENERIC_STOP_WORDS.has(normalizedToken);
  });
  const phrases = dedupe([
    matchedFamilies[0]?.canonical || "",
    ...matchedFamilies.flatMap((family) => [...family.expansions, ...family.related]),
    remainingTokens.join(" ").trim(),
    ...remainingTokens,
  ]);

  return {
    part: matchedFamilies[0]?.canonical || remainingTokens.join(" ").trim(),
    families: matchedFamilies.map((family) => family.canonical),
    keywordPhrases: phrases,
    keywordTokens: dedupe(phrases.flatMap((phrase) => tokenizeSearchText(phrase))),
  };
}

async function analyzeSearchQuery(query) {
  const rawQuery = String(query || "").trim();
  const normalizedQuery = normalizeComparable(rawQuery);

  if (!rawQuery) {
    return {
      rawQuery: "",
      inputType: "text",
      brand: "",
      model: "",
      year: null,
      engine: "",
      part: "",
      vin: "",
      vehicle: null,
      partFamilies: [],
      keywordPhrases: [],
      keywordTokens: [],
      queryTokens: [],
      normalizedQueryText: "",
    };
  }

  const cachedAnalysis = getCachedSearchAnalysis(normalizedQuery);

  if (cachedAnalysis) {
    return cachedAnalysis;
  }

  if (isValidVin(rawQuery)) {
    const vin = normalizeVin(rawQuery);
    const vehicle = {
      ...decodeVin(vin),
      ...(await decodeVinWithApi(vin)),
    };
    const vinAnalysis = {
      rawQuery,
      inputType: "vin",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || null,
      engine: vehicle.engine || "",
      part: "",
      vin,
      vehicle,
      partFamilies: [],
      keywordPhrases: [],
      keywordTokens: [],
      queryTokens: [vin],
      normalizedQueryText: normalizeSearchText(rawQuery),
    };

    setCachedSearchAnalysis(normalizedQuery, vinAnalysis);
    return vinAnalysis;
  }

  const queryTokens = tokenizeSearchText(rawQuery);
  const upperQueryTokens = queryTokens.map((token) => token.toUpperCase());
  const brand = canonicalizeBrand(extractBrandFromQuery(rawQuery));
  const model = extractModelFromTokens(upperQueryTokens);
  const year = extractYearFromQuery(rawQuery);
  const engine = extractEngineFromQuery(rawQuery);
  const excludedTokens = new Set(
    [
      ...tokenizeSearchText(brand),
      ...tokenizeSearchText(model),
      ...tokenizeSearchText(engine),
      year ? String(year) : "",
    ].filter(Boolean),
  );
  const partSignals = extractPartSignals(rawQuery, queryTokens, excludedTokens);
  const textAnalysis = {
    rawQuery,
    inputType: "text",
    brand,
    model,
    year,
    engine,
    part: partSignals.part,
    vin: "",
    vehicle: null,
    partFamilies: partSignals.families,
    keywordPhrases: partSignals.keywordPhrases,
    keywordTokens: partSignals.keywordTokens,
    queryTokens: dedupe(queryTokens),
    normalizedQueryText: normalizeSearchText(rawQuery),
  };

  setCachedSearchAnalysis(normalizedQuery, textAnalysis);
  return textAnalysis;
}

function buildProductSearchIndex(product) {
  const vehicle = inferProductVehicleData(product);
  const nameText = normalizeSearchText(product?.name);
  const descriptionText = normalizeSearchText(product?.description);
  const metadataText = normalizeSearchText(
    [vehicle.brand, vehicle.model, vehicle.year, vehicle.engine].filter(Boolean).join(" "),
  );
  const allText = dedupe([nameText, descriptionText, metadataText]).join(" ").trim();

  return {
    vehicle,
    nameText,
    descriptionText,
    allText,
    nameTokens: tokenizeSearchText(product?.name),
    descriptionTokens: tokenizeSearchText(product?.description),
    allTokens: tokenizeSearchText(allText),
  };
}

function countPhraseHits(phrases, text) {
  const normalizedText = normalizeSearchText(text);

  return phrases.reduce((hits, phrase) => {
    const normalizedPhrase = normalizeSearchText(phrase);

    if (!normalizedPhrase) {
      return hits;
    }

    return hits + (normalizedText.includes(normalizedPhrase) ? 1 : 0);
  }, 0);
}

function countExactTokenHits(tokens, productTokens) {
  const normalizedProductTokens = new Set(productTokens.map((token) => normalizeSearchText(token)));

  return tokens.reduce((hits, token) => {
    const normalizedToken = normalizeSearchText(token);

    if (!normalizedToken) {
      return hits;
    }

    return hits + (normalizedProductTokens.has(normalizedToken) ? 1 : 0);
  }, 0);
}

function countFuzzyTokenHits(tokens, productTokens) {
  const normalizedProductTokens = productTokens.map((token) => normalizeSearchText(token));

  return tokens.reduce((hits, token) => {
    const normalizedToken = normalizeSearchText(token);

    if (!normalizedToken) {
      return hits;
    }

    if (normalizedProductTokens.includes(normalizedToken)) {
      return hits;
    }

    return (
      hits +
      (normalizedProductTokens.some((productToken) => isFuzzyTokenMatch(normalizedToken, productToken))
        ? 1
        : 0)
    );
  }, 0);
}

function scoreVehicleMatch(analysis, vehicle) {
  const brandExact = Boolean(
    analysis.brand &&
      vehicle.brand &&
      normalizeComparable(analysis.brand) === normalizeComparable(vehicle.brand),
  );
  const modelMatch = compareModelValues(analysis.model, vehicle.model);
  const yearExact = Boolean(
    analysis.year &&
      vehicle.year &&
      Number(analysis.year) === Number(vehicle.year),
  );
  const engineExact = Boolean(analysis.engine && compareEngineValues(vehicle.engine, analysis.engine));
  let score = 0;

  if (brandExact) {
    score += 60;
  }

  if (modelMatch.exact) {
    score += 75;
  } else if (modelMatch.similar) {
    score += 35;
  }

  if (yearExact) {
    score += 45;
  }

  if (engineExact) {
    score += 20;
  }

  if (brandExact && modelMatch.exact && yearExact) {
    score += 160;
  } else if ((modelMatch.exact && yearExact) || (brandExact && modelMatch.exact)) {
    score += 110;
  } else if (modelMatch.similar || (brandExact && yearExact)) {
    score += 55;
  }

  return {
    score,
    brandExact,
    modelExact: modelMatch.exact,
    modelSimilar: modelMatch.similar && !modelMatch.exact,
    yearExact,
    engineExact,
  };
}

function scoreKeywordMatch(analysis, productIndex) {
  if (analysis.keywordTokens.length === 0 && analysis.keywordPhrases.length === 0) {
    return {
      score: 0,
      anyMatch: false,
      strongMatch: false,
    };
  }

  const namePhraseHits = countPhraseHits(analysis.keywordPhrases, productIndex.nameText);
  const descriptionPhraseHits = countPhraseHits(analysis.keywordPhrases, productIndex.descriptionText);
  const nameTokenHits = countExactTokenHits(analysis.keywordTokens, productIndex.nameTokens);
  const descriptionTokenHits = countExactTokenHits(
    analysis.keywordTokens,
    productIndex.descriptionTokens,
  );
  const fuzzyHits = countFuzzyTokenHits(analysis.keywordTokens, productIndex.allTokens);
  const score =
    Math.min(namePhraseHits, 3) * 36 +
    Math.min(descriptionPhraseHits, 3) * 18 +
    Math.min(nameTokenHits, 4) * 14 +
    Math.min(descriptionTokenHits, 4) * 9 +
    Math.min(fuzzyHits, 4) * 6;

  return {
    score,
    anyMatch: score > 0,
    strongMatch: namePhraseHits > 0 || nameTokenHits > 1,
  };
}

function determinePriorityTier(match) {
  if (match.vinTier) {
    return match.vinTier;
  }

  if (match.brandExact && match.modelExact && match.yearExact) {
    return 1;
  }

  if ((match.modelExact && match.yearExact) || (match.brandExact && match.modelExact)) {
    return 2;
  }

  if (match.modelSimilar || (match.brandExact && match.yearExact)) {
    return 3;
  }

  return 4;
}

function determineVinVehiclePriorityTier(match) {
  if (match.brandExact && match.modelExact && match.yearExact) {
    return 1;
  }

  if (match.brandExact && match.modelExact) {
    return 2;
  }

  if (match.brandExact) {
    return 3;
  }

  return 4;
}

function scoreTextSearchProduct(product, analysis) {
  const productIndex = buildProductSearchIndex(product);
  const vehicleMatch = scoreVehicleMatch(analysis, productIndex.vehicle);
  const keywordMatch = scoreKeywordMatch(analysis, productIndex);
  const exactQueryInName =
    analysis.normalizedQueryText.length >= 3 &&
    productIndex.nameText.includes(analysis.normalizedQueryText);
  const exactQueryInDescription =
    analysis.normalizedQueryText.length >= 3 &&
    productIndex.descriptionText.includes(analysis.normalizedQueryText);
  const generalTokenHits = countExactTokenHits(analysis.queryTokens, productIndex.allTokens);
  const generalFuzzyHits = countFuzzyTokenHits(analysis.queryTokens, productIndex.allTokens);
  const hasVehicleIntent = Boolean(
    analysis.brand || analysis.model || analysis.year || analysis.engine,
  );
  const hasPartIntent = Boolean(analysis.part || analysis.keywordTokens.length > 0);
  const hasVehicleEvidence = Boolean(
    vehicleMatch.brandExact ||
      vehicleMatch.modelExact ||
      vehicleMatch.modelSimilar ||
      vehicleMatch.yearExact ||
      vehicleMatch.engineExact,
  );
  const hasTextEvidence = Boolean(
    keywordMatch.anyMatch ||
      exactQueryInName ||
      exactQueryInDescription ||
      generalTokenHits > 0 ||
      generalFuzzyHits > 0,
  );

  if (hasPartIntent && !hasTextEvidence) {
    return null;
  }

  if (hasVehicleIntent && !hasVehicleEvidence && !exactQueryInName && generalTokenHits < 2) {
    return null;
  }

  let score =
    vehicleMatch.score +
    keywordMatch.score +
    Math.min(generalTokenHits, 5) * 6 +
    Math.min(generalFuzzyHits, 4) * 3;

  if (exactQueryInName) {
    score += 55;
  }

  if (exactQueryInDescription) {
    score += 25;
  }

  if (vehicleMatch.brandExact && keywordMatch.anyMatch) {
    score += 20;
  }

  if (vehicleMatch.modelExact && keywordMatch.strongMatch) {
    score += 18;
  }

  const minimumScore =
    !hasVehicleIntent && analysis.queryTokens.length <= 2 ? 8 : 18;

  if (score < minimumScore) {
    return null;
  }

  return {
    matched: true,
    priorityTier: determinePriorityTier({
      ...vehicleMatch,
    }),
    score,
    product,
  };
}

function scoreVinSearchProduct(product, analysis) {
  const productIndex = buildProductSearchIndex(product);
  const storedVinCodes = parseVinCodes(product.vinCodes);
  const matchedVinPattern =
    storedVinCodes.find((vinCode) => vinPatternMatches(vinCode, analysis.vin)) || "";
  const vehicleMatch = scoreVehicleMatch(
    {
      ...analysis,
      brand: analysis.vehicle?.brand || analysis.brand,
      model: analysis.vehicle?.model || analysis.model,
      year: analysis.vehicle?.year || analysis.year,
      engine: analysis.vehicle?.engine || analysis.engine,
    },
    productIndex.vehicle,
  );
  const vinVehicleTier = determineVinVehiclePriorityTier(vehicleMatch);

  if (!matchedVinPattern && !vehicleMatch.brandExact) {
    return null;
  }

  let score = vehicleMatch.score;

  if (matchedVinPattern.length >= 17) {
    score += 320;
  } else if (matchedVinPattern.length >= 8) {
    score += 240;
  } else if (matchedVinPattern.length >= 6) {
    score += 190;
  } else if (matchedVinPattern) {
    score += 150;
  }

  if (vinVehicleTier === 1) {
    score += 90;
  } else if (vinVehicleTier === 2) {
    score += 55;
  } else if (vinVehicleTier === 3) {
    score += 25;
  }

  return {
    matched: true,
    priorityTier: matchedVinPattern ? 1 : vinVehicleTier,
    score,
    product,
  };
}

function rankProductsForSearch(products, analysis) {
  return products
    .map((product) =>
      analysis.inputType === "vin"
        ? scoreVinSearchProduct(product, analysis)
        : scoreTextSearchProduct(product, analysis),
    )
    .filter(Boolean)
    .sort((left, right) => {
      if (left.priorityTier !== right.priorityTier) {
        return left.priorityTier - right.priorityTier;
      }

      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return getCreatedAtValue(right.product) - getCreatedAtValue(left.product);
    });
}

function buildSearchMeta(analysis, resultCount) {
  const vehicle = analysis.inputType === "vin" ? analysis.vehicle : null;
  const parsed = {
    brand: vehicle?.brand || analysis.brand || "",
    model: vehicle?.model || analysis.model || "",
    year: vehicle?.year || analysis.year || null,
    engine: vehicle?.engine || analysis.engine || "",
    part: analysis.part || "",
    vin: analysis.vin || "",
    keywords: analysis.keywordTokens.slice(0, 8),
  };
  const summary = [
    parsed.brand,
    parsed.model,
    parsed.year,
    parsed.engine,
    parsed.part,
  ]
    .filter(Boolean)
    .join(" / ");

  return {
    inputType: analysis.inputType,
    label: "Uyğun hissələr tapıldı",
    resultCount,
    summary: summary || analysis.rawQuery,
    parsed,
  };
}

module.exports = {
  analyzeSearchQuery,
  buildSearchMeta,
  compareEngineValues,
  rankProductsForSearch,
};
