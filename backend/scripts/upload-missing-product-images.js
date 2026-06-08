#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_ENV_FILE = path.resolve(__dirname, '../../frontend/.env.local');
const DEFAULT_PUBLIC_ROOT = 'https://disk.yandex.ru/d/d_RPetUWa6ZKBw';
const YANDEX_PUBLIC_RESOURCE_API = 'https://cloud-api.yandex.net/v1/disk/public/resources';

const PRODUCTS = [
  {
    slug: 'leppa-podvesnoy-unitaz-leppa-445a',
    name: 'Подвесной унитаз Leppa 445A',
    folderPath: '/Унитаз/5',
  },
  {
    slug: 'wenston-napolnyy-umnyy-unitaz-wenston-h65',
    name: 'Напольный умный унитаз Wenston H65',
    folderPath: '/Унитаз/H65',
  },
  {
    slug: 'wenston-napolnyy-umnyy-unitaz-wenston-h88',
    name: 'Напольный умный унитаз Wenston H88',
    folderPath: '/Унитаз/H88',
  },
  {
    slug: 'wenston-napolnyy-umnyy-unitaz-wenston-h99',
    name: 'Напольный умный унитаз Wenston H99',
    folderPath: '/Унитаз/H99',
  },
  {
    slug: 'wenston-napolnyy-umnyy-unitaz-wenston-sz2d',
    name: 'Напольный умный унитаз Wenston SZ2D',
    folderPath: '/Унитаз/SZ2D',
  },
  {
    slug: 'wenston-podvesnoy-umnyy-unitaz-s-installyatsiey-v-komplekte-wenston-t13',
    name: 'Подвесной умный унитаз с инсталляцией в комплекте Wenston T13',
    folderPath: '/Унитаз/Т13',
  },
  {
    slug: 'wenston-vodonagrevatel-k9-dsk-85a-black',
    name: 'Водонагреватель K9-DSK-85A black',
    folderPath: '/Водонагреватель/Фото/K9-DSK-85A black',
  },
];

function usage() {
  console.log(`
Upload missing product images from the public Yandex Disk folder and attach them to Strapi products.

Usage:
  node scripts/upload-missing-product-images.js --dry-run
  node scripts/upload-missing-product-images.js --apply
  node scripts/upload-missing-product-images.js --apply --only wenston-napolnyy-umnyy-unitaz-wenston-h65

Options:
  --apply                  Write changes. Required unless --dry-run is set.
  --dry-run                Print what would be uploaded and attached.
  --env <path>             Env file with NEXT_PUBLIC_STRAPI_GLOBAL_URL and STRAPI_API_TOKEN.
                           Defaults to ../frontend/.env.local from the repo root.
  --api-url <url>          Strapi API base URL. Overrides env.
  --token <token>          Strapi API token. Overrides env.
  --public-root <url>      Public Yandex Disk root URL.
  --only <slug>            Process one product slug. Can be used multiple times.
  --replace-existing       Replace Product.images even when it already has media.
`);
}

function parseArgs(argv) {
  const options = {
    apiUrl: null,
    apply: false,
    dryRun: false,
    envFile: DEFAULT_ENV_FILE,
    only: new Set(),
    publicRoot: DEFAULT_PUBLIC_ROOT,
    replaceExisting: false,
    token: null,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }

    if (arg === '--apply') {
      options.apply = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--replace-existing') {
      options.replaceExisting = true;
      continue;
    }

    if (arg === '--env' || arg === '--api-url' || arg === '--token' || arg === '--public-root' || arg === '--only') {
      const value = argv[index + 1];

      if (!value) {
        throw new Error(`${arg} requires a value`);
      }

      index += 1;

      if (arg === '--env') {
        options.envFile = path.resolve(process.cwd(), value);
      } else if (arg === '--api-url') {
        options.apiUrl = value;
      } else if (arg === '--token') {
        options.token = value;
      } else if (arg === '--public-root') {
        options.publicRoot = value;
      } else if (arg === '--only') {
        options.only.add(value);
      }

      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (options.apply && options.dryRun) {
    throw new Error('Use either --apply or --dry-run, not both.');
  }

  if (!options.apply && !options.dryRun) {
    throw new Error('Pass --apply to write changes or --dry-run to preview them.');
  }

  return options;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) {
      continue;
    }

    env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  }

  return env;
}

