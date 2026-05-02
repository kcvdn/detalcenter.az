function normalizePriceValue(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
}

export function getRegularPrice(product) {
  return normalizePriceValue(product?.price);
}

export function getDiscountPrice(product) {
  const regularPrice = getRegularPrice(product);
  const discountPrice = Number(product?.discountPrice);

  if (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice >= regularPrice) {
    return null;
  }

  return discountPrice;
}

export function hasDiscount(product) {
  return getDiscountPrice(product) !== null;
}

export function getCurrentPrice(product) {
  return getDiscountPrice(product) ?? getRegularPrice(product);
}

export function getDiscountPercent(product) {
  const regularPrice = getRegularPrice(product);
  const discountPrice = getDiscountPrice(product);

  if (discountPrice === null || regularPrice <= 0) {
    return 0;
  }

  return Math.round(((regularPrice - discountPrice) / regularPrice) * 100);
}

export function formatCurrency(value, locale = "az-AZ") {
  return `${normalizePriceValue(value).toLocaleString(locale)} AZN`;
}
