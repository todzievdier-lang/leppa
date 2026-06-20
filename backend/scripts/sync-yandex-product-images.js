#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const APP_DIR = path.resolve(__dirname, '..');
const DEFAULT_ENV_FILE = path.resolve(APP_DIR, '..', 'frontend', '.env.local');
const DEFAULT_PUBLIC_ROOT = 'https://disk.yandex.ru/d/d_RPetUWa6ZKBw';
const YANDEX_API = 'https://cloud-api.yandex.net/v1/disk/public/resources';

const TOILET_SOURCE_NAMES = {
  '445V': '5',
  '448A': '448',
  '684VA': '684V',
};

const TOILET_DRAWINGS = {
  '407V': '407V.png',
  '448A': '448.png',
  '449A': '449A.png',
  '462VA': '462VA.png',
  '470VA': '470VA.png',
  '476VA': '476VA.png',
  '478VA': '478VA.png',
  '626': '626.png',
  '681VA': '681VA.png',
  '684VA': '684VA.png',
  '8089': '8089.png',
  '948V': '948V.png',
  '951V': '951V.png',
};

const SMART_TOILET_DRAWINGS = {
  H65: 'H65.png',
  H88: 'H88.png',
  H99: 'H99.png',
  SZ2D: 'SZ2D.png',
  T13: 'T13.png',
};

const HEATER_DRAWINGS = {
  'DSK-55A': 'DSK-55A.png',
  'DSK-55B': 'DSK-55B.png',
  'DSK-55C': 'DSK-55С.png',
  'DSK-55D': 'DSK-55D.png',
  'DSK-55E': 'DSK-55E.png',
  'H2-B-DSK-85C black': 'H2-B-DSK-85C black.png',
  'H2-B-DSK-85C white': 'H2-B-DSK-85C white.png',
  'K03-DSK-85E': 'K03-DSK-85E.png',
  'K9-DSK-85A black': 'K9-DSK-85A black.png',
  'K9-DSK-85A white': 'K9-DSK-85A white.png',
  'V20-DSK-85D black': 'V20-DSK-85D Black.png',
  'V20-DSK-85D white': 'V20-DSK-85D White.png',
  'X1-DSK-85 black': 'X1-DSK-85 black.png',
  'X1-DSK-85 brown': 'X1-DSK-85 brown.png',
  'X7-DSK-85B': 'X7-DSK-85B.png',
};

const BUTTON_SOURCE_NAMES = {
  'WENSTON-BUTTON-001G': '001G',
  'WENSTON-BUTTON-001S': '001S',
  'WENSTON-BUTTON-601BL': '601Bl',
  'WENSTON-BUTTON-603BS': '603BS',
  'WENSTON-BUTTON-603BL': '603Bl',
  'WENSTON-BUTTON-603G': '603G',
  'WENSTON-BUTTON-606BL': '606Bl',
  'WENSTON-BUTTON-608BL': '608Bl',
  'WENSTON-BUTTON-608GG': '608GG',
  'WENSTON-BUTTON-608ZG': '608ZG',
};

function usage() {
  console.log(`
Synchronize every product image from the public Yandex Disk source.

Usage:
  npm run sync:yandex-images -- --dry-run
  npm run sync:yandex-images -- --apply

Options:
  --dry-run             Validate mappings, folders and source images without writing.
  --apply               Upload originals, replace Product.images and remove superseded files.
  --only <slug>         Process one product slug. Can be repeated.
  --keep-old            Do not delete superseded and unattached media after a successful sync.
  --env <path>          Frontend env file with Strapi URL/token.
  --public-root <url>   Override the public Yandex Disk URL.
`);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    dryRun: false,
    envFile: DEFAULT_ENV_FILE,
    keepOld: false,
    only: new Set(),
    publicRoot: DEFAULT_PUBLIC_ROOT,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    if (arg === '--apply') options.apply = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--keep-old') options.keepOld = true;
    else if (arg === '--env' || arg === '--only' || arg === '--public-root') {
      const value = argv[++index];
      if (!value) throw new Error(`${arg} requires a value`);
      if (arg === '--env') options.envFile = path.resolve(process.cwd(), value);
      else if (arg === '--only') options.only.add(value);
      else options.publicRoot = value;
    } else throw new Error(`Unknown option: ${arg}`);
  }

  if (options.apply === options.dryRun) {
    throw new Error('Use exactly one of --apply or --dry-run.');
  }
  return options;
}

function readEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function getConfig(options) {
  const env = readEnv(options.envFile);
  const temporaryTokenFile = path.join(APP_DIR, '.tmp', 'yandex-sync-token');
  const apiUrl =
    process.env.STRAPI_API_URL
    || env.NEXT_PUBLIC_STRAPI_GLOBAL_URL
    || env.STRAPI_API_URL
    || env.NEXT_PUBLIC_STRAPI_URL
    || 'http://127.0.0.1:1337';
  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    token:
      process.env.STRAPI_API_TOKEN
      || env.STRAPI_API_TOKEN
      || (fs.existsSync(temporaryTokenFile) ? fs.readFileSync(temporaryTokenFile, 'utf8').trim() : ''),
  };
}

function authHeaders(config) {
  return config.token ? { Authorization: `Bearer ${config.token}` } : {};
}

async function fetchWithRetry(url, init = {}, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(180000),
      });
      if (response.ok || response.status < 500 || attempt === attempts) return response;
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  throw lastError;
}

async function fetchJson(url, init = {}) {
  const response = await fetchWithRetry(url, init);
  if (!response.ok) {
    const body = (await response.text()).slice(0, 500);
    throw new Error(`${url} returned ${response.status}: ${body}`);
  }
  return response.json();
}

function strapiUrl(config, pathname) {
  return new URL(pathname, `${config.apiUrl}/`).toString();
}

async function fetchProducts(config) {
  const url = new URL(strapiUrl(config, '/api/products'));
  url.searchParams.set('pagination[pageSize]', '100');
  ['slug', 'sku', 'baseSku', 'name', 'widthMm', 'heightMm'].forEach((field, index) => {
    url.searchParams.set(`fields[${index}]`, field);
  });
  url.searchParams.set('populate[category][fields][0]', 'slug');
  url.searchParams.set('populate[images][fields][0]', 'id');
  const body = await fetchJson(url, { headers: authHeaders(config) });
  return body.data || [];
}

function heaterVariantName(product) {
  const slug = String(product.slug || '').toLowerCase();
  const sku = product.sku;
  if (['H2-B-DSK-85C', 'K9-DSK-85A', 'V20-DSK-85D', 'X1-DSK-85'].includes(sku)) {
    const color = slug.endsWith('-white') ? 'white' : slug.endsWith('-brown') ? 'brown' : 'black';
    return `${sku} ${color}`;
  }
  return sku;
}

function mirrorDrawingName(product) {
  const model = product.sku;
  if (!['BASE', 'BERTA', 'ROYAL'].includes(model)) {
    return ['LAURA', 'LEON', 'LORD', 'RUNO'].includes(model)
      ? `${model[0]}${model.slice(1).toLowerCase()}.png`
      : null;
  }
  if (!product.widthMm || !product.heightMm) return null;
  const label = `${product.widthMm}х${product.heightMm}`;
  return `${model[0]}${model.slice(1).toLowerCase()} ${label}.png`;
}

function productSources(product) {
  const category = product.category?.slug;
  const sku = product.sku;
  if (!category || !sku) return null;

  if (category === 'unitazy' || category === 'rakoviny') {
    const sourceName = TOILET_SOURCE_NAMES[sku] || sku;
    const sources = [{ path: `/Унитаз/${sourceName}` }];
    if (TOILET_DRAWINGS[sku]) {
      sources.push({ path: '/Чертежи/Чертежи унитазов', names: [TOILET_DRAWINGS[sku]] });
    }
    return { category, targetFolder: sku, sources };
  }

  if (category === 'umnye-unitazy') {
    const sourceName = sku === 'T13' ? 'Т13' : sku;
    const sources = [{ path: `/Унитаз/${sourceName}` }];
    if (SMART_TOILET_DRAWINGS[sku]) {
      sources.push({ path: '/Чертежи/Чертежи умных унитазов', names: [SMART_TOILET_DRAWINGS[sku]] });
    }
    return { category, targetFolder: sku, sources };
  }

  if (category === 'installations') {
    return { category, targetFolder: sku, sources: [{ path: '/Инсталляция' }] };
  }

  if (category === 'flush-buttons') {
    const sourceName = BUTTON_SOURCE_NAMES[sku];
    return sourceName
      ? { category, targetFolder: sku, sources: [{ path: `/Кнопки/${sourceName}` }] }
      : null;
  }

  if (category === 'vodonagrevateli') {
    const variant = heaterVariantName(product);
    const sourceVariant = variant === 'V20-DSK-85D white' ? 'V20-DSK-85D White' : variant;
    const sources = [{ path: `/Водонагреватель/Фото/${sourceVariant}` }];
    if (HEATER_DRAWINGS[variant]) {
      sources.push({ path: '/Чертежи/Чертеж - водонагреватель', names: [HEATER_DRAWINGS[variant]] });
    }
    return { category, targetFolder: variant, sources };
  }

  if (category === 'zerkala') {
    const sources = [{ path: `/Зеркало /${sku}` }];
    if (sku === 'BASE') {
      sources.push({ path: '/Зеркало /BASE 2' }, { path: '/Зеркало /BASE 3' });
      if (product.widthMm === 800 && product.heightMm === 800) {
        sources.push({ path: '/Зеркало /BASE квадратные' });
      }
    }
    if (sku === 'RUNO') sources.push({ path: '/Зеркало /RUNO 2' });
    if (sku === 'BERTA' || sku === 'ROYAL') {
      const extraByWidth = {
        400: '/Зеркало /ROYAL и BERTA 400x800',
        600: '/Зеркало /ROYAL и BERTA 600x800',
        800: sku === 'ROYAL' ? '/Зеркало /ROYAL 800x800' : null,
        1000: '/Зеркало /ROYAL и BERTA 1000x800',
        1200: '/Зеркало /ROYAL и BERTA 1200x800',
      };
      if (extraByWidth[product.widthMm]) sources.push({ path: extraByWidth[product.widthMm] });
    }
    const drawingName = mirrorDrawingName(product);
    if (drawingName) {
      sources.push({ path: '/Чертежи/Чертеж - Зеркало', names: [drawingName] });
    }
    return { category, targetFolder: sku, sources };
  }

  return null;
}

