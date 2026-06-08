const fs = require('fs');

const oldRaw = JSON.parse(
  fs.readFileSync('backend/src/data/restore-old-products/products.old.json', 'utf8')
);

const currentRaw = JSON.parse(
  fs.readFileSync('backend/src/data/products-current-10.backup.json', 'utf8')
);

const oldProducts = oldRaw.products || [];
const currentProducts = currentRaw.products || [];

const categories = oldRaw.categories || [];

const categoryByKey = new Map();
const categoryById = new Map();
const categoryBySlug = new Map();

for (const category of categories) {
  if (category.key) categoryByKey.set(category.key, category);
  if (category.strapiId) categoryById.set(category.strapiId, category);
  if (category.slug) categoryBySlug.set(category.slug, category);
}

function resolveCategoryKey(product) {
  if (product.categoryKey) return product.categoryKey;

  if (product.category?.key) return product.category.key;
  if (product.category?.slug) {
    const found = categoryBySlug.get(product.category.slug);
    return found?.key || product.category.slug;
  }

  if (product.categorySlug) {
    const found = categoryBySlug.get(product.categorySlug);
    return found?.key || product.categorySlug;
  }

  if (product.categoryId) {
    return categoryById.get(product.categoryId)?.key;
  }

  if (product.strapiCategoryId) {
    return categoryById.get(product.strapiCategoryId)?.key;
  }

  if (product.category) {
    if (typeof product.category === 'string') {
      return categoryByKey.get(product.category)?.key || categoryBySlug.get(product.category)?.key || product.category;
    }

    if (typeof product.category === 'number') {
      return categoryById.get(product.category)?.key;
    }
  }

  if (Array.isArray(product.categories) && product.categories.length > 0) {
    const first = product.categories[0];

    if (typeof first === 'string') {
      return categoryByKey.get(first)?.key || categoryBySlug.get(first)?.key || first;
    }

    if (typeof first === 'number') {
      return categoryById.get(first)?.key;
    }

    if (first?.key) return first.key;
    if (first?.slug) return categoryBySlug.get(first.slug)?.key || first.slug;
    if (first?.strapiId) return categoryById.get(first.strapiId)?.key;
  }

  return undefined;
}

const fixedOldProducts = oldProducts.map((product) => {
  const categoryKey = resolveCategoryKey(product);

  return {
    ...product,
    categoryKey,
  };
});

const missing = fixedOldProducts.filter((product) => !product.categoryKey);

if (missing.length > 0) {
  console.log('Products without categoryKey:', missing.length);
  console.log(missing.slice(0, 5).map((product) => ({
    slug: product.slug,
    keys: Object.keys(product),
    category: product.category,
    categoryId: product.categoryId,
    categorySlug: product.categorySlug,
    categories: product.categories,
  })));
  process.exit(1);
}

const bySlug = new Map();

for (const product of fixedOldProducts) {
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

fs.writeFileSync('backend/src/data/products.merged.fixed.json', JSON.stringify(merged, null, 2), 'utf8');
fs.writeFileSync('frontend/data/local-products.merged.fixed.json', JSON.stringify(merged, null, 2), 'utf8');

console.log('old:', oldProducts.length);
console.log('current:', currentProducts.length);
console.log('merged fixed:', merged.products.length);
console.log('category keys:', [...new Set(merged.products.map((p) => p.categoryKey))].sort());
