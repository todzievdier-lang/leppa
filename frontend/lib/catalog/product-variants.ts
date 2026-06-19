import { getProductHref } from "@/lib/catalog/helpers";
import { formatProductPrice } from "@/lib/utils/price";

import type { Category, Product, ProductAttribute } from "@/types/catalog";

export type ProductSizeVariant = {
	product: Product;
	href: string;
	label: string;
	priceLabel: string;
	isActive: boolean;
	inStock: boolean;
};

export type ProductColorVariant = {
	product: Product;
	href: string;
	label: string;
	hex: string;
	isLight: boolean;
	isActive: boolean;
	inStock: boolean;
};

type SizeValue = {
	key: string;
	valueLabel: string;
	unitLabel: string | null;
	sortValue: number | string;
};

const EXPLICIT_SIZE_ATTRIBUTE_KEYS = new Set([
	"size",
	"sizes",
	"dimension",
	"dimensions",
]);

const DIMENSION_ATTRIBUTE_KEYS = [
	"diametermm",
	"diameter",
	"widthmm",
	"width",
	"heightmm",
	"height",
	"lengthmm",
	"length",
	"depthmm",
	"depth",
];

const SIZE_ATTRIBUTE_KEYS = new Set([
	...EXPLICIT_SIZE_ATTRIBUTE_KEYS,
	...DIMENSION_ATTRIBUTE_KEYS,
]);

const COLOR_ATTRIBUTE_KEYS = new Set([
	"color",
	"coloroptions",
	"colors",
	"availablecolors",
	"availablecolours",
]);

const UNIT_LABELS: Record<string, string> = {
	cm: "см",
	mm: "мм",
	"см": "см",
	"мм": "мм",
};

function normalizeText(value: string | null | undefined) {
	return (value ?? "")
		.trim()
		.toLocaleLowerCase("ru-RU")
		.replace(/\s+/g, " ");
}

function normalizeAttributeKey(key: string) {
	return key.trim().toLocaleLowerCase("en-US");
}

function normalizeAttributeValue(value: ProductAttribute["value"]) {
	if (Array.isArray(value)) {
		return value
			.map((item) => item.trim().toLocaleLowerCase("ru-RU"))
			.sort()
			.join(",");
	}

	return String(value).trim().toLocaleLowerCase("ru-RU");
}

function isSizeAttribute(attribute: ProductAttribute) {
	return SIZE_ATTRIBUTE_KEYS.has(normalizeAttributeKey(attribute.key));
}

function isColorAttribute(attribute: ProductAttribute) {
	return COLOR_ATTRIBUTE_KEYS.has(normalizeAttributeKey(attribute.key));
}

function isLightHex(hex: string) {
	const normalizedHex = hex.replace("#", "");

	if (!/^[0-9a-f]{6}$/i.test(normalizedHex)) {
		return false;
	}

	const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
	const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
	const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);
	const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

	return luminance >= 0.82;
}

function getProductSeriesKey(product: Product) {
	return `name:${normalizeText(product.name).replace(
		/\b\d{2,4}\s*[xх×]\s*\d{1,4}(?:\s*[xх×]\s*\d{1,4})?\s*(?:mm|мм|cm|см)?\b/gi,
		"",
	).trim()}`;
}

function getStableAttributesKey(product: Product) {
	return product.attributes
		.filter((attribute) => !isSizeAttribute(attribute) && !isColorAttribute(attribute))
		.map((attribute) => [
			normalizeAttributeKey(attribute.key),
			normalizeAttributeValue(attribute.value),
			normalizeText(attribute.unit),
		].join(":"))
		.sort()
		.join("|");
}

function getColorVariantGroupKey(product: Product) {
	const groupSku = normalizeText(product.baseSku ?? product.sku);

	if (groupSku) {
		return `${product.categoryKey}::sku:${groupSku}`;
	}

	return [
		product.categoryKey,
		normalizeText(product.brand),
		getProductSeriesKey(product),
		getStableAttributesKey(product),
	].join("::");
}

function getVariantGroupKey(product: Product) {
	const colorIdentity = product.color?.id
		? `color:${product.color.id}`
		: "";

	const groupSku = normalizeText(product.baseSku ?? product.sku);

	if (groupSku) {
		return [
			product.categoryKey,
			`sku:${groupSku}`,
			colorIdentity,
			getStableAttributesKey(product),
		].join("::");
	}

	return [
		product.categoryKey,
		normalizeText(product.brand),
		getProductSeriesKey(product),
		colorIdentity,
		getStableAttributesKey(product),
	].join("::");
}

