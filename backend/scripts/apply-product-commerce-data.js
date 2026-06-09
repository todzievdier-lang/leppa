#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { compileStrapi, createStrapi } = require('@strapi/strapi');

const PRODUCT_UID = 'api::product.product';
const appDir = path.resolve(__dirname, '..');
const MAX_BUNDLE_PRODUCTS = 5;

const INSTALLATION_SLUG = 'wenston-installyatsiya-dlya-podvesnogo-unitaza-stw';
const DEFAULT_WALL_TOILET_SLUG = 'leppa-podvesnoy-unitaz-leppa-448';
const DEFAULT_MIRROR_SLUG =
  'wenston-zerkalo-base-s-podsvetkoy-v-alyuminievoy-rame-s-sensornym-vklyucheniem-sistema-antizapotevaniya-800x800x20';

const FLUSH_BUTTON_BY_COLOR = {
  black: 'wenston-knopka-smyva-line-chernaya',
  gray: 'wenston-knopka-smyva-line-seraya',
  white: 'wenston-knopka-smyva-line-belaya',
};

const PRICE_BY_SLUG = {
  [INSTALLATION_SLUG]: 12490,
  [FLUSH_BUTTON_BY_COLOR.white]: 2490,
  [FLUSH_BUTTON_BY_COLOR.gray]: 2490,
  [FLUSH_BUTTON_BY_COLOR.black]: 2990,
};

const PRICE_BY_MODEL = {
  '407V': 6990,
  '445V': 7490,
  '448A': 7990,
  '449A': 8490,
  '462VA': 8990,
  '470VA': 9490,
  '476VA': 9990,
  '478VA': 10990,
  '626': 8990,
  '681VA': 10990,
  '684VA': 11990,
  '948V': 15990,
  '951V': 16990,
  '8089': 25990,
  H65: 59990,
  SZ2D: 69990,
  H88: 79990,
  H99: 89990,
  T13: 119990,
  LAURA: 12990,
  LEON: 10990,
  LORD: 18990,
  RUNO: 9990,
};

const WATER_HEATER_PRICES = {
  'DSK-55A': 5990,
  'DSK-55B': 5990,
  'DSK-55C': 5990,
  'DSK-55D': 5990,
  'DSK-55E': 5990,
  'K03-DSK-85E': 7990,
  'X7-DSK-85B': 8990,
  'K9-DSK-85A': 9990,
  'H2-B-DSK-85C': 8990,
  'V20-DSK-85D': 10990,
  'X1-DSK-85': 9990,
};

const MIRROR_SERIES_BASE_PRICES = {
  BASE: 5990,
  BERTA: 5990,
  MIO: 6490,
  ROYAL: 8990,
};

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    status: argv.includes('--draft') ? 'draft' : 'published',
  };
}

function getCategorySlug(product) {
  return product.category?.slug ?? null;
}

function getColorSlug(product) {
  return product.color?.slug ?? null;
}

function getModel(product) {
  return product.baseSku ?? product.sku ?? product.model ?? null;
}

function getMirrorWidth(product) {
  const match = product.slug.match(/-(\d{3,4})x\d{3,4}x\d+$/);

  return match ? Number(match[1]) : null;
}

function getMirrorPrice(product) {
  const model = getModel(product);
  const width = getMirrorWidth(product);

  if (!model || !width) {
    return PRICE_BY_MODEL[model] ?? null;
  }

  const basePrice = MIRROR_SERIES_BASE_PRICES[model];

  if (!basePrice) {
    return PRICE_BY_MODEL[model] ?? null;
  }

  const widthSteps = Math.max(0, Math.round((width - 400) / 100));

  return basePrice + widthSteps * 1000;
}

function getEstimatedPrice(product) {
  if (PRICE_BY_SLUG[product.slug]) {
    return PRICE_BY_SLUG[product.slug];
  }

  const model = getModel(product);

  if (model && PRICE_BY_MODEL[model]) {
    return PRICE_BY_MODEL[model];
  }

  if (model && WATER_HEATER_PRICES[model]) {
    return WATER_HEATER_PRICES[model];
  }

  if (getCategorySlug(product) === 'zerkala') {
    return getMirrorPrice(product);
  }

  return null;
}

function makeBundle(productSlugs, discountPercent = 6) {
  return {
    discountPercent,
    productSlugs: productSlugs.slice(0, MAX_BUNDLE_PRODUCTS),
  };
}

function isWallHungToilet(product) {
	return getCategorySlug(product) === 'unitazy' && /подвесн/i.test(product.name);
}

function normalizeBundleProductSlugs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenSlugs = new Set();

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (item && typeof item === 'object') {
        return String(item.slug ?? item.productSlug ?? item.product_slug ?? '').trim();
      }

      return '';
    })
    .filter((slug) => slug.length > 0)
    .filter((slug) => {
      if (seenSlugs.has(slug)) {
        return false;
      }

      seenSlugs.add(slug);
      return true;
    })
    .slice(0, MAX_BUNDLE_PRODUCTS);
}

