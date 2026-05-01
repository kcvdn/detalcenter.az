const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { auth, role } = require("../middleware/auth");
const { normalizeAssetUrl } = require("../utils/assetUrls");

const router = express.Router();
const uploadsDir = path.join(__dirname, "..", "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!String(file.mimetype || "").startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }

    cb(null, true);
  },
});

router.post("/", auth, role(["ADMIN", "SELLER_ADMIN"]), upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Image is required" });
  }

  res.json({
    url: normalizeAssetUrl(`/uploads/${req.file.filename}`, req),
  });
});

router.use((error, _req, res, next) => {
  if (!error) {
    return next();
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Image must be smaller than 5MB" });
  }

  return res.status(400).json({ error: error.message || "Upload failed" });
});

module.exports = router;
