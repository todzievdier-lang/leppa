import {
	getProductHref,
	getProductPrimaryImage,
} from "@/lib/catalog/helpers";
import { formatProductPrice } from "@/lib/utils/price";

import type { Category, Product } from "@/types/catalog";
import type { ShopProductOption, ShopProductSnapshot } from "@/types/shop";

export function getShopProductSnapshot(
	product: Product,
	category?: Pick<Category, "slug"> | null,
	selectedOptions: ShopProductOption[] = [],
): ShopProductSnapshot {
	const optionKey = selectedOptions
		.map((option) => `${option.label}:${option.value}`)
		.join("|");

	return {
		id: product.id,
		...(optionKey ? { lineId: `${product.id}::${optionKey}` } : {}),
		name: product.name,
		sku: product.sku,
		href: getProductHref(product, category),
		image: getProductPrimaryImage(product),
		priceLabel: formatProductPrice(product),
		inStock: product.inStock,
		price: product.price,
		currency: product.currency,
		...(selectedOptions.length > 0 ? { selectedOptions } : {}),
	};
}
