const express = require("express");
const { auth } = require("../middleware/auth");
const prisma = require("../src/lib/prisma");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        sellerId: true,
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("GET ME ERROR:", error);
    res.status(500).json({ error: "Could not fetch user" });
  }
});

module.exports = router;
