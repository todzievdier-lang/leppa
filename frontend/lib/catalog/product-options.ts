import type { Product } from "@/types/catalog";

export type ProductColorOption = {
	label: string;
	value: string;
	swatch: string;
};

const COLOR_OPTION_KEYS = new Set([
	"coloroptions",
	"colors",
	"availablecolors",
	"availablecolours",
]);

const COLOR_SWATCHES: Record<string, string> = {
	"белый": "#f7f5ef",
	"белая": "#f7f5ef",
	"белое": "#f7f5ef",
	"серый": "#8c8c86",
	"серая": "#8c8c86",
	"серое": "#8c8c86",
	"черный": "#111111",
	"черная": "#111111",
	"черное": "#111111",
	"чёрный": "#111111",
	"чёрная": "#111111",
	"чёрное": "#111111",
	"хром": "#c7c9c9",
	"хром матовый": "#b8b9b5",
	"золото": "#caa756",
	"золото матовое": "#bd9b52",
	"прозрачное": "#e7edf2",
};

function normalizeKey(value: string) {
	return value.trim().toLocaleLowerCase("en-US");
}

function normalizeColor(value: string) {
	return value.trim().toLocaleLowerCase("ru-RU").replace(/\s+/g, " ");
}

function getSwatch(label: string) {
	const normalizedLabel = normalizeColor(label);

	return COLOR_SWATCHES[normalizedLabel] ?? "#d7d7d2";
}

function toColorValues(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value
			.filter((item): item is string => typeof item === "string")
			.map((item) => item.trim())
			.filter(Boolean);
	}

	if (typeof value !== "string") {
		return [];
	}

	return value
		.split(/[;,/|]/)
		.map((item) => item.trim())
		.filter(Boolean);
}

export function getProductColorOptions(product: Product): ProductColorOption[] {
	const colorAttribute = product.attributes.find((attribute) =>
		COLOR_OPTION_KEYS.has(normalizeKey(attribute.key)),
	);
	const values = toColorValues(colorAttribute?.value);
	const uniqueValues = [...new Set(values)];

	return uniqueValues.map((value) => ({
		label: value,
		value: normalizeColor(value),
		swatch: getSwatch(value),
	}));
}

export function getSelectedColorOption(
	options: ProductColorOption[],
	selectedValue: string | null,
) {
	return (
		options.find((option) => option.value === selectedValue)
		?? options[0]
		?? null
	);
}