function getNumberishValue(value: ProductAttribute["value"]) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim()) {
		const normalizedValue = Number(value.replace(",", "."));

		return Number.isFinite(normalizedValue) ? normalizedValue : null;
	}

	return null;
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("ru-RU", {
		maximumFractionDigits: 1,
	}).format(value);
}

function parseLocalizedNumber(value: string): number | null {
	const normalizedValue = Number(value.replace(",", "."));

	return Number.isFinite(normalizedValue) ? normalizedValue : null;
}

function getLeadingSizeLabel(label: string) {
	const match = label.match(/\d+(?:[,.]\d+)?/u);

	if (!match) {
		return label;
	}

	const value = parseLocalizedNumber(match[0]);
	const shouldDisplayCentimeters =
		value !== null
		&& /\bmm\b|мм/iu.test(label)
		&& Math.abs(value) >= 100
		&& value % 10 === 0;

	return value !== null
		? formatNumber(shouldDisplayCentimeters ? value / 10 : value)
		: match[0];
}

function getUnitLabel(unit?: string) {
	const normalizedUnit = normalizeText(unit);

	return normalizedUnit ? (UNIT_LABELS[normalizedUnit] ?? unit ?? null) : null;
}

function formatSizeValue(attribute: ProductAttribute): SizeValue {
	const unitLabel = getUnitLabel(attribute.unit);
	const numericValue = getNumberishValue(attribute.value);

	if (numericValue == null) {
		return {
			key: normalizeAttributeKey(attribute.key),
			valueLabel: String(attribute.value),
			unitLabel,
			sortValue: normalizeAttributeValue(attribute.value),
		};
	}

	const shouldDisplayCentimeters =
		unitLabel === "мм"
		&& Math.abs(numericValue) >= 100
		&& numericValue % 10 === 0;

	return {
		key: normalizeAttributeKey(attribute.key),
		valueLabel: formatNumber(
			shouldDisplayCentimeters ? numericValue / 10 : numericValue,
		),
		unitLabel: shouldDisplayCentimeters ? "см" : unitLabel,
		sortValue: numericValue,
	};
}

function getAttributeMap(product: Product) {
	return new Map(
		product.attributes.map((attribute) => [
			normalizeAttributeKey(attribute.key),
			attribute,
		]),
	);
}

function getExplicitSizeLabel(product: Product) {
	const attributesByKey = getAttributeMap(product);
	const attribute = [...EXPLICIT_SIZE_ATTRIBUTE_KEYS]
		.map((key) => attributesByKey.get(key))
		.find((entry): entry is ProductAttribute => Boolean(entry));

	if (!attribute) {
		return null;
	}

	const size = formatSizeValue(attribute);

	return size.unitLabel
		? `${size.valueLabel} ${size.unitLabel}`
		: size.valueLabel;
}

function getDimensionValues(product: Product) {
	const attributesByKey = getAttributeMap(product);
	const dimensions = new Map<string, SizeValue>();

	DIMENSION_ATTRIBUTE_KEYS.forEach((key) => {
		const attribute = attributesByKey.get(key);

		if (attribute) {
			dimensions.set(key, formatSizeValue(attribute));
		}
	});

	return dimensions;
}

function getPreferredDimensionKeys(products: Product[]) {
	const dimensionsByProduct = products.map(getDimensionValues);
	const presentKeys = DIMENSION_ATTRIBUTE_KEYS.filter((key) =>
		dimensionsByProduct.some((dimensions) => dimensions.has(key)),
	);
	const changedKeys = presentKeys.filter((key) => {
		const values = new Set(
			dimensionsByProduct
				.map((dimensions) => dimensions.get(key)?.sortValue)
				.filter((value) => value !== undefined),
		);

		return values.size > 1;
	});

	if (changedKeys.length === 1) {
		return changedKeys;
	}

	const diameterKey = presentKeys.find((key) => key.startsWith("diameter"));

	if (diameterKey && !presentKeys.some((key) => key.startsWith("width"))) {
		return [diameterKey];
	}

	const widthKey = presentKeys.find((key) => key.startsWith("width"));
	const heightKey = presentKeys.find((key) => key.startsWith("height"));
	const widthHeightKeys = [widthKey, heightKey].filter(
		(key): key is string => Boolean(key),
	);

	if (widthHeightKeys.length > 0) {
		return widthHeightKeys;
	}

	return changedKeys.length > 0 ? changedKeys : presentKeys;
}

