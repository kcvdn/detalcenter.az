const express = require("express");
const { auth, role } = require("../../middleware/auth");
const {
  createProductHandler,
  deleteProductHandler,
  getManagedProducts,
  getProductById,
  getProducts,
  getVehicleOptions,
  updateProductHandler,
} = require("../controllers/productController");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const { createProductSchema, productQuerySchema, updateProductSchema } = require("../validators/productSchemas");

const router = express.Router();

function normalizeCompatibilityInput(value) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeJsonInput(value) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeIncomingProductBody(req, _res, next) {
  const body = req.body || {};

  req.body = {
    ...body,
    imageUrl: body.imageUrl ?? body.image,
    imageUrls: normalizeJsonInput(body.imageUrls ?? body.images),
    sellerId: body.sellerId ?? body.seller_id,
    compatibility: normalizeCompatibilityInput(body.compatibility),
  };

  next();
}

router.get("/", validate(productQuerySchema, "query"), asyncHandler(getProducts));
router.get(
  "/manage",
  auth,
  role(["ADMIN", "SELLER_ADMIN"]),
  validate(productQuerySchema, "query"),
  asyncHandler(getManagedProducts),
);
router.get("/vehicle-options", asyncHandler(getVehicleOptions));
router.get("/:id", asyncHandler(getProductById));
router.post(
  "/",
  auth,
  role(["ADMIN", "SELLER_ADMIN"]),
  normalizeIncomingProductBody,
  validate(createProductSchema),
  asyncHandler(createProductHandler),
);
router.put(
  "/:id",
  auth,
  role(["ADMIN", "SELLER_ADMIN"]),
  normalizeIncomingProductBody,
  validate(updateProductSchema),
  asyncHandler(updateProductHandler),
);
router.delete("/:id", auth, role(["ADMIN", "SELLER_ADMIN"]), asyncHandler(deleteProductHandler));

module.exports = router;
