const express = require("express");
const fs = require("fs/promises");
const multer = require("multer");
const path = require("path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const { auth, role } = require("../middleware/auth");
const { normalizeAssetUrl } = require("../utils/assetUrls");
const { canonicalizeBrand, stringifyVinCodes } = require("../services/vinService");

const router = express.Router();
const prisma = new PrismaClient();

const uploadDirectory = path.join(__dirname, "..", "uploads");
const allowedExtensions = new Set([".xlsx", ".xls"]);
const requiredColumns = ["name", "price", "seller_id"];
const normalizeProductName = (name) => String(name || "").trim().toLowerCase();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (!allowedExtensions.has(extension)) {
      cb(new Error("Only .xlsx or .xls files are allowed"));
      return;
    }

    cb(null, true);
  },
});

const normalizeKey = (key) => String(key || "").trim().toLowerCase().replace(/\s+/g, "_");

const parseRows = (rows) =>
  rows
    .map((row) =>
      Object.entries(row || {}).reduce((normalizedRow, [key, value]) => {
        normalizedRow[normalizeKey(key)] = value;
        return normalizedRow;
      }, {}),
    )
    .filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));

const parseOptionalYear = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsedYear = Number(value);

  return Number.isFinite(parsedYear) ? Math.trunc(parsedYear) : null;
};

const getDuplicateKey = (name, sellerId) => `${Number(sellerId)}:${normalizeProductName(name)}`;

const handleImportUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

router.post(
  "/products",
  auth,
  role(["ADMIN"]),
  async (req, res) => {
    try {
      await handleImportUpload(req, res);

      if (!req.file) {
        return res.status(400).json({ error: "Excel file is required" });
      }

      const workbook = XLSX.readFile(req.file.path);
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return res.status(400).json({ error: "Excel file is empty" });
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const rows = parseRows(rawRows);

      if (rows.length === 0) {
        return res.status(400).json({ error: "Excel file has no product rows" });
      }

      const headerKeys = Object.keys(rows[0] || {});
      const missingColumns = requiredColumns.filter((column) => !headerKeys.includes(column));

      if (missingColumns.length > 0) {
        return res.status(400).json({
          error: `Missing required columns: ${missingColumns.join(", ")}`,
        });
      }

      const sellerIds = [...new Set(rows.map((row) => Number(row.seller_id)).filter(Boolean))];
      const sellers = await prisma.seller.findMany({
        where: {
          id: {
            in: sellerIds,
          },
        },
        select: {
          id: true,
        },
      });
      const sellerIdSet = new Set(sellers.map((seller) => seller.id));

      const invalidRow = rows.find((row) => {
        const name = String(row.name || "").trim();
        const price = Number(row.price);
        const sellerId = Number(row.seller_id);

        return !name || Number.isNaN(price) || !sellerIdSet.has(sellerId);
      });

      if (invalidRow) {
        return res.status(400).json({
          error:
            "Each row must include valid name, price and existing seller_id values",
        });
      }

      const existingProducts = await prisma.product.findMany({
        where: {
          seller_id: {
            in: sellerIds,
          },
        },
        select: {
          name: true,
          seller_id: true,
        },
      });

      const existingKeys = new Set(
        existingProducts.map((product) => getDuplicateKey(product.name, product.seller_id)),
      );
      const createOperations = [];
      let skipped = 0;

      rows.forEach((row) => {
        const name = String(row.name).trim();
        const sellerId = Number(row.seller_id);
        const duplicateKey = getDuplicateKey(name, sellerId);

        if (existingKeys.has(duplicateKey)) {
          skipped += 1;
          console.log("IMPORT PRODUCTS SKIPPED DUPLICATE:", {
            name,
            seller_id: sellerId,
          });
          return;
        }

        existingKeys.add(duplicateKey);
        createOperations.push(
          prisma.product.create({
            data: {
              name,
              price: Number(row.price),
              image: normalizeAssetUrl(row.image, req),
              description: String(row.description || "").trim() || null,
              brand: canonicalizeBrand(String(row.brand || "").trim()),
              model: String(row.model || "").trim(),
              year: parseOptionalYear(row.year),
              engine: String(row.engine || "").trim(),
              vinCodes: stringifyVinCodes(row.vin_codes || row.vincodes || row.vin),
              seller_id: sellerId,
            },
          }),
        );
      });

      if (createOperations.length > 0) {
        await prisma.$transaction(createOperations);
      }

      return res.status(201).json({
        added: createOperations.length,
        skipped,
      });
    } catch (error) {
      console.error("IMPORT PRODUCTS ERROR:", error);

      if (error.message === "Only .xlsx or .xls files are allowed") {
        return res.status(400).json({ error: error.message });
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ error: "Excel file field name must be file" });
      }

      return res.status(500).json({ error: "Could not import products" });
    } finally {
      try {
        await fs.unlink(req.file.path);
      } catch {
        // Ignore cleanup errors for temp uploads.
      }
    }
  },
);

module.exports = router;
