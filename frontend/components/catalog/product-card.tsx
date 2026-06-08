"use client";

import { useMemo } from "react";
import Link from "next/link";

import { ProductColorSelector } from "@/components/catalog/product-color-selector";
import { ProductAvailabilityBadge } from "@/components/catalog/product-availability-badge";
import { ProductSkuCopy } from "@/components/catalog/product-sku-copy";
import { ProductSizeSelector } from "@/components/catalog/product-size-selector";
import { ProductActions } from "@/components/shop/product-actions";
import { surfaceVariants } from "@/components/ui/surface";
import { productMediaFrameClassName } from "@/components/media/product-media-frame";
import { getProductHref, getProductImageAlt } from "@/lib/catalog/helpers";
import {
	getProductColorVariants,
	getProductSizeVariants,
} from "@/lib/catalog/product-variants";
import { getShopProductSnapshot } from "@/lib/shop/product";
import { formatProductPrice } from "@/lib/utils/price";
import { cn } from "@/lib/utils";
import { ProductCardMedia } from "@/components/catalog/product-card-media";

import type { Category, Product } from "@/types/catalog";

export function ProductCard({
	category,
	product,
	variantProducts = [],
}: {
	category?: Category | null;
	product: Product;
	variantProducts?: Product[];
}) {
	const sizeVariants = useMemo(
		() => getProductSizeVariants(product, variantProducts, category),
		[category, product, variantProducts],
	);
	const colorVariants = useMemo(
		() => getProductColorVariants(product, variantProducts, category),
		[category, product, variantProducts],
	);
	const imageAlt = getProductImageAlt(product);
	const href = getProductHref(product, category);
	const shopProduct = getShopProductSnapshot(
		product,
		category,
		product.color?.name ? [{ label: "Цвет", value: product.color.name }] : [],
	);

	return (
		<article
			className={cn(
				surfaceVariants({ variant: "card" }),
				"hover-lift-card group relative flex h-full min-w-0 flex-col overflow-hidden p-3 transition-colors duration-300 hover:border-hairline-strong",
			)}>
			<Link
				href={href}
				scroll={false}
				aria-label={`Открыть товар ${product.name}`}
				className="absolute inset-0 z-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			/>

			<div className="relative z-10">
				<ProductCardMedia
					href={href}
					images={product.images}
					alt={imageAlt}
				/>
			</div>

			<div className="pointer-events-none relative z-10 flex flex-1 flex-col px-2 pb-2 pt-4 sm:px-3">
				<div className="min-w-0">
					<p className="min-w-0 whitespace-normal break-words mb-2 text-[1.375rem] font-bold leading-tight tracking-normal text-ink sm:text-2xl">
						{formatProductPrice(product)}
					</p>
					<h2 className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-ink">
						{product.name}
					</h2>
					<ProductAvailabilityBadge
						product={product}
						className="mt-3 min-h-7 w-fit px-2.5 py-1 text-[11px]"
					/>
					<ProductSkuCopy
						sku={product.sku}
						className="mt-3 max-w-full"
					/>
				</div>

				<div className="mt-5 grid gap-3 pb-4">
					<ProductColorSelector
						currentProductId={product.id}
						variants={colorVariants}
						variant="card"
					/>

					<ProductSizeSelector
						currentProductId={product.id}
						variant="card"
						variants={sizeVariants}
					/>
				</div>

				<div className="mt-auto border-t border-hairline pt-3.5">
					<div className="space-y-3">
						<div className="pointer-events-auto relative z-20">
							<ProductActions
								layout="card"
								product={shopProduct}
							/>
						</div>
					</div>
				</div>
			</div>
		</article>
	);
}

export function ProductCardSkeleton() {
	return (
		<article
			aria-hidden="true"
			className={cn(
				surfaceVariants({ variant: "card" }),
				"flex h-full min-w-0 flex-col overflow-hidden p-3",
			)}>
			<div className="relative">
				<div className={productMediaFrameClassName("card", "animate-pulse")} />
			</div>
			<div className="flex flex-1 flex-col px-2 pb-2 pt-4 sm:px-3">
				<div className="min-h-[2.75rem]">
					<div className="h-5 w-11/12 animate-pulse rounded-full bg-toolbar" />
					<div className="mt-2 h-5 w-3/5 animate-pulse rounded-full bg-toolbar" />
				</div>
				<div className="mt-3 h-7 w-24 animate-pulse rounded-full bg-toolbar" />

				<div className="mt-4 flex min-h-9 flex-wrap content-start gap-2">
					<div className="size-9 animate-pulse rounded-full bg-toolbar" />
					<div className="size-9 animate-pulse rounded-full bg-toolbar" />
					<div className="h-9 w-24 animate-pulse rounded-full bg-toolbar" />
				</div>

				<div className="mt-auto border-t border-hairline pt-3.5">
					<div className="space-y-3">
						<div className="h-8 w-36 animate-pulse rounded-full bg-toolbar" />
						<div className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-2.5">
							<div className="h-11 animate-pulse rounded-full bg-toolbar" />
							<div className="size-11 animate-pulse rounded-full bg-toolbar" />
						</div>
					</div>
				</div>
			</div>
		</article>
	);
}
