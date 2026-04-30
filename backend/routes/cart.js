const express = require("express");
const { auth } = require("../middleware/auth");
const prisma = require("../src/lib/prisma");
const { serializeLiteProduct } = require("../src/utils/legacyProductAdapter");

const router = express.Router();

const serializeCartItem = (item, req) => ({
  ...item,
  product: serializeLiteProduct(item.product, req),
});

router.post("/", auth, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const existingCartItem = await prisma.cartItem.findFirst({
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

    if (existingCartItem) {
      const updatedItem = await prisma.cartItem.update({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: {
            increment: 1,
          },
        },
        include: {
          product: {
            include: {
              seller: true,
            },
          },
        },
      });

      return res.json(serializeCartItem(updatedItem, req));
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        user_id: req.user.id,
        product_id: Number(product_id),
        quantity: 1,
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    });

    res.status(201).json(serializeCartItem(cartItem, req));
  } catch (error) {
    console.error("CREATE CART ITEM ERROR:", error);
    res.status(500).json({ error: "Could not add item to cart" });
  }
});

router.get("/:userId", auth, async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);

    if (req.user.role !== "ADMIN" && req.user.id !== requestedUserId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const cartItems = await prisma.cartItem.findMany({
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
        id: "desc",
      },
    });

    res.json(cartItems.map((item) => serializeCartItem(item, req)));
  } catch (error) {
    console.error("GET CART ITEMS ERROR:", error);
    res.status(500).json({ error: "Could not fetch cart" });
  }
});

router.patch("/:id", auth, async (req, res) => {
  try {
    const cartItemId = Number(req.params.id);
    const quantity = Number(req.body?.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: "quantity must be an integer greater than 0" });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        id: cartItemId,
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (req.user.role !== "ADMIN" && req.user.id !== cartItem.user_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updatedItem = await prisma.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity,
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    });

    res.json(serializeCartItem(updatedItem, req));
  } catch (error) {
    console.error("UPDATE CART ITEM ERROR:", error);
    res.status(500).json({ error: "Could not update cart item" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (req.user.role !== "ADMIN" && req.user.id !== cartItem.user_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE CART ITEM ERROR:", error);
    res.status(500).json({ error: "Could not remove cart item" });
  }
});

module.exports = router;
