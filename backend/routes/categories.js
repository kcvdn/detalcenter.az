const express = require("express");
const { auth, role } = require("../middleware/auth");
const prisma = require("../src/lib/prisma");
const { normalizeCategory } = require("../src/services/catalogService");
const { normalizeAssetUrl } = require("../utils/assetUrls");

const router = express.Router();

function parseOptionalParentId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : NaN;
}

router.get("/", async (_req, res) => {
  try {
    const [storedCategories, productCategories] = await Promise.all([
      prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      }),
      prisma.product.findMany({
        distinct: ["category"],
        select: {
          category: true,
        },
        orderBy: {
          category: "asc",
        },
      }),
    ]);

    const seenNames = new Set();
    const categories = [];

    storedCategories.forEach((category) => {
      const normalizedName = String(category.name || "").trim();

      if (!normalizedName) {
        return;
      }

      seenNames.add(normalizedName.toLowerCase());
      categories.push({
        id: category.id,
        name: normalizedName,
        imageUrl: normalizeAssetUrl(category.imageUrl || "", _req) || "",
        parentId: category.parentId || null,
        source: "category",
      });
    });

    productCategories.forEach((item, index) => {
      const normalizedName = String(item.category || "").trim();

      if (!normalizedName || seenNames.has(normalizedName.toLowerCase())) {
        return;
      }

      categories.push({
        id: `product-${index + 1}`,
        name: normalizedName,
        imageUrl: "",
        parentId: null,
        source: "product",
      });
    });

    res.json(categories);
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    res.status(500).json({ error: "Could not fetch categories" });
  }
});

router.post("/", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const name = normalizeCategory(req.body?.name);
    const parentId = parseOptionalParentId(req.body?.parentId);
    const imageUrl = String(req.body?.imageUrl || "").trim() || null;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    if (Number.isNaN(parentId)) {
      return res.status(400).json({ error: "parentId is invalid" });
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        parentId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      return res.status(409).json({ error: "Category already exists under this parent" });
    }

    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: {
          id: parentId,
        },
        select: {
          id: true,
        },
      });

      if (!parentCategory) {
        return res.status(404).json({ error: "Parent category not found" });
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        parentId,
        imageUrl,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    res.status(500).json({ error: "Could not create category" });
  }
});

router.put("/:id", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const name = normalizeCategory(req.body?.name);
    const parentId = parseOptionalParentId(req.body?.parentId);
    const imageUrl =
      req.body?.imageUrl === undefined ? undefined : String(req.body?.imageUrl || "").trim() || null;

    if (!categoryId || !name) {
      return res.status(400).json({ error: "Valid category id and name are required" });
    }

    if (Number.isNaN(parentId)) {
      return res.status(400).json({ error: "parentId is invalid" });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (parentId === categoryId) {
      return res.status(400).json({ error: "Category cannot be its own parent" });
    }

    const duplicateCategory = await prisma.category.findFirst({
      where: {
        id: {
          not: categoryId,
        },
        parentId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (duplicateCategory) {
      return res.status(409).json({ error: "Another category with this name already exists under this parent" });
    }

    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
        select: { id: true, parentId: true },
      });

      if (!parentCategory) {
        return res.status(404).json({ error: "Parent category not found" });
      }

      if (parentCategory.parentId === categoryId) {
        return res.status(400).json({ error: "Nested circular category move is not allowed" });
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        parentId,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      },
    });

    res.json(category);
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
    res.status(500).json({ error: "Could not update category" });
  }
});

router.delete("/:id", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (!categoryId) {
      return res.status(400).json({ error: "Valid category id is required" });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const linkedProductsCount = await prisma.product.count({
      where: {
        category: {
          equals: category.name,
          mode: "insensitive",
        },
      },
    });

    if (linkedProductsCount > 0) {
      return res.status(409).json({
        error: "Bu kateqoriya mehsullarda istifade olunur. Evvelce mehsullari yenile.",
      });
    }

    const childCount = await prisma.category.count({
      where: {
        parentId: categoryId,
      },
    });

    if (childCount > 0) {
      return res.status(409).json({
        error: "Bu kateqoriyanin alt kateqoriyalari var. Evvelce onlari sil ve ya dasi.",
      });
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    res.status(500).json({ error: "Could not delete category" });
  }
});

module.exports = router;
