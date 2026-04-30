const { decodeVin } = require("../utils/vinDecoder");

async function decodeVinHandler(req, res) {
  const vehicle = decodeVin(req.params.vin);

  return res.json({
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    engine: vehicle.engine,
  });
}

module.exports = {
  decodeVinHandler,
};
