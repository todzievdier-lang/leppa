const fs = require('fs');

const oldRaw = JSON.parse(
  fs.readFileSync('backend/src/data/restore-old-products/products.old.json', 'utf8')
);

const currentRaw = JSON.parse(
  fs.readFileSync('backend/src/data/products-current-10.backup.json', 'utf8')
);

const oldProducts = Array.isArray(oldRaw) ? oldRaw : oldRaw.products || [];
const currentProducts = Array.isArray(currentRaw) ? currentRaw : currentRaw.products || [];

const bySlug = new Map();

for (const product of oldProducts) {
  if (!product.slug) continue;
  bySlug.set(product.slug, product);
}

for (const product of currentProducts) {
  if (!product.slug) continue;
  bySlug.set(product.slug, product);
}

const merged = {
  schemaVersion: 2,
  products: Array.from(bySlug.values()),
};

fs.writeFileSync(
  'backend/src/data/products.merged.json',
  JSON.stringify(merged, null, 2),
  'utf8'
);

fs.writeFileSync(
  'frontend/data/local-products.merged.json',
  JSON.stringify(merged, null, 2),
  'utf8'
);

console.log('old:', oldProducts.length);
console.log('current:', currentProducts.length);
console.log('merged:', merged.products.length);
