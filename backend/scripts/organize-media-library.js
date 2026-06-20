#!/usr/bin/env node
'use strict';

const path = require('node:path');
const Database = require('better-sqlite3');
const { compileStrapi, createStrapi } = require('@strapi/strapi');

const APP_DIR = path.resolve(__dirname, '..');
const FILE_UID = 'plugin::upload.file';

function parseArgs(argv) {
  const options = { apply: false, dryRun: false, prune: false };
  for (const arg of argv.slice(2)) {
    if (arg === '--apply') options.apply = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--prune-unattached') options.prune = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (options.apply === options.dryRun) throw new Error('Use exactly one of --apply or --dry-run.');
  return options;
}

function heaterFolderName(sku, slug) {
  if (!['H2-B-DSK-85C', 'K9-DSK-85A', 'V20-DSK-85D', 'X1-DSK-85'].includes(sku)) return sku;
  const normalizedSlug = String(slug).toLowerCase();
  const color = normalizedSlug.endsWith('-white') ? 'white' : normalizedSlug.endsWith('-brown') ? 'brown' : 'black';
  return `${sku} ${color}`;
}

function getFolder(db, category, name) {
  return db.prepare(`
    SELECT child.id, child.name, child.path
    FROM upload_folders child
    JOIN upload_folders_parent_lnk link ON link.folder_id = child.id
    JOIN upload_folders parent ON parent.id = link.inv_folder_id
    WHERE parent.name = ? AND lower(child.name) = lower(?)
    LIMIT 1
  `).get(category, name);
}

function makePlans() {
  const db = new Database(path.join(APP_DIR, '.tmp', 'data.db'), { readonly: true });
  try {
    const rows = db.prepare(`
      SELECT
        f.id,
        f.name,
        f.folder_path AS folderPath,
        group_concat(DISTINCT CASE WHEN relation.related_type = 'api::category.category' THEN category.slug END) AS categoryImage,
        group_concat(DISTINCT CASE WHEN relation.related_type = 'api::product.product' THEN product_category.slug END) AS productCategory,
        group_concat(DISTINCT product.sku) AS skus,
        group_concat(DISTINCT product.slug) AS slugs
      FROM files f
      LEFT JOIN files_related_mph relation ON relation.file_id = f.id
      LEFT JOIN categories category
        ON relation.related_type = 'api::category.category' AND category.id = relation.related_id
      LEFT JOIN products product
        ON relation.related_type = 'api::product.product' AND product.id = relation.related_id
      LEFT JOIN products_category_lnk category_link ON category_link.product_id = product.id
      LEFT JOIN categories product_category ON product_category.id = category_link.category_id
      GROUP BY f.id
      ORDER BY f.id
    `).all();
    const categoriesFolder = db.prepare(`SELECT id, name, path FROM upload_folders WHERE name = 'categories' LIMIT 1`).get();

    return rows.map((row) => {
      let folder = null;
      if (row.categoryImage) {
        folder = categoriesFolder;
      } else if (row.productCategory && row.skus) {
        const category = row.productCategory.split(',')[0];
        const sku = row.skus.split(',')[0];
        const slug = row.slugs?.split(',')[0] || '';
        const folderName = category === 'vodonagrevateli' ? heaterFolderName(sku, slug) : sku;
        folder = getFolder(db, category, folderName);
      } else if (row.name.startsWith('leon-')) {
        folder = getFolder(db, 'zerkala', 'LEON');
      }
      return { ...row, folder };
    });
  } finally {
    db.close();
  }
}

async function main() {
  const options = parseArgs(process.argv);
  const plans = makePlans();
  const moves = plans.filter((plan) => plan.folder && plan.folderPath !== plan.folder.path);
  const unattached = plans.filter((plan) => !plan.categoryImage && !plan.productCategory && !plan.folder);
  const missingFolders = plans.filter((plan) => (plan.categoryImage || plan.productCategory) && !plan.folder);

  console.log(`[plan] moves=${moves.length} unattached=${unattached.length} missingFolders=${missingFolders.length}`);
  for (const plan of missingFolders) console.warn(`[missing-folder] ${plan.id} ${plan.name}`);
  if (missingFolders.length) throw new Error('Some attached media cannot be mapped to a target folder.');
  if (options.dryRun) return;

  process.chdir(APP_DIR);
  let app;
  try {
    app = await createStrapi(await compileStrapi({ appDir: APP_DIR })).load();
    for (const plan of moves) {
      await app.plugin('upload').service('upload').updateFileInfo(plan.id, { folder: plan.folder.id });
      console.log(`[moved] ${plan.name} -> ${plan.folder.path}`);
    }
    if (options.prune) {
      for (const plan of unattached) {
        const file = await app.db.query(FILE_UID).findOne({ where: { id: plan.id } });
        if (file) await app.plugin('upload').service('upload').remove(file);
        console.log(`[removed] ${plan.name}`);
      }
    }
    const apiUploads = await app.db.query('plugin::upload.folder').findOne({ where: { name: 'API Uploads' } });
    if (apiUploads) {
      const count = await app.db.query(FILE_UID).count({ where: { folderPath: apiUploads.path } });
      if (count === 0) await app.plugin('upload').service('folder').deleteByIds([apiUploads.id]);
    }
  } finally {
    if (app) await app.destroy();
  }
}

main().catch((error) => {
  console.error('[error]', error.stack || error.message);
  process.exit(1);
});
