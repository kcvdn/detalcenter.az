const express = require("express");
const { searchProductsByVin } = require("../controllers/searchController");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const { vinParamSchema } = require("../validators/productSchemas");

const router = express.Router();

router.get("/vin/:vin", validate(vinParamSchema, "params"), asyncHandler(searchProductsByVin));

module.exports = router;
