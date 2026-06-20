"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

import { ProductMedia } from "@/components/media/product-media";
import {
	getSafeProductImageSrc,
	PRODUCT_IMAGE_FALLBACK,
} from "@/components/media/product-media-frame";
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
	const [isLightboxOpen, setIsLightboxOpen] = useState(false);
	const closeLightboxButtonRef = useRef<HTMLButtonElement | null>(null);
	const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const ignoreNextClickRef = useRef(false);
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

	const openLightbox = useCallback(() => {
		if (ignoreNextClickRef.current) {
			ignoreNextClickRef.current = false;
			return;
		}

		setIsLightboxOpen(true);
	}, []);

	const closeLightbox = useCallback(() => {
		setIsLightboxOpen(false);
	}, []);

	const focusThumbnail = useCallback(
		(index: number) => {
			selectImage(index);
			window.requestAnimationFrame(() => {
				thumbnailRefs.current[index]?.focus();
			});
		},
		[selectImage],
	);

	useEffect(() => {
		if (!isLightboxOpen) {
			return;
		}

		const previousBodyOverflow = document.body.style.overflow;

		document.body.style.overflow = "hidden";
		window.requestAnimationFrame(() => {
			closeLightboxButtonRef.current?.focus();
		});

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				event.preventDefault();
				closeLightbox();
			}

			if (event.key === "ArrowRight") {
				event.preventDefault();
				selectNext();
			}

			if (event.key === "ArrowLeft") {
				event.preventDefault();
				selectPrevious();
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = previousBodyOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [closeLightbox, isLightboxOpen, selectNext, selectPrevious]);

	const lightbox = isLightboxOpen ? (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Увеличенный просмотр фотографий товара"
			className="fixed inset-0 z-[999] flex bg-ink/95 text-on-dark backdrop-blur-sm"
			onClick={closeLightbox}>
			<button
				ref={closeLightboxButtonRef}
				type="button"
				aria-label="Закрыть просмотр"
				className="absolute right-4 top-4 z-20 inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition duration-200 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-6 sm:top-6"
				onClick={closeLightbox}>
				<X
					aria-hidden="true"
					className="size-5"
				/>
			</button>

			<div
				className="relative flex h-dvh w-dvw items-center justify-center p-4 sm:p-6"
				onClick={(event) => {
					event.stopPropagation();
				}}>
				{hasMultipleImages ? (
					<button
						type="button"
						aria-label="Предыдущее изображение"
						className="absolute left-3 top-1/2 z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-control backdrop-blur transition duration-200 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-6"
						onClick={(event) => {
							event.stopPropagation();
							selectPrevious();
						}}>
						<ChevronLeft
							aria-hidden="true"
							className="size-6"
						/>
					</button>
				) : null}

				<div className="relative h-full max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100dvw-2rem)] sm:max-h-[calc(100dvh-3rem)] sm:max-w-[calc(100dvw-3rem)]">
					<Image
						key={`lightbox-${activeImage.url}-${safeActiveIndex}`}
						src={getSafeProductImageSrc(activeImage.url)}
						alt={activeImage.alt}
						fill
						priority
						unoptimized
						sizes="(max-width: 768px) 100vw, 96vw"
						className="pointer-events-none select-none object-contain object-center"
					/>
				</div>

				{hasMultipleImages ? (
					<button
						type="button"
						aria-label="Следующее изображение"
						className="absolute right-3 top-1/2 z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-control backdrop-blur transition duration-200 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-6"
						onClick={(event) => {
							event.stopPropagation();
							selectNext();
						}}>
						<ChevronRight
							aria-hidden="true"
							className="size-6"
						/>
					</button>
				) : null}

				{hasMultipleImages ? (
					<div className="absolute bottom-4 left-1/2 z-20 flex max-w-[min(26rem,calc(100dvw-2rem))] -translate-x-1/2 gap-2 overflow-x-auto rounded-full border border-white/10 bg-black/25 px-2 py-2 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						{gallery.map((image, index) => {
							const isActive = index === safeActiveIndex;

							return (
								<button
									key={`lightbox-thumb-${image.url}-${index}`}
									type="button"
									aria-label={`Показать изображение ${index + 1}`}
									aria-current={isActive ? "true" : undefined}
									className={cn(
										"size-12 shrink-0 rounded-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
										isActive
											? "opacity-100 ring-2 ring-white"
											: "opacity-55 hover:opacity-90",
									)}
									onClick={(event) => {
										event.stopPropagation();
										selectImage(index);
									}}>
									<ProductMedia
										src={image.url}
										alt={image.alt}
										sizes="48px"
										variant="thumbnail"
										className="border-white/15 bg-white/10"
										imageClassName="object-cover"
									/>
								</button>
							);
						})}
					</div>
				) : null}
			</div>
		</div>
	) : null;

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

					ignoreNextClickRef.current = true;
					window.setTimeout(() => {
						ignoreNextClickRef.current = false;
					}, 0);

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
				<button
					type="button"
					aria-label="Увеличить активное изображение товара"
					className="relative block w-full cursor-zoom-in rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					onClick={openLightbox}>
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
					<span className="pointer-events-none absolute right-3 top-3 z-10 inline-flex size-10 items-center justify-center rounded-full border border-hairline bg-canvas/90 text-ink opacity-0 shadow-control backdrop-blur transition duration-200 group-hover:opacity-100">
						<ZoomIn
							aria-hidden="true"
							className="size-5"
						/>
					</span>
				</button>

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

			{lightbox && typeof document !== "undefined"
				? createPortal(lightbox, document.body)
				: null}
		</section>
	);
}
