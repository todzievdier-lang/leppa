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

function getProductSeriesKey(product: Product) {
	const model = normalizeText(product.model);

	if (model) {
		return `model:${model}`;
	}

	return `name:${normalizeText(product.name).replace(
		/\b\d{2,4}\s*[xх×]\s*\d{1,4}(?:\s*[xх×]\s*\d{1,4})?\s*(?:mm|мм|cm|см)?\b/gi,
		"",
	).trim()}`;
}

function getVariantGroupKey(product: Product) {
	const stableAttributes = product.attributes
		.filter((attribute) => !isSizeAttribute(attribute))
		.map((attribute) => [
			normalizeAttributeKey(attribute.key),
			normalizeAttributeValue(attribute.value),
			normalizeText(attribute.unit),
		].join(":"))
		.sort()
		.join("|");

	return [
		product.categoryKey,
		normalizeText(product.brand),
		getProductSeriesKey(product),
		stableAttributes,
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
	return getExplicitSizeLabel(product) ?? getDimensionLabel(product, dimensionKeys);
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
