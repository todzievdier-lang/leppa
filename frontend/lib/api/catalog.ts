import {
	buildBrandOptions,
	buildFilterGroups,
	filterProducts,
	paginateProducts,
	sortProducts,
} from "@/lib/catalog/filters";
import {
	DEFAULT_CATALOG_PAGE,
	DEFAULT_CATALOG_PER_PAGE,
	DEFAULT_CATALOG_SORT,
} from "@/lib/catalog/query";
import {
	getProductHref,
	getProductImageAlt,
	getProductPrimaryThumbnail,
} from "@/lib/catalog/helpers";
import { isSameSlug } from "@/lib/utils/slug";

import type {
	CatalogQuery,
	CatalogResult,
	Category,
	CategoryKey,
	CategoryLink,
	Product,
	ProductAttribute,
	ProductAttributeValue,
	ProductBundleConfig,
	ProductColor,
	ProductDescriptionBlock,
	ProductDescriptionInlineNode,
	ProductDescriptionInlineText,
	ProductDescriptionListItem,
	ProductImage,
	ProductSearchItem,
} from "@/types/catalog";

type PlainRecord = Record<string, unknown>;

const STRAPI_API_URLS = getConfiguredStrapiApiUrls();
const PRIMARY_STRAPI_API_URL = STRAPI_API_URLS[0] ?? null;
const STRAPI_API_TOKEN = getConfiguredStrapiApiToken();
const STRAPI_PAGE_SIZE = 100;
const STRAPI_MAX_PAGES = 100;
const MAX_BUNDLE_PRODUCTS = 5;

function normalizeStrapiApiUrl(value: string | undefined): string | null {
	const normalizedValue = value?.trim().replace(/\/+$/, "");

	if (!normalizedValue || normalizedValue.includes("api.example.com")) {
		return null;
	}

	return normalizedValue;
}

function getConfiguredStrapiApiUrls(): string[] {
	const urls = [
		normalizeStrapiApiUrl(process.env.STRAPI_API_URL),
		normalizeStrapiApiUrl(process.env.NEXT_PUBLIC_STRAPI_GLOBAL_URL),
		normalizeStrapiApiUrl(process.env.NEXT_PUBLIC_STRAPI_URL),
		normalizeStrapiApiUrl(process.env.NEXT_PUBLIC_API_URL),
	].filter((url): url is string => url !== null);

	return [...new Set(urls)];
}

function isLocalStrapiApiUrl(value: string | null): boolean {
	if (!value) {
		return false;
	}

	try {
		const hostname = new URL(value).hostname;

		return ["localhost", "127.0.0.1", "::1"].includes(hostname);
	} catch {
		return false;
	}
}

function getConfiguredStrapiApiToken(): string | null {
	if (STRAPI_API_URLS.every(isLocalStrapiApiUrl)) {
		return null;
	}

	return process.env.STRAPI_API_TOKEN?.trim() || null;
}

function isRecord(value: unknown): value is PlainRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function getNumber(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);

		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
}

function getBoolean(value: unknown): boolean {
	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "string") {
		return value.toLowerCase() === "true";
	}

	return false;
}

function getStrapiApiUrl(pathname: string, baseUrl: string): URL | null {
	if (!baseUrl) {
		return null;
	}

	return new URL(pathname, baseUrl);
}

function getStrapiRequestHeaders(): HeadersInit | undefined {
	if (!STRAPI_API_TOKEN) {
		return undefined;
	}

	return {
		Authorization: `Bearer ${STRAPI_API_TOKEN}`,
	};
}

async function readResponsePreview(response: Response): Promise<string> {
	try {
		const text = await response.text();
		const trimmed = text.trim();

		if (!trimmed) {
			return "(empty body)";
		}

		return trimmed.slice(0, 300);
	} catch {
		return "(body unreadable)";
	}
}

function logStrapiRequestError(
	pathname: string,
	url: URL,
	response: Response,
	bodyPreview: string,
) {
	const message = [
		`[strapi] Request failed for ${pathname}`,
		`${response.status} ${response.statusText}`,
		url.toString(),
		bodyPreview,
	].join(" | ");

	console.error(message);
}

