"use client";

import Link from "next/link";
import { HeartOff, Trash2 } from "lucide-react";

import { ProductCartControls } from "@/components/shop/product-actions";
import { ProductSkuCopy } from "@/components/catalog/product-sku-copy";
import { Button } from "@/components/ui/button";
import { FilledImage } from "@/components/media/filled-image";
import {
	getSafeProductImageSrc,
	productMediaFrameClassName,
} from "@/components/media/product-media-frame";
import { surfaceVariants } from "@/components/ui/surface";
import { useShopState } from "@/lib/shop/store";
import { cn } from "@/lib/utils";

import type { ShopProductSnapshot } from "@/types/shop";

function FavoritesSkeleton() {
	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{Array.from({ length: 4 }, (_, index) => (
				<div
					key={index}
					className={cn(
						surfaceVariants({ variant: "card" }),
						"h-[360px] animate-pulse bg-frost p-3",
					)}
				/>
			))}
		</div>
	);
}

function FavoriteProductCard({
	onRemove,
	product,
}: {
	onRemove: () => void;
	product: ShopProductSnapshot;
}) {
	return (
		<article
			className={cn(
				surfaceVariants({ variant: "card" }),
				"hover-lift-card flex h-full min-w-0 flex-col overflow-hidden p-3",
			)}>
			<Link
				href={product.href}
				className={productMediaFrameClassName("card")}
				aria-label={`Открыть товар ${product.name}`}>
				<FilledImage
					src={getSafeProductImageSrc(product.image)}
					alt={product.name}
					sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
					className="absolute inset-0"
				/>
			</Link>

			<div className="flex flex-1 flex-col px-2 pb-2 pt-4 sm:px-3">
				<p className="mb-2 text-[1.375rem] font-bold leading-tight text-ink sm:text-2xl">
					{product.priceLabel}
				</p>
				<Link
					href={product.href}
					className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-ink transition-colors hover:text-ink-muted">
					{product.name}
				</Link>
				<ProductSkuCopy
					sku={product.sku}
					className="mt-3"
				/>

				<div className="mt-auto grid grid-cols-[minmax(0,1fr)_2.75rem] gap-2.5 border-t border-hairline pt-3.5">
					<ProductCartControls
						layout="card"
						product={product}
					/>
					<Button
						type="button"
						variant="secondary"
						size="icon"
						aria-label={`Удалить из избранного: ${product.name}`}
						className="size-11 text-ink-faint hover:text-destructive"
						onClick={onRemove}>
						<Trash2 aria-hidden="true" />
					</Button>
				</div>
			</div>
		</article>
	);
}

export function FavoritesPage() {
	const { favoritesCount, hydrated, removeFromFavorites, state } =
		useShopState();

	return (
		<section className="bg-canvas text-ink">
			<div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:px-10 lg:pb-24 lg:pt-40">
				<Link
					href="/catalog"
					className="text-sm font-medium text-ink-muted transition-colors hover:text-ink">
					Вернуться к покупкам
				</Link>

				<div className="mt-8 flex flex-wrap items-end justify-between gap-4">
					<div>
						<h1 className="text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
							Избранное
						</h1>
						<p className="mt-3 text-sm text-ink-muted">
							{favoritesCount} товаров в подборке
						</p>
					</div>
				</div>

				<div className="mt-8">
					{!hydrated ? (
						<FavoritesSkeleton />
					) : state.favorites.length > 0 ? (
						<div className="grid gap-x-3 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{state.favorites.map((product) => (
								<FavoriteProductCard
									key={product.id}
									product={product}
									onRemove={() => {
										removeFromFavorites(product.id);
									}}
								/>
							))}
						</div>
					) : (
						<div
							className={cn(
								surfaceVariants({ variant: "empty" }),
								"px-6 py-14",
							)}>
							<div className="mx-auto flex size-14 items-center justify-center rounded-full border border-hairline bg-canvas text-ink-muted shadow-control">
								<HeartOff
									aria-hidden="true"
									className="size-6"
								/>
							</div>
							<h2 className="mt-5 text-xl font-semibold text-ink">
								Избранное пустое
							</h2>
							<p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
								Добавляйте товары сердцем в каталоге, и они появятся здесь.
							</p>
							<Button
								asChild
								variant="dark"
								className="mt-6">
								<Link href="/catalog">Перейти в каталог</Link>
							</Button>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
