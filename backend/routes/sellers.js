const express = require("express");
const bcrypt = require("bcrypt");
const { auth, role } = require("../middleware/auth");
const { parseAuthToken } = require("../lib/token");
const { normalizeAssetUrl } = require("../utils/assetUrls");
const prisma = require("../src/lib/prisma");
const { buildUniqueUsername } = require("../src/utils/userIdentity");
const { getActorSellerId } = require("../src/utils/authScope");

const router = express.Router();

const serializeSeller = (seller, req) => {
  if (!seller) {
    return seller;
  }

  return {
    ...seller,
    logo: normalizeAssetUrl(seller.logo, req),
  };
};

const publicSellerSelect = {
  id: true,
  name: true,
  logo: true,
  phone: true,
  address: true,
  description: true,
  createdAt: true,
};

const sellerSelect = {
  ...publicSellerSelect,
  adminUsers: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  },
};

function getOptionalUser(req) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return parseAuthToken(authHeader.slice("Bearer ".length).trim());
}

router.get("/", async (req, res) => {
  try {
    const optionalUser = getOptionalUser(req);
    const scopedSellerId = getActorSellerId(optionalUser);
    const includeAdminFields = optionalUser?.role === "ADMIN" || Boolean(scopedSellerId);
    const sellers = await prisma.seller.findMany({
      ...(scopedSellerId
        ? {
            where: {
              id: scopedSellerId,
            },
          }
        : {}),
      select: includeAdminFields ? sellerSelect : publicSellerSelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(sellers.map((seller) => serializeSeller(seller, req)));
  } catch (error) {
    console.error("GET SELLERS ERROR:", error);
    res.status(500).json({ error: "Could not fetch sellers" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const sellerId = Number(req.params.id);
    const optionalUser = getOptionalUser(req);
    const scopedSellerId = getActorSellerId(optionalUser);

    if (Number.isNaN(sellerId)) {
      return res.status(400).json({ error: "Invalid seller id" });
    }

    if (scopedSellerId && scopedSellerId !== sellerId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const seller = await prisma.seller.findUnique({
      where: {
        id: sellerId,
      },
      select: optionalUser?.role === "ADMIN" || scopedSellerId ? sellerSelect : publicSellerSelect,
    });

    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json(serializeSeller(seller, req));
  } catch (error) {
    console.error("GET SELLER ERROR:", error);
    res.status(500).json({ error: "Could not fetch seller" });
  }
});

router.post("/", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const { name, logo, phone, address, description, adminName, adminEmail, adminPassword } = req.body;
    const normalizedName = String(name || "").trim();
    const normalizedAdminName = String(adminName || "").trim();
    const normalizedAdminEmail = String(adminEmail || "").trim().toLowerCase();
    const normalizedAdminPassword = String(adminPassword || "");

    if (!normalizedName) {
      return res.status(400).json({ error: "Seller name is required" });
    }

    if (!normalizedAdminName || !normalizedAdminEmail || !normalizedAdminPassword) {
      return res.status(400).json({ error: "adminName, adminEmail and adminPassword are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedAdminEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Seller admin email already exists" });
    }

    const seller = await prisma.$transaction(async (tx) => {
      const createdSeller = await tx.seller.create({
        data: {
          name: normalizedName,
          logo: normalizeAssetUrl(logo, req),
          phone: String(phone || "").trim() || null,
          address: String(address || "").trim() || null,
          description: String(description || "").trim() || null,
        },
      });

      const username = await buildUniqueUsername(
        tx,
        normalizedAdminEmail.split("@")[0] || normalizedAdminName || normalizedName,
      );
      const password = await bcrypt.hash(normalizedAdminPassword, 10);

      await tx.user.create({
        data: {
          username,
          name: normalizedAdminName,
          email: normalizedAdminEmail,
          password,
          role: "SELLER_ADMIN",
          sellerId: createdSeller.id,
        },
      });

      return tx.seller.findUnique({
        where: {
          id: createdSeller.id,
        },
        select: sellerSelect,
      });
    });

    res.status(201).json(serializeSeller(seller, req));
  } catch (error) {
    console.error("CREATE SELLER ERROR:", error);
    res.status(500).json({ error: "Could not create seller" });
  }
});

router.put("/:id", auth, role(["ADMIN", "SELLER_ADMIN"]), async (req, res) => {
  try {
    const sellerId = Number(req.params.id);
    const { name, logo, phone, address, description, adminName, adminEmail, adminPassword } = req.body;
    const scopedSellerId = getActorSellerId(req.user);
    const isAdmin = req.user?.role === "ADMIN";

    if (!sellerId) {
      return res.status(400).json({ error: "Seller id is required" });
    }

    if (scopedSellerId && scopedSellerId !== sellerId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const existingSeller = await prisma.seller.findUnique({
      where: {
        id: sellerId,
      },
    });

    if (!existingSeller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    if (!String(name || "").trim()) {
      return res.status(400).json({ error: "Seller name is required" });
    }

    const updatedSeller = await prisma.$transaction(async (tx) => {
      const seller = await tx.seller.update({
        where: {
          id: sellerId,
        },
        data: {
          name: String(name).trim(),
          logo:
            logo === undefined
              ? existingSeller.logo
              : normalizeAssetUrl(logo, req),
          phone: phone === undefined ? existingSeller.phone : String(phone || "").trim() || null,
          address: address === undefined ? existingSeller.address : String(address || "").trim() || null,
          description:
            description === undefined ? existingSeller.description : String(description || "").trim() || null,
        },
      });

      const sellerAdmin = await tx.user.findFirst({
        where: {
          sellerId,
          role: "SELLER_ADMIN",
        },
      });

      if (sellerAdmin && (adminName || adminEmail || adminPassword)) {
        if (!isAdmin) {
          throw new Error("SELLER_ADMIN_FIELDS_FORBIDDEN");
        }

        const nextAdminName = adminName ? String(adminName).trim() : sellerAdmin.name;
        const nextAdminEmail = adminEmail
          ? String(adminEmail).trim().toLowerCase()
          : sellerAdmin.email;

        const emailOwner = await tx.user.findUnique({
          where: {
            email: nextAdminEmail,
          },
          select: {
            id: true,
          },
        });

        if (emailOwner && emailOwner.id !== sellerAdmin.id) {
          throw new Error("SELLER_ADMIN_EMAIL_EXISTS");
        }

        await tx.user.update({
          where: {
            id: sellerAdmin.id,
          },
          data: {
            name: nextAdminName,
            email: nextAdminEmail,
            ...(adminPassword
              ? {
                  password: await bcrypt.hash(String(adminPassword), 10),
                }
              : {}),
          },
        });
      }

      return tx.seller.findUnique({
        where: {
          id: seller.id,
        },
        select: sellerSelect,
      });
    });

    res.json(serializeSeller(updatedSeller, req));
  } catch (error) {
    if (error.message === "SELLER_ADMIN_FIELDS_FORBIDDEN") {
      return res.status(403).json({ error: "Only admins can update seller admin credentials" });
    }

    if (error.message === "SELLER_ADMIN_EMAIL_EXISTS") {
      return res.status(409).json({ error: "Seller admin email already exists" });
    }

    console.error("UPDATE SELLER ERROR:", error);
    res.status(500).json({ error: "Could not update seller" });
  }
});

router.delete("/:id", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const sellerId = Number(req.params.id);
    const productCount = await prisma.product.count({
      where: {
        seller_id: sellerId,
      },
    });

    if (productCount > 0) {
      return res.status(400).json({ error: "Seller has products and cannot be deleted" });
    }

    await prisma.user.updateMany({
      where: {
        sellerId,
      },
      data: {
        sellerId: null,
      },
    });

    await prisma.seller.delete({
      where: {
        id: sellerId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE SELLER ERROR:", error);
    res.status(500).json({ error: "Could not delete seller" });
  }
});

module.exports = router;
