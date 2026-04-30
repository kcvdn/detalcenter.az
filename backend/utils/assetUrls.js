const DEFAULT_API_ORIGIN = process.env.PUBLIC_API_URL || process.env.API_URL || "http://localhost:5000";

function getRequestOrigin(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProto === "string" && forwardedProto
      ? forwardedProto.split(",")[0].trim()
      : req.protocol || "http";
  const host = typeof req.get === "function" ? req.get("host") : "";

  return host ? `${protocol}://${host}` : DEFAULT_API_ORIGIN;
}

function normalizeAssetUrl(value, req) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("blob:") ||
    normalized.startsWith("data:")
  ) {
    return normalized;
  }

  const origin = getRequestOrigin(req);

  if (normalized.startsWith("/uploads/")) {
    return `${origin}${normalized}`;
  }

  if (normalized.startsWith("uploads/")) {
    return `${origin}/${normalized}`;
  }

  if (normalized.startsWith("/")) {
    return `${origin}${normalized}`;
  }

  return `${origin}/uploads/${normalized.replace(/^\/+/, "")}`;
}

module.exports = {
  DEFAULT_API_ORIGIN,
  getRequestOrigin,
  normalizeAssetUrl,
};
