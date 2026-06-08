"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import type { Product } from "@/types/catalog";
import type { ProductSizeVariant } from "@/lib/catalog/product-variants";

type ProductSizeSelectorVariant = "card" | "detail";

type ProductSizeSelectorProps = {
	variants: ProductSizeVariant[];
	currentProductId: string;
	className?: string;
	variant?: ProductSizeSelectorVariant;
	onSelectProduct?: (product: Product) => void;
};

function getVisibleVariants(
	variants: ProductSizeVariant[],
	currentProductId: string,
	maxVisible: number,
) {
	if (variants.length <= maxVisible) {
		return variants;
	}

	const visibleVariants = variants.slice(0, maxVisible);
	const activeVariant = variants.find(
		(item) => item.product.id === currentProductId,
	);

	if (
		activeVariant
		&& !visibleVariants.some((item) => item.product.id === currentProductId)
	) {
		return [...visibleVariants.slice(0, maxVisible - 1), activeVariant];
	}

	return visibleVariants;
}

function areSameProductIds(first: string[], second: string[]) {
	return (
		first.length === second.length
		&& first.every((id, index) => id === second[index])
	);
}

function getPrioritizedVariantIds(
	variants: ProductSizeVariant[],
	currentProductId: string,
	visibleCount: number,
) {
	const allIds = variants.map((item) => item.product.id);

	if (visibleCount >= variants.length) {
		return allIds;
	}

	const selectedIndexes = new Set<number>();
	const activeIndex = variants.findIndex(
		(item) => item.product.id === currentProductId,
	);

	if (activeIndex >= 0) {
		selectedIndexes.add(activeIndex);
	}

	for (let index = 0; index < variants.length; index += 1) {
		if (selectedIndexes.size >= visibleCount) {
			break;
		}

		selectedIndexes.add(index);
	}

	return Array.from(selectedIndexes)
		.sort((first, second) => first - second)
		.map((index) => variants[index]?.product.id)
		.filter((id): id is string => Boolean(id));
}

