import Image from "next/image";

import { cn } from "@/lib/utils";

type FilledImageProps = {
	src: string;
	alt: string;
	sizes?: string;
	className?: string;
	imageClassName?: string;
	priority?: boolean;
	quality?: number;
};

export function FilledImage({
	src,
	alt,
	sizes,
	className,
	imageClassName,
	priority,
	quality = 100,
}: FilledImageProps) {
	const safeAlt = alt?.trim() ? alt : "Изображение товара";

	return (
		<div
			className={cn(
				"relative isolate h-full w-full overflow-hidden bg-toolbar",
				className,
			)}>
			<Image
				src={src}
				alt={safeAlt}
				fill
				priority={priority}
				quality={quality}
				sizes={sizes}
				className={cn(
					"pointer-events-none select-none object-cover object-center",
					imageClassName,
				)}
			/>
		</div>
	);
}
