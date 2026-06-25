import type { ProductImage } from "@/types/catalog";

export const PRODUCT_IMAGE_QUALITY = {
	thumbnail: 60,
	card: 65,
	gallery: 75,
	lightbox: 85,
} as const;

export const PRODUCT_IMAGE_SIZES = {
	card: "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw",
	gallery: "(max-width: 1024px) calc(100vw - 2.5rem), 58vw",
	thumbnail: "(max-width: 640px) 22vw, 120px",
	lightbox: "(max-width: 768px) calc(100vw - 2rem), calc(100vw - 3rem)",
} as const;

export type ProductImageUsage = "thumbnail" | "card" | "gallery" | "lightbox";

export function getProductImageSource(
	image: ProductImage,
	usage: ProductImageUsage,
): string {
	if (usage === "thumbnail") {
		return image.thumbnailUrl
			?? image.smallUrl
			?? image.mediumUrl
			?? image.largeUrl
			?? image.url;
	}

	if (usage === "card") {
		return image.smallUrl
			?? image.mediumUrl
			?? image.thumbnailUrl
			?? image.largeUrl
			?? image.url;
	}

	if (usage === "gallery") {
		return image.largeUrl
			?? image.mediumUrl
			?? image.url;
	}

	return image.url
		?? image.largeUrl
		?? image.mediumUrl
		?? image.smallUrl
		?? image.thumbnailUrl;
}
