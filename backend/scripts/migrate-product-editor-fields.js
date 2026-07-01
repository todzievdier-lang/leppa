#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { compileStrapi, createStrapi } = require('@strapi/strapi');

const PRODUCT_UID = 'api::product.product';
const appDir = path.resolve(__dirname, '..');
const DIMENSION_FIELDS = [
  ['widthMm', 'Ширина'],
  ['heightMm', 'Высота'],
  ['depthMm', 'Глубина'],
  ['lengthMm', 'Длина'],
  ['diameterMm', 'Диаметр'],
];

const ATTRIBUTE_KEYS_BY_LABEL = {
  'тип изделия': 'productType',
  'цвет': 'color',
  'цвет сиденья': 'seatColor',
  'цвет фурнитуры': 'hardwareColor',
  'поверхность': 'surface',
  'материал': 'material',
  'материал корпуса': 'bodyMaterial',
  'покрытие корпуса': 'bodyFinish',
  'материал фасада': 'facadeMaterial',
  'монтаж': 'mounting',
  'способ монтажа': 'mountingMethod',
  'направление выпуска': 'outletDirection',
  'вид смывающего потока': 'flushFlowType',
  'тип лампы': 'lampType',
  'цвет подсветки': 'lightingColor',
  'страна происхождения': 'countryOfOrigin',
  'гарантия': 'warranty',
  'тип установки': 'installationType',
  'мощность': 'powerW',
  'роль в комплекте': 'kitRole',
  'тип кнопки': 'buttonType',
  'режимы смыва': 'flushModes',
  'совместимость': 'compatibility',
  'отделка': 'finish',
  'бачок': 'flushTank',
  'комплект крепежа': 'mountingKit',
  'бренд': 'brand',
};
const DIMENSION_HEADING_PATTERN = /^(?:размеры?|габариты?|габаритные размеры)\s*:?\s*$/iu;
const DIMENSION_VALUE_PATTERN =
  /^(?:длина|ширина|высота|глубина|диаметр)\s*:\s*\d+(?:[.,]\d+)?\s*(?:мм|mm)?\s*$/iu;
const COMBINED_DIMENSIONS_PATTERN =
  /^(?:размеры?|габариты?|габаритные размеры)(?:\s*\([^)]*\))?\s*:\s*[\d\s.,*xх×-]+(?:мм|mm)\s*$/iu;

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

function isDimensionText(text) {
  const normalizedText = text.trim();

  return (
    DIMENSION_HEADING_PATTERN.test(normalizedText)
    || DIMENSION_VALUE_PATTERN.test(normalizedText)
    || COMBINED_DIMENSIONS_PATTERN.test(normalizedText)
  );
}

function removeDimensionLines(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !isDimensionText(line))
    .join('\n');
}

function cleanDescriptionNode(value) {
  if (Array.isArray(value)) {
    return value.map(cleanDescriptionNode);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const cleaned = { ...value };

  if (typeof cleaned.text === 'string') {
    cleaned.text = removeDimensionLines(cleaned.text);
  }

  if (Array.isArray(cleaned.children)) {
    cleaned.children = cleaned.children.map(cleanDescriptionNode);
  }

  return cleaned;
}

function cleanDescription(description) {
  if (!Array.isArray(description)) {
    return [];
  }

  return description
    .filter((block) => !isDimensionText(getBlockText(block)))
    .map(cleanDescriptionNode)
    .filter((block) => getBlockText(block).trim());
}

function getAttributeKeyFromLabel(label) {
  const normalizedLabel = label.trim().toLocaleLowerCase('ru-RU');

  return (
    ATTRIBUTE_KEYS_BY_LABEL[normalizedLabel]
    ?? `custom:${normalizedLabel.replace(/\s+/g, '-')}`
  );
}

function getLegacyAttributes(product) {
  if (Array.isArray(product.attributes) && product.attributes.length > 0) {
    return product.attributes;
  }

  if (!Array.isArray(product.specifications)) {
    return [];
  }

  return product.specifications
    .filter((specification) => specification?.name && specification?.value)
    .map((specification) => ({
      key: getAttributeKeyFromLabel(String(specification.name)),
      label: String(specification.name),
      value: String(specification.value),
      ...(specification.unit ? { unit: String(specification.unit) } : {}),
    }))
    .filter((attribute) => attribute.value);
}

function getAttributesWithDimensions(product, dimensionFields) {
  if (dimensionFields.length === 0) {
    return getLegacyAttributes(product);
  }

  const dimensionKeys = new Set(dimensionFields.map(([key]) => key));
  const attributes = getLegacyAttributes(product)
    .filter((attribute) => !dimensionKeys.has(attribute?.key));
  const dimensions = dimensionFields
    .map(([key, label]) => {
      const rawValue = product[key];
      const value = rawValue === null || rawValue === undefined || rawValue === ''
        ? Number.NaN
        : Number(rawValue);

      return Number.isFinite(value) && value >= 0
        ? { key, label, value, unit: 'mm' }
        : null;
    })
    .filter(Boolean);

  return [...attributes, ...dimensions];
}

async function migrateStatus(strapi, status, dryRun) {
  const productAttributes = strapi.contentType(PRODUCT_UID).attributes;
  const dimensionFields = DIMENSION_FIELDS
    .filter(([key]) => Object.prototype.hasOwnProperty.call(productAttributes, key));
  const products = await strapi.documents(PRODUCT_UID).findMany({
    status,
    pagination: { pageSize: 1000 },
    fields: [
      'sku',
      'description',
      'attributes',
      ...dimensionFields.map(([key]) => key),
    ],
    populate: {
      specifications: {
        fields: ['name', 'value', 'unit'],
      },
    },
  });

  let updated = 0;
  let restoredAttributes = 0;
  let cleanedDescriptions = 0;
  let migratedDimensions = 0;

  for (const product of products) {
    const data = {};
    const description = cleanDescription(product.description);
    const attributes = getAttributesWithDimensions(product, dimensionFields);

    if (JSON.stringify(description) !== JSON.stringify(product.description ?? [])) {
      data.description = description;
      cleanedDescriptions += 1;
    }

    if (JSON.stringify(attributes) !== JSON.stringify(product.attributes ?? [])) {
      data.attributes = attributes;
      if (!Array.isArray(product.attributes) || product.attributes.length === 0) {
        restoredAttributes += 1;
      }
      if (dimensionFields.some(([key]) => {
        const value = product[key];

        return value !== null && value !== undefined && value !== ''
          && Number.isFinite(Number(value));
      })) {
        migratedDimensions += 1;
      }
    }

    if (Object.keys(data).length === 0) {
      continue;
    }

    if (!dryRun) {
      await strapi.documents(PRODUCT_UID).update({
        documentId: product.documentId,
        status,
        data,
      });
    }

    updated += 1;
  }

  console.log(
    `[${status}] ${dryRun ? 'would update' : 'updated'} ${updated} products `
    + `(${cleanedDescriptions} descriptions, ${restoredAttributes} restored attribute sets, `
    + `${migratedDimensions} dimension sets)`
  );
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
