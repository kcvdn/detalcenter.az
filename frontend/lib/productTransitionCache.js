const STORAGE_KEY = "detalcenter-product-preview-cache";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

function readPreviewMap() {
  const storage = getStorage();

  if (!storage) {
    return {};
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getProductPreview(id) {
  if (!id) {
    return null;
  }

  const previews = readPreviewMap();

  return previews[String(id)] || null;
}

export function storeProductPreview(product) {
  if (!product?.id) {
    return;
  }

  const storage = getStorage();

  if (!storage) {
    return;
  }

  const previews = readPreviewMap();

  previews[String(product.id)] = {
    id: product.id,
    name: product.name || "",
    price: product.price || 0,
    image: product.image || "",
    description: product.description || "",
    seller: product.seller?.name ? { name: product.seller.name } : product.seller || null,
  };

  storage.setItem(STORAGE_KEY, JSON.stringify(previews));
}