function getDimensionLabel(product: Product, keys: string[]) {
	const dimensions = getDimensionValues(product);
	const values = keys
		.map((key) => dimensions.get(key))
		.filter((value): value is SizeValue => Boolean(value));

	if (values.length === 0) {
		return null;
	}

	const sharedUnit = values.every(
		(value) => value.unitLabel === values[0]?.unitLabel,
	)
		? values[0]?.unitLabel
		: null;

	if (sharedUnit) {
		return `${values.map((value) => value.valueLabel).join(" x ")} ${sharedUnit}`;
	}

	return values
		.map((value) =>
			value.unitLabel
				? `${value.valueLabel} ${value.unitLabel}`
				: value.valueLabel,
		)
		.join(" x ");
}

function getProductSizeLabel(product: Product, dimensionKeys: string[]) {
	const label = getExplicitSizeLabel(product) ?? getDimensionLabel(product, dimensionKeys);

	return label ? getLeadingSizeLabel(label) : null;
}

function compareVariants(
	left: ProductSizeVariant,
	right: ProductSizeVariant,
	dimensionKeys: string[],
) {
	const leftDimensions = getDimensionValues(left.product);
	const rightDimensions = getDimensionValues(right.product);

	for (const key of dimensionKeys) {
		const leftValue = leftDimensions.get(key)?.sortValue;
		const rightValue = rightDimensions.get(key)?.sortValue;

		if (typeof leftValue === "number" && typeof rightValue === "number") {
			if (leftValue !== rightValue) {
				return leftValue - rightValue;
			}
		}

		if (typeof leftValue === "string" && typeof rightValue === "string") {
			const compared = leftValue.localeCompare(rightValue, "ru");

			if (compared !== 0) {
				return compared;
			}
		}
	}

	return left.label.localeCompare(right.label, "ru");
}

function uniqueProducts(products: Product[]) {
	const productsById = new Map<string, Product>();

	products.forEach((product) => {
		productsById.set(product.id, product);
	});

	return [...productsById.values()];
}

function compareColorVariants(
	left: ProductColorVariant,
	right: ProductColorVariant,
) {
	if (left.product.color?.sortOrder !== right.product.color?.sortOrder) {
		return (left.product.color?.sortOrder ?? 0) - (right.product.color?.sortOrder ?? 0);
	}

	return left.label.localeCompare(right.label, "ru");
}

export function getProductColorVariants(
	product: Product,
	products: Product[],
	category?: Pick<Category, "slug"> | null,
): ProductColorVariant[] {
	const availableProducts = uniqueProducts([product, ...products]);
	const groupKey = getColorVariantGroupKey(product);
	const groupProducts = availableProducts.filter(
		(candidate) =>
			candidate.categoryKey === product.categoryKey
			&& getColorVariantGroupKey(candidate) === groupKey
			&& candidate.color !== null,
	);

	if (groupProducts.length <= 1) {
		return [];
	}

	return groupProducts
		.map((variantProduct) => {
			const hex = variantProduct.color?.hex ?? "#d7d7d2";

			return {
				product: variantProduct,
				href: getProductHref(variantProduct, category),
				label: variantProduct.color?.name ?? variantProduct.name,
				hex,
				isLight: isLightHex(hex),
				isActive: variantProduct.id === product.id,
				inStock: variantProduct.inStock,
			};
		})
		.sort(compareColorVariants);
}

export function getProductSizeVariants(
	product: Product,
	products: Product[],
	category?: Pick<Category, "slug"> | null,
): ProductSizeVariant[] {
	const availableProducts = uniqueProducts([product, ...products]);
	const groupKey = getVariantGroupKey(product);
	const groupProducts = availableProducts.filter(
		(candidate) =>
			candidate.categoryKey === product.categoryKey
			&& getVariantGroupKey(candidate) === groupKey,
	);

	if (groupProducts.length <= 1) {
		return [];
	}

	const dimensionKeys = getPreferredDimensionKeys(groupProducts);
	const variants = groupProducts
		.map((variantProduct) => {
			const label = getProductSizeLabel(variantProduct, dimensionKeys);

			return label
				? {
						product: variantProduct,
						href: getProductHref(variantProduct, category),
						label,
						priceLabel: formatProductPrice(variantProduct),
						isActive: variantProduct.id === product.id,
						inStock: variantProduct.inStock,
					}
				: null;
		})
		.filter((variant): variant is ProductSizeVariant => variant !== null);

	if (new Set(variants.map((variant) => variant.label)).size <= 1) {
		return [];
	}

	return variants.sort((left, right) =>
		compareVariants(left, right, dimensionKeys),
	);
}
