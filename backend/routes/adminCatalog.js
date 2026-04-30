const express = require("express");
const { auth, role } = require("../middleware/auth");
const prisma = require("../src/lib/prisma");
const {
  normalizeBrandName,
  normalizeModelName,
} = require("../src/services/catalogService");

const router = express.Router();

router.use(auth, role(["ADMIN"]));

router.get("/", async (_req, res) => {
  try {
    const [brands, stats] = await Promise.all([
      prisma.brand.findMany({
        orderBy: {
          name: "asc",
        },
        include: {
          models: {
            orderBy: {
              name: "asc",
            },
            include: {
              _count: {
                select: {
                  cars: true,
                },
              },
            },
          },
          _count: {
            select: {
              models: true,
              cars: true,
            },
          },
        },
      }),
      Promise.all([
        prisma.brand.count(),
        prisma.model.count(),
        prisma.car.count(),
      ]),
    ]);

    res.json({
      stats: {
        brands: stats[0],
        models: stats[1],
        cars: stats[2],
      },
      brands,
    });
  } catch (error) {
    console.error("ADMIN CATALOG LIST ERROR:", error);
    res.status(500).json({ error: "Could not fetch vehicle catalog" });
  }
});

router.post("/brands", async (req, res) => {
  try {
    const name = normalizeBrandName(req.body?.name);

    if (!name) {
      return res.status(400).json({ error: "Brand name is required" });
    }

    const existingBrand = await prisma.brand.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingBrand) {
      return res.status(409).json({ error: "Brand already exists" });
    }

    const brand = await prisma.brand.create({
      data: { name },
    });

    res.status(201).json(brand);
  } catch (error) {
    console.error("ADMIN CATALOG CREATE BRAND ERROR:", error);
    res.status(500).json({ error: "Could not create brand" });
  }
});

router.put("/brands/:id", async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const name = normalizeBrandName(req.body?.name);

    if (!brandId || !name) {
      return res.status(400).json({ error: "Valid brand id and name are required" });
    }

    const existingBrand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!existingBrand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const duplicateBrand = await prisma.brand.findFirst({
      where: {
        id: {
          not: brandId,
        },
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (duplicateBrand) {
      return res.status(409).json({ error: "Another brand with this name already exists" });
    }

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: { name },
    });

    res.json(brand);
  } catch (error) {
    console.error("ADMIN CATALOG UPDATE BRAND ERROR:", error);
    res.status(500).json({ error: "Could not update brand" });
  }
});

router.delete("/brands/:id", async (req, res) => {
  try {
    const brandId = Number(req.params.id);

    if (!brandId) {
      return res.status(400).json({ error: "Valid brand id is required" });
    }

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        _count: {
          select: {
            models: true,
            cars: true,
          },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    if (brand._count.models > 0 || brand._count.cars > 0) {
      return res.status(409).json({
        error: "Delete brand models and linked cars first",
      });
    }

    await prisma.brand.delete({
      where: { id: brandId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("ADMIN CATALOG DELETE BRAND ERROR:", error);
    res.status(500).json({ error: "Could not delete brand" });
  }
});

router.post("/models", async (req, res) => {
  try {
    const brandId = Number(req.body?.brandId);
    const name = normalizeModelName(req.body?.name);

    if (!brandId || !name) {
      return res.status(400).json({ error: "Brand and model name are required" });
    }

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const existingModel = await prisma.model.findFirst({
      where: {
        brandId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingModel) {
      return res.status(409).json({ error: "Model already exists for this brand" });
    }

    const model = await prisma.model.create({
      data: {
        brandId,
        name,
      },
    });

    res.status(201).json(model);
  } catch (error) {
    console.error("ADMIN CATALOG CREATE MODEL ERROR:", error);
    res.status(500).json({ error: "Could not create model" });
  }
});

router.put("/models/:id", async (req, res) => {
  try {
    const modelId = Number(req.params.id);
    const name = normalizeModelName(req.body?.name);

    if (!modelId || !name) {
      return res.status(400).json({ error: "Valid model id and name are required" });
    }

    const existingModel = await prisma.model.findUnique({
      where: { id: modelId },
    });

    if (!existingModel) {
      return res.status(404).json({ error: "Model not found" });
    }

    const duplicateModel = await prisma.model.findFirst({
      where: {
        id: {
          not: modelId,
        },
        brandId: existingModel.brandId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (duplicateModel) {
      return res.status(409).json({ error: "Another model with this name already exists" });
    }

    const model = await prisma.model.update({
      where: { id: modelId },
      data: { name },
    });

    res.json(model);
  } catch (error) {
    console.error("ADMIN CATALOG UPDATE MODEL ERROR:", error);
    res.status(500).json({ error: "Could not update model" });
  }
});

router.delete("/models/:id", async (req, res) => {
  try {
    const modelId = Number(req.params.id);

    if (!modelId) {
      return res.status(400).json({ error: "Valid model id is required" });
    }

    const model = await prisma.model.findUnique({
      where: { id: modelId },
      include: {
        _count: {
          select: {
            cars: true,
          },
        },
      },
    });

    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }

    if (model._count.cars > 0) {
      return res.status(409).json({ error: "Delete linked vehicle rows first" });
    }

    await prisma.model.delete({
      where: { id: modelId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("ADMIN CATALOG DELETE MODEL ERROR:", error);
    res.status(500).json({ error: "Could not delete model" });
  }
});

module.exports = router;
