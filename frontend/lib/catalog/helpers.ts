import type { Category, Product } from "@/types/catalog";

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

export function getProductHref(
	product: Product,
	category?: Pick<Category, "slug"> | null,
): string {
	const categorySlug = category?.slug ?? product.categoryKey;

	return `/catalog/${categorySlug}/${product.slug}`;
}