function normalizeDiscountPercent(value) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 6;
}

function sanitizeExistingBundles(product, productsBySlug) {
  if (!Array.isArray(product.bundles)) {
    return [];
  }

  return product.bundles
    .map((bundle) => {
      if (!bundle || typeof bundle !== 'object') {
        return null;
      }

      const productSlugs = normalizeBundleProductSlugs(
        bundle.productSlugs
          ?? bundle.product_slugs
          ?? bundle.items
          ?? bundle.products,
      ).filter((slug) => productsBySlug.has(slug));

      if (productSlugs.length < 2) {
        return null;
      }

      const discountPercent = normalizeDiscountPercent(
        bundle.discountPercent ?? bundle.discount_percent ?? bundle.discount,
      );

      return {
        discountPercent,
        productSlugs,
      };
    })
    .filter((bundle) => bundle !== null)
    .slice(0, 1);
}

function buildDefaultBundles(product, productsBySlug) {
  const bundles = [];
  const categorySlug = getCategorySlug(product);

  if (isWallHungToilet(product)) {
    bundles.push(
      makeBundle([
        product.slug,
        INSTALLATION_SLUG,
        FLUSH_BUTTON_BY_COLOR.white,
      ]),
    );
  }

  if (product.slug === INSTALLATION_SLUG) {
    bundles.push(
      makeBundle([
        product.slug,
        DEFAULT_WALL_TOILET_SLUG,
        FLUSH_BUTTON_BY_COLOR.white,
      ]),
    );
  }

  if (categorySlug === 'flush-buttons') {
    bundles.push(
      makeBundle([
        product.slug,
        INSTALLATION_SLUG,
        DEFAULT_WALL_TOILET_SLUG,
      ]),
    );
  }

  if (categorySlug === 'umnye-unitazy' && productsBySlug.has(DEFAULT_MIRROR_SLUG)) {
    bundles.push(
      makeBundle([
        product.slug,
        DEFAULT_MIRROR_SLUG,
      ], 5),
    );
  }

  return bundles.filter((bundle) =>
    bundle.productSlugs.length > 1
    && bundle.productSlugs.every((slug) => productsBySlug.has(slug)),
  ).slice(0, 1);
}

function buildBundles(product, productsBySlug) {
  const existingBundles = sanitizeExistingBundles(product, productsBySlug);

  return existingBundles.length > 0
    ? existingBundles
    : buildDefaultBundles(product, productsBySlug);
}

async function getProducts(strapi, status) {
  return strapi.documents(PRODUCT_UID).findMany({
    status,
    pagination: { pageSize: 1000 },
    fields: ['slug', 'sku', 'baseSku', 'name', 'brand', 'model', 'price', 'bundles'],
    populate: {
      category: { fields: ['slug'] },
      color: { fields: ['slug', 'name'] },
    },
  });
}

async function applyCommerceData(strapi, options) {
  const products = await getProducts(strapi, options.status);
  const productsBySlug = new Map(products.map((product) => [product.slug, product]));
  const stats = {
    bundled: 0,
    missingPrices: 0,
    priced: 0,
    skipped: 0,
    updated: 0,
  };

  for (const product of products) {
    const price = getEstimatedPrice(product);
    const bundles = buildBundles(product, productsBySlug);
    const data = { bundles };

    if (price === null) {
      stats.missingPrices += 1;
    } else {
      data.price = price;
      stats.priced += 1;
    }

    if (bundles.length > 0) {
      stats.bundled += 1;
    }

    if (options.dryRun) {
      console.log(
        `[dry-run] ${product.slug} price=${price ?? 'missing'} bundles=${bundles.length}`,
      );
      stats.skipped += 1;
      continue;
    }

    await strapi.documents(PRODUCT_UID).update({
      documentId: product.documentId,
      status: options.status,
      data,
    });

    stats.updated += 1;
    console.log(`[updated] ${product.slug} price=${price ?? 'missing'} bundles=${bundles.length}`);
  }

  return stats;
}

async function main() {
  const options = parseArgs(process.argv);

  process.chdir(appDir);

  let app;

  try {
    const appContext = await compileStrapi({ appDir });
    app = await createStrapi(appContext).load();
    const stats = await applyCommerceData(app, options);

    console.log(
      `[done] updated=${stats.updated} priced=${stats.priced} bundled=${stats.bundled} missingPrices=${stats.missingPrices} skipped=${stats.skipped}`,
    );
  } finally {
    if (app) {
      await app.destroy();
    }
  }
}

main().catch((error) => {
  console.error('[error]', error.message);

  if (error.details) {
    console.error(JSON.stringify(error.details, null, 2));
  }

  process.exit(1);
});
