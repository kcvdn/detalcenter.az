require("dotenv").config({ override: true });

const bcrypt = require("bcrypt");
const cors = require("cors");
const express = require("express");
const fs = require("fs");
const path = require("path");
const prisma = require("./src/lib/prisma");
const { errorHandler, notFoundHandler } = require("./src/middleware/errorHandler");
const { buildUniqueEmail, buildUniqueUsername } = require("./src/utils/userIdentity");
const productRoutes = require("./src/routes/productRoutes");
const searchRoutes = require("./src/routes/searchRoutes");
const vinRoutes = require("./src/routes/vinRoutes");
const authRouter = require("./routes/auth");
const meRouter = require("./routes/me");
const sellersRouter = require("./routes/sellers");
const uploadRouter = require("./routes/upload");
const usersRouter = require("./routes/users");
const favoritesRouter = require("./routes/favorites");
const cartRouter = require("./routes/cart");
const ordersRouter = require("./routes/orders");
const adminOrdersRouter = require("./routes/adminOrders");
const adminAnalyticsRouter = require("./routes/adminAnalytics");
const adminCatalogRouter = require("./routes/adminCatalog");const categoriesRouter = require("./routes/categories");const contentRouter = require("./routes/content");

const app = express();
const uploadsDir = path.join(__dirname, "uploads");
const port = Number(process.env.PORT || 5000);
const databaseUrl = process.env.DATABASE_URL || "";

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));

async function ensureAdminUser() {
  const adminName = process.env.ADMIN_NAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const requestedAdminEmail = process.env.ADMIN_EMAIL || `${adminName}@detalcenter.local`;

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        username: true,
      },
    });

    if (existingAdmin) {
      console.log(`Admin already exists: ${existingAdmin.username}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const username = await buildUniqueUsername(prisma, adminName);
    const email = await buildUniqueEmail(prisma, requestedAdminEmail, username);

    await prisma.user.create({
      data: {
        username,
        name: adminName,
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log(`Admin created: ${username}`);
  } catch (error) {
    console.error("Prisma error:", error.message);

    if (error?.code === "P5010" || error?.code === "P2021") {
      console.error("User model/table is not ready yet. Run:");
      console.error("npx prisma migrate dev --name init");
      console.error("npx prisma generate");
    }
  }
}

async function ensureDatabaseReady() {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log("Database query check passed");

    const [usersCount, sellersCount, productsCount] = await Promise.all([
      prisma.user.count(),
      prisma.seller.count(),
      prisma.product.count(),
    ]);

    console.log("Bootstrap data state:", {
      users: usersCount,
      sellers: sellersCount,
      products: productsCount,
    });

    if (sellersCount === 0 || productsCount === 0) {
      console.warn("Database has little or no catalog data. Run `npm run db:seed` in backend.");
    }
  } catch (error) {
    console.error("DATABASE READY CHECK ERROR:", error.message || error);

    if (databaseUrl.startsWith("prisma+postgres://")) {
      console.error(
        "DATABASE_URL uses prisma+postgres. Make sure the Prisma Postgres service is running or replace it with a direct postgresql:// URL.",
      );
    }

    if (error?.code === "P5010" || error?.code === "P2021") {
      console.error("Database schema is not ready. Run:");
      console.error("npm run db:local");
      console.error("npx prisma migrate dev --name init");
      console.error("npx prisma generate");
      console.error("npm run db:seed");
    }

    throw error;
  }
}

app.get("/", (_req, res) => {
  res.json({
    name: "detalcenter.az backend",
    status: "ok",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy" });
});

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/products", productRoutes);
app.use("/products", productRoutes);
app.use("/api/vin", vinRoutes);
app.use("/search", searchRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/sellers", sellersRouter);
app.use("/sellers", sellersRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/users", usersRouter);
app.use("/users", usersRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/admin/analytics", adminAnalyticsRouter);
app.use("/api/admin/catalog", adminCatalogRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/content", contentRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  await ensureDatabaseReady();
  await ensureAdminUser();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(async (error) => {
  console.error("SERVER START ERROR:", error);
  await prisma.$disconnect();
  process.exit(1);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing Prisma connection...`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
