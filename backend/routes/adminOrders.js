const express = require("express");
const { auth, role } = require("../middleware/auth");
const prisma = require("../src/lib/prisma");
const { serializeLiteProduct } = require("../src/utils/legacyProductAdapter");
const { getActorSellerId } = require("../src/utils/authScope");

const router = express.Router();

const serializeOrder = (order, req, sellerId = null) => {
  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
        ...item,
        product: serializeLiteProduct(item.product, req),
      }))
    : [];
  const sellerScoped = Number.isInteger(Number(sellerId)) && Number(sellerId) > 0;
  const scopedTotal = items.reduce((sum, item) => {
    return sum + Number(item.product?.price || 0) * Number(item.quantity || 0);
  }, 0);

  return {
    ...order,
    fullOrderTotal: Number(order.total || 0),
    total: sellerScoped ? scopedTotal : Number(order.total || 0),
    sellerScoped,
    items,
  };
};

router.get("/", auth, role(["ADMIN", "SELLER_ADMIN"]), async (req, res) => {
  try {
    const sellerId = getActorSellerId(req.user);
    const orders = await prisma.order.findMany({
      ...(sellerId
        ? {
            where: {
              items: {
                some: {
                  product: {
                    seller_id: sellerId,
                  },
                },
              },
            },
          }
        : {}),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          ...(sellerId
            ? {
                where: {
                  product: {
                    seller_id: sellerId,
                  },
                },
              }
            : {}),
          include: {
            product: {
              include: {
                seller: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders.map((order) => serializeOrder(order, req, sellerId)));
  } catch (error) {
    console.error("GET ADMIN ORDERS ERROR:", error);
    res.status(500).json({ error: "Could not fetch admin orders" });
  }
});

module.exports = router;
