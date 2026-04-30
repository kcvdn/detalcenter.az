const ApiError = require("../utils/apiError");

const brandAliases = new Map([
  ["bmw", "BMW"],
  ["kia", "Kia"],
  ["vw", "VW"],
]);

function collapseWhitespace(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeHyphenatedWords(value, mapper) {
  return value
    .split("-")
    .map((part) => mapper(part))
    .join("-");
}

function titleCase(value) {
  return collapseWhitespace(value)
    .split(" ")
    .map((word) =>
      normalizeHyphenatedWords(word, (part) => {
        if (!part) {
          return part;
        }

        if (/^[A-Z0-9]+$/.test(part)) {
          return part;
        }

        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }),
    )
    .join(" ");
}

function normalizeBrandName(value) {
  const normalizedValue = collapseWhitespace(value);

  if (!normalizedValue) {
    return "";
  }

  const lowerCasedValue = normalizedValue.toLowerCase();

  if (brandAliases.has(lowerCasedValue)) {
    return brandAliases.get(lowerCasedValue);
  }

  if (/^[A-Z0-9]{2,4}$/.test(normalizedValue)) {
    return normalizedValue.toUpperCase();
  }

  return titleCase(normalizedValue);
}

function normalizeModelName(value) {
  const normalizedValue = collapseWhitespace(value);

  if (!normalizedValue) {
    return "";
  }

  if (/^[A-Za-z0-9-]{1,5}$/.test(normalizedValue) || /\d/.test(normalizedValue)) {
    return normalizedValue.toUpperCase();
  }

  return titleCase(normalizedValue);
}

function normalizeEngineName(value) {
  return collapseWhitespace(value);
}

function normalizeFuelType(value) {
  const normalizedValue = collapseWhitespace(value);

  if (!normalizedValue) {
    return "UNKNOWN";
  }

  return normalizedValue.toUpperCase();
}

function normalizeBodyType(value) {
  const normalizedValue = collapseWhitespace(value);

  if (!normalizedValue) {
    return "UNKNOWN";
  }

  return titleCase(normalizedValue);
}

function normalizeCategory(value) {
  return titleCase(value);
}

async function ensureBrand(tx, name) {
  const normalizedName = normalizeBrandName(name);

  if (!normalizedName) {
    throw new ApiError(400, "Compatibility brand is required");
  }

  const existingBrand = await tx.brand.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
  });

  if (existingBrand) {
    return existingBrand;
  }

  return tx.brand.create({
    data: {
      name: normalizedName,
    },
  });
}

async function ensureModel(tx, { brandId, name }) {
  const normalizedName = normalizeModelName(name);

  if (!normalizedName) {
    throw new ApiError(400, "Compatibility model is required");
  }

  const existingModel = await tx.model.findFirst({
    where: {
      brandId,
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
  });

  if (existingModel) {
    return existingModel;
  }

  return tx.model.create({
    data: {
      brandId,
      name: normalizedName,
    },
  });
}

async function ensureEngine(tx, { name, fuelType }) {
  const normalizedName = normalizeEngineName(name);
  const normalizedFuelType = normalizeFuelType(fuelType);

  if (!normalizedName) {
    throw new ApiError(400, "Compatibility engine is required");
  }

  const existingEngine = await tx.engine.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
      fuelType: {
        equals: normalizedFuelType,
        mode: "insensitive",
      },
    },
  });

  if (existingEngine) {
    return existingEngine;
  }

  return tx.engine.create({
    data: {
      name: normalizedName,
      fuelType: normalizedFuelType,
    },
  });
}

async function ensureCar(tx, compatibility) {
  const bodyType = normalizeBodyType(compatibility.bodyType);
  const yearFrom = Number(compatibility.yearFrom);
  const yearTo = Number(compatibility.yearTo);

  if (!Number.isInteger(yearFrom) || !Number.isInteger(yearTo) || yearFrom > yearTo) {
    throw new ApiError(400, "Compatibility years are invalid");
  }

  const brand = await ensureBrand(tx, compatibility.brand);
  const model = await ensureModel(tx, {
    brandId: brand.id,
    name: compatibility.model,
  });
  const engine = await ensureEngine(tx, {
    name: compatibility.engine,
    fuelType: compatibility.fuelType,
  });

  const existingCar = await tx.car.findFirst({
    where: {
      brandId: brand.id,
      modelId: model.id,
      bodyType,
      yearFrom,
      yearTo,
      engineId: engine.id,
    },
  });

  if (existingCar) {
    return existingCar;
  }

  return tx.car.create({
    data: {
      brandId: brand.id,
      modelId: model.id,
      bodyType,
      yearFrom,
      yearTo,
      engineId: engine.id,
    },
  });
}

function normalizeCompatibility(compatibility = []) {
  return compatibility.map((entry) => ({
    brand: normalizeBrandName(entry.brand),
    model: normalizeModelName(entry.model),
    bodyType: normalizeBodyType(entry.bodyType),
    yearFrom: Number(entry.yearFrom),
    yearTo: Number(entry.yearTo),
    engine: normalizeEngineName(entry.engine),
    fuelType: normalizeFuelType(entry.fuelType),
  }));
}

module.exports = {
  ensureBrand,
  ensureCar,
  ensureEngine,
  ensureModel,
  normalizeBrandName,
  normalizeBodyType,
  normalizeCategory,
  normalizeCompatibility,
  normalizeEngineName,
  normalizeFuelType,
  normalizeModelName,
};
