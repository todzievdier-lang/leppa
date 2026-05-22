import { categories } from "@/data/catalog/categories";
import { isSameSlug } from "@/lib/utils/slug";

import type { Category, CategoryKey, Product, ProductAttribute } from "@/types/catalog";

export function getCategoryByKey(key: CategoryKey): Category | null {
	return categories.find((category) => category.key === key) ?? null;
}

export function getCategoryBySlug(slug: string): Category | null {
	return categories.find((category) => isSameSlug(category.slug, slug)) ?? null;
}

export function getCategoryHref(category: Category): string {
	return `/catalog/${category.slug}`;
}

export function getProductPrimaryImage(product: Product): string {
	return product.images.find((image) => image.role === "main")?.url
		?? product.images[0]?.url
		?? "/no-image.png";
}

export function getProductImageAlt(product: Product): string {
	return product.images.find((image) => image.role === "main")?.alt ?? product.name;
}

export function getProductHref(product: Product): string {
	const category = getCategoryByKey(product.categoryKey);

	return category
		? `/catalog/${category.slug}/${product.slug}`
		: `/catalog/product/${product.slug}`;
}

export function getProductCategory(product: Product): Category | null {
	return getCategoryByKey(product.categoryKey);
}

export function getProductAttribute(
	product: Product,
	attributeKey: string,
): ProductAttribute | null {
	return product.attributes.find((attribute) => attribute.key === attributeKey) ?? null;
}
