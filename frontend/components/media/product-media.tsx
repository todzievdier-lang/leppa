import { FilledImage } from "@/components/media/filled-image";
import {
	getSafeProductImageSrc,
	productMediaFrameClassName,
	type ProductMediaFrameVariant,
} from "@/components/media/product-media-frame";

type ProductMediaProps = {
	src?: string | null;
	alt: string;
	variant?: ProductMediaFrameVariant;
	sizes?: string;
	className?: string;
	imageClassName?: string;
	priority?: boolean;
	quality?: number;
};

export function ProductMedia({
	src,
	alt,
	variant = "gallery",
	sizes,
	className,
	imageClassName,
	priority,
	quality,
}: ProductMediaProps) {
	return (
		<div className={productMediaFrameClassName(variant, className)}>
			<FilledImage
				src={getSafeProductImageSrc(src)}
				alt={alt}
				sizes={sizes}
				priority={priority}
				quality={quality}
				className="absolute inset-0"
				imageClassName={imageClassName}
			/>
		</div>
	);
}
