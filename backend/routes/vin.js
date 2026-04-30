const express = require("express");
const {
  decodeVinWithApi,
  isValidVin,
  normalizeVin,
} = require("../services/vinService");

const router = express.Router();

router.get("/:vin", async (req, res) => {
  try {
    const vin = normalizeVin(req.params.vin);

    if (!isValidVin(vin)) {
      return res.status(400).json({ error: "VIN must be exactly 17 valid characters" });
    }

    const decodedVehicle = await decodeVinWithApi(vin);

    res.json({
      brand: decodedVehicle.brand || "",
      model: decodedVehicle.model || "",
      year: decodedVehicle.year || null,
      engine: decodedVehicle.engine || "",
    });
  } catch (error) {
    console.error("VIN ROUTE ERROR:", error);
    res.status(500).json({ error: "Could not decode VIN" });
  }
});

module.exports = router;
