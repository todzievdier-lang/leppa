"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check, Plus, ShoppingBag } from "lucide-react";

import { FilledImage } from "@/components/media/filled-image";
import { Button } from "@/components/ui/button";
import { surfaceVariants } from "@/components/ui/surface";
import {
	getProductHref,
	getProductPrimaryImage,
} from "@/lib/catalog/helpers";
import { getShopProductSnapshot } from "@/lib/shop/product";
import { useShopState } from "@/lib/shop/store";
import { cn } from "@/lib/utils";
import { formatPrice, formatProductPrice } from "@/lib/utils/price";

import type { Category, Product, ProductAttributeValue } from "@/types/catalog";
import type { ShopProductSnapshot } from "@/types/shop";

type KitPart = "toilet" | "installation" | "flush-button" | "sound-panel" | "mirror";

type ProductBundle = {
	id: string;
	items: Product[];
	discountPercent: number;
	originalTotal: number | null;
	discountAmount: number | null;
	bundleTotal: number | null;
	currency: string;
};

const BUNDLE_DISCOUNT_RATE = 0.06;
const BUNDLE_OFFER_LABEL = "Выгодное предложение";
const MAX_BUNDLE_PRODUCTS = 5;
const MAX_BUNDLES = 1;

function normalizeText(value: string | null | undefined) {
	return (value ?? "").trim().toLocaleLowerCase("ru-RU");
}

function getAttributeValue(
	product: Product,
	key: string,
): ProductAttributeValue | null {
	return product.attributes.find((attribute) => attribute.key === key)?.value ?? null;
}

function getAttributeString(product: Product, key: string) {
	const value = getAttributeValue(product, key);

	return typeof value === "string" ? value : null;
}

function getKitPart(product: Product): KitPart | null {
	const productType = normalizeText(getAttributeString(product, "productType"));
	const kitRole = normalizeText(getAttributeString(product, "kitRole"));
	const name = normalizeText(product.name);

	if (
		productType.includes("звукоизоляц")
		|| productType.includes("шумоизоляц")
		|| kitRole.includes("звукоизоляц")
		|| kitRole.includes("шумоизоляц")
		|| name.includes("звукоизоляц")
		|| name.includes("шумоизоляц")
	) {
		return "sound-panel";
	}

	if (
		product.categoryKey === "zerkala"
		|| productType.includes("зеркал")
		|| kitRole.includes("зеркал")
		|| name.includes("зеркал")
	) {
		return "mirror";
	}

	if (
		productType.includes("инсталляц")
		|| kitRole.includes("инсталляц")
		|| name.includes("инсталляц")
	) {
		return "installation";
	}

	if (
		productType.includes("кноп")
		|| kitRole.includes("кноп")
		|| name.includes("кноп")
	) {
		return "flush-button";
	}

	if (name.includes("унитаз")) {
		return "toilet";
	}

	return null;
}

function getPartLabel(part: KitPart | null) {
	if (part === "installation") {
		return "Инсталляция";
	}

	if (part === "flush-button") {
		return "Кнопка смыва";
	}

	if (part === "sound-panel") {
		return "Панель";
	}

	if (part === "mirror") {
		return "Зеркало";
	}

	return "Унитаз";
}

function uniqueProducts(products: Product[]) {
	const seenProductIds = new Set<string>();

	return products.filter((product) => {
		if (seenProductIds.has(product.id)) {
			return false;
		}

		seenProductIds.add(product.id);
		return true;
	});
}

function getBundlePriceTotals(
	items: Product[],
	currency: string,
	discountPercent: number,
) {
	if (items.some((item) => typeof item.price !== "number")) {
		return {
			originalTotal: null,
			discountAmount: null,
			bundleTotal: null,
			currency,
		};
	}

	const originalTotal = items.reduce(
		(total, item) => total + (item.price ?? 0),
		0,
	);
	const discountAmount = Math.round(originalTotal * (discountPercent / 100));

	return {
		originalTotal,
		discountAmount,
		bundleTotal: originalTotal - discountAmount,
		currency,
	};
}

function getProductsBySlug(products: Product[]) {
	return new Map(products.map((product) => [product.slug, product]));
}

function getConfiguredBundleProducts(
	product: Product,
	productSlugs: string[],
	productsBySlug: Map<string, Product>,
) {
	const items = uniqueProducts([
		product,
		...productSlugs
			.filter((slug) => slug !== product.slug)
			.map((slug) => productsBySlug.get(slug) ?? null)
			.filter((item): item is Product => item !== null),
	]);

	return items.slice(0, MAX_BUNDLE_PRODUCTS);
}

