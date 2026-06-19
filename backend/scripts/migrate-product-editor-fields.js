#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { compileStrapi, createStrapi } = require('@strapi/strapi');

const PRODUCT_UID = 'api::product.product';
const DIMENSION_FIELDS = ['widthMm', 'heightMm', 'depthMm', 'lengthMm', 'diameterMm'];
const MIRROR_SERIES = new Set(['BASE', 'BERTA', 'MIO', 'ROYAL']);
const appDir = path.resolve(__dirname, '..');

const TECHNICAL_DESCRIPTION_PATTERN = new RegExp(
  '^(?:Название|Производитель|Артикул|Цвет(?: рамы)?|Материал(?: рамы)?|Габариты?[^:]*|Габаритные размеры[^:]*|Размеры?[^:]*)\\s*:',
  'i',
);

function getBlockText(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(getBlockText).join('');
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  if (typeof value.text === 'string') {
    return value.text;
  }

  return getBlockText(value.children);
}

function fixKnownSeriesName(text, sku) {
  if (!MIRROR_SERIES.has(sku)) {
    return text;
  }

  return text.replace(/Зеркало\s+(?:BASE|BERTA|MIO|ROYAL)\b/giu, `Зеркало ${sku}`);
}

function cleanDescription(description, sku) {
  if (!Array.isArray(description)) {
    return [];
  }

  const paragraphs = description
    .flatMap((block) => getBlockText(block).split(/\n+/))
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !TECHNICAL_DESCRIPTION_PATTERN.test(line))
    .filter((line) => !/^Функция антизапотевания\.?$/iu.test(line))
    .map((line) => fixKnownSeriesName(line, sku));

  return paragraphs.map((text) => ({
    type: 'paragraph',
    children: [{ type: 'text', text }],
  }));
}

function getAttributes(product) {
  return Array.isArray(product.attributes) ? product.attributes : [];
}

function getDimensionData(product) {
  const attributes = getAttributes(product);

  return Object.fromEntries(DIMENSION_FIELDS.map((fieldName) => {
    const attribute = attributes.find((entry) => entry?.key === fieldName);
    const value = Number(attribute?.value);

    return [fieldName, Number.isFinite(value) ? value : null];
  }));
}

function getSpecifications(product) {
  return getAttributes(product)
    .filter((attribute) => attribute?.label && !DIMENSION_FIELDS.includes(attribute.key))
    .map((attribute) => ({
      name: String(attribute.label),
      value: Array.isArray(attribute.value)
        ? attribute.value.join(', ')
        : String(attribute.value ?? ''),
      unit: attribute.unit ? String(attribute.unit) : null,
    }))
    .filter((attribute) => attribute.value);
}

async function migrateStatus(strapi, status, dryRun) {
  const products = await strapi.documents(PRODUCT_UID).findMany({
    status,
    pagination: { pageSize: 1000 },
    fields: ['sku', 'description', 'attributes'],
  });

  let updated = 0;

  for (const product of products) {
    const data = {
      ...getDimensionData(product),
      specifications: getSpecifications(product),
      description: cleanDescription(product.description, product.sku),
    };

    if (!dryRun) {
      await strapi.documents(PRODUCT_UID).update({
        documentId: product.documentId,
        status,
        data,
      });
    }

    updated += 1;
  }

  console.log(`[${status}] ${dryRun ? 'would update' : 'updated'} ${updated} products`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  let app;

  try {
    const appContext = await compileStrapi({ appDir });
    app = await createStrapi(appContext).load();
    await migrateStatus(app, 'draft', dryRun);
    await migrateStatus(app, 'published', dryRun);
    await new Promise((resolve) => setTimeout(resolve, 250));
  } finally {
    if (app) {
      await app.destroy();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