async function fetchStrapiJson(url: URL, pathname: string): Promise<unknown | null> {
	try {
		const response = await fetch(url, {
			headers: getStrapiRequestHeaders(),
			cache: "no-store",
		});

		if (!response.ok) {
			const preview = await readResponsePreview(response);
			logStrapiRequestError(pathname, url, response, preview);
			return null;
		}

		return (await response.json()) as unknown;
	} catch (error) {
		console.error(
			`[strapi] Request failed for ${pathname} | ${url.toString()} | ${
				error instanceof Error ? error.message : "unknown error"
			}`,
		);
		return null;
	}
}

function resolveStrapiAssetUrl(url: string | null): string | null {
	if (!url) {
		return null;
	}

	if (/^https?:\/\//i.test(url)) {
		return url;
	}

	if (!PRIMARY_STRAPI_API_URL) {
		return url;
	}

	return new URL(url, PRIMARY_STRAPI_API_URL).toString();
}

function getStrapiEntryFields(entry: unknown): PlainRecord | null {
	if (!isRecord(entry)) {
		return null;
	}

	const attributes = isRecord(entry.attributes) ? entry.attributes : {};

	return {
		...entry,
		...attributes,
	};
}

function unwrapStrapiRelation(value: unknown): PlainRecord | null {
	if (!isRecord(value)) {
		return null;
	}

	if ("data" in value) {
		const data = value.data;
		const relation = Array.isArray(data) ? data[0] : data;

		return getStrapiEntryFields(relation);
	}

	return getStrapiEntryFields(value);
}

function unwrapStrapiMedia(value: unknown): PlainRecord | null {
	if (!isRecord(value)) {
		return null;
	}

	if ("data" in value) {
		const data = value.data;
		const media = Array.isArray(data) ? data[0] : data;

		return unwrapStrapiMedia(media);
	}

	return getStrapiEntryFields(value);
}

function unwrapStrapiMediaList(value: unknown): PlainRecord[] {
	if (Array.isArray(value)) {
		return value
			.map(unwrapStrapiMedia)
			.filter((media): media is PlainRecord => media !== null);
	}

	if (isRecord(value) && "data" in value) {
		const data = value.data;

		if (Array.isArray(data)) {
			return data
				.map(unwrapStrapiMedia)
				.filter((media): media is PlainRecord => media !== null);
		}
	}

	const media = unwrapStrapiMedia(value);

	return media ? [media] : [];
}

function getStrapiImageUrl(value: unknown): string | null {
	const media = unwrapStrapiMedia(value);

	if (!media) {
		return null;
	}

	const formats = isRecord(media.formats) ? media.formats : null;
	const large = isRecord(formats?.large) ? getString(formats.large.url) : null;
	const medium = isRecord(formats?.medium)
		? getString(formats.medium.url)
		: null;
	const small = isRecord(formats?.small) ? getString(formats.small.url) : null;
	const original = getString(media.url);

	return resolveStrapiAssetUrl(large ?? medium ?? small ?? original);
}

function getStrapiImageFormatUrl(
	media: PlainRecord,
	formatName: "thumbnail" | "small" | "medium" | "large",
): string | null {
	const formats = isRecord(media.formats) ? media.formats : null;
	const format = isRecord(formats?.[formatName]) ? formats[formatName] : null;

	return resolveStrapiAssetUrl(getString(format?.url));
}

function blockToText(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}

	if (Array.isArray(value)) {
		const hasBlockChildren = value.some((item) =>
			isRecord(item)
			&& typeof item.type === "string"
			&& item.type !== "text"
			&& item.type !== "link",
		);

		return value.map(blockToText).join(hasBlockChildren ? "\n" : "");
	}

	if (!isRecord(value)) {
		return "";
	}

	if (typeof value.text === "string") {
		return value.text;
	}

	if (value.type === "list" && Array.isArray(value.children)) {
		return value.children.map(blockToText).join("\n");
	}

	return blockToText(value.children);
}

function getDescription(value: unknown, fallback = ""): string {
	if (typeof value === "string") {
		return value.trim() || fallback;
	}

	if (Array.isArray(value)) {
		const text = value
			.map(blockToText)
			.map((block) => block.trim())
			.filter(Boolean)
			.join("\n\n");

		return text || fallback;
	}

	return fallback;
}

function getDescriptionInlineText(
	children: ProductDescriptionInlineNode[],
): string {
	return children
		.map((child) => child.type === "text"
			? child.text
			: getDescriptionInlineText(child.children))
		.join("");
}

