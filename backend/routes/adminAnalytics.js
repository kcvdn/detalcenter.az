const express = require("express");
const { auth, role } = require("../middleware/auth");
const prisma = require("../src/lib/prisma");
const { getActorSellerId, isSellerAdmin } = require("../src/utils/authScope");

const router = express.Router();

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function createEmptyTimeline(startDate, totalDays) {
  const timelineMap = new Map();

  for (let index = 0; index < totalDays; index += 1) {
    const currentDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + index,
    );

    timelineMap.set(getDateKey(currentDate), {
      date: getDateKey(currentDate),
      orders: 0,
      revenue: 0,
    });
  }

  return timelineMap;
}

function addOrderToTimeline(timelineMap, dateValue, revenue) {
  const dateKey = getDateKey(new Date(dateValue));
  const existingDay = timelineMap.get(dateKey);

  if (!existingDay) {
    return;
  }

  existingDay.orders += 1;
  existingDay.revenue += Number(revenue || 0);
}

async function buildMarketplaceAnalytics(now) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const weeklyStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const monthlyStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

  const [
    totalOrders,
    totalRevenueResult,
    todayOrders,
    todayRevenueResult,
    weeklyOrders,
    monthlyOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: {
        total: true,
      },
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: weeklyStartDate,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: monthlyStartDate,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const weeklySalesMap = createEmptyTimeline(weeklyStartDate, 7);
  const monthlySalesMap = createEmptyTimeline(monthlyStartDate, 30);

  weeklyOrders.forEach((order) => {
    addOrderToTimeline(weeklySalesMap, order.createdAt, order.total);
  });

  monthlyOrders.forEach((order) => {
    addOrderToTimeline(monthlySalesMap, order.createdAt, order.total);
  });

  return {
    scope: "marketplace",
    scopeLabel: "Marketplace",
    totalOrders,
    totalRevenue: Number(totalRevenueResult._sum.total || 0),
    todayOrders,
    todayRevenue: Number(todayRevenueResult._sum.total || 0),
    weeklySalesByDay: Array.from(weeklySalesMap.values()),
    monthlySalesByDay: Array.from(monthlySalesMap.values()),
  };
}

async function buildSellerAnalytics(now, sellerId) {
  const seller = await prisma.seller.findUnique({
    where: {
      id: sellerId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!seller) {
    throw new Error("SELLER_NOT_FOUND");
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const monthlyStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  const weeklyStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      product: {
        seller_id: sellerId,
      },
    },
    include: {
      order: {
        select: {
          id: true,
          createdAt: true,
        },
      },
      product: {
        select: {
          price: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const allOrderIds = new Set();
  const todayOrderIds = new Set();
  const weeklyOrderMap = new Map();
  const monthlyOrderMap = new Map();

  let totalRevenue = 0;
  let todayRevenue = 0;

  orderItems.forEach((item) => {
    const subtotal = Number(item.product?.price || 0) * Number(item.quantity || 0);
    const createdAt = new Date(item.order.createdAt);

    totalRevenue += subtotal;
    allOrderIds.add(item.order_id);

    if (createdAt >= startOfToday && createdAt < startOfTomorrow) {
      todayRevenue += subtotal;
      todayOrderIds.add(item.order_id);
    }

    if (createdAt >= weeklyStartDate) {
      const weekEntry = weeklyOrderMap.get(item.order_id) || {
        orderId: item.order_id,
        createdAt,
        revenue: 0,
      };
      weekEntry.revenue += subtotal;
      weeklyOrderMap.set(item.order_id, weekEntry);
    }

    if (createdAt >= monthlyStartDate) {
      const monthEntry = monthlyOrderMap.get(item.order_id) || {
        orderId: item.order_id,
        createdAt,
        revenue: 0,
      };
      monthEntry.revenue += subtotal;
      monthlyOrderMap.set(item.order_id, monthEntry);
    }
  });

  const weeklySalesMap = createEmptyTimeline(weeklyStartDate, 7);
  const monthlySalesMap = createEmptyTimeline(monthlyStartDate, 30);

  weeklyOrderMap.forEach((entry) => {
    addOrderToTimeline(weeklySalesMap, entry.createdAt, entry.revenue);
  });

  monthlyOrderMap.forEach((entry) => {
    addOrderToTimeline(monthlySalesMap, entry.createdAt, entry.revenue);
  });

  return {
    scope: "seller",
    scopeLabel: seller.name,
    seller,
    totalOrders: allOrderIds.size,
    totalRevenue,
    todayOrders: todayOrderIds.size,
    todayRevenue,
    weeklySalesByDay: Array.from(weeklySalesMap.values()),
    monthlySalesByDay: Array.from(monthlySalesMap.values()),
  };
}

router.get("/", auth, role(["ADMIN", "SELLER_ADMIN"]), async (req, res) => {
  try {
    const now = new Date();
    const sellerId = getActorSellerId(req.user);
    const analytics =
      isSellerAdmin(req.user) && sellerId
        ? await buildSellerAnalytics(now, sellerId)
        : await buildMarketplaceAnalytics(now);

    res.json(analytics);
  } catch (error) {
    if (error.message === "SELLER_NOT_FOUND") {
      return res.status(404).json({ error: "Seller not found" });
    }

    console.error("GET ADMIN ANALYTICS ERROR:", error);
    res.status(500).json({ error: "Could not fetch analytics" });
  }
});

module.exports = router;
