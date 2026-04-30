const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;
const VIN_CACHE_TTL_MS = Number(process.env.VIN_CACHE_TTL_MS || 1000 * 60 * 60 * 12);
const VPIC_DECODE_BASE_URL =
  process.env.VIN_DECODER_API_BASE ||
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended";
const vinDecodeCache = new Map();

const vinYearMap = {
  Y: 2000,
  "1": 2001,
  "2": 2002,
  "3": 2003,
  "4": 2004,
  "5": 2005,
  "6": 2006,
  "7": 2007,
  "8": 2008,
  "9": 2009,
  A: 2010,
  B: 2011,
  C: 2012,
  D: 2013,
  E: 2014,
  F: 2015,
  G: 2016,
  H: 2017,
  J: 2018,
  K: 2019,
  L: 2020,
  M: 2021,
  N: 2022,
  P: 2023,
  R: 2024,
  S: 2025,
  T: 2026,
  V: 2027,
  W: 2028,
  X: 2029,
};

const brandByWmi = [
  {
    prefixes: ["WBA", "WBS", "WBX", "5UX"],
    brand: "BMW",
  },
  {
    prefixes: ["WDB", "WDD", "W1K", "4JG"],
    brand: "Mercedes-Benz",
  },
  {
    prefixes: ["WAU", "TRU"],
    brand: "Audi",
  },
  {
    prefixes: ["WVW", "WVG", "3VW"],
    brand: "Volkswagen",
  },
  {
    prefixes: ["JTD", "JTE", "JT3", "JT4", "JT5"],
    brand: "Toyota",
  },
  {
    prefixes: ["KMH", "KMF"],
    brand: "Hyundai",
  },
  {
    prefixes: ["KNM", "KNA", "KNE"],
    brand: "Kia",
  },
];

const brandAliases = [
  {
    brand: "BMW",
    tokens: ["BMW"],
  },
  {
    brand: "Mercedes-Benz",
    tokens: ["MERCEDESBENZ", "MERCEDES", "BENZ"],
  },
  {
    brand: "Audi",
    tokens: ["AUDI"],
  },
  {
    brand: "Volkswagen",
    tokens: ["VOLKSWAGEN", "VW"],
  },
  {
    brand: "Toyota",
    tokens: ["TOYOTA"],
  },
  {
    brand: "Hyundai",
    tokens: ["HYUNDAI"],
  },
  {
    brand: "Kia",
    tokens: ["KIA"],
  },
];

const knownModelTokens = [
  "E46",
  "E60",
  "E90",
  "F10",
  "F30",
  "G30",
  "W204",
  "W205",
  "B8",
  "B9",
  "MK6",
  "MK7",
  "E150",
  "E210",
  "ELANTRA",
  "CERATO",
];

function normalizeComparable(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function normalizeVin(vin) {
  return normalizeComparable(vin);
}

function canonicalizeBrand(value) {
  const normalized = normalizeComparable(value);
  const matchedBrand = brandAliases.find((entry) =>
    entry.tokens.some((token) => normalized === token || normalized.includes(token)),
  );

  return matchedBrand?.brand || String(value || "").trim();
}

function isValidVin(vin) {
  return VIN_REGEX.test(normalizeVin(vin));
}

function parseVinCodes(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => normalizeVin(item)).filter(Boolean))];
  }

  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalizedValue);

    if (Array.isArray(parsed)) {
      return parseVinCodes(parsed);
    }
  } catch {
    // Ignore JSON parse errors and fall back to delimiter parsing.
  }

  return [
    ...new Set(
      normalizedValue
        .split(/[\n,;]+/)
        .map((item) => normalizeVin(item))
        .filter(Boolean),
    ),
  ];
}

function stringifyVinCodes(value) {
  return JSON.stringify(parseVinCodes(value));
}

function getVinTokens(vin) {
  const normalizedVin = normalizeVin(vin);

  return {
    full: normalizedVin,
    last8: normalizedVin.slice(-8),
    last6: normalizedVin.slice(-6),
  };
}

function decodeYear(vin) {
  return vinYearMap[normalizeVin(vin).charAt(9)] || null;
}

function decodeBrand(vin) {
  const wmi = normalizeVin(vin).slice(0, 3);
  const matchedBrand = brandByWmi.find((entry) => entry.prefixes.includes(wmi));

  return matchedBrand?.brand || "Unknown";
}