function getDescriptionTextNode(value: string): ProductDescriptionInlineText {
	return {
		type: "text",
		text: value,
	};
}

function normalizeDescriptionInlineNode(
	value: unknown,
): ProductDescriptionInlineNode | null {
	if (typeof value === "string") {
		return value ? getDescriptionTextNode(value) : null;
	}

	if (!isRecord(value)) {
		return null;
	}

	if (typeof value.text === "string") {
		const textNode: ProductDescriptionInlineText = {
			type: "text",
			text: value.text,
			...(value.bold === true ? { bold: true } : {}),
			...(value.italic === true ? { italic: true } : {}),
			...(value.underline === true ? { underline: true } : {}),
			...(value.strikethrough === true ? { strikethrough: true } : {}),
			...(value.code === true ? { code: true } : {}),
		};

		return textNode.text ? textNode : null;
	}

	if (value.type === "link") {
		const url = getString(value.url);
		const children = normalizeDescriptionInlineNodes(value.children);

		return url && children.length > 0
			? { type: "link", url, children }
			: null;
	}

	const text = blockToText(value).trim();

	return text ? getDescriptionTextNode(text) : null;
}

function normalizeDescriptionInlineNodes(
	value: unknown,
): ProductDescriptionInlineNode[] {
	if (!Array.isArray(value)) {
		const node = normalizeDescriptionInlineNode(value);

		return node ? [node] : [];
	}

	return value
		.map(normalizeDescriptionInlineNode)
		.filter((node): node is ProductDescriptionInlineNode => node !== null);
}

function normalizeDescriptionListItem(
	value: unknown,
): ProductDescriptionListItem | null {
	if (!isRecord(value)) {
		return null;
	}

	const children = normalizeDescriptionInlineNodes(value.children);

	if (getDescriptionInlineText(children).trim()) {
		return {
			type: "list-item",
			children,
		};
	}

	const text = blockToText(value).trim();

	return text
		? {
				type: "list-item",
				children: [getDescriptionTextNode(text)],
			}
		: null;
}

function normalizeDescriptionListItems(
	value: unknown,
): ProductDescriptionListItem[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map(normalizeDescriptionListItem)
		.filter((item): item is ProductDescriptionListItem => item !== null);
}

function normalizeDescriptionHeadingLevel(
	value: unknown,
): 1 | 2 | 3 | 4 | 5 | 6 {
	const level = getNumber(value);

	return level && level >= 1 && level <= 6
		? (level as 1 | 2 | 3 | 4 | 5 | 6)
		: 3;
}

function normalizeDescriptionBlock(value: unknown): ProductDescriptionBlock | null {
	if (!isRecord(value)) {
		return null;
	}

	const type = getString(value.type);

	if (type === "list") {
		const children = normalizeDescriptionListItems(value.children);

		return children.length > 0
			? {
					type: "list",
					format: value.format === "ordered" ? "ordered" : "unordered",
					children,
				}
			: null;
	}

	const children = normalizeDescriptionInlineNodes(value.children);

	if (!getDescriptionInlineText(children).trim()) {
		return null;
	}

	if (type === "heading") {
		return {
			type: "heading",
			level: normalizeDescriptionHeadingLevel(value.level),
			children,
		};
	}

	if (type === "quote" || type === "code") {
		return { type, children };
	}

	return {
		type: "paragraph",
		children,
	};
}

function getDescriptionBlocks(value: unknown): ProductDescriptionBlock[] {
	if (typeof value === "string") {
		return value
			.split(/\n{2,}/)
			.map((line) => line.trim())
			.filter(Boolean)
			.map((text) => ({
				type: "paragraph",
				children: [getDescriptionTextNode(text)],
			}));
	}

	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map(normalizeDescriptionBlock)
		.filter((block): block is ProductDescriptionBlock => block !== null);
}

function getStrapiSeo(value: unknown): Category["seo"] | undefined {
	if (!isRecord(value)) {
		return undefined;
	}

	const title = getString(value.title) ?? undefined;
	const description = getString(value.description) ?? undefined;

	return title || description ? { title, description } : undefined;
}

function isAttributeValue(value: unknown): value is ProductAttributeValue {
	return (
		typeof value === "string"
		|| typeof value === "number"
		|| typeof value === "boolean"
		|| (
			Array.isArray(value)
			&& value.every((item) => typeof item === "string")
		)
	);
}

