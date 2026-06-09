"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, ShoppingBag } from "lucide-react";

import { FilledImage } from "@/components/media/filled-image";
import { Button } from "@/components/ui/button";
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

type KitPart = "toilet" | "installation" | "flush-button" | "sound-panel";

type ProductBundle = {
	id: string;
	items: Product[];
	name: string;
	originalTotal: number | null;
	discountAmount: number | null;
	bundleTotal: number | null;
	currency: string;
};

const BUNDLE_DISCOUNT_RATE = 0.06;
const MAX_BUNDLES = 2;
const KIT_PART_ORDER: KitPart[] = [
	"installation",
	"toilet",
	"flush-button",
	"sound-panel",
];

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

	return "Унитаз";
}

function getProductGroupKey(product: Product) {
	return product.baseSku ?? product.model ?? product.sku ?? product.slug;
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

function uniqueProductGroups(products: Product[], currentProduct: Product) {
	const currentColorSlug = currentProduct.color?.slug ?? null;
	const bestProductsByGroup = new Map<string, Product>();

	products.forEach((product) => {
		const productGroupKey = getProductGroupKey(product);
		const existingProduct = bestProductsByGroup.get(productGroupKey);

		if (!existingProduct) {
			bestProductsByGroup.set(productGroupKey, product);
			return;
		}

		const existingMatchesColor =
			currentColorSlug !== null && existingProduct.color?.slug === currentColorSlug;
		const productMatchesColor =
			currentColorSlug !== null && product.color?.slug === currentColorSlug;

		if (
			(product.inStock && !existingProduct.inStock)
			|| (productMatchesColor && !existingMatchesColor)
		) {
			bestProductsByGroup.set(productGroupKey, product);
		}
	});

	return [...bestProductsByGroup.values()];
}

function sortProductsByFit(products: Product[], currentProduct: Product) {
	const currentColorSlug = currentProduct.color?.slug ?? null;

	return [...products].sort((leftProduct, rightProduct) => {
		const leftStockScore = leftProduct.inStock ? 0 : 1;
		const rightStockScore = rightProduct.inStock ? 0 : 1;

		if (leftStockScore !== rightStockScore) {
			return leftStockScore - rightStockScore;
		}

		const leftColorScore =
			currentColorSlug !== null && leftProduct.color?.slug === currentColorSlug
				? 0
				: 1;
		const rightColorScore =
			currentColorSlug !== null && rightProduct.color?.slug === currentColorSlug
				? 0
				: 1;

		if (leftColorScore !== rightColorScore) {
			return leftColorScore - rightColorScore;
		}

		const leftPriceScore = typeof leftProduct.price === "number" ? 0 : 1;
		const rightPriceScore = typeof rightProduct.price === "number" ? 0 : 1;

		if (leftPriceScore !== rightPriceScore) {
			return leftPriceScore - rightPriceScore;
		}

		return leftProduct.name.localeCompare(rightProduct.name, "ru-RU");
	});
}

function getComplementParts(currentPart: KitPart) {
	if (currentPart === "installation") {
		return ["toilet", "flush-button", "sound-panel"] satisfies KitPart[];
	}

	if (currentPart === "toilet") {
		return ["installation", "flush-button", "sound-panel"] satisfies KitPart[];
	}

	if (currentPart === "flush-button") {
		return ["installation", "toilet", "sound-panel"] satisfies KitPart[];
	}

	return ["installation", "toilet", "flush-button"] satisfies KitPart[];
}

function getBundlePriceTotals(items: Product[], currency: string) {
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
	const discountAmount = Math.round(originalTotal * BUNDLE_DISCOUNT_RATE);

	return {
		originalTotal,
		discountAmount,
		bundleTotal: originalTotal - discountAmount,
		currency,
	};
}

function buildBundles(product: Product, products: Product[]) {
	const currentPart = getKitPart(product);

	if (!currentPart) {
		return [];
	}

	const productsByPart = new Map<KitPart, Product[]>();

	products
		.filter((candidate) => candidate.id !== product.id)
		.forEach((candidate) => {
			const candidatePart = getKitPart(candidate);

			if (!candidatePart) {
				return;
			}

			const partProducts = productsByPart.get(candidatePart) ?? [];

			partProducts.push(candidate);
			productsByPart.set(candidatePart, partProducts);
		});

	const complementParts = getComplementParts(currentPart).filter((part) =>
		(productsByPart.get(part)?.length ?? 0) > 0,
	);

	if (complementParts.length === 0) {
		return [];
	}

	const candidatesByPart = new Map<KitPart, Product[]>();

	complementParts.forEach((part) => {
		const candidates = sortProductsByFit(
			uniqueProductGroups(productsByPart.get(part) ?? [], product),
			product,
		);

		if (candidates.length > 0) {
			candidatesByPart.set(part, candidates.slice(0, MAX_BUNDLES));
		}
	});

	const bundleCount = Math.min(
		MAX_BUNDLES,
		Math.max(
			1,
			...complementParts.map((part) => candidatesByPart.get(part)?.length ?? 0),
		),
	);
	const currency = product.currency ?? "RUB";

	return Array.from({ length: bundleCount }, (_, bundleIndex) => {
		const items = uniqueProducts([
			product,
			...complementParts
				.map((part) => {
					const partCandidates = candidatesByPart.get(part) ?? [];

					return partCandidates[bundleIndex] ?? partCandidates[0] ?? null;
				})
				.filter((item): item is Product => item !== null),
		]).sort((leftProduct, rightProduct) => {
			const leftPart = getKitPart(leftProduct);
			const rightPart = getKitPart(rightProduct);

			return (
				KIT_PART_ORDER.indexOf(leftPart ?? currentPart)
				- KIT_PART_ORDER.indexOf(rightPart ?? currentPart)
			);
		});

		return {
			id: items.map((item) => item.id).join("-"),
			items,
			name: `Комплект ${bundleIndex + 1}`,
			...getBundlePriceTotals(items, currency),
		};
	}).filter((bundle) => bundle.items.length > 1);
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
					value: bundle.name,
				},
			],
		);
		const discountedPrice = discountedPrices?.[index] ?? null;

		if (discountedPrice === null) {
			return snapshot;
		}

		return {
			...snapshot,
			price: discountedPrice,
			priceLabel: formatPrice(discountedPrice, snapshot.currency ?? "RUB"),
		};
	});
}

