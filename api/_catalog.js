const CARD_DATA = require("../src/data/card.js");

// react.html'deki slugify/getProductId ile birebir aynı mantık — istemciden
// gelen productId'nin gerçek katalogdaki bir ürün+varyant kombinasyonuna
// karşılık geldiğini sunucu tarafında doğrulamak için kullanılır.
function slugify(text) {
  const trMap = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i" };
  return text
    .split("")
    .map((ch) => trMap[ch] || ch)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProductId(productName, variantName) {
  return `${slugify(productName)}_${slugify(variantName)}`;
}

const VALID_PRODUCT_IDS = new Set();
for (const product of CARD_DATA) {
  for (const variant of product.variants) {
    VALID_PRODUCT_IDS.add(getProductId(product.name, variant.name));
  }
}

function isValidProductId(productId) {
  return typeof productId === "string" && VALID_PRODUCT_IDS.has(productId);
}

module.exports = { isValidProductId };
