import { surfaceVariants } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

export const PRODUCT_IMAGE_FALLBACK = "/no-image.webp";

export type ProductMediaFrameVariant =
	| "card"
	| "gallery"
	| "thumbnail"
	| "mini"
	| "fill";

const mediaFrameClasses: Record<ProductMediaFrameVariant, string> = {
	card: cn(
		surfaceVariants({ variant: "media" }),
		"relative isolate aspect-[4/3] overflow-hidden",
	),
	gallery: cn(
		surfaceVariants({ variant: "media" }),
		"relative isolate aspect-[4/3] overflow-hidden",
	),
	thumbnail: cn(
		surfaceVariants({ variant: "media" }),
		"relative isolate aspect-square overflow-hidden",
	),
	mini: "relative isolate aspect-square overflow-hidden rounded-sm border border-hairline bg-toolbar",
	fill: cn(
		surfaceVariants({ variant: "media" }),
		"relative isolate h-full w-full overflow-hidden",
	),
};

export function getSafeProductImageSrc(src?: string | null) {
	const normalizedSrc = src?.trim();

	if (!normalizedSrc) {
		return PRODUCT_IMAGE_FALLBACK;
	}

	return normalizedSrc;
}

export function productMediaFrameClassName(
	variant: ProductMediaFrameVariant,
	className?: string,
) {
	return cn(mediaFrameClasses[variant], className);
}