function ProductBundleItem({
	isCurrent,
	product,
}: {
	isCurrent: boolean;
	product: Product;
}) {
	const part = getKitPart(product);
	const href = getProductHref(product);

	return (
		<article className="relative grid min-w-0 gap-3 rounded-[8px] border border-hairline bg-canvas p-3 sm:grid-cols-[6rem_minmax(0,1fr)] lg:flex-1 lg:grid-cols-1">
			<span className="absolute right-3 top-3 z-10 inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-control">
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
					sizes="(max-width: 640px) 6rem, (max-width: 1024px) 8rem, 12rem"
					className="aspect-square rounded-[6px]"
					imageClassName="object-contain p-2"
				/>
			</Link>

			<div className="min-w-0 self-end">
				<div className="flex min-w-0 flex-wrap items-center gap-2">
					<p className="text-xs font-semibold uppercase tracking-normal text-ink-faint">
						{getPartLabel(part)}
					</p>
					{isCurrent ? (
						<span className="rounded-full border border-hairline bg-frost px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
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
				<p className="mt-2 text-sm font-semibold text-ink">
					{formatProductPrice(product)}
				</p>
			</div>
		</article>
	);
}

function BundleJoiner() {
	return (
		<div className="flex items-center justify-center text-ink-faint lg:self-center">
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
	const [activeBundleIndex, setActiveBundleIndex] = useState(0);

	if (bundles.length === 0) {
		return null;
	}

	const activeBundle = bundles[Math.min(activeBundleIndex, bundles.length - 1)];
	const originalTotalLabel = activeBundle.originalTotal === null
		? "Цена по запросу"
		: formatPrice(activeBundle.originalTotal, activeBundle.currency);
	const bundleTotalLabel = activeBundle.bundleTotal === null
		? "Цена по запросу"
		: formatPrice(activeBundle.bundleTotal, activeBundle.currency);
	const discountLabel = activeBundle.discountAmount === null
		? `Скидка ${Math.round(BUNDLE_DISCOUNT_RATE * 100)}%`
		: `Выгода ${formatPrice(activeBundle.discountAmount, activeBundle.currency)}`;
	const availableCount = activeBundle.items.filter((item) => item.inStock).length;
	const canAddBundle = availableCount > 0;

	return (
		<section
			aria-labelledby="product-kit-title"
			className={cn("mt-12 rounded-[8px] bg-frost px-4 py-5 sm:px-6 lg:p-7", className)}>
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="min-w-0">
					<p className="text-xs font-semibold uppercase tracking-normal text-ink-faint">
						Подобрать вместе
					</p>
					<h2
						id="product-kit-title"
						className="mt-1 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
						Выгодные комплекты
					</h2>
				</div>

				{bundles.length > 1 ? (
					<div
						className="flex w-full gap-2 overflow-x-auto [scrollbar-width:none] md:w-auto [&::-webkit-scrollbar]:hidden"
						role="tablist"
						aria-label="Комплекты товаров">
						{bundles.map((bundle, index) => {
							const isActive = activeBundle.id === bundle.id;

							return (
								<button
									key={bundle.id}
									type="button"
									role="tab"
									aria-selected={isActive}
									className={cn(
										"shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200",
										isActive
											? "border-ink bg-ink text-on-dark"
											: "border-hairline bg-canvas text-ink-muted hover:border-hairline-strong hover:text-ink",
									)}
									onClick={() => {
										setActiveBundleIndex(index);
									}}>
									{bundle.name}
								</button>
							);
						})}
					</div>
				) : null}
			</div>

			<div className="mt-5 grid gap-5 rounded-[8px] bg-canvas p-3 shadow-control lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)] lg:items-stretch lg:p-5">
				<div className="flex min-w-0 flex-col gap-3 lg:flex-row">
					{activeBundle.items.map((item, index) => (
						<div
							key={item.id}
							className="contents">
							{index > 0 ? <BundleJoiner /> : null}
							<ProductBundleItem
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
							<div className="mt-1 flex flex-wrap items-center gap-2">
								<p className="text-3xl font-semibold tracking-normal text-ink">
									{bundleTotalLabel}
								</p>
								<span className="rounded-full border border-destructive/15 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
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
