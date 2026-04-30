const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");
const { getActorSellerId, isAdmin, isSellerAdmin } = require("../utils/authScope");
const {
  ensureCar,
  normalizeBrandName,
  normalizeCategory,
  normalizeCompatibility,
  normalizeEngineName,
  normalizeFuelType,
  normalizeModelName,
} = require("./catalogService");

const productInclude = {
  seller: true,
  productCars: {
    include: {
      car: {
        include: {
          brand: true,
          model: true,
          engine: true,
        },
      },
    },
  },
};

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue || null;
}

function parseImageCollection(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalizedValue);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    }
  } catch {}

  return [normalizedValue];
}

function serializeImageCollection(value) {
  const images = parseImageCollection(value);

  if (images.length <= 1) {
    return images[0] || "";
  }

  return JSON.stringify(images);
}

function parseProductId(productId) {
  const normalizedProductId = Number(productId);

  if (!Number.isInteger(normalizedProductId) || normalizedProductId <= 0) {
    throw new ApiError(400, "Invalid product id");
  }

  return normalizedProductId;
}

function buildProductSearchWhere(filters = {}) {
  const where = {};
  const andConditions = [];
  const normalizedSearch = normalizeOptionalString(filters.search);
  const normalizedCategory = normalizeOptionalString(filters.category);
  const normalizedBrand = normalizeOptionalString(filters.brand);
  const normalizedModel = normalizeOptionalString(filters.model);
  const normalizedEngine = normalizeOptionalString(filters.engine);
  const normalizedFuelType = normalizeOptionalString(filters.fuelType);
  const normalizedSellerId = filters.seller_id ? Number(filters.seller_id) : null;
  const normalizedYear = filters.year ? Number(filters.year) : null;

  if (normalizedSearch) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: normalizedSearch,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: normalizedSearch,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: normalizedSearch,
            mode: "insensitive",
          },
        },
        {
          oemCode: {
            contains: normalizedSearch,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (normalizedCategory) {
    andConditions.push({
      category: {
        equals: normalizeCategory(normalizedCategory),
        mode: "insensitive",
      },
    });
  }

  if (normalizedSellerId) {
    andConditions.push({
      seller_id: normalizedSellerId,
    });
  }

  const carConditions = {};

  if (normalizedBrand) {
    carConditions.brand = {
      name: {
        equals: normalizeBrandName(normalizedBrand),
        mode: "insensitive",
      },
    };
  }

  if (normalizedModel) {
    carConditions.model = {
      name: {
        equals: normalizeModelName(normalizedModel),
        mode: "insensitive",
      },
    };
  }

  if (normalizedEngine) {
    carConditions.engine = {
      ...(carConditions.engine || {}),
      name: {
        equals: normalizeEngineName(normalizedEngine),
        mode: "insensitive",
      },
    };
  }

  if (normalizedFuelType) {
    carConditions.engine = {
      ...(carConditions.engine || {}),
      fuelType: {
        equals: normalizeFuelType(normalizedFuelType),
        mode: "insensitive",
      },
    };
  }

  if (Number.isInteger(normalizedYear)) {
    carConditions.yearFrom = {
      lte: normalizedYear,
    };
    carConditions.yearTo = {
      gte: normalizedYear,
    };
  }

  if (Object.keys(carConditions).length > 0) {
    andConditions.push({
      productCars: {
        some: {
          car: carConditions,
        },
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

function normalizeProductPayload(payload) {
  const imageUrls = parseImageCollection(payload.imageUrls ?? payload.imageUrl);

  return {
    name: String(payload.name || "").trim(),
    category: normalizeCategory(payload.category),
    price: Number(payload.price),
    imageUrl: serializeImageCollection(imageUrls),
    oemCode: normalizeOptionalString(payload.oemCode),
    description: normalizeOptionalString(payload.description),
    sellerId: payload.sellerId ? Number(payload.sellerId) : null,
    compatibility: normalizeCompatibility(payload.compatibility || []),
  };
}

function getScopedSellerId(actor) {
  if (!isSellerAdmin(actor)) {
    return null;
  }

  const sellerId = getActorSellerId(actor);

  if (!sellerId) {
    throw new ApiError(403, "Seller admin account is not linked to a seller");
  }

  return sellerId;
}

function ensureProductAccess(product, actor) {
  if (!actor || isAdmin(actor)) {
    return;
  }

  const sellerId = getScopedSellerId(actor);

  if (Number(product?.seller_id) !== sellerId) {
    throw new ApiError(403, "Access denied");
  }
}

async function assertSellerExists(tx, sellerId) {
  if (!sellerId) {
    return null;
  }

  const seller = await tx.seller.findUnique({
    where: {
      id: sellerId,
    },
  });

  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  return seller;
}

async function findProductById(productId) {
  const normalizedProductId = parseProductId(productId);
  const product = await prisma.product.findUnique({
    where: {
      id: normalizedProductId,
    },
    include: productInclude,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
}

async function listVehicleOptions() {
  const brands = await prisma.brand.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      models: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  return brands.map((brand) => ({
    brand: brand.name,
    models: brand.models.map((model) => model.name),
  }));
}

async function createProduct(payload, actor = null) {
  const normalizedPayload = normalizeProductPayload(payload);
  const scopedSellerId = getScopedSellerId(actor);

  if (scopedSellerId) {
    normalizedPayload.sellerId = scopedSellerId;
  }

  const productId = await prisma.$transaction(async (tx) => {
    await assertSellerExists(tx, normalizedPayload.sellerId);

    const product = await tx.product.create({
      data: {
        name: normalizedPayload.name,
        category: normalizedPayload.category,
        price: normalizedPayload.price,
        imageUrl: normalizedPayload.imageUrl,
        oemCode: normalizedPayload.oemCode,
        description: normalizedPayload.description,
        seller_id: normalizedPayload.sellerId,
      },
    });

    const carIds = [];

    for (const compatibilityEntry of normalizedPayload.compatibility) {
      const car = await ensureCar(tx, compatibilityEntry);
      carIds.push(car.id);
    }

    await tx.productCar.createMany({
      data: [...new Set(carIds)].map((carId) => ({
        productId: product.id,
        carId,
      })),
      skipDuplicates: true,
    });

    return product.id;
  });

  return findProductById(productId);
}

async function updateProduct(productId, payload, actor = null) {
  const normalizedProductId = parseProductId(productId);
  const existingProduct = await findProductById(normalizedProductId);
  ensureProductAccess(existingProduct, actor);

  const normalizedPayload = {
    ...(payload.name !== undefined ? { name: String(payload.name).trim() } : {}),
    ...(payload.category !== undefined ? { category: normalizeCategory(payload.category) } : {}),
    ...(payload.price !== undefined ? { price: Number(payload.price) } : {}),
    ...(payload.imageUrl !== undefined || payload.imageUrls !== undefined
      ? { imageUrl: serializeImageCollection(payload.imageUrls ?? payload.imageUrl) }
      : {}),
    ...(payload.oemCode !== undefined ? { oemCode: normalizeOptionalString(payload.oemCode) } : {}),
    ...(payload.description !== undefined
      ? { description: normalizeOptionalString(payload.description) }
      : {}),
    ...(payload.sellerId !== undefined ? { sellerId: payload.sellerId ? Number(payload.sellerId) : null } : {}),
    ...(payload.compatibility !== undefined
      ? { compatibility: normalizeCompatibility(payload.compatibility) }
      : {}),
  };
  const scopedSellerId = getScopedSellerId(actor);

  if (scopedSellerId) {
    normalizedPayload.sellerId = scopedSellerId;
  }

  await prisma.$transaction(async (tx) => {
    if (normalizedPayload.sellerId !== undefined && normalizedPayload.sellerId !== null) {
      await assertSellerExists(tx, normalizedPayload.sellerId);
    }

    if (normalizedPayload.sellerId === null && payload.sellerId !== undefined) {
      normalizedPayload.seller_id = null;
    }

    await tx.product.update({
      where: {
        id: normalizedProductId,
      },
      data: {
        ...(normalizedPayload.name !== undefined ? { name: normalizedPayload.name } : {}),
        ...(normalizedPayload.category !== undefined ? { category: normalizedPayload.category } : {}),
        ...(normalizedPayload.price !== undefined ? { price: normalizedPayload.price } : {}),
        ...(normalizedPayload.imageUrl !== undefined ? { imageUrl: normalizedPayload.imageUrl } : {}),
        ...(normalizedPayload.oemCode !== undefined ? { oemCode: normalizedPayload.oemCode } : {}),
        ...(normalizedPayload.description !== undefined
          ? { description: normalizedPayload.description }
          : {}),
        ...(payload.sellerId !== undefined
          ? { seller_id: normalizedPayload.sellerId || null }
          : {}),
      },
    });

    if (normalizedPayload.compatibility) {
      const carIds = [];

      for (const compatibilityEntry of normalizedPayload.compatibility) {
        const car = await ensureCar(tx, compatibilityEntry);
        carIds.push(car.id);
      }

      await tx.productCar.deleteMany({
        where: {
          productId: normalizedProductId,
        },
      });

      await tx.productCar.createMany({
        data: [...new Set(carIds)].map((carId) => ({
          productId: normalizedProductId,
          carId,
        })),
        skipDuplicates: true,
      });
    }
  });

  return findProductById(normalizedProductId);
}

async function deleteProduct(productId, actor = null) {
  const normalizedProductId = parseProductId(productId);
  const existingProduct = await findProductById(normalizedProductId);
  ensureProductAccess(existingProduct, actor);

  await prisma.product.delete({
    where: {
      id: normalizedProductId,
    },
  });
}

async function listProducts(filters = {}, actor = null) {
  const scopedFilters = {
    ...filters,
  };
  const scopedSellerId = getScopedSellerId(actor);

  if (scopedSellerId) {
    scopedFilters.seller_id = scopedSellerId;
  }

  const where = buildProductSearchWhere(scopedFilters);
  const [products, sellers] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
    scopedFilters.search
      ? prisma.seller.findMany({
          where: {
            name: {
              contains: String(scopedFilters.search).trim(),
              mode: "insensitive",
            },
            ...(scopedSellerId ? { id: scopedSellerId } : {}),
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  return {
    products,
    sellers,
    preferredVehicle: {
      brand: scopedFilters.brand || "",
      model: scopedFilters.model || "",
      year: scopedFilters.year || null,
      engine: scopedFilters.engine || "",
    },
  };
}

module.exports = {
  buildProductSearchWhere,
  createProduct,
  deleteProduct,
  findProductById,
  listVehicleOptions,
  listProducts,
  productInclude,
  updateProduct,
};