function naturalSort(left, right) {
  return String(left.name).localeCompare(String(right.name), 'ru', {
    numeric: true,
    sensitivity: 'base',
  });
}

function isImage(item) {
  return item?.type === 'file' && (item.media_type === 'image' || String(item.mime_type).startsWith('image/'));
}

function createYandexReader(publicRoot) {
  const cache = new Map();
  return async function read(source) {
    if (!cache.has(source.path)) {
      const url = new URL(YANDEX_API);
      url.searchParams.set('public_key', publicRoot);
      url.searchParams.set('path', source.path);
      url.searchParams.set('limit', '1000');
      cache.set(source.path, fetchJson(url).then((body) => (body._embedded?.items || []).filter(isImage).sort(naturalSort)));
    }
    const items = await cache.get(source.path);
    if (!source.names) return items;
    const wanted = new Set(source.names.map((name) => name.normalize('NFC')));
    return items.filter((item) => wanted.has(String(item.name).normalize('NFC')));
  };
}

function findFolder(db, category, name) {
  return db.prepare(`
    SELECT child.id, child.name, child.path
    FROM upload_folders child
    JOIN upload_folders_parent_lnk link ON link.folder_id = child.id
    JOIN upload_folders parent ON parent.id = link.inv_folder_id
    WHERE lower(child.name) = lower(?) AND parent.name = ?
    LIMIT 1
  `).get(name, category);
}

function sanitizePart(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'image';
}

function uploadName(targetFolder, item) {
  const extension = path.extname(item.name || '').toLowerCase() || '.jpg';
  const basename = path.basename(item.name || 'image', path.extname(item.name || ''));
  const hash = crypto.createHash('sha1').update(item.path).digest('hex').slice(0, 10);
  return `${sanitizePart(targetFolder)}-${hash}-${sanitizePart(basename)}${extension}`;
}

async function findUploadedFile(config, name) {
  const url = new URL(strapiUrl(config, '/api/upload/files'));
  url.searchParams.set('filters[name][$eq]', name);
  url.searchParams.set('pagination[pageSize]', '1');
  const body = await fetchJson(url, { headers: authHeaders(config) });
  return Array.isArray(body) ? body[0] || null : null;
}

