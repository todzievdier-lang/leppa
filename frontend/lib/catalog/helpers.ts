import type { Category, Product } from "@/types/catalog";
import { getProductImageSource } from "@/lib/catalog/product-image";

export function getCategoryHref(category: Category): string {
	return `/catalog/${category.slug}`;
}

export function getProductPrimaryImage(product: Product): string {
	const image = product.images.find((item) => item.role === "main")
		?? product.images[0];

	return image ? getProductImageSource(image, "card") : "/no-image.png";
}

export function getProductPrimaryThumbnail(product: Product): string {
	const image = product.images.find((item) => item.role === "main")
		?? product.images[0];

	return image ? getProductImageSource(image, "thumbnail") : "/no-image.png";
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
