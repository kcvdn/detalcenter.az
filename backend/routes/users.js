const express = require("express");
const bcrypt = require("bcrypt");
const { auth, role } = require("../middleware/auth");
const prisma = require("../src/lib/prisma");
const { buildUniqueUsername } = require("../src/utils/userIdentity");

const router = express.Router();
const publicUserSelect = {
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
};

router.get("/", auth, role(["ADMIN"]), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: publicUserSelect,
    });

    console.log("Users:", {
      count: users.length,
    });

    res.json(users);
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ error: "Could not fetch users" });
  }
});

router.put("/me", auth, async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const oldPassword =
      typeof req.body?.oldPassword === "string" ? req.body.oldPassword : "";
    const newPassword =
      typeof req.body?.newPassword === "string" ? req.body.newPassword.trim() : "";

    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const updateData = {
      name,
      email,
    };

    if (oldPassword || newPassword) {
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "oldPassword and newPassword are required together" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }

      const validPassword = await bcrypt.compare(oldPassword, user.password);

      if (!validPassword) {
        return res.status(400).json({ error: "Old password is incorrect" });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: updateData,
      select: publicUserSelect,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("UPDATE ME ERROR:", error);
    res.status(500).json({ error: "Could not update profile" });
  }
});

router.post("/", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const { name, email, password, username, role } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPassword = typeof password === "string" ? password : "";
    const selectedRole = typeof role === "string" ? role.toUpperCase() : "USER";
    const allowedRoles = ["USER", "SELLER_ADMIN", "ADMIN"];

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    const resolvedUsername = await buildUniqueUsername(
      prisma,
      username || normalizedEmail.split("@")[0] || normalizedName,
    );

    const createdUser = await prisma.user.create({
      data: {
        username: resolvedUsername,
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: selectedRole,
      },
      select: publicUserSelect,
    });

    res.status(201).json(createdUser);
  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    res.status(500).json({ error: "Could not create user" });
  }
});

router.put("/:id", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!userId || !name || !email) {
      return res.status(400).json({ error: "Valid user id, name, and email are required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const anotherUserWithEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (anotherUserWithEmail && anotherUserWithEmail.id !== userId) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const updateData = {
      name,
      email,
    };

    if (password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: publicUserSelect,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    res.status(500).json({ error: "Could not update user" });
  }
});

router.delete("/:id", auth, role(["ADMIN"]), async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!userId) {
      return res.status(400).json({ error: "Valid user id is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(204).end();
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    res.status(500).json({ error: "Could not delete user" });
  }
});

module.exports = router;