function buildConfiguredBundles(product: Product, products: Product[]) {
	if (product.bundles.length === 0) {
		return [];
	}

	const productsBySlug = getProductsBySlug(products);
	const currency = product.currency ?? "RUB";

	return product.bundles
		.slice(0, MAX_BUNDLES)
		.map((bundle, bundleIndex): ProductBundle | null => {
			const items = getConfiguredBundleProducts(
				product,
				bundle.productSlugs,
				productsBySlug,
			);

			if (items.length < 2) {
				return null;
			}

			const discountPercent = bundle.discountPercent ?? Math.round(
				BUNDLE_DISCOUNT_RATE * 100,
			);

			return {
				id: `${product.id}-configured-${bundleIndex}`,
				items,
				discountPercent,
				...getBundlePriceTotals(items, currency, discountPercent),
			};
		})
		.filter((bundle): bundle is ProductBundle => bundle !== null);
}

function buildBundles(product: Product, products: Product[]) {
	return buildConfiguredBundles(product, products);
}

function getDiscountedPrices(items: Product[], bundleTotal: number | null) {
	if (bundleTotal === null || items.some((item) => typeof item.price !== "number")) {
		return null;
	}

	const originalTotal = items.reduce(
		(total, item) => total + (item.price ?? 0),
		0,
	);

	if (originalTotal <= 0) {
		return null;
	}

	const discountedPrices = items.map((item) =>
		Math.round(((item.price ?? 0) / originalTotal) * bundleTotal),
	);
	const roundedTotal = discountedPrices.reduce((total, price) => total + price, 0);
	const difference = bundleTotal - roundedTotal;

	if (discountedPrices.length > 0) {
		discountedPrices[discountedPrices.length - 1] += difference;
	}

	return discountedPrices;
}

function getBundleCartProducts(
	bundle: ProductBundle,
	currentProduct: Product,
	category: Category,
): ShopProductSnapshot[] {
	const discountedPrices = getDiscountedPrices(bundle.items, bundle.bundleTotal);

	return bundle.items.map((item, index) => {
		const snapshot = getShopProductSnapshot(
			item,
			item.id === currentProduct.id ? category : null,
			[
				{
					label: "Комплект",
					value: BUNDLE_OFFER_LABEL,
				},
			],
		);
		const discountedPrice = discountedPrices?.[index] ?? null;

		if (discountedPrice === null) {
			return snapshot;
		}

		return {
			...snapshot,
			originalPrice: item.price,
			price: discountedPrice,
			priceLabel: formatPrice(discountedPrice, snapshot.currency ?? "RUB"),
		};
	});
}

function ProductBundleItem({
	discountAmount,
	discountedPrice,
	isCurrent,
	product,
}: {
	discountAmount: number | null;
	discountedPrice: number | null;
	isCurrent: boolean;
	product: Product;
}) {
	const part = getKitPart(product);
	const href = getProductHref(product);
	const hasDiscount = discountedPrice !== null
		&& typeof product.price === "number"
		&& discountedPrice < product.price;

	return (
		<article
			className={cn(
				surfaceVariants({ variant: "card" }),
				"relative grid w-full min-w-0 gap-3 p-3 sm:w-60",
			)}>
			<span className="absolute right-3 top-3 z-10 inline-flex size-6 items-center justify-center rounded-full bg-ink text-on-dark shadow-control">
				<Check
					aria-hidden="true"
					className="size-3.5"
				/>
			</span>

			<Link
				href={href}
				scroll={false}
				aria-label={`Открыть товар ${product.name}`}
				className="block">
				<FilledImage
					src={getProductPrimaryImage(product)}
					alt={product.name}
					sizes="(max-width: 640px) calc(100vw - 4rem), 15rem"
					className="h-40 w-full rounded-sm bg-frost lg:h-44"
					imageClassName="object-cover"
				/>
			</Link>

			<div className="min-w-0 self-end">
				<div className="flex min-w-0 flex-wrap items-center gap-2">
					<p className="text-xs font-semibold uppercase tracking-normal text-ink-faint">
						{getPartLabel(part)}
					</p>
					{isCurrent ? (
						<span className="rounded-full border border-hairline bg-frost px-2 py-0.5 text-[11px] font-semibold text-ink-muted shadow-control">
							Текущий товар
						</span>
					) : null}
				</div>
				<Link
					href={href}
					scroll={false}
					className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors hover:text-ink-muted">
					{product.name}
				</Link>
				<div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
					{hasDiscount ? (
						<>
							<p className="text-lg font-semibold leading-tight text-ink">
								{formatPrice(discountedPrice, product.currency ?? "RUB")}
							</p>
							<p className="text-sm font-semibold leading-tight text-ink-muted line-through decoration-ink-muted/50">
								{formatProductPrice(product)}
							</p>
							{discountAmount !== null && discountAmount > 0 ? (
								<span className="rounded-full border border-destructive/15 bg-canvas px-2 py-0.5 text-[11px] font-semibold text-destructive shadow-control">
									-{formatPrice(discountAmount, product.currency ?? "RUB")}
								</span>
							) : null}
						</>
					) : (
						<p className="text-lg font-semibold leading-tight text-ink">
							{formatProductPrice(product)}
						</p>
					)}
				</div>
			</div>
		</article>
	);
}

