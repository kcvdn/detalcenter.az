function isAdmin(user) {
  return user?.role === "ADMIN";
}

function isSellerAdmin(user) {
  return user?.role === "SELLER_ADMIN";
}

function getActorSellerId(user) {
  if (!isSellerAdmin(user)) {
    return null;
  }

  const sellerId = Number(user?.sellerId);
  return Number.isInteger(sellerId) && sellerId > 0 ? sellerId : null;
}

module.exports = {
  getActorSellerId,
  isAdmin,
  isSellerAdmin,
};
