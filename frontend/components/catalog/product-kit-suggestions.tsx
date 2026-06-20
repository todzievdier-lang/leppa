"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, ShoppingBag, X } from "lucide-react";

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
const BUNDLE_OFFER_LABEL = "Выгодный комплект";
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
	const categoryKey = normalizeText(product.categoryKey);
	const productType = normalizeText(getAttributeString(product, "productType"));
	const kitRole = normalizeText(getAttributeString(product, "kitRole"));
	const name = normalizeText(product.name);

	if (categoryKey === "installations") {
		return "installation";
	}

	if (categoryKey === "flush-buttons") {
		return "flush-button";
	}

	if (categoryKey === "zerkala") {
		return "mirror";
	}

	if (categoryKey === "unitazy" || categoryKey === "umnye-unitazy") {
		return "toilet";
	}

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
		productType.includes("зеркал")
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
		return "Звукоизоляционная панель";
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
	const discountAmount = items.length > 1
		? Math.round(originalTotal * (discountPercent / 100))
		: 0;

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
	return uniqueProducts([
		product,
		...productSlugs
			.filter((slug) => slug !== product.slug)
			.map((slug) => productsBySlug.get(slug) ?? null)
			.filter((item): item is Product => item !== null),
	]).slice(0, MAX_BUNDLE_PRODUCTS);
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
			[{ label: "Комплект", value: BUNDLE_OFFER_LABEL }],
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

function isComparableToilet(candidate: Product, selectedProduct: Product) {
	const selectedName = normalizeText(selectedProduct.name);
	const candidateName = normalizeText(candidate.name);

	if (selectedName.includes("подвесн")) {
		return candidateName.includes("подвесн");
	}

	if (selectedName.includes("напольн")) {
		return candidateName.includes("напольн");
	}

	return true;
}

function getAlternativeProducts(selectedProduct: Product, products: Product[]) {
	const selectedPart = getKitPart(selectedProduct);
	const samePart = products.filter((candidate) => {
		if (getKitPart(candidate) !== selectedPart) {
			return false;
		}

		if (selectedPart === "toilet" && !isComparableToilet(candidate, selectedProduct)) {
			return false;
		}

		return true;
	});
	const sameCategory = samePart.filter(
		(candidate) => candidate.categoryKey === selectedProduct.categoryKey,
	);
	const candidates = sameCategory.length > 1 ? sameCategory : samePart;

	return [...candidates].sort((first, second) => {
		if (first.id === selectedProduct.id) {
			return -1;
		}

		if (second.id === selectedProduct.id) {
			return 1;
		}

		if (first.inStock !== second.inStock) {
			return first.inStock ? -1 : 1;
		}

		return first.name.localeCompare(second.name, "ru");
	});
}

function BundleJoiner() {
	return (
		<div className="flex shrink-0 items-center justify-center px-1 text-ink-faint sm:self-center">
			<Plus aria-hidden="true" className="size-5" />
		</div>
	);
}

