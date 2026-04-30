const express = require("express");
const { auth, role } = require("../middleware/auth");
const { generateInvoice } = require("../utils/generateInvoice");
const prisma = require("../src/lib/prisma");
const { serializeLiteProduct } = require("../src/utils/legacyProductAdapter");
const { getActorSellerId, isSellerAdmin } = require("../src/utils/authScope");

const router = express.Router();
const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DONE"];

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

const orderInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  items: {
    include: {
      product: {
        include: {
          seller: true,
        },
      },
    },
  },
};

router.get("/", auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        user_id: req.user.id,
      },
      include: orderInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders.map((order) => serializeOrder(order, req)));
  } catch (error) {
    console.error("GET CURRENT USER ORDERS ERROR:", error);
    res.status(500).json({ error: "Could not fetch orders" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const userId = Number(req.body?.user_id || req.user.id);
    const name = req.body?.name?.trim?.() || "";
    const phone = req.body?.phone?.trim?.() || "";
    const address = req.body?.address?.trim?.() || "";
    const note = req.body?.note?.trim?.() || null;

    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!name || !phone || !address) {
      return res.status(400).json({ error: "name, phone and address are required" });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        user_id: userId,
      },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const total = cartItems.reduce((sum, item) => {
      return sum + Number(item.product?.price || 0) * Number(item.quantity || 0);
    }, 0);

    const order = await prisma.order.create({
      data: {
        user_id: userId,
        total,
        name,
        phone,
        address,
        note,
        items: {
          create: cartItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        },
      },
      include: orderInclude,
    });

    await prisma.cartItem.deleteMany({
      where: {
        user_id: userId,
      },
    });

    res.status(201).json(serializeOrder(order, req));
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({ error: "Could not create order" });
  }
});

router.get("/:id/invoice", auth, async (req, res) => {
  try {
    if (isSellerAdmin(req.user)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const orderId = Number(req.params.id);
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: orderInclude,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (req.user.role !== "ADMIN" && req.user.id !== order.user_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    generateInvoice({ order, res });
  } catch (error) {
    console.error("ORDER INVOICE ERROR:", error);
    res.status(500).json({ error: "Could not generate invoice" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const sellerId = getActorSellerId(req.user);
    const order = await prisma.order.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: sellerId
        ? {
            ...orderInclude,
            items: {
              where: {
                product: {
                  seller_id: sellerId,
                },
              },
              include: {
                product: {
                  include: {
                    seller: true,
                  },
                },
              },
            },
          }
        : orderInclude,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (sellerId) {
      if (!order.items.length) {
        return res.status(403).json({ error: "Access denied" });
      }

      return res.json(serializeOrder(order, req, sellerId));
    }

    if (req.user.role !== "ADMIN" && req.user.id !== order.user_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(serializeOrder(order, req));
  } catch (error) {
    console.error("GET ORDER DETAIL ERROR:", error);
    res.status(500).json({ error: "Could not fetch order" });
  }
});

router.put("/:id", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status,
      },
      include: orderInclude,
    });

    res.json(serializeOrder(updatedOrder, req));
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    res.status(500).json({ error: "Could not update order status" });
  }
});

module.exports = router;
