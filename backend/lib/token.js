const jwt = require("jsonwebtoken");

const DEFAULT_DEV_JWT_SECRET = "detalcenter-az-local-dev-secret";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return DEFAULT_DEV_JWT_SECRET;
}

function normalizeUserPayload(user) {
  return {
    id: Number(user.id),
    role: user.role,
    sellerId: user.sellerId ? Number(user.sellerId) : null,
  };
}

function createAuthToken(user) {
  return jwt.sign(normalizeUserPayload(user), getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function parseAuthToken(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const normalizedPayload = normalizeUserPayload(payload);

    if (!normalizedPayload.id || !normalizedPayload.role) {
      return null;
    }

    return normalizedPayload;
  } catch {
    return null;
  }
}

module.exports = {
  createAuthToken,
  createSimpleToken: createAuthToken,
  parseAuthToken,
  parseSimpleToken: parseAuthToken,
};
