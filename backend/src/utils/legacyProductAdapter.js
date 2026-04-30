const { normalizeAssetUrl } = require("../../utils/assetUrls");
const { serializeSeller } = require("./productSerializer");

function serializeLiteProduct(product, req) {
  if (!product) {
    return null;
  }

  const normalizedImageUrl = normalizeAssetUrl(product.imageUrl, req);

  return {
    ...product,
    imageUrl: normalizedImageUrl,
    image: normalizedImageUrl,
    seller: serializeSeller(product.seller, req),
  };
}

module.exports = {
  serializeLiteProduct,
};