function BundleJoiner() {
	return (
		<div className="flex shrink-0 items-center justify-center text-ink-faint sm:self-center">
			<span className="inline-flex size-8 items-center justify-center rounded-full border border-hairline bg-canvas shadow-control">
				<Plus
					aria-hidden="true"
					className="size-4"
				/>
			</span>
		</div>
	);
}

export function ProductKitSuggestions({
	category,
	className,
	product,
	products,
}: {
	category: Category;
	className?: string;
	product: Product;
	products: Product[];
}) {
	const { addManyToCart } = useShopState();
	const bundles = useMemo(
		() => buildBundles(product, products),
		[product, products],
	);

	if (bundles.length === 0) {
		return null;
	}

	const activeBundle = bundles[0];
	const originalTotalLabel = activeBundle.originalTotal === null
		? "Цена по запросу"
		: formatPrice(activeBundle.originalTotal, activeBundle.currency);
	const bundleTotalLabel = activeBundle.bundleTotal === null
		? "Цена по запросу"
		: formatPrice(activeBundle.bundleTotal, activeBundle.currency);
	const discountLabel = activeBundle.discountAmount === null
		? `Скидка ${activeBundle.discountPercent}%`
		: `Выгода ${formatPrice(activeBundle.discountAmount, activeBundle.currency)}`;
	const availableCount = activeBundle.items.filter((item) => item.inStock).length;
	const canAddBundle = availableCount > 0;
	const discountedPrices = getDiscountedPrices(
		activeBundle.items,
		activeBundle.bundleTotal,
	);

	return (
		<section
			aria-labelledby="product-kit-title"
			className={cn(
				"mt-12 p-4 sm:p-5 lg:p-6",
				surfaceVariants({ variant: "muted" }),
				className,
			)}>
			<div className="flex flex-col gap-1">
				<div className="min-w-0">
					<p className="text-xs font-semibold uppercase tracking-normal text-ink-faint">
						Подобрать вместе
					</p>
					<h2
						id="product-kit-title"
						className="mt-1 text-xl font-semibold tracking-normal text-ink sm:text-2xl">
						{BUNDLE_OFFER_LABEL}
					</h2>
				</div>
			</div>

			<div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)] lg:items-stretch">
				<div className="flex min-w-0 max-w-[52rem] flex-wrap items-stretch gap-x-3 gap-y-4">
					{activeBundle.items.map((item, index) => (
						<div
							key={item.id}
							className={cn(
								"flex w-full min-w-0 flex-col items-center gap-3 sm:w-auto sm:flex-row sm:items-stretch",
								index > 0 && "sm:min-w-[17.75rem]",
							)}>
							{index > 0 ? <BundleJoiner /> : null}
							<ProductBundleItem
								discountAmount={
									discountedPrices?.[index] !== undefined
									&& typeof item.price === "number"
										? item.price - discountedPrices[index]
										: null
								}
								discountedPrice={discountedPrices?.[index] ?? null}
								isCurrent={item.id === product.id}
								product={item}
							/>
						</div>
					))}
				</div>

				<div className="grid content-center gap-4 border-t border-hairline pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
					<div className="grid gap-3">
						<div>
							<p className="text-sm text-ink-muted">По отдельности:</p>
							<p
								className={cn(
									"mt-1 text-xl font-semibold text-ink-muted",
									activeBundle.originalTotal !== null
										&& "line-through decoration-ink-muted/50",
								)}>
								{originalTotalLabel}
							</p>
						</div>

						<div>
							<p className="text-sm font-semibold text-ink">Комплектом:</p>
							<div className="mt-1 grid gap-2">
								<p className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
									{bundleTotalLabel}
								</p>
								<span className="w-fit rounded-full border border-destructive/15 bg-canvas px-3 py-1 text-xs font-semibold text-destructive shadow-control">
									{discountLabel}
								</span>
							</div>
						</div>
					</div>

					<Button
						type="button"
						variant="dark"
						className="w-full"
						disabled={!canAddBundle}
						onClick={() => {
							addManyToCart(
								getBundleCartProducts(activeBundle, product, category),
							);
						}}>
						<ShoppingBag aria-hidden="true" />
						{canAddBundle ? "В корзину комплектом" : "Нет в наличии"}
					</Button>
				</div>
			</div>
		</section>
	);
}
