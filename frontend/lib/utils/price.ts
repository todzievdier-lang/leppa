import type { Product, ProductAttribute } from "@/types/catalog";

const UNIT_LABELS: Record<string, string> = {
	mm: "мм",
	cm: "см",
	W: "Вт",
	kW: "кВт",
	V: "В",
};

export function formatPrice(
	price: number | null | undefined,
	currency = "RUB",
): string {
	if (price == null) {
		return "Цена по запросу";
	}

	return new Intl.NumberFormat("ru-RU", {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(price);
}

export function formatProductPrice(product: Product): string {
	return formatPrice(product.price, product.currency ?? "RUB");
}

export function formatAttributeValue(attribute: ProductAttribute): string {
	if (Array.isArray(attribute.value)) {
		return attribute.value.join(", ");
	}

	const value = String(attribute.value);

	if (!attribute.unit) {
		return value;
	}

	return `${value} ${UNIT_LABELS[attribute.unit] ?? attribute.unit}`;
}
