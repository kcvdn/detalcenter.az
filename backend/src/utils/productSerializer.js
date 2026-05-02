const { normalizeAssetUrl } = require("../../utils/assetUrls");

function parseImageCollection(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  const normalizedValue = String(value || "").trim();

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

function normalizeComparable(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function sortCompatibility(left, right) {
  return (
    String(left.brand || "").localeCompare(String(right.brand || "")) ||
    String(left.model || "").localeCompare(String(right.model || "")) ||
    String(left.bodyType || "").localeCompare(String(right.bodyType || "")) ||
    Number(left.yearFrom || 0) - Number(right.yearFrom || 0) ||
    Number(left.yearTo || 0) - Number(right.yearTo || 0) ||
    String(left.engine || "").localeCompare(String(right.engine || ""))
  );
}

function serializeSeller(seller, req) {
  if (!seller) {
    return null;
  }

  return {
    ...seller,
    logo: normalizeAssetUrl(seller.logo, req),
  };
}

function serializeCompatibilityLink(productCar) {
  const brand = productCar?.car?.brand;
  const model = productCar?.car?.model;
  const engine = productCar?.car?.engine;

  return {
    id: productCar.id,
    carId: productCar.carId,
    brand: brand?.name || "",
    model: model?.name || "",
    bodyType: productCar?.car?.bodyType || "",
    yearFrom: productCar?.car?.yearFrom || null,
    yearTo: productCar?.car?.yearTo || null,
    engine: engine?.name || "",
    fuelType: engine?.fuelType || "",
  };
}

function matchesPreferredVehicle(entry, preferredVehicle = {}) {
  if (!preferredVehicle || Object.keys(preferredVehicle).length === 0) {
    return true;
  }

  if (
    preferredVehicle.brand &&
    normalizeComparable(entry.brand) !== normalizeComparable(preferredVehicle.brand)
  ) {
    return false;
  }

  if (
    preferredVehicle.model &&
    normalizeComparable(entry.model) !== normalizeComparable(preferredVehicle.model)
  ) {
    return false;
  }

  if (
    preferredVehicle.engine &&
    normalizeComparable(entry.engine) !== normalizeComparable(preferredVehicle.engine)
  ) {
    return false;
  }

  if (preferredVehicle.year) {
    const year = Number(preferredVehicle.year);

    if (!Number.isFinite(year) || year < Number(entry.yearFrom) || year > Number(entry.yearTo)) {
      return false;
    }
  }

  return true;
}

function pickPrimaryCompatibility(compatibility, preferredVehicle) {
  if (compatibility.length === 0) {
    return null;
  }

  return compatibility.find((entry) => matchesPreferredVehicle(entry, preferredVehicle)) || compatibility[0];
}

function serializeProduct(product, req, preferredVehicle = null) {
  const compatibility = (product.productCars || [])
    .map((productCar) => serializeCompatibilityLink(productCar))
    .sort(sortCompatibility);
  const primaryCompatibility = pickPrimaryCompatibility(compatibility, preferredVehicle);
  const normalizedImages = parseImageCollection(product.imageUrl).map((image) => normalizeAssetUrl(image, req));
  const normalizedImageUrl = normalizedImages[0] || "";

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: Number(product.price),
    discountPrice: product.discountPrice === null || product.discountPrice === undefined ? null : Number(product.discountPrice),
    imageUrl: normalizedImageUrl,
    image: normalizedImageUrl,
    images: normalizedImages,
    oemCode: product.oemCode || null,
    description: product.description || null,
    seller_id: product.seller_id || null,
    seller: serializeSeller(product.seller, req),
    compatibility,
    compatibilityCount: compatibility.length,
    brand: primaryCompatibility?.brand || "",
    model: primaryCompatibility?.model || "",
    bodyType: primaryCompatibility?.bodyType || "",
    year: primaryCompatibility?.yearFrom || null,
    yearFrom: primaryCompatibility?.yearFrom || null,
    yearTo: primaryCompatibility?.yearTo || null,
    engine: primaryCompatibility?.engine || "",
    fuelType: primaryCompatibility?.fuelType || "",
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function serializeProducts(products, req, preferredVehicle = null) {
  return products.map((product) => serializeProduct(product, req, preferredVehicle));
}

module.exports = {
  serializeProduct,
  serializeProducts,
  serializeSeller,
};
