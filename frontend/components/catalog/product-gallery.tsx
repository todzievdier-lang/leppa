"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductMedia } from "@/components/media/product-media";
import { PRODUCT_IMAGE_FALLBACK } from "@/components/media/product-media-frame";
import { cn } from "@/lib/utils";

import type { ProductImage } from "@/types/catalog";

type ProductGalleryProps = {
	images: ProductImage[];
	fallbackAlt: string;
};

type GalleryImage = {
	url: string;
	alt: string;
	role?: string;
};

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function wrapIndex(index: number, length: number) {
	return (index + length) % length;
}

function normalizeGalleryImages(
	images: ProductImage[],
	fallbackAlt: string,
): GalleryImage[] {
	const normalized = images
		.map((image) => ({
			url: image.url.trim(),
			alt: image.alt?.trim() ? image.alt : fallbackAlt,
			role: image.role,
		}))
		.filter((image) => image.url.length > 0);

	const gallery = normalized.length > 0
		? normalized
		: [{ url: PRODUCT_IMAGE_FALLBACK, alt: fallbackAlt, role: "placeholder" }];
	const mainImageIndex = gallery.findIndex((image) => image.role === "main");

	if (mainImageIndex <= 0) {
		return gallery;
	}

	const mainImage = gallery[mainImageIndex] as GalleryImage;

	return [
		mainImage,
		...gallery.slice(0, mainImageIndex),
		...gallery.slice(mainImageIndex + 1),
	];
}

