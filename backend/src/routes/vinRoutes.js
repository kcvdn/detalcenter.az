const express = require("express");
const { decodeVinHandler } = require("../controllers/vinController");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const { vinParamSchema } = require("../validators/productSchemas");

const router = express.Router();

router.get("/:vin", validate(vinParamSchema, "params"), asyncHandler(decodeVinHandler));

module.exports = router;