function BundleProductCard({
	alternativeCount,
	discountedPrice,
	isCurrent,
	isSelected,
	onOpenAlternatives,
	onToggle,
	product,
}: {
	alternativeCount: number;
	discountedPrice: number | null;
	isCurrent: boolean;
	isSelected: boolean;
	onOpenAlternatives: () => void;
	onToggle: () => void;
	product: Product;
}) {
	const hasDiscount = isSelected
		&& discountedPrice !== null
		&& typeof product.price === "number"
		&& discountedPrice < product.price;

	return (
		<article
			className={cn(
				"relative flex w-44 shrink-0 flex-col px-2 py-3 transition-opacity sm:w-48",
				!isSelected && !isCurrent && "opacity-75",
			)}>
			{!isCurrent ? (
				<button
					type="button"
					aria-label={isSelected ? `Убрать ${product.name} из комплекта` : `Добавить ${product.name} в комплект`}
					aria-pressed={isSelected}
					onClick={onToggle}
					className={cn(
						"absolute right-2 top-2 z-10 inline-flex size-7 items-center justify-center rounded-md border bg-canvas shadow-control transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						isSelected
							? "border-ink bg-ink text-on-dark"
							: "border-hairline-strong text-transparent hover:border-ink-faint",
					)}>
					<Check aria-hidden="true" className="size-4" />
				</button>
			) : null}

			<Link
				href={getProductHref(product)}
				scroll={false}
				aria-label={`Открыть товар ${product.name}`}
				className="block">
				<FilledImage
					src={getProductPrimaryImage(product)}
					alt={product.name}
					sizes="12rem"
					className="h-36 w-full rounded-md bg-canvas sm:h-40"
					imageClassName="object-contain p-2"
				/>
			</Link>

			<div className="mt-3 flex min-h-28 flex-1 flex-col">
				<p className="text-lg font-semibold leading-tight text-ink">
					{hasDiscount
						? formatPrice(discountedPrice, product.currency ?? "RUB")
						: formatProductPrice(product)}
				</p>
				{hasDiscount ? (
					<p className="mt-1 text-xs font-semibold text-ink-muted line-through decoration-ink-muted/50">
						{formatProductPrice(product)}
					</p>
				) : null}
				<Link
					href={getProductHref(product)}
					scroll={false}
					className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors hover:text-ink-muted">
					{product.name}
				</Link>
				<p className="mt-1 text-xs text-ink-faint">
					{product.brand ?? getPartLabel(getKitPart(product))}
				</p>
				{!isCurrent && alternativeCount > 1 ? (
					<button
						type="button"
						onClick={onOpenAlternatives}
						className="mt-auto pt-3 text-left text-sm font-semibold text-ink-muted underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						{alternativeCount > 2
							? `Выбрать из ${alternativeCount}`
							: "Выбрать другой"}
					</button>
				) : null}
			</div>
		</article>
	);
}

