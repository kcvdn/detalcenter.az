const { z } = require("zod");

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue ? normalizedValue : undefined;
};

const normalizeNullableString = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return String(value).trim() || null;
};

const optionalInteger = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : value;
}, z.number().int().positive().optional());

const optionalNullablePrice = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : value;
}, z.number().nonnegative().nullable().optional());

const imageCollectionSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(normalizedValue);
      return Array.isArray(parsed) ? parsed : [normalizedValue];
    } catch {
      return [normalizedValue];
    }
  }

  return value;
}, z.array(z.string().trim().min(1)).min(1));

const compatibilitySchema = z
  .object({
    brand: z.string().trim().min(1, "brand is required"),
    model: z.string().trim().min(1, "model is required"),
    bodyType: z.preprocess(normalizeOptionalString, z.string().trim().min(1).default("UNKNOWN")).optional(),
    yearFrom: z.coerce.number().int().min(1900),
    yearTo: z.coerce.number().int().min(1900),
    engine: z.string().trim().min(1, "engine is required"),
    fuelType: z
      .preprocess(normalizeOptionalString, z.string().trim().min(1).default("UNKNOWN"))
      .optional(),
  })
  .transform((value) => ({
    ...value,
    bodyType: value.bodyType || "UNKNOWN",
    fuelType: value.fuelType || "UNKNOWN",
  }))
  .refine((value) => value.yearFrom <= value.yearTo, {
    message: "yearFrom must be less than or equal to yearTo",
    path: ["yearTo"],
  });

const createProductSchema = z
  .object({
    name: z.string().trim().min(1, "name is required"),
    category: z.string().trim().min(1, "category is required"),
    price: z.coerce.number().nonnegative(),
    discountPrice: optionalNullablePrice,
    imageUrl: z.preprocess(normalizeOptionalString, z.string().trim().min(1).optional()),
    imageUrls: imageCollectionSchema.optional(),
    oemCode: z.preprocess(normalizeNullableString, z.string().trim().min(1).nullable()).optional(),
    description: z.preprocess(normalizeNullableString, z.string().trim().nullable()).optional(),
    sellerId: optionalInteger,
    compatibility: z.array(compatibilitySchema).min(1, "At least one compatibility entry is required"),
  })
  .refine((value) => {
    return (
      (Array.isArray(value.imageUrls) && value.imageUrls.length > 0) ||
      (typeof value.imageUrl === "string" && value.imageUrl.trim().length > 0)
    );
  }, {
    message: "At least one product image is required",
    path: ["imageUrls"],
  })
  .refine((value) => {
    return value.discountPrice === undefined || value.discountPrice === null || value.discountPrice < value.price;
  }, {
    message: "discountPrice must be lower than price",
    path: ["discountPrice"],
  });

const updateProductSchema = z
  .object({
    name: z.preprocess(normalizeOptionalString, z.string().trim().min(1).optional()),
    category: z.preprocess(normalizeOptionalString, z.string().trim().min(1).optional()),
    price: z.coerce.number().nonnegative().optional(),
    discountPrice: optionalNullablePrice,
    imageUrl: z.preprocess(normalizeOptionalString, z.string().trim().min(1).optional()),
    imageUrls: imageCollectionSchema.optional(),
    oemCode: z.preprocess(normalizeNullableString, z.string().trim().min(1).nullable()).optional(),
    description: z.preprocess(normalizeNullableString, z.string().trim().nullable()).optional(),
    sellerId: optionalInteger,
    compatibility: z.array(compatibilitySchema).min(1).optional(),
  })
  .refine((value) => {
    return (
      value.discountPrice === undefined ||
      value.discountPrice === null ||
      value.price === undefined ||
      value.discountPrice < value.price
    );
  }, {
    message: "discountPrice must be lower than price",
    path: ["discountPrice"],
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one product field must be provided",
  });

const productQuerySchema = z.object({
  search: z.preprocess(normalizeOptionalString, z.string().trim().optional()),
  category: z.preprocess(normalizeOptionalString, z.string().trim().optional()),
  brand: z.preprocess(normalizeOptionalString, z.string().trim().optional()),
  model: z.preprocess(normalizeOptionalString, z.string().trim().optional()),
  engine: z.preprocess(normalizeOptionalString, z.string().trim().optional()),
  fuelType: z.preprocess(normalizeOptionalString, z.string().trim().optional()),
  year: z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : value;
  }, z.number().int().min(1900).optional()),
  seller_id: optionalInteger,
});

const vinParamSchema = z.object({
  vin: z.string().trim().min(17).max(17),
});

module.exports = {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
  vinParamSchema,
};
