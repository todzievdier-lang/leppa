const fs = require('fs');

const oldRaw = JSON.parse(
  fs.readFileSync('backend/src/data/restore-old-products/products.old.json', 'utf8')
);

const currentRaw = JSON.parse(
  fs.readFileSync('backend/src/data/products-current-10.backup.json', 'utf8')
);

const oldProducts = oldRaw.products || [];
const currentProducts = currentRaw.products || [];

function normalizeOldProduct(product) {
  return {
    slug: product.slug,
    sku: product.sku || product.model || product.slug,
    baseSku: product.sku || product.model || product.slug,
    name: product.name,
    brand: product.brand || null,
    model: product.model || product.sku || null,
    categoryKey: product.category && product.category.slug,
    price: product.price ?? null,
    currency: product.currency || 'RUB',
    inStock: true,
    description: product.description || '',
    images: product.images || [],
    externalImages: product.images || [],
    videos: product.videos || [],
    attributes: product.attributes || [],
  };
}

function normalizeCurrentProduct(product) {
  return {
    ...product,
    currency: product.currency || 'RUB',
    inStock: product.inStock ?? true,
    externalImages: product.externalImages || product.images || [],
  };
}

const normalizedOldProducts = oldProducts.map(normalizeOldProduct);
const normalizedCurrentProducts = currentProducts.map(normalizeCurrentProduct);

const missingCategory = normalizedOldProducts.filter((product) => !product.categoryKey);

if (missingCategory.length > 0) {
  console.log('Products without categoryKey:', missingCategory.length);
  console.log(missingCategory.slice(0, 5));
  process.exit(1);
}

const bySlug = new Map();

for (const product of normalizedOldProducts) {
  if (!product.slug) continue;
  bySlug.set(product.slug, product);
}

for (const product of normalizedCurrentProducts) {
  if (!product.slug) continue;
  bySlug.set(product.slug, product);
}

const result = {
  schemaVersion: 2,
  products: Array.from(bySlug.values()),
};

fs.writeFileSync(
  'backend/src/data/products.restored.json',
  JSON.stringify(result, null, 2),
  'utf8'
);

fs.writeFileSync(
  'frontend/data/local-products.restored.json',
  JSON.stringify(result, null, 2),
  'utf8'
);

console.log('old:', oldProducts.length);
console.log('current:', currentProducts.length);
console.log('restored:', result.products.length);
console.log('category slugs:', [...new Set(result.products.map((p) => p.categoryKey))].sort());

console.log('sample old restored product:');
console.log(JSON.stringify(result.products[0], null, 2).slice(0, 1500));
