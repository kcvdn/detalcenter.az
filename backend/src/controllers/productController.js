const {
  createProduct,
  deleteProduct,
  findProductById,
  listVehicleOptions,
  listProducts,
  updateProduct,
} = require("../services/productService");
const { serializeProduct, serializeProducts, serializeSeller } = require("../utils/productSerializer");

function buildSearchMeta(search, resultCount) {
  const trimmedSearch = String(search || "").trim();

  if (!trimmedSearch) {
    return null;
  }

  return {
    inputType: "text",
    label: trimmedSearch,
    resultCount,
    summary: `${resultCount} product${resultCount === 1 ? "" : "s"} matched "${trimmedSearch}"`,
    parsed: {
      brand: "",
      model: "",
      year: null,
      engine: "",
      part: trimmedSearch,
      vin: "",
      keywords: trimmedSearch.split(/\s+/).filter(Boolean),
    },
  };
}

async function getProducts(req, res) {
  const { products, sellers, preferredVehicle } = await listProducts(req.query);
  const serializedProducts = serializeProducts(products, req, preferredVehicle);
  const searchMeta = buildSearchMeta(req.query.search, serializedProducts.length);

  console.log("Products:", {
    count: serializedProducts.length,
    filters: req.query,
  });

  if (searchMeta) {
    return res.json({
      products: serializedProducts,
      sellers: sellers.map((seller) => serializeSeller(seller, req)),
      searchMeta,
    });
  }

  return res.json(serializedProducts);
}

async function getManagedProducts(req, res) {
  const { products, sellers, preferredVehicle } = await listProducts(req.query, req.user);
  const serializedProducts = serializeProducts(products, req, preferredVehicle);
  const searchMeta = buildSearchMeta(req.query.search, serializedProducts.length);

  if (searchMeta) {
    return res.json({
      products: serializedProducts,
      sellers: sellers.map((seller) => serializeSeller(seller, req)),
      searchMeta,
    });
  }

  return res.json(serializedProducts);
}

async function getProductById(req, res) {
  const product = await findProductById(req.params.id);
  return res.json(serializeProduct(product, req));
}

async function getVehicleOptions(_req, res) {
  const brands = await listVehicleOptions();
  return res.json({ brands });
}

async function createProductHandler(req, res) {
  const product = await createProduct(req.body, req.user);
  return res.status(201).json(serializeProduct(product, req));
}

async function updateProductHandler(req, res) {
  const product = await updateProduct(req.params.id, req.body, req.user);
  return res.json(serializeProduct(product, req));
}

async function deleteProductHandler(req, res) {
  await deleteProduct(req.params.id, req.user);
  return res.json({ success: true });
}

module.exports = {
  createProductHandler,
  deleteProductHandler,
  getManagedProducts,
  getProductById,
  getProducts,
  getVehicleOptions,
  updateProductHandler,
};