function getBrandProfile(brand, year) {
  if (brand === "BMW") {
    if (year && year <= 2005) {
      return {
        model: "E46",
        generation: "E46",
        engine: year >= 2003 ? "2.0" : "1.9",
      };
    }

    if (year && year <= 2010) {
      return {
        model: "E60",
        generation: "E60",
        engine: "2.5",
      };
    }

    if (year && year <= 2016) {
      return {
        model: "F10",
        generation: "F10",
        engine: "2.0",
      };
    }

    return {
      model: "G30",
      generation: "G30",
      engine: "2.0",
    };
  }

  if (brand === "Mercedes-Benz") {
    if (year && year <= 2014) {
      return {
        model: "W204",
        generation: "W204",
        engine: "1.8",
      };
    }

    return {
      model: "W205",
      generation: "W205",
      engine: "2.0",
    };
  }

  if (brand === "Audi") {
    if (year && year <= 2015) {
      return {
        model: "B8",
        generation: "B8",
        engine: "2.0",
      };
    }

    return {
      model: "B9",
      generation: "B9",
      engine: "2.0",
    };
  }

  if (brand === "Volkswagen") {
    if (year && year <= 2012) {
      return {
        model: "MK6",
        generation: "Golf Mk6",
        engine: "1.6",
      };
    }

    return {
      model: "MK7",
      generation: "Golf Mk7",
      engine: "1.4",
    };
  }

  if (brand === "Toyota") {
    if (year && year <= 2013) {
      return {
        model: "E150",
        generation: "Corolla E150",
        engine: "1.6",
      };
    }

    return {
      model: "E210",
      generation: "Corolla E210",
      engine: "1.8",
    };
  }

  if (brand === "Hyundai") {
    return {
      model: "ELANTRA",
      generation: "Elantra",
      engine: "1.6",
    };
  }

  if (brand === "Kia") {
    return {
      model: "CERATO",
      generation: "Cerato",
      engine: "1.6",
    };
  }

  return {
    model: "",
    generation: "",
    engine: "",
  };
}

function decodeVin(vin) {
  const normalizedVin = normalizeVin(vin);
  const brand = canonicalizeBrand(decodeBrand(normalizedVin));
  const year = decodeYear(normalizedVin);
  const profile = getBrandProfile(brand, year);

  return {
    vin: normalizedVin,
    brand,
    model: profile.model || "",
    year,
    engine: profile.engine || "",
    generation: profile.generation || "",
  };
}

function parseYearValue(value) {
  const parsedYear = Number(value);

  return Number.isFinite(parsedYear) && parsedYear > 0 ? Math.trunc(parsedYear) : null;
}

function buildEngineLabel(decodedResult) {
  const directEngine =
    String(decodedResult?.EngineModel || "").trim() ||
    String(decodedResult?.OtherEngineInfo || "").trim();

  if (directEngine) {
    return directEngine;
  }

  const parts = [];
  const displacement = String(decodedResult?.DisplacementL || "").trim();
  const cylinders = String(decodedResult?.EngineCylinders || "").trim();
  const fuel = String(decodedResult?.FuelTypePrimary || "").trim();
  const aspiration = String(decodedResult?.Turbo || "").trim();

  if (displacement) {
    parts.push(`${displacement}L`);
  }

  if (cylinders) {
    parts.push(`${cylinders} cyl`);
  }

  if (fuel) {
    parts.push(fuel);
  }

  if (aspiration && aspiration.toLowerCase() !== "no") {
    parts.push(aspiration);
  }

  return parts.join(" ").trim();
}

function mapVpicDecodeResult(decodedResult) {
  if (!decodedResult || typeof decodedResult !== "object") {
    return {
      brand: "",
      model: "",
      year: null,
      engine: "",
    };
  }

  return {
    brand: canonicalizeBrand(decodedResult.Make || decodedResult.Manufacturer || ""),
    model: String(decodedResult.Model || decodedResult.Series || decodedResult.Trim || "").trim(),
    year: parseYearValue(decodedResult.ModelYear),
    engine: buildEngineLabel(decodedResult),
  };
}

function hasMeaningfulVinData(decodedVehicle) {
  return Boolean(
    decodedVehicle?.brand ||
      decodedVehicle?.model ||
      decodedVehicle?.year ||
      decodedVehicle?.engine,
  );
}

function getCachedVinDecode(vin) {
  const cacheEntry = vinDecodeCache.get(normalizeVin(vin));

  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.expiresAt <= Date.now()) {
    vinDecodeCache.delete(normalizeVin(vin));
    return null;
  }

  return cacheEntry.data;
}