function getConfig(options) {
  const env = readEnvFile(options.envFile);
  const apiUrl = options.apiUrl || env.NEXT_PUBLIC_STRAPI_GLOBAL_URL || env.STRAPI_API_URL || env.NEXT_PUBLIC_STRAPI_URL;
  const token = options.token || env.STRAPI_API_TOKEN || '';

  if (!apiUrl) {
    throw new Error('Strapi API URL was not found. Set --api-url or NEXT_PUBLIC_STRAPI_GLOBAL_URL.');
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    token,
  };
}

function getAuthHeaders(token) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function fetchWithRetry(url, init = {}, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(120000),
      });

      if (response.ok || response.status < 500 || attempt === attempts) {
        return response;
      }

      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }

  throw lastError;
}

async function readErrorBody(response) {
  try {
    const text = await response.text();
    return text.trim().slice(0, 500);
  } catch {
    return '(body unreadable)';
  }
}

async function fetchJson(url, init = {}) {
  const response = await fetchWithRetry(url, init);

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status} ${response.statusText}: ${await readErrorBody(response)}`);
  }

  return response.json();
}

function apiUrl(config, pathname) {
  return new URL(pathname, `${config.apiUrl}/`).toString();
}

function isImageResource(item) {
  return item?.type === 'file' && (item.media_type === 'image' || String(item.mime_type || '').startsWith('image/'));
}

function sortByName(left, right) {
  return String(left.name || '').localeCompare(String(right.name || ''), 'ru', {
    numeric: true,
    sensitivity: 'base',
  });
}

async function listYandexImages(publicRoot, folderPath) {
  const url = new URL(YANDEX_PUBLIC_RESOURCE_API);
  url.searchParams.set('public_key', publicRoot);
  url.searchParams.set('path', folderPath);
  url.searchParams.set('limit', '200');

  const data = await fetchJson(url);
  const items = data?._embedded?.items || [];

  return items.filter(isImageResource).sort(sortByName);
}

function sanitizeFilenamePart(value) {
  return (
    String(value || '')
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9_.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 90) || 'image'
  );
}

function getExtension(item) {
  const ext = path.extname(item.name || '');

  if (ext) {
    return ext.toLowerCase();
  }

  if (item.mime_type === 'image/png') {
    return '.png';
  }

  if (item.mime_type === 'image/webp') {
    return '.webp';
  }

  return '.jpg';
}

function buildUploadName(product, item, index) {
  const number = String(index + 1).padStart(2, '0');
  const baseName = sanitizeFilenamePart(path.basename(item.name || `image-${number}`, path.extname(item.name || '')));

  return `${product.slug}-${number}-${baseName}${getExtension(item)}`;
}

async function findProduct(config, slug) {
  const url = new URL(apiUrl(config, '/api/products'));
  url.searchParams.set('filters[slug][$eq]', slug);
  url.searchParams.set('pagination[pageSize]', '1');
  url.searchParams.set('populate[images][fields][0]', 'id');

  const data = await fetchJson(url, {
    headers: getAuthHeaders(config.token),
  });
  const product = data?.data?.[0] || null;

  if (!product) {
    return null;
  }

  return {
    documentId: product.documentId,
    id: product.id,
    imageIds: Array.isArray(product.images) ? product.images.map((image) => image.id).filter(Boolean) : [],
    name: product.name,
    slug: product.slug,
  };
}

async function findUploadedFile(config, name) {
  const url = new URL(apiUrl(config, '/api/upload/files'));
  url.searchParams.set('filters[name][$eq]', name);
  url.searchParams.set('pagination[pageSize]', '1');

  const files = await fetchJson(url, {
    headers: getAuthHeaders(config.token),
  });

  return Array.isArray(files) ? files[0] || null : null;
}

async function downloadImage(item) {
  if (!item.file) {
    throw new Error(`Yandex resource ${item.path || item.name} does not include a download URL.`);
  }

  const response = await fetchWithRetry(item.file);

  if (!response.ok) {
    throw new Error(`Download failed for ${item.path || item.name}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || item.mime_type || 'application/octet-stream';
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    buffer,
    contentType,
  };
}

