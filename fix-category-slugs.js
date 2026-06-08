const fs = require('fs');

const inputPath = 'backend/src/data/products.merged.fixed.json';
const outputPath = 'backend/src/data/products.merged.strapi-slugs.json';
const frontendOutputPath = 'frontend/data/local-products.merged.strapi-slugs.json';

const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const slugMap = {
  'toilets': 'unitazy',
  'smart-toilets': 'umnye-unitazy',
  'sinks': 'rakoviny',
  'mirrors': 'zerkala',
  'water-heaters': 'vodonagrevateli',
  'installations': 'installations',
  'flush-buttons': 'flush-buttons',
};

const products = (raw.products || []).map((product) => {
  const current = product.categoryKey;
  const mapped = slugMap[current] || current;

  return {
    ...product,
    categoryKey: mapped,
  };
});

const result = {
  schemaVersion: 2,
  products,
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
fs.writeFileSync(frontendOutputPath, JSON.stringify(result, null, 2), 'utf8');

console.log('products:', products.length);
console.log('category slugs:', [...new Set(products.map((p) => p.categoryKey))].sort());