export function ProductSizeSelector({
	variants,
	currentProductId,
	className,
	variant = "detail",
	onSelectProduct,
}: ProductSizeSelectorProps) {
	const isCard = variant === "card";
	const fallbackMaxVisible = isCard ? 2 : 4;
	const containerRef = useRef<HTMLDivElement | null>(null);
	const measureRef = useRef<HTMLDivElement | null>(null);
	const [visibleProductIds, setVisibleProductIds] = useState(() =>
		getPrioritizedVariantIds(variants, currentProductId, fallbackMaxVisible),
	);
	const itemClassName = useCallback(
		(isActive: boolean, inStock: boolean) =>
			cn(
				"inline-flex shrink-0 items-center justify-center rounded-full border text-center font-semibold tracking-normal transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
				isCard
					? "min-h-9 min-w-12 px-3 py-1 text-sm"
					: "min-h-10 px-4 py-2 text-sm",
				isActive
					? "border-ink bg-ink text-on-dark shadow-control"
					: "border-hairline bg-frost text-ink-muted hover:border-hairline-strong hover:bg-toolbar hover:text-ink",
				!inStock && "border-dashed opacity-60",
			),
		[isCard],
	);
	const measureVisibleProductIds = useCallback(() => {
		const container = containerRef.current;
		const measure = measureRef.current;

		if (!container || !measure) {
			return getPrioritizedVariantIds(
				variants,
				currentProductId,
				fallbackMaxVisible,
			);
		}

		const availableWidth = container.clientWidth;
		const styles = window.getComputedStyle(measure);
		const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
		const moreElement = measure.querySelector<HTMLElement>("[data-size-more]");
		const moreWidth = moreElement?.getBoundingClientRect().width ?? 0;
		const widthsByProductId = new Map(
			Array.from(
				measure.querySelectorAll<HTMLElement>("[data-size-variant-id]"),
			).map((element) => [
				element.dataset.sizeVariantId ?? "",
				element.getBoundingClientRect().width,
			]),
		);

		for (
			let visibleCount = variants.length;
			visibleCount >= 1;
			visibleCount -= 1
		) {
			const candidateIds = getPrioritizedVariantIds(
				variants,
				currentProductId,
				visibleCount,
			);
			const hiddenCount = variants.length - candidateIds.length;
			const variantsWidth = candidateIds.reduce(
				(total, id) => total + (widthsByProductId.get(id) ?? 0),
				0,
			);
			const gapCount =
				Math.max(0, candidateIds.length - 1) + (hiddenCount > 0 ? 1 : 0);
			const totalWidth =
				variantsWidth
				+ gap * gapCount
				+ (hiddenCount > 0 ? moreWidth : 0);

			if (totalWidth <= availableWidth + 1) {
				return candidateIds;
			}
		}

		return getPrioritizedVariantIds(variants, currentProductId, 1);
	}, [currentProductId, fallbackMaxVisible, variants]);

	useEffect(() => {
		let animationFrame = 0;

		function updateVisibleVariants() {
			animationFrame = 0;
			const nextProductIds = measureVisibleProductIds();

			setVisibleProductIds((currentProductIds) =>
				areSameProductIds(currentProductIds, nextProductIds)
					? currentProductIds
					: nextProductIds,
			);
		}

		function scheduleUpdate() {
			if (animationFrame) {
				window.cancelAnimationFrame(animationFrame);
			}

			animationFrame = window.requestAnimationFrame(updateVisibleVariants);
		}

		scheduleUpdate();

		const resizeObserver = containerRef.current
			? new ResizeObserver(scheduleUpdate)
			: null;

		if (containerRef.current) {
			resizeObserver?.observe(containerRef.current);
		}

		window.addEventListener("resize", scheduleUpdate);

		return () => {
			if (animationFrame) {
				window.cancelAnimationFrame(animationFrame);
			}

			resizeObserver?.disconnect();
			window.removeEventListener("resize", scheduleUpdate);
		};
	}, [measureVisibleProductIds]);

	const visibleVariants = useMemo(() => {
		const visibleProductIdSet = new Set(visibleProductIds);
		const measuredVariants = variants.filter((item) =>
			visibleProductIdSet.has(item.product.id),
		);
		const hasActiveVariant = measuredVariants.some(
			(item) => item.product.id === currentProductId,
		);

		if (measuredVariants.length > 0 && hasActiveVariant) {
			return measuredVariants;
		}

		return getVisibleVariants(variants, currentProductId, fallbackMaxVisible);
	}, [currentProductId, fallbackMaxVisible, variants, visibleProductIds]);
	const hiddenCount = Math.max(0, variants.length - visibleVariants.length);

	if (variants.length <= 1) {
		return null;
	}

	return (
		<div className={cn("pointer-events-auto relative", className)}>
			{!isCard ? (
				<p className="mb-2 text-sm font-semibold text-ink">
					Размер
				</p>
			) : null}

			<div
				ref={containerRef}
				aria-label="Размеры товара"
				className={cn(
					"relative flex flex-nowrap overflow-hidden",
					isCard ? "min-h-9 gap-2" : "gap-2",
				)}>
				{visibleVariants.map((item) => {
					const isActive = item.product.id === currentProductId;
					const title = [
						item.label,
						item.priceLabel,
						item.inStock ? null : "нет в наличии",
					]
						.filter(Boolean)
						.join(", ");

					if (onSelectProduct) {
						return (
							<button
								key={item.product.id}
								type="button"
								aria-pressed={isActive}
								title={title}
								disabled={isActive}
								className={itemClassName(isActive, item.inStock)}
								onClick={(event) => {
									event.preventDefault();
									event.stopPropagation();
									onSelectProduct(item.product);
								}}>
								{item.label}
							</button>
						);
					}

					if (isActive && !isCard) {
						return (
							<span
								key={item.product.id}
								aria-current="true"
								title={title}
								className={itemClassName(true, item.inStock)}>
								{item.label}
							</span>
						);
					}

					return (
						<Link
							key={item.product.id}
							href={item.href}
							scroll={false}
							aria-current={isActive ? "true" : undefined}
							title={title}
							className={itemClassName(isActive, item.inStock)}>
							{item.label}
						</Link>
					);
				})}

				{hiddenCount > 0 ? (
					<span
						className={cn(
							itemClassName(false, true),
							"border-dashed text-ink-faint",
						)}
						title={`Еще размеров: ${hiddenCount}`}>
						+{hiddenCount}
					</span>
				) : null}
			</div>

			<div
				ref={measureRef}
				aria-hidden="true"
				className={cn(
					"pointer-events-none invisible absolute left-0 top-0 -z-10 flex flex-nowrap overflow-visible",
					isCard ? "gap-2" : "gap-2",
				)}>
				{variants.map((item) => (
					<span
						key={`measure-${item.product.id}`}
						data-size-variant-id={item.product.id}
						className={itemClassName(
							item.product.id === currentProductId,
							item.inStock,
						)}>
						{item.label}
					</span>
				))}
				<span
					data-size-more="true"
					className={cn(
						itemClassName(false, true),
						"border-dashed text-ink-faint",
					)}>
					+{variants.length}
				</span>
			</div>
		</div>
	);
}
