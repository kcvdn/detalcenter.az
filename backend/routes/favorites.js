const express = require("express");
const { auth } = require("../middleware/auth");
const prisma = require("../src/lib/prisma");
const { serializeLiteProduct } = require("../src/utils/legacyProductAdapter");

const router = express.Router();

const serializeFavorite = (favorite, req) => ({
  ...favorite,
  product: serializeLiteProduct(favorite.product, req),
});

router.post("/", auth, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        user_id: req.user.id,
        product_id: Number(product_id),
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (existingFavorite) {
      return res.json(serializeFavorite(existingFavorite, req));
    }

    const favorite = await prisma.favorite.create({
      data: {
        user_id: req.user.id,
        product_id: Number(product_id),
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    });

    res.status(201).json(serializeFavorite(favorite, req));
  } catch (error) {
    console.error("CREATE FAVORITE ERROR:", error);
    res.status(500).json({ error: "Could not add favorite" });
  }
});

router.get("/:userId", auth, async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);

    if (req.user.role !== "ADMIN" && req.user.id !== requestedUserId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        user_id: requestedUserId,
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(favorites.map((favorite) => serializeFavorite(favorite, req)));
  } catch (error) {
    console.error("GET FAVORITES ERROR:", error);
    res.status(500).json({ error: "Could not fetch favorites" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!favorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    if (req.user.role !== "ADMIN" && req.user.id !== favorite.user_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE FAVORITE ERROR:", error);
    res.status(500).json({ error: "Could not remove favorite" });
  }
});

module.exports = router;
