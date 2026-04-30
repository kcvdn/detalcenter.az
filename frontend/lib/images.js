const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

export const productPlaceholderSrc = "/placeholder-product.svg";

export function resolveImageSrc(image, fallback = "") {
  const normalizedImage = String(image || "").trim();

  if (!normalizedImage) {
    return fallback;
  }

  if (
    normalizedImage.startsWith("http://") ||
    normalizedImage.startsWith("https://") ||
    normalizedImage.startsWith("blob:") ||
    normalizedImage.startsWith("data:")
  ) {
    try {
      const parsedUrl = new URL(normalizedImage);

      if (
        (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1") &&
        parsedUrl.pathname.startsWith("/uploads/")
      ) {
        return parsedUrl.pathname;
      }
    } catch {}

    return normalizedImage;
  }

  if (normalizedImage.startsWith("/")) {
    return normalizedImage.startsWith("/uploads/") && apiUrl
      ? `${apiUrl}${normalizedImage}`
      : normalizedImage;
  }

  if (normalizedImage.startsWith("uploads/")) {
    return apiUrl ? `${apiUrl}/${normalizedImage}` : `/${normalizedImage}`;
  }

  return apiUrl ? `${apiUrl}/uploads/${normalizedImage.replace(/^\/+/, "")}` : normalizedImage;
}

export function isPreviewImageSrc(src = "") {
  return src.startsWith("blob:") || src.startsWith("data:");
}