async function uploadImage(config, product, item, index, options) {
  const uploadName = buildUploadName(product, item, index);
  const existing = await findUploadedFile(config, uploadName);

  if (existing?.id) {
    console.log(`[media:reused] ${uploadName}`);
    return existing;
  }

  if (options.dryRun) {
    console.log(`[dry-run:media] upload ${item.path} -> ${uploadName}`);
    return { id: index + 1, name: uploadName };
  }

  const { buffer, contentType } = await downloadImage(item);
  const form = new FormData();
  const fileInfo = {
    alternativeText: product.name,
    caption: item.name || null,
    name: uploadName,
  };

  form.append('files', new Blob([buffer], { type: contentType }), uploadName);
  form.append('fileInfo', JSON.stringify(fileInfo));

  const uploaded = await fetchJson(apiUrl(config, '/api/upload'), {
    method: 'POST',
    headers: getAuthHeaders(config.token),
    body: form,
  });
  const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;

  if (!file?.id) {
    throw new Error(`Strapi upload did not return a file id for ${uploadName}`);
  }

  console.log(`[media:uploaded] ${uploadName} (${Math.round(buffer.length / 1024)} KB)`);
  return file;
}

async function attachImages(config, product, fileIds, options) {
  if (options.dryRun) {
    console.log(`[dry-run:update] ${product.slug} images=${fileIds.length}`);
    return;
  }

  const url = new URL(apiUrl(config, `/api/products/${product.documentId}`));
  url.searchParams.set('status', 'published');

  await fetchJson(url, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(config.token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        images: fileIds,
      },
    }),
  });

  console.log(`[updated] ${product.slug} images=${fileIds.length}`);
}

async function processProduct(config, productConfig, options, stats) {
  const product = await findProduct(config, productConfig.slug);

  if (!product) {
    console.warn(`[warn] Product not found in Strapi: ${productConfig.slug}`);
    stats.missingProducts += 1;
    return;
  }

  if (product.imageIds.length > 0 && !options.replaceExisting) {
    console.log(`[skip] ${product.slug} already has ${product.imageIds.length} image(s)`);
    stats.skipped += 1;
    return;
  }

  const yandexImages = await listYandexImages(options.publicRoot, productConfig.folderPath);

  if (yandexImages.length === 0) {
    console.warn(`[warn] No images found in ${productConfig.folderPath} for ${product.slug}`);
    stats.emptyFolders += 1;
    return;
  }

  console.log(`[product] ${product.slug} <- ${productConfig.folderPath} (${yandexImages.length} image(s))`);

  const files = [];

  for (let index = 0; index < yandexImages.length; index += 1) {
    const file = await uploadImage(config, { ...product, name: productConfig.name || product.name }, yandexImages[index], index, options);
    files.push(file);
  }

  const fileIds = files.map((file) => file.id).filter(Boolean);

  await attachImages(config, product, fileIds, options);

  stats.updated += 1;
  stats.images += yandexImages.length;
}

async function main() {
  const options = parseArgs(process.argv);
  const config = getConfig(options);
  const products = options.only.size > 0 ? PRODUCTS.filter((product) => options.only.has(product.slug)) : PRODUCTS;
  const stats = {
    emptyFolders: 0,
    images: 0,
    missingProducts: 0,
    skipped: 0,
    updated: 0,
  };

  if (products.length === 0) {
    throw new Error('No products matched --only.');
  }

  console.log(`[info] Strapi API: ${config.apiUrl}`);
  console.log(`[info] Products queued: ${products.length}`);
  console.log(`[info] Mode: ${options.dryRun ? 'dry-run' : 'apply'}`);

  for (const product of products) {
    await processProduct(config, product, options, stats);
  }

  console.log(
    `[done] updated=${stats.updated} skipped=${stats.skipped} missingProducts=${stats.missingProducts} emptyFolders=${stats.emptyFolders} images=${stats.images}`
  );
}

main().catch((error) => {
  console.error('[error]', error.message);
  process.exit(1);
});
