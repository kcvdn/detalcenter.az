const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { normalizeAssetUrl } = require("../utils/assetUrls");
const {
  analyzeSearchQuery,
  buildSearchMeta,
  compareEngineValues,
  rankProductsForSearch,
} = require("../services/smartSearchService");
const {
  canonicalizeBrand,
  inferProductVehicleData,
  isValidVin,
  normalizeComparable,
  normalizeVin,
  parseVinCodes,
  stringifyVinCodes,
} = require("../services/vinService");

const router = express.Router();
const prisma = new PrismaClient();

function parseOptionalYear(value, fallback = null) {
  if (value === undefined) {
    return fallback;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsedYear = Number(value);

  if (!Number.isFinite(parsedYear)) {
    return fallback;
  }

  return Math.trunc(parsedYear);
}

function parseOptionalPrice(value, fallback = null) {
  if (value === undefined) {
    return fallback;
  }

  if (value === null || value === "") {
    return fallback;
  }

  const parsedPrice = Number.parseFloat(value);

  if (!Number.isFinite(parsedPrice)) {
    return fallback;
  }

  return parsedPrice;
}

function normalizeVehicleField(value, fallback = "") {
  if (value === undefined) {
    return fallback;
  }

  return String(value || "").trim();
}

function serializeSeller(seller, req) {
  if (!seller) {
    return seller;
  }

  return {
    ...seller,
    logo: normalizeAssetUrl(seller.logo, req),
  };
}

function serializeProduct(product, req) {
  if (!product) {
    return product;
  }

  const inferredVehicle = inferProductVehicleData(product);

  return {
    ...product,
    image: normalizeAssetUrl(product.image, req),
    brand: inferredVehicle.brand,
    model: inferredVehicle.model,
    year: inferredVehicle.year,
    engine: inferredVehicle.engine,
    vinCodes: parseVinCodes(product.vinCodes),
    seller: serializeSeller(product.seller, req),
  };
}

function buildProductData(body, req, existingProduct = null) {
  const fallback = existingProduct || {};
  const draft = {
    name:
      body.name !== undefined ? String(body.name || "").trim() : fallback.name,
    price: parseOptionalPrice(body.price, fallback.price ?? null),
    image:
      body.image !== undefined
        ? normalizeAssetUrl(body.image, req)
        : fallback.image,
    description:
      body.description !== undefined
        ? String(body.description || "").trim() || null
        : fallback.description,
    brand: canonicalizeBrand(normalizeVehicleField(body.brand, fallback.brand || "")),
    model: normalizeVehicleField(body.model, fallback.model || ""),
    year: parseOptionalYear(body.year, fallback.year ?? null),
    engine: normalizeVehicleField(body.engine, fallback.engine || ""),
  };
  const inferredVehicle = inferProductVehicleData(draft);

  return {
    ...draft,
    brand: inferredVehicle.brand,
    model: inferredVehicle.model,
    year: inferredVehicle.year,
    engine: inferredVehicle.engine,
    vinCodes:
      body.vinCodes !== undefined
        ? stringifyVinCodes(body.vinCodes)
        : fallback.vinCodes ?? stringifyVinCodes([]),
  };
}

function matchesVehicleFilters(product, filters) {
  const inferredVehicle = inferProductVehicleData(product);
  const brandFilter = canonicalizeBrand(String(filters.brand || "").trim());
  const modelFilter = normalizeComparable(filters.model);
  const engineFilter = normalizeComparable(filters.engine);
  const yearFilter = parseOptionalYear(filters.year, null);

  if (brandFilter && normalizeComparable(inferredVehicle.brand) !== normalizeComparable(brandFilter)) {
    return false;
  }

  if (modelFilter && normalizeComparable(inferredVehicle.model) !== modelFilter) {
    return false;
  }

  if (yearFilter && Number(inferredVehicle.year) !== Number(yearFilter)) {
    return false;
  }

  if (engineFilter && !compareEngineValues(inferredVehicle.engine, filters.engine)) {
    return false;
  }

  return true;
}

function getUniqueSellersFromProducts(products) {
  const sellerMap = new Map();

  products.forEach((product) => {
    if (product?.seller?.id && !sellerMap.has(product.seller.id)) {
      sellerMap.set(product.seller.id, product.seller);
    }
  });

  return Array.from(sellerMap.values());
}

function addUniqueVinClause(clauses, clause, seenClauses) {
  const normalizedClause = Object.fromEntries(
    Object.entries(clause).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

  if (Object.keys(normalizedClause).length === 0) {
    return;
  }

  const clauseKey = JSON.stringify(normalizedClause);

  if (seenClauses.has(clauseKey)) {
    return;
  }

  seenClauses.add(clauseKey);
  clauses.push(normalizedClause);
}

function buildVinSearchWhere(searchAnalysis) {
  const vinVehicle = searchAnalysis?.vehicle || {};
  const brand = canonicalizeBrand(String(vinVehicle.brand || searchAnalysis?.brand || "").trim());
  const model = String(vinVehicle.model || searchAnalysis?.model || "").trim();
  const year = parseOptionalYear(vinVehicle.year || searchAnalysis?.year, null);

  if (!brand) {
    return null;
  }

  const clauses = [];
  const seenClauses = new Set();

  if (brand && model && year) {
    addUniqueVinClause(
      clauses,
      {
        brand,
        model,
        year,
      },
      seenClauses,
    );
  }

  if (brand && model) {
    addUniqueVinClause(
      clauses,
      {
        brand,
        model,
      },
      seenClauses,
    );
  }

  addUniqueVinClause(
    clauses,
    {
      brand,
    },
    seenClauses,
  );

  return clauses.length > 0
    ? {
        OR: clauses,
      }
    : null;
}

router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      min,
      max,
      seller_id,
      brand = "",
      model = "",
      year = "",
      engine = "",
    } = req.query;
    const normalizedSearch = String(search || "").trim();
    const hasSearch = Boolean(normalizedSearch);
    const parsedSellerId = seller_id ? parseInt(seller_id, 10) : null;
    const vehicleFilters = {
      brand: String(brand || "").trim(),
      model: String(model || "").trim(),
      year: String(year || "").trim(),
      engine: String(engine || "").trim(),
    };
    const hasVehicleFilters = Object.values(vehicleFilters).some(Boolean);

    const where = {};
    const and = [];

    if (min || max) {
      and.push({
        price: {
          ...(min ? { gte: Number(min) } : {}),
          ...(max ? { lte: Number(max) } : {}),
        },
      });
    }

    if (parsedSellerId) {
      and.push({
        seller_id: parsedSellerId,
      });
    }

    const filterProductsByVehicle = (items) =>
      hasVehicleFilters
        ? items.filter((product) => matchesVehicleFilters(product, vehicleFilters))
        : items;

    if (!hasSearch) {
      if (and.length > 0) {
        where.AND = and;
      }

      const products = filterProductsByVehicle(
        await prisma.product.findMany({
          where,
          include: { seller: true },
          orderBy: {
            createdAt: "desc",
          },
        }),
      );

      return res.json(products.map((product) => serializeProduct(product, req)));
    }

    const searchAnalysis = await analyzeSearchQuery(normalizedSearch);

    if (searchAnalysis.inputType === "vin") {
      const vinWhere = buildVinSearchWhere(searchAnalysis);

      if (vinWhere) {
        and.push(vinWhere);
      }
    }

    if (and.length > 0) {
      where.AND = and;
    }

    const productsQuery = prisma.product.findMany({
      where,
      include: { seller: true },
      orderBy: {
        createdAt: "desc",
      },
    });
    const sellerWhere = {
      name: {
        contains: normalizedSearch,
      },
      ...(parsedSellerId ? { id: parsedSellerId } : {}),
    };

    const [products, sellers] = await Promise.all([
      productsQuery,
      prisma.seller.findMany({
        where: sellerWhere,
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      }),
    ]);
    const filteredProducts = filterProductsByVehicle(products);
    const rankedProducts = rankProductsForSearch(filteredProducts, searchAnalysis).map(
      (entry) => entry.product,
    );
    const productSellerIds = new Set(rankedProducts.map((product) => product.seller_id));
    const filteredSellers =
      searchAnalysis.inputType === "vin"
        ? getUniqueSellersFromProducts(rankedProducts)
        : (hasVehicleFilters ? sellers.filter((seller) => productSellerIds.has(seller.id)) : sellers);

    res.json({
      products: rankedProducts.map((product) => serializeProduct(product, req)),
      sellers: filteredSellers.map((seller) => serializeSeller(seller, req)),
      searchMeta: buildSearchMeta(searchAnalysis, rankedProducts.length),
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    res.status(500).json({ error: "Could not fetch products" });
  }
});

