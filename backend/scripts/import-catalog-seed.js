#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { compileStrapi, createStrapi } = require('@strapi/strapi');

const CATEGORY_UID = 'api::category.category';
const COLOR_UID = 'api::color.color';

const appDir = path.resolve(__dirname, '..');
const colorsFile = path.join(appDir, 'src/data/colors.json');
const categoriesFile = path.join(appDir, 'src/data/categories.json');

function usage() {
  console.log(`
Import catalog seed data (colors and categories) into Strapi.

Usage:
  node scripts/import-catalog-seed.js
  node scripts/import-catalog-seed.js --publish
`);
}

function parseArgs(argv) {
  const options = {
    status: 'draft',
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }

    if (arg === '--publish') {
      options.status = 'published';
    }
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toBlocks(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return [
    {
      type: 'paragraph',
      children: [{ type: 'text', text }],
    },
  ];
}

function hasDraftAndPublish(contentType) {
  return Boolean(contentType?.options?.draftAndPublish);
}

async function findBySlug(strapi, uid, slug, status) {
  const contentType = strapi.contentType(uid);

  if (!contentType) {
    throw new Error(`Content type not found: ${uid}. Run "npm run develop" once to sync the schema.`);
  }

  const searchStatuses = hasDraftAndPublish(contentType)
    ? [status, status === 'draft' ? 'published' : 'draft']
    : [undefined];

  for (const searchStatus of searchStatuses) {
    const params = {
      filters: { slug: { $eq: slug } },
    };

    if (searchStatus) {
      params.status = searchStatus;
    }

    const entry = await strapi.documents(uid).findFirst(params);

    if (entry) {
      return entry;
    }
  }

  return null;
}

async function upsertEntry(strapi, uid, slug, data, status) {
  const existing = await findBySlug(strapi, uid, slug, status);

  if (existing) {
    await strapi.documents(uid).update({
      documentId: existing.documentId,
      status,
      data,
    });

    return 'updated';
  }

  await strapi.documents(uid).create({
    status,
    data: {
      slug,
      ...data,
    },
  });

  return 'created';
}

async function importSeed(strapi, options) {
  const colorsPayload = readJson(colorsFile);
  const categoriesPayload = readJson(categoriesFile);

  for (const color of colorsPayload.colors) {
    const result = await upsertEntry(
      strapi,
      COLOR_UID,
      color.slug,
      {
        name: color.name,
        hex: color.hex,
        sortOrder: color.sortOrder ?? 0,
      },
      options.status,
    );

    console.log(`[color:${result}] ${color.slug}`);
  }

  for (const category of categoriesPayload.categories) {
    const result = await upsertEntry(
      strapi,
      CATEGORY_UID,
      category.slug,
      {
        name: category.name,
        description: toBlocks(category.description),
      },
      options.status,
    );

    console.log(`[category:${result}] ${category.slug}`);
  }
}

async function main() {
  const options = parseArgs(process.argv);

  process.chdir(appDir);

  let strapi;

  try {
    const appContext = await compileStrapi({ appDir });
    strapi = await createStrapi(appContext).load();
    await importSeed(strapi, options);
  } finally {
    if (strapi) {
      await strapi.destroy();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