function BundleOptionsDrawer({
	candidates,
	onChoose,
	onClose,
	selectedProduct,
}: {
	candidates: Product[];
	onChoose: (product: Product) => void;
	onClose: () => void;
	selectedProduct: Product;
}) {
	const title = `Выберите: ${getPartLabel(getKitPart(selectedProduct))}`;

	return (
		<div className="fixed inset-0 z-[70]" role="presentation">
			<button
				type="button"
				aria-label="Закрыть выбор товара"
				onClick={onClose}
				className="absolute inset-0 bg-scrim backdrop-blur-[2px]"
			/>

			<aside
				role="dialog"
				aria-modal="true"
				aria-labelledby="bundle-options-title"
				className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-toolbar shadow-surface-lg">
				<header className="flex shrink-0 items-start justify-between gap-5 border-b border-hairline bg-canvas px-5 py-5 sm:px-7">
					<div>
						<p className="text-xs font-semibold uppercase tracking-normal text-ink-faint">
							Варианты комплектации
						</p>
						<h3 id="bundle-options-title" className="mt-1 text-xl font-semibold text-ink sm:text-2xl">
							{title}
						</h3>
						<p className="mt-1 text-sm text-ink-muted">
							{candidates.length} {candidates.length === 1 ? "товар" : "товаров"}
						</p>
					</div>
					<button
						type="button"
						autoFocus
						aria-label="Закрыть"
						onClick={onClose}
						className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-hairline bg-frost text-ink shadow-control transition-colors hover:bg-toolbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						<X aria-hidden="true" className="size-5" />
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
					<div className="grid gap-3">
						{candidates.map((candidate) => {
							const isSelected = candidate.id === selectedProduct.id;

							return (
								<article
									key={candidate.id}
									className={cn(
										surfaceVariants({ variant: "card" }),
										"grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 p-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-4",
										isSelected && "ring-2 ring-ink",
									)}>
									<Link href={getProductHref(candidate)} scroll={false} className="block self-center">
										<FilledImage
											src={getProductPrimaryImage(candidate)}
											alt={candidate.name}
											sizes="9rem"
											className="h-32 w-full rounded-md bg-frost sm:h-36"
											imageClassName="object-contain p-2"
										/>
									</Link>

									<div className="flex min-w-0 flex-col">
										<p className="text-xl font-semibold text-ink">
											{formatProductPrice(candidate)}
										</p>
										<Link
											href={getProductHref(candidate)}
											scroll={false}
											className="mt-2 line-clamp-3 text-sm font-semibold leading-snug text-ink hover:text-ink-muted">
											{candidate.name}
										</Link>
										<Link
											href={getProductHref(candidate)}
											scroll={false}
											className="mt-1 w-fit text-xs font-semibold text-ink-muted underline decoration-hairline-strong underline-offset-4">
											О товаре
										</Link>
										<Button
											type="button"
											size="sm"
											variant={isSelected ? "dark" : "secondary"}
											disabled={isSelected || !candidate.inStock}
											onClick={() => onChoose(candidate)}
											className="mt-auto w-full">
											{isSelected ? (
												<><Check aria-hidden="true" />В комплекте</>
											) : candidate.inStock ? (
												"Добавить в комплект"
											) : (
												"Нет в наличии"
											)}
										</Button>
									</div>
								</article>
							);
						})}
					</div>
				</div>
			</aside>
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
		() => buildConfiguredBundles(product, products),
		[product, products],
	);
	const configuredBundle = bundles[0] ?? null;
	const [bundleItems, setBundleItems] = useState<Product[]>(
		() => configuredBundle?.items ?? [],
	);
	const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
		() => new Set(configuredBundle?.items.map((item) => item.id) ?? []),
	);
	const [drawerSlotIndex, setDrawerSlotIndex] = useState<number | null>(null);

	useEffect(() => {
		if (drawerSlotIndex === null) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setDrawerSlotIndex(null);
			}
		}

		document.body.classList.add("overlay");
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.classList.remove("overlay");
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [drawerSlotIndex]);

	if (!configuredBundle) {
		return null;
	}

	const selectedItems = bundleItems.filter(
		(item) => item.id === product.id || selectedProductIds.has(item.id),
	);
	const totals = getBundlePriceTotals(
		selectedItems,
		configuredBundle.currency,
		configuredBundle.discountPercent,
	);
	const activeBundle: ProductBundle = {
		...configuredBundle,
		items: selectedItems,
		...totals,
	};
	const discountedPrices = getDiscountedPrices(
		selectedItems,
		activeBundle.bundleTotal,
	);
	const discountedPriceById = new Map(
		selectedItems.map((item, index) => [item.id, discountedPrices?.[index] ?? null]),
	);
	const canAddBundle = selectedItems.every((item) => item.inStock);
	const hasBundleDiscount = (activeBundle.discountAmount ?? 0) > 0;
	const drawerProduct = drawerSlotIndex === null
		? null
		: (bundleItems[drawerSlotIndex] ?? null);
	const drawerCandidates = drawerProduct
		? getAlternativeProducts(drawerProduct, products)
		: [];

	function toggleProduct(item: Product) {
		if (item.id === product.id) {
			return;
		}

		setSelectedProductIds((current) => {
			const next = new Set(current);

			if (next.has(item.id)) {
				next.delete(item.id);
			} else {
				next.add(item.id);
			}

			return next;
		});
	}

	function replaceProduct(slotIndex: number, nextProduct: Product) {
		const previousProduct = bundleItems[slotIndex];

		setBundleItems((current) => current.map((item, index) =>
			index === slotIndex ? nextProduct : item,
		));
		setSelectedProductIds((current) => {
			const next = new Set(current);
			next.delete(previousProduct.id);
			next.add(nextProduct.id);
			return next;
		});
		setDrawerSlotIndex(null);
	}

	return (
		<section
			aria-labelledby="product-kit-title"
			className={cn(
				"mt-12 p-4 sm:p-6 lg:p-8",
				surfaceVariants({ variant: "muted" }),
				className,
			)}>
			<div>
				<p className="text-xs font-semibold uppercase tracking-normal text-ink-faint">
					Соберите свой набор
				</p>
				<h2 id="product-kit-title" className="mt-1 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
					{BUNDLE_OFFER_LABEL}
				</h2>
				<p className="mt-2 max-w-2xl text-sm text-ink-muted">
					Отметьте нужные позиции или замените товар на подходящий вариант.
				</p>
			</div>

			<div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-canvas shadow-control lg:grid lg:grid-cols-[minmax(0,1fr)_18rem]">
				<div className="min-w-0 overflow-x-auto px-2 py-4 sm:px-4">
					<div className="flex min-w-max items-stretch">
						{bundleItems.map((item, index) => {
							const isCurrent = item.id === product.id;
							const isSelected = isCurrent || selectedProductIds.has(item.id);
							const alternativeCount = getAlternativeProducts(item, products).length;

							return (
								<div key={`${index}-${item.id}`} className="flex items-stretch">
									{index > 0 ? <BundleJoiner /> : null}
									<BundleProductCard
										alternativeCount={alternativeCount}
										discountedPrice={discountedPriceById.get(item.id) ?? null}
										isCurrent={isCurrent}
										isSelected={isSelected}
										onOpenAlternatives={() => setDrawerSlotIndex(index)}
										onToggle={() => toggleProduct(item)}
										product={item}
									/>
								</div>
							);
						})}
					</div>
				</div>

				<div className="flex flex-col justify-center border-t border-hairline p-5 lg:border-l lg:border-t-0 lg:p-6">
					{hasBundleDiscount && activeBundle.originalTotal !== null ? (
						<div>
							<p className="text-sm text-ink-muted">По отдельности:</p>
							<p className="mt-1 text-lg font-semibold text-ink-muted line-through decoration-ink-muted/50">
								{formatPrice(activeBundle.originalTotal, activeBundle.currency)}
							</p>
						</div>
					) : null}

					<div className={cn(hasBundleDiscount && "mt-4 border-t border-hairline pt-4")}>
						<p className="text-sm font-semibold text-ink">
							{selectedItems.length > 1 ? "Комплектом:" : "Стоимость:"}
						</p>
						<p className="mt-1 text-3xl font-semibold tracking-normal text-ink">
							{activeBundle.bundleTotal === null
								? "Цена по запросу"
								: formatPrice(activeBundle.bundleTotal, activeBundle.currency)}
						</p>
						{hasBundleDiscount ? (
							<span className="mt-3 inline-flex w-fit rounded-full border border-destructive/15 bg-canvas px-3 py-1 text-xs font-semibold text-destructive shadow-control">
								Выгода {formatPrice(activeBundle.discountAmount ?? 0, activeBundle.currency)}
							</span>
						) : null}
					</div>

					<Button
						type="button"
						variant="dark"
						className="mt-5 w-full"
						disabled={!canAddBundle}
						onClick={() => {
							addManyToCart(
								getBundleCartProducts(activeBundle, product, category),
								{
									bundleTitle: BUNDLE_OFFER_LABEL,
									discountPercent: activeBundle.discountPercent,
								},
							);
						}}>
						<ShoppingBag aria-hidden="true" />
						{canAddBundle ? "В корзину комплектом" : "Нет в наличии"}
					</Button>
					<p className="mt-3 text-center text-xs text-ink-faint">
						Выбрано: {selectedItems.length} из {bundleItems.length}
					</p>
				</div>
			</div>

			{drawerProduct && drawerSlotIndex !== null ? (
				<BundleOptionsDrawer
					candidates={drawerCandidates}
					onChoose={(nextProduct) => replaceProduct(drawerSlotIndex, nextProduct)}
					onClose={() => setDrawerSlotIndex(null)}
					selectedProduct={drawerProduct}
				/>
			) : null}
		</section>
	);
}