router.get("/vin/:vin", async (req, res) => {
  try {
    const vin = normalizeVin(req.params.vin);

    if (!isValidVin(vin)) {
      return res.status(400).json({ error: "VIN must be exactly 17 valid characters" });
    }

    const searchAnalysis = await analyzeSearchQuery(vin);
    const vinWhere = buildVinSearchWhere(searchAnalysis);
    const products = await prisma.product.findMany({
      where: vinWhere || undefined,
      include: { seller: true },
      orderBy: {
        createdAt: "desc",
      },
    });

    const matchedProducts = rankProductsForSearch(products, searchAnalysis)
      .map((entry) => entry.product)
      .map((product) => serializeProduct(product, req));

    res.json({
      vehicle: searchAnalysis.vehicle,
      products: matchedProducts,
      searchMeta: buildSearchMeta(searchAnalysis, matchedProducts.length),
    });
  } catch (error) {
    console.error("VIN PRODUCT SEARCH ERROR:", error);
    res.status(500).json({ error: "Could not search products by VIN" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { seller: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(serializeProduct(product, req));
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);
    res.status(500).json({ error: "Could not fetch product" });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const price = parseOptionalPrice(req.body.price, null);
    const sellerId = Number.parseInt(req.body.seller_id, 10);
    const productData = buildProductData(
      {
        ...req.body,
        name,
        price,
        image: req.body.image ?? null,
      },
      req,
    );

    if (!name || price === null || !Number.isInteger(sellerId)) {
      return res.status(400).json({ error: "name, price and seller_id are required" });
    }

    if (price < 0) {
      return res.status(400).json({ error: "price must be a valid non-negative number" });
    }

    const seller = await prisma.seller.findUnique({
      where: {
        id: sellerId,
      },
      select: {
        id: true,
      },
    });

    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        name,
        price: Number.parseFloat(String(price)),
        seller_id: Number.parseInt(String(sellerId), 10),
        image: productData.image,
      },
      include: { seller: true },
    });

    res.status(201).json(serializeProduct(product, req));
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ error: "Could not create product" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: buildProductData(req.body, req, existingProduct),
      include: { seller: true },
    });

    res.json(serializeProduct(updatedProduct, req));
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ error: "Could not update product" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.product.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    res.status(500).json({ error: "Could not delete product" });
  }
});

module.exports = router;