export function ProductGallery({ images, fallbackAlt }: ProductGalleryProps) {
	const gallery = useMemo(
		() => normalizeGalleryImages(images, fallbackAlt),
		[images, fallbackAlt],
	);
	const [activeIndex, setActiveIndex] = useState(0);
	const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const swipeStartRef = useRef<{
		x: number;
		y: number;
		pointerId: number;
	} | null>(null);
	const hasMultipleImages = gallery.length > 1;
	const safeActiveIndex = clamp(activeIndex, 0, gallery.length - 1);
	const activeImage = gallery[safeActiveIndex] ?? gallery[0];

	useEffect(() => {
		thumbnailRefs.current[safeActiveIndex]?.scrollIntoView({
			block: "nearest",
			inline: "nearest",
		});
	}, [safeActiveIndex]);

	const selectImage = useCallback(
		(index: number) => {
			setActiveIndex(clamp(index, 0, gallery.length - 1));
		},
		[gallery.length],
	);

	const selectPrevious = useCallback(() => {
		if (!hasMultipleImages) {
			return;
		}

		setActiveIndex((currentIndex) => wrapIndex(currentIndex - 1, gallery.length));
	}, [gallery.length, hasMultipleImages]);

	const selectNext = useCallback(() => {
		if (!hasMultipleImages) {
			return;
		}

		setActiveIndex((currentIndex) => wrapIndex(currentIndex + 1, gallery.length));
	}, [gallery.length, hasMultipleImages]);

	const focusThumbnail = useCallback(
		(index: number) => {
			selectImage(index);
			window.requestAnimationFrame(() => {
				thumbnailRefs.current[index]?.focus();
			});
		},
		[selectImage],
	);

	return (
		<section
			aria-label="Галерея товара"
			className="min-w-0">
			<div
				className="group relative touch-pan-y"
				role="region"
				aria-label={`Изображение ${safeActiveIndex + 1} из ${gallery.length}: ${activeImage.alt}`}
				onPointerDown={(event) => {
					if (!hasMultipleImages || event.pointerType === "mouse") {
						return;
					}

					event.currentTarget.setPointerCapture(event.pointerId);
					swipeStartRef.current = {
						x: event.clientX,
						y: event.clientY,
						pointerId: event.pointerId,
					};
				}}
				onPointerUp={(event) => {
					const swipeStart = swipeStartRef.current;

					if (!swipeStart) {
						return;
					}

					if (event.currentTarget.hasPointerCapture(swipeStart.pointerId)) {
						event.currentTarget.releasePointerCapture(swipeStart.pointerId);
					}

					swipeStartRef.current = null;

					const deltaX = event.clientX - swipeStart.x;
					const deltaY = event.clientY - swipeStart.y;

					if (Math.abs(deltaX) < 44 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
						return;
					}

					if (deltaX < 0) {
						selectNext();
					} else {
						selectPrevious();
					}
				}}
				onPointerCancel={(event) => {
					const swipeStart = swipeStartRef.current;

					if (
						swipeStart
						&& event.currentTarget.hasPointerCapture(swipeStart.pointerId)
					) {
						event.currentTarget.releasePointerCapture(swipeStart.pointerId);
					}

					swipeStartRef.current = null;
				}}>
					<ProductMedia
					key={`${activeImage.url}-${safeActiveIndex}`}
					src={activeImage.url}
					alt={activeImage.alt}
					priority
					sizes="(max-width: 1024px) 100vw, 58vw"
					variant="gallery"
					className="animate-in fade-in zoom-in-[0.985] duration-300"
					imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.015]"
				/>

				{hasMultipleImages ? (
					<>
						<button
							type="button"
							aria-label="Предыдущее изображение"
							className="absolute left-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-canvas/90 text-ink opacity-0 shadow-control backdrop-blur transition duration-200 hover:bg-canvas focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group-hover:opacity-100 sm:flex"
							onClick={selectPrevious}>
							<ChevronLeft
								aria-hidden="true"
								className="size-5"
							/>
						</button>
						<button
							type="button"
							aria-label="Следующее изображение"
							className="absolute right-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-canvas/90 text-ink opacity-0 shadow-control backdrop-blur transition duration-200 hover:bg-canvas focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group-hover:opacity-100 sm:flex"
							onClick={selectNext}>
							<ChevronRight
								aria-hidden="true"
								className="size-5"
							/>
						</button>
					</>
				) : null}
			</div>

			<p
				aria-live="polite"
				className="sr-only">
				{`Показано изображение ${safeActiveIndex + 1} из ${gallery.length}`}
			</p>

			{hasMultipleImages ? (
				<div
					role="listbox"
					aria-label="Миниатюры товара"
					aria-orientation="horizontal"
					className="mt-3 grid auto-cols-[clamp(4.75rem,18vw,7rem)] p-[5px] grid-flow-col gap-3 overflow-x-auto pb-1 [scrollbar-width:none] sm:auto-cols-[clamp(5.25rem,11vw,7.5rem)] [&::-webkit-scrollbar]:hidden">
					{gallery.map((image, index) => {
						const isActive = index === safeActiveIndex;

						return (
							<button
								key={`${image.url}-${index}`}
								ref={(node) => {
									thumbnailRefs.current[index] = node;
								}}
								type="button"
								role="option"
								aria-label={`Показать изображение ${index + 1}`}
								aria-selected={isActive}
								className={cn(
									"group rounded-sm p-0 text-left transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
									isActive
										? "opacity-100 ring-2 ring-ink ring-offset-2 ring-offset-background"
										: "opacity-70 hover:-translate-y-0.5 hover:opacity-100 hover:shadow-control",
								)}
								onClick={() => {
									selectImage(index);
								}}
								onKeyDown={(event) => {
									if (event.key === "ArrowRight") {
										event.preventDefault();
										focusThumbnail(wrapIndex(index + 1, gallery.length));
									}

									if (event.key === "ArrowLeft") {
										event.preventDefault();
										focusThumbnail(wrapIndex(index - 1, gallery.length));
									}

									if (event.key === "Home") {
										event.preventDefault();
										focusThumbnail(0);
									}

									if (event.key === "End") {
										event.preventDefault();
										focusThumbnail(gallery.length - 1);
									}
								}}>
								<ProductMedia
									src={image.url}
									alt={image.alt}
									sizes="(max-width: 640px) 22vw, 120px"
									variant="thumbnail"
									className={cn(
										"transition duration-300 ease-out",
										isActive
											? "border-ink shadow-control"
											: "group-hover:border-hairline-strong",
									)}
									imageClassName={cn(
										"transition-transform duration-500 ease-out",
										isActive
											? "scale-[1.02]"
											: "group-hover:scale-[1.04]",
									)}
								/>
							</button>
						);
					})}
				</div>
			) : null}
		</section>
	);
}
