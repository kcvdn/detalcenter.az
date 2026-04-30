const { findProductsByVin } = require("../services/searchService");
const { serializeProducts } = require("../utils/productSerializer");

async function searchProductsByVin(req, res) {
  const { vehicle, products } = await findProductsByVin(req.params.vin);

  return res.json({
    vehicle,
    products: serializeProducts(products, req, vehicle),
    searchMeta: {
      inputType: "vin",
      label: vehicle.vin,
      resultCount: products.length,
      summary: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`.trim(),
      parsed: {
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        engine: vehicle.engine,
        part: "",
        vin: vehicle.vin,
        keywords: [],
      },
    },
  });
}

module.exports = {
  searchProductsByVin,
};