function parseJsonArray(value: unknown): unknown[] {
	if (Array.isArray(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim()) {
		try {
			const parsed = JSON.parse(value);

			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	return [];
}

function normalizeAttributeRecords(value: unknown): PlainRecord[] {
	const normalizedArray = parseJsonArray(value);

	if (normalizedArray.length > 0) {
		return normalizedArray.filter((entry): entry is PlainRecord => isRecord(entry));
	}

	if (isRecord(value)) {
		if (Array.isArray(value.attributes)) {
			return value.attributes.filter((entry): entry is PlainRecord => isRecord(entry));
		}

		return Object.entries(value)
			.filter(([, attributeValue]) => isAttributeValue(attributeValue))
			.map(([key, attributeValue]) => ({
				key,
				label: key,
				value: attributeValue,
			}));
	}

	return [];
}

function mapProductAttributes(value: unknown): ProductAttribute[] {
	const attributes: ProductAttribute[] = [];

	normalizeAttributeRecords(value).forEach((attribute) => {
		if (!isRecord(attribute)) {
			return;
		}

		const key = getString(attribute.key);
		const label = getString(attribute.label);
		const attributeValue = attribute.value;

		if (!key || !label || !isAttributeValue(attributeValue)) {
			return;
		}

		const unit = getString(attribute.unit);

		attributes.push({
			key,
			label,
			value: attributeValue,
			...(unit ? { unit } : {}),
		});
	});

	return attributes;
}

const ATTRIBUTE_KEYS_BY_LABEL: Record<string, string> = {
	"тип изделия": "productType",
	"цвет": "color",
	"цвет сиденья": "seatColor",
	"цвет фурнитуры": "hardwareColor",
	"поверхность": "surface",
	"материал": "material",
	"материал корпуса": "bodyMaterial",
	"покрытие корпуса": "bodyFinish",
	"материал фасада": "facadeMaterial",
	"монтаж": "mounting",
	"способ монтажа": "mountingMethod",
	"направление выпуска": "outletDirection",
	"вид смывающего потока": "flushFlowType",
	"тип лампы": "lampType",
	"цвет подсветки": "lightingColor",
	"страна происхождения": "countryOfOrigin",
	"гарантия": "warranty",
	"тип установки": "installationType",
	"мощность": "powerW",
	"роль в комплекте": "kitRole",
	"тип кнопки": "buttonType",
	"режимы смыва": "flushModes",
	"совместимость": "compatibility",
	"отделка": "finish",
	"бачок": "flushTank",
	"комплект крепежа": "mountingKit",
	"бренд": "brand",
};

function getAttributeKeyFromLabel(label: string): string {
	const normalizedLabel = label.trim().toLocaleLowerCase("ru-RU");

	return ATTRIBUTE_KEYS_BY_LABEL[normalizedLabel]
		?? `custom:${normalizedLabel.replace(/\s+/g, "-")}`;
}

function mapProductSpecifications(value: unknown): ProductAttribute[] {
	return parseJsonArray(value)
		.filter((entry): entry is PlainRecord => isRecord(entry))
		.map((entry): ProductAttribute | null => {
			const label = getString(entry.name) ?? getString(entry.label);
			const attributeValue = getString(entry.value);

			if (!label || !attributeValue) {
				return null;
			}

			const unit = getString(entry.unit);

			return {
				key: getAttributeKeyFromLabel(label),
				label,
				value: attributeValue,
				...(unit ? { unit } : {}),
			};
		})
		.filter((attribute): attribute is ProductAttribute => attribute !== null);
}

function mapProductDimensions(fields: PlainRecord): ProductAttribute[] {
	return [
		["widthMm", "Ширина"],
		["heightMm", "Высота"],
		["depthMm", "Глубина"],
		["lengthMm", "Длина"],
		["diameterMm", "Диаметр"],
	]
		.map(([key, label]): ProductAttribute | null => {
			const value = getNumber(fields[key]);

			return value === null
				? null
				: { key, label, value, unit: "mm" };
		})
		.filter((attribute): attribute is ProductAttribute => attribute !== null);
}

function mergeProductAttributes(
	legacyAttributes: ProductAttribute[],
	specifications: ProductAttribute[],
	dimensions: ProductAttribute[],
): ProductAttribute[] {
	const attributesByKey = new Map<string, ProductAttribute>();

	[...legacyAttributes, ...specifications, ...dimensions].forEach((attribute) => {
		attributesByKey.set(attribute.key, attribute);
	});

	return [...attributesByKey.values()];
}

function normalizeBundleProductSlugs(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => {
			if (typeof item === "string") {
				return getString(item);
			}

			if (isRecord(item)) {
				return (
					getString(item.slug)
					?? getString(item.productSlug)
					?? getString(item.product_slug)
				);
			}

			return null;
		})
		.filter((slug): slug is string => slug !== null);
}

function mapProductBundles(value: unknown): ProductBundleConfig[] {
	const bundleRecords = parseJsonArray(value).filter((entry): entry is PlainRecord =>
		isRecord(entry),
	);

	return bundleRecords
		.map((bundle): ProductBundleConfig | null => {
			const productSlugs = normalizeBundleProductSlugs(
				bundle.productSlugs
					?? bundle.product_slugs
					?? bundle.items
					?? bundle.products,
			).slice(0, MAX_BUNDLE_PRODUCTS);

			if (productSlugs.length < 2) {
				return null;
			}

			const discountPercent = getNumber(
				bundle.discountPercent ?? bundle.discount_percent ?? bundle.discount,
			);

			return {
				discountPercent:
					discountPercent !== null && discountPercent > 0
						? discountPercent
						: 6,
				productSlugs,
			};
		})
		.filter((bundle): bundle is ProductBundleConfig => bundle !== null);
}

function mapProductImages(value: unknown, productName: string): ProductImage[] {
	const images: ProductImage[] = [];

	unwrapStrapiMediaList(value).forEach((media, index) => {
		const originalUrl = resolveStrapiAssetUrl(getString(media.url));
		const thumbnailUrl = getStrapiImageFormatUrl(media, "thumbnail");
		const smallUrl = getStrapiImageFormatUrl(media, "small");
		const mediumUrl = getStrapiImageFormatUrl(media, "medium");
		const largeUrl = getStrapiImageFormatUrl(media, "large");
		const url = originalUrl ?? largeUrl ?? mediumUrl ?? smallUrl ?? thumbnailUrl;

		if (!url) {
			return;
		}

		const label = getString(media.caption) ?? getString(media.name);
		const alt =
			getString(media.alternativeText) ??
			getString(media.caption) ??
			productName;

		images.push({
			url,
			...(thumbnailUrl ? { thumbnailUrl } : {}),
			...(smallUrl ? { smallUrl } : {}),
			...(mediumUrl ? { mediumUrl } : {}),
			...(largeUrl ? { largeUrl } : {}),
			alt,
			...(label ? { label } : {}),
			...(index === 0 ? { role: "main" } : {}),
		});
	});

	return images;
}

function mapProductVideos(value: unknown): string[] {
	return unwrapStrapiMediaList(value)
		.map((media) => resolveStrapiAssetUrl(getString(media.url)))
		.filter((url): url is string => url !== null);
}

function getPaginationPageCount(payload: unknown): number | null {
	if (!isRecord(payload) || !isRecord(payload.meta)) {
		return null;
	}

	if (!isRecord(payload.meta.pagination)) {
		return null;
	}

	return getNumber(payload.meta.pagination.pageCount);
}

function addStrapiFields(url: URL, fields: string[]) {
	fields.forEach((field, index) => {
		url.searchParams.set(`fields[${index}]`, field);
	});
}

function addStrapiPopulateFields(
	url: URL,
	relation: string,
	fields: string[],
) {
	fields.forEach((field, index) => {
		url.searchParams.set(`populate[${relation}][fields][${index}]`, field);
	});
}

async function fetchStrapiCollection(
	pathname: string,
	configureUrl?: (url: URL) => void,
): Promise<unknown[]> {
	if (STRAPI_API_URLS.length === 0) {
		return [];
	}

	for (const baseUrl of STRAPI_API_URLS) {
		const entries = await fetchStrapiCollectionFromBaseUrl(
			baseUrl,
			pathname,
			configureUrl,
		);

		if (entries.length > 0 || STRAPI_API_URLS.length === 1) {
			return entries;
		}

		console.warn(
			`[strapi] Empty collection for ${pathname} from ${baseUrl}; trying next configured URL.`,
		);
	}

	return [];
}

async function fetchStrapiCollectionFromBaseUrl(
	baseUrl: string,
	pathname: string,
	configureUrl?: (url: URL) => void,
): Promise<unknown[]> {
	const entries: unknown[] = [];
	let page = 1;
	let pageCount: number | null = null;

	do {
		const url = getStrapiApiUrl(pathname, baseUrl);

		if (!url) {
			return entries;
		}

		configureUrl?.(url);
		url.searchParams.set("pagination[page]", String(page));
		url.searchParams.set("pagination[pageSize]", String(STRAPI_PAGE_SIZE));

		const payload = await fetchStrapiJson(url, pathname);

		if (!payload) {
			return entries;
		}

		const data = isRecord(payload) && Array.isArray(payload.data)
			? payload.data
			: [];

		entries.push(...data);
		pageCount = getPaginationPageCount(payload);

		if (!pageCount && data.length < STRAPI_PAGE_SIZE) {
			break;
		}

		page += 1;
	} while (pageCount ? page <= pageCount : page < STRAPI_MAX_PAGES);

	return entries;
}

function mapStrapiCategory(entry: unknown): Category | null {
	const fields = getStrapiEntryFields(entry);

	if (!fields) {
		return null;
	}

	const name = getString(fields.name);
	const slug = getString(fields.slug);

	if (!name || !slug) {
		return null;
	}

	return {
		key: slug,
		slug,
		name,
		englishName:
			getString(fields.englishName) ??
			getString(fields.english_name) ??
			name,
		description: getDescription(fields.description),
		image: getStrapiImageUrl(fields.image),
		seo: getStrapiSeo(fields.seo),
	};
}

function mapStrapiColor(entry: unknown): ProductColor | null {
	const fields = getStrapiEntryFields(entry);

	if (!fields) {
		return null;
	}

	const name = getString(fields.name);
	const slug = getString(fields.slug);
	const hex = getString(fields.hex);

	if (!name || !slug || !hex) {
		return null;
	}

	return {
		id:
			getString(fields.documentId) ??
			getString(fields.id) ??
			slug,
		slug,
		name,
		hex,
		sortOrder: getNumber(fields.sortOrder) ?? 0,
	};
}

function mapStrapiProduct(entry: unknown): Product | null {
	const fields = getStrapiEntryFields(entry);

	if (!fields) {
		return null;
	}

	const name = getString(fields.name);
	const slug = getString(fields.slug);
	const categoryFields = unwrapStrapiRelation(fields.category);
	const categorySlug = getString(categoryFields?.slug)
		?? getString(fields.categorySlug)
		?? getString(fields.category_key);

	if (!name || !slug || !categorySlug) {
		return null;
	}

	const colorFields = unwrapStrapiRelation(fields.color);
	const attributes = mergeProductAttributes(
		mapProductAttributes(fields.attributes),
		mapProductSpecifications(fields.specifications),
		mapProductDimensions(fields),
	);

	return {
		id:
			getString(fields.documentId) ??
			getString(fields.id) ??
			String(getNumber(fields.id) ?? slug),
		slug,
		sku: getString(fields.sku),
		baseSku: getString(fields.baseSku),
		color: mapStrapiColor(colorFields),
		name,
		brand: getString(fields.brand),
		categoryKey: categorySlug,
		price: getNumber(fields.price),
		currency: getString(fields.currency),
		inStock: getBoolean(fields.inStock),
		description: getDescription(fields.description),
		descriptionBlocks: getDescriptionBlocks(fields.description),
		images: mapProductImages(fields.images, name),
		videos: mapProductVideos(fields.videos),
		attributes,
		bundles: mapProductBundles(fields.bundles),
	};
}

async function fetchStrapiCategories(): Promise<Category[]> {
	const entries = await fetchStrapiCollection("/api/categories", (url) => {
		addStrapiFields(url, ["name", "slug", "description"]);
		addStrapiPopulateFields(url, "image", [
			"url",
			"alternativeText",
			"caption",
			"name",
			"formats",
		]);
		url.searchParams.set("sort", "name:asc");
	});
	const categories = entries
		.map(mapStrapiCategory)
		.filter((category): category is Category => category !== null);

	return categories;
}

async function fetchStrapiProducts(): Promise<Product[]> {
	const entries = await fetchStrapiCollection("/api/products", (url) => {
		addStrapiFields(url, [
			"slug",
			"sku",
			"baseSku",
			"name",
			"brand",
			"price",
			"widthMm",
			"heightMm",
			"depthMm",
			"lengthMm",
			"diameterMm",
			"bundles",
			"description",
			"attributes",
			"inStock",
		]);
		addStrapiPopulateFields(url, "images", [
			"url",
			"alternativeText",
			"caption",
			"name",
			"formats",
		]);
		addStrapiPopulateFields(url, "videos", ["url"]);
		addStrapiPopulateFields(url, "specifications", ["name", "value", "unit"]);
		addStrapiPopulateFields(url, "category", ["slug"]);
		addStrapiPopulateFields(url, "color", ["name", "slug", "hex", "sortOrder"]);
		url.searchParams.set("sort", "name:asc");
	});

	return entries
		.map(mapStrapiProduct)
		.filter((product): product is Product => product !== null);
}

function normalizeCatalogQuery(query: CatalogQuery): CatalogResult["query"] {
	return {
		...query,
		page: query.page ?? DEFAULT_CATALOG_PAGE,
		perPage: query.perPage ?? DEFAULT_CATALOG_PER_PAGE,
		sort: query.sort ?? DEFAULT_CATALOG_SORT,
		brand: query.brand ?? [],
		filters: query.filters ?? {},
	};
}

export async function getCategories(): Promise<Category[]> {
	return fetchStrapiCategories();
}

export async function getFooterCategories(): Promise<CategoryLink[]> {
	const categories = await getCategories();

	return categories.map(({ key, slug, name }) => ({ key, slug, name }));
}

export async function getCategoryBySlug(
	slug: string,
): Promise<Category | null> {
	const categories = await getCategories();

	return categories.find((category) => isSameSlug(category.slug, slug)) ?? null;
}

export async function getProducts(): Promise<Product[]> {
	return fetchStrapiProducts();
}

export async function getProductSearchItems(): Promise<ProductSearchItem[]> {
	const [categories, products] = await Promise.all([
		getCategories(),
		getProducts(),
	]);
	const categoryByKey = new Map(
		categories.map((category) => [category.key, category]),
	);

	return sortProducts(products, "name-asc").map((product) => {
		const category = categoryByKey.get(product.categoryKey) ?? null;

		return {
			id: product.id,
			name: product.name,
			sku: product.sku,
			href: getProductHref(product, category),
			image: getProductPrimaryThumbnail(product),
			imageAlt: getProductImageAlt(product),
			categoryName: category?.name ?? "Каталог",
			price: product.price,
			currency: product.currency,
			inStock: product.inStock,
		};
	});
}

export async function getProductBySlug(
	slug: string,
	categoryKey?: CategoryKey,
): Promise<Product | null> {
	const products = await getProducts();

	return (
		products.find((product) => {
			if (product.slug !== slug) {
				return false;
			}

			return categoryKey ? product.categoryKey === categoryKey : true;
		}) ?? null
	);
}

export async function getCatalog(
	query: CatalogQuery = {},
): Promise<CatalogResult> {
	const normalizedQuery = normalizeCatalogQuery(query);
	const searchlessQuery = {
		...normalizedQuery,
		search: undefined,
	};
	const [categories, allProducts] = await Promise.all([
		getCategories(),
		getProducts(),
	]);
	const activeCategory = normalizedQuery.categoryKey
		? (categories.find(
				(category) => category.key === normalizedQuery.categoryKey,
			) ?? null)
		: null;
	const filteredCatalogProducts = filterProducts(allProducts, normalizedQuery);
	const searchableProducts = sortProducts(
		filterProducts(allProducts, searchlessQuery),
		normalizedQuery.sort,
	);
	const paginatedResult = paginateProducts(
		searchableProducts,
		normalizedQuery.page,
		normalizedQuery.perPage,
	);

	return {
		categories,
		activeCategory,
		products: paginatedResult.items,
		searchableProducts,
		total: paginatedResult.meta.total,
		pagination: paginatedResult.meta,
		query: normalizedQuery,
		brandOptions: buildBrandOptions(filteredCatalogProducts),
		filterGroups: buildFilterGroups(filteredCatalogProducts),
	};
}
