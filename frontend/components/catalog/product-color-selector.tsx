"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import type { ProductColorVariant } from "@/lib/catalog/product-variants";

type ProductColorSelectorVariant = "card" | "detail";

type ProductColorSelectorProps = {
	variants: ProductColorVariant[];
	currentProductId: string;
	className?: string;
	variant?: ProductColorSelectorVariant;
};

export function ProductColorSelector({
	variants,
	currentProductId,
	className,
	variant = "detail",
}: ProductColorSelectorProps) {
	if (variants.length <= 1) {
		return null;
	}

	const isCard = variant === "card";

	return (
		<div className={cn("pointer-events-auto", className)}>
			{!isCard ? (
				<p className="mb-2 text-sm font-semibold text-ink">
					Цвет
				</p>
			) : null}

			<div
				aria-label="Цвета товара"
				className={cn("flex flex-wrap", isCard ? "gap-2" : "gap-2.5")}>
				{variants.map((item) => {
					const isActive = item.product.id === currentProductId;
					const title = [
						item.label,
						item.inStock ? null : "нет в наличии",
					]
						.filter(Boolean)
						.join(", ");
					const swatch = (
						<span
							aria-hidden="true"
							className={cn(
								"rounded-full border border-black/10",
								isCard ? "size-6" : "size-7",
								item.isLight && "shadow-inner",
							)}
							style={{ backgroundColor: item.hex }}
						/>
					);

					if (isActive && !isCard) {
						return (
							<span
								key={item.product.id}
								aria-current="true"
								title={title}
								className={cn(
									"inline-flex shrink-0 items-center justify-center rounded-full border bg-canvas",
									isCard ? "size-9" : "size-11",
									"border-ink shadow-control",
									!item.inStock && "opacity-60",
								)}>
								{swatch}
							</span>
						);
					}

					return (
						<Link
							key={item.product.id}
							href={item.href}
							scroll={false}
							aria-current={isActive ? "true" : undefined}
							aria-label={`Выбрать цвет: ${item.label}`}
							title={title}
							className={cn(
								"inline-flex shrink-0 items-center justify-center rounded-full border bg-canvas transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
								isCard ? "size-9" : "size-11",
								isActive
									? "border-ink shadow-control"
									: "border-hairline hover:border-hairline-strong hover:shadow-control",
								!item.inStock && "opacity-60",
							)}>
							{swatch}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