async function uploadItem(config, product, plan, item, options, stats) {
  const name = uploadName(plan.targetFolder, item);
  const existing = await findUploadedFile(config, name);
  if (existing?.id) {
    stats.reused += 1;
    return existing;
  }
  if (options.dryRun) return { id: 0, name };
  if (!item.file) throw new Error(`${item.path} has no original download URL`);

  const response = await fetchWithRetry(item.file);
  if (!response.ok) throw new Error(`Download failed for ${item.path}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || item.mime_type || 'application/octet-stream';
  if (item.size && buffer.length !== item.size) {
    throw new Error(`Size mismatch for ${item.path}: expected ${item.size}, downloaded ${buffer.length}`);
  }

  const form = new FormData();
  form.append('files', new Blob([buffer], { type: contentType }), name);
  form.append('fileInfo', JSON.stringify({
    alternativeText: product.name,
    caption: item.name,
    folder: plan.folder.id,
    name,
  }));
  const body = await fetchJson(strapiUrl(config, '/api/upload'), {
    method: 'POST',
    headers: authHeaders(config),
    body: form,
  });
  const file = Array.isArray(body) ? body[0] : body;
  if (!file?.id) throw new Error(`Upload returned no file id for ${item.path}`);
  stats.uploaded += 1;
  stats.bytes += buffer.length;
  console.log(`[uploaded] ${product.sku}: ${item.name} (${Math.round(buffer.length / 1024)} KB)`);
  return file;
}

async function updateProduct(config, product, imageIds) {
  const url = new URL(strapiUrl(config, `/api/products/${product.documentId}`));
  url.searchParams.set('status', 'published');
  await fetchJson(url, {
    method: 'PUT',
    headers: { ...authHeaders(config), 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { images: imageIds } }),
  });
}

async function deleteFile(config, id) {
  const response = await fetchWithRetry(strapiUrl(config, `/api/upload/files/${id}`), {
    method: 'DELETE',
    headers: authHeaders(config),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete media ${id}: ${response.status} ${(await response.text()).slice(0, 300)}`);
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function main() {
  const options = parseArgs(process.argv);
  const config = getConfig(options);
  const db = new Database(path.join(APP_DIR, '.tmp', 'data.db'), { readonly: true });
  const readYandex = createYandexReader(options.publicRoot);

  try {
    let products = await fetchProducts(config);
    if (options.only.size) products = products.filter((product) => options.only.has(product.slug));
    if (!products.length) throw new Error('No products matched the requested scope.');

    const plans = [];
    for (const product of products) {
      const sourcePlan = productSources(product);
      if (!sourcePlan) throw new Error(`No Yandex mapping for ${product.category?.slug}/${product.sku} (${product.slug})`);
      const folder = findFolder(db, sourcePlan.category, sourcePlan.targetFolder);
      if (!folder) throw new Error(`Media folder not found: /products/${sourcePlan.category}/${sourcePlan.targetFolder}`);

      const batches = [];
      for (const source of sourcePlan.sources) {
        const items = await readYandex(source);
        if (!items.length) throw new Error(`No matching images in ${source.path} for ${product.slug}`);
        batches.push(...items);
      }
      const seen = new Set();
      const items = batches.filter((item) => !seen.has(item.path) && seen.add(item.path));
      plans.push({ ...sourcePlan, folder, items, product });
      console.log(`[plan] ${product.slug}: ${items.length} originals -> /products/${sourcePlan.category}/${folder.name}`);
    }

    const uniqueSourcePaths = new Set(plans.flatMap((plan) => plan.items.map((item) => item.path)));
    console.log(`[preflight] products=${plans.length} uniqueOriginals=${uniqueSourcePaths.size} mode=${options.dryRun ? 'dry-run' : 'apply'}`);
    if (options.dryRun) return;

    const stats = { uploaded: 0, reused: 0, bytes: 0, updated: 0, deleted: 0 };
    const newFileIds = new Set();
    const oldFileIds = new Set();
    const uploadCache = new Map();

    for (const plan of plans) {
      for (const image of plan.product.images || []) if (image.id) oldFileIds.add(image.id);
      const files = [];
      for (const item of plan.items) {
        const key = `${plan.folder.id}:${item.path}`;
        if (!uploadCache.has(key)) {
          uploadCache.set(key, uploadItem(config, plan.product, plan, item, options, stats));
        }
        files.push(await uploadCache.get(key));
      }
      const ids = files.map((file) => file.id).filter(Boolean);
      ids.forEach((id) => newFileIds.add(id));
      await updateProduct(config, plan.product, ids);
      stats.updated += 1;
      console.log(`[updated] ${plan.product.slug}: images=${ids.length}`);
    }

    if (!options.keepOld) {
      const unattached = db.prepare(`
        SELECT f.id FROM files f
        LEFT JOIN files_related_mph relation ON relation.file_id = f.id
        WHERE relation.file_id IS NULL
      `).all().map((row) => row.id);
      const candidates = new Set([...oldFileIds, ...unattached]);
      const toDelete = [...candidates].filter((id) => !newFileIds.has(id));
      await mapWithConcurrency(toDelete, 4, async (id) => {
        await deleteFile(config, id);
        stats.deleted += 1;
      });
    }

    console.log(`[done] products=${stats.updated} uploaded=${stats.uploaded} reused=${stats.reused} downloadedMB=${(stats.bytes / 1024 / 1024).toFixed(1)} deletedOld=${stats.deleted}`);
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error('[error]', error.stack || error.message);
  process.exit(1);
});
