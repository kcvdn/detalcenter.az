const express = require("express");
const bcrypt = require("bcrypt");
const { createAuthToken } = require("../lib/token");
const prisma = require("../src/lib/prisma");
const { buildUniqueUsername } = require("../src/utils/userIdentity");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const resolvedUsername = await buildUniqueUsername(
      prisma,
      username || normalizedEmail.split("@")[0] || normalizedName,
    );

    const user = await prisma.user.create({
      data: {
        username: resolvedUsername,
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: "USER",
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: "Register error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, username, login, password } = req.body;
    const normalizedLogin = String(login || email || username || "")
      .trim()
      .toLowerCase();

    if (!normalizedLogin || !password) {
      return res.status(400).json({ error: "username/email and password are required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: normalizedLogin,
          },
          {
            username: normalizedLogin,
          },
        ],
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username/email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid username/email or password" });
    }

    const token = createAuthToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        sellerId: user.sellerId || null,
        seller: user.seller || null,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ error: "Login error" });
  }
});

module.exports = router;