function setCachedVinDecode(vin, decodedVehicle) {
  vinDecodeCache.set(normalizeVin(vin), {
    data: decodedVehicle,
    expiresAt: Date.now() + VIN_CACHE_TTL_MS,
  });
}

async function fetchDecodedVinFromVpic(vin) {
  const normalizedVin = normalizeVin(vin);
  const requestUrl = new URL(`${VPIC_DECODE_BASE_URL}/${encodeURIComponent(normalizedVin)}`);
  const inferredYear = decodeYear(normalizedVin);

  requestUrl.searchParams.set("format", "json");

  if (inferredYear) {
    requestUrl.searchParams.set("modelyear", String(inferredYear));
  }

  const response = await fetch(requestUrl, {
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`VIN decode request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return mapVpicDecodeResult(Array.isArray(payload?.Results) ? payload.Results[0] : null);
}

async function decodeVinWithApi(vin, { force = false } = {}) {
  const normalizedVin = normalizeVin(vin);

  if (!isValidVin(normalizedVin)) {
    throw new Error("VIN must be exactly 17 valid characters");
  }

  if (!force) {
    const cached = getCachedVinDecode(normalizedVin);

    if (cached) {
      return cached;
    }
  }

  const mockDecoded = decodeVin(normalizedVin);
  const fallbackDecoded = {
    brand: mockDecoded.brand === "Unknown" ? "" : mockDecoded.brand,
    model: mockDecoded.model || "",
    year: mockDecoded.year || null,
    engine: mockDecoded.engine || "",
  };
  let externalDecoded = null;

  try {
    externalDecoded = await fetchDecodedVinFromVpic(normalizedVin);
  } catch (error) {
    console.error("VIN DECODE EXTERNAL API ERROR:", error.message || error);
  }

  const decodedVehicle = {
    brand: externalDecoded?.brand || fallbackDecoded.brand,
    model: externalDecoded?.model || fallbackDecoded.model,
    year: externalDecoded?.year || fallbackDecoded.year,
    engine: externalDecoded?.engine || fallbackDecoded.engine,
  };

  if (!hasMeaningfulVinData(decodedVehicle)) {
    setCachedVinDecode(normalizedVin, fallbackDecoded);
    return fallbackDecoded;
  }

  setCachedVinDecode(normalizedVin, decodedVehicle);
  return decodedVehicle;
}

function extractVehicleFromText(value) {
  const text = String(value || "");
  const normalizedText = normalizeComparable(text);
  const detectedBrand = canonicalizeBrand(
    brandAliases.find((entry) =>
      entry.tokens.some((token) => normalizedText.includes(token)),
    )?.brand || "",
  );
  const detectedModel =
    knownModelTokens.find((token) => normalizedText.includes(token)) || "";
  const detectedYear = text.match(/\b(19|20)\d{2}\b/)?.[0] || null;
  const detectedEngine = text.match(/\b\d\.\d\b/)?.[0] || "";

  return {
    brand: detectedBrand,
    model: detectedModel,
    year: detectedYear ? Number(detectedYear) : null,
    engine: detectedEngine,
  };
}

function inferProductVehicleData(product) {
  const parsedFromText = extractVehicleFromText(
    `${product?.name || ""} ${product?.description || ""}`,
  );

  return {
    brand: canonicalizeBrand(product?.brand || parsedFromText.brand || ""),
    model: String(product?.model || parsedFromText.model || "").trim(),
    year:
      product?.year === undefined || product?.year === null || product?.year === ""
        ? parsedFromText.year
        : Number(product.year),
    engine: String(product?.engine || parsedFromText.engine || "").trim(),
  };
}

function vinPatternMatches(pattern, vin) {
  const normalizedPattern = normalizeVin(pattern);
  const normalizedVin = normalizeVin(vin);

  if (!normalizedPattern || !normalizedVin) {
    return false;
  }

  return (
    normalizedVin === normalizedPattern ||
    normalizedVin.startsWith(normalizedPattern) ||
    normalizedVin.endsWith(normalizedPattern)
  );
}

module.exports = {
  canonicalizeBrand,
  decodeVin,
  decodeVinWithApi,
  extractVehicleFromText,
  getVinTokens,
  inferProductVehicleData,
  isValidVin,
  normalizeComparable,
  normalizeVin,
  parseVinCodes,
  stringifyVinCodes,
  vinPatternMatches,
};
