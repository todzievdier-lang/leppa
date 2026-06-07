"use client";

import { cn } from "@/lib/utils";

import type { ProductColorOption } from "@/lib/catalog/product-options";

type ProductColorSelectorVariant = "card" | "detail";

type ProductColorSelectorProps = {
	options: ProductColorOption[];
	selectedValue: string | null;
	className?: string;
	variant?: ProductColorSelectorVariant;
	onSelect: (value: string) => void;
};

export function ProductColorSelector({
	options,
	selectedValue,
	className,
	variant = "detail",
	onSelect,
}: ProductColorSelectorProps) {
	if (options.length <= 1) {
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
				{options.map((option) => {
					const isActive = option.value === selectedValue;

					return (
						<button
							key={option.value}
							type="button"
							aria-label={`Выбрать цвет: ${option.label}`}
							aria-pressed={isActive}
							title={option.label}
							className={cn(
								"inline-flex shrink-0 items-center justify-center rounded-full border bg-canvas transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
								isCard ? "size-9" : "size-11",
								isActive
									? "border-ink shadow-control"
									: "border-hairline hover:border-hairline-strong hover:shadow-control",
							)}
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								onSelect(option.value);
							}}>
							<span
								aria-hidden="true"
								className={cn(
									"rounded-full border border-black/10",
									isCard ? "size-6" : "size-7",
									option.value.includes("бел") && "shadow-inner",
								)}
								style={{ backgroundColor: option.swatch }}
							/>
						</button>
					);
				})}
			</div>
		</div>
	);
}
