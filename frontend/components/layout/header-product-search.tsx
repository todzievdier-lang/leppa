"use client";

import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type FormEvent,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { createPortal } from "react-dom";

import { getSafeProductImageSrc } from "@/components/media/product-media-frame";
import { Button } from "@/components/ui/button";
import { createCatalogHref } from "@/lib/catalog/url";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/price";

import type { ProductSearchItem } from "@/types/catalog";

const SEARCH_RESULT_LIMIT = 12;

type ProductSearchResponse = {
	products?: ProductSearchItem[];
};

type IndexedProductSearchItem = ProductSearchItem & {
	compactName: string;
	compactSku: string;
	normalizedName: string;
	normalizedSku: string;
};

function normalizeSearchText(value: unknown): string {
	return String(value ?? "").trim().toLocaleLowerCase("ru-RU");
}

function normalizeCompactSearchText(value: unknown): string {
	return normalizeSearchText(value).replace(/[^0-9a-zа-яё]+/giu, "");
}

function getSearchRank(
	product: IndexedProductSearchItem,
	compactQuery: string,
	normalizedQuery: string,
) {
	if (compactQuery && product.compactSku === compactQuery) {
		return 0;
	}

	if (compactQuery && product.compactSku.startsWith(compactQuery)) {
		return 1;
	}

	if (product.normalizedName.startsWith(normalizedQuery)) {
		return 2;
	}

	if (product.normalizedName.includes(normalizedQuery)) {
		return 3;
	}

	return 4;
}

function getProductMeta(product: ProductSearchItem) {
	const sku = product.sku?.trim();

	return sku
		? `Артикул ${sku} · ${product.categoryName}`
		: product.categoryName;
}

export function HeaderProductSearch({
	isNavigationOpen = false,
	products,
}: {
	isNavigationOpen?: boolean;
	products: ProductSearchItem[];
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [searchProducts, setSearchProducts] = useState(products);
	const [hasLoadedSearchProducts, setHasLoadedSearchProducts] = useState(
		products.length > 0,
	);
	const [isLoadingProducts, setIsLoadingProducts] = useState(false);
	const [searchLoadFailed, setSearchLoadFailed] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const router = useRouter();
	const prefersReducedMotion = useReducedMotion();
	const canUseDocument = typeof document !== "undefined";
	const trimmedQuery = query.trim();
	const normalizedQuery = normalizeSearchText(trimmedQuery);
	const compactQuery = normalizeCompactSearchText(trimmedQuery);
	const hasQuery = trimmedQuery.length > 0;

	const indexedProducts = useMemo<IndexedProductSearchItem[]>(
		() =>
			searchProducts.map((product) => ({
				...product,
				compactName: normalizeCompactSearchText(product.name),
				compactSku: normalizeCompactSearchText(product.sku),
				normalizedName: normalizeSearchText(product.name),
				normalizedSku: normalizeSearchText(product.sku),
			})),
		[searchProducts],
	);

	const results = useMemo(() => {
		if (!hasQuery) {
			return [];
		}

		const terms = normalizedQuery.split(/\s+/).filter(Boolean);
		const compactTerms = terms.map(normalizeCompactSearchText);

		return indexedProducts
			.map((product) => {
				const isMatch = terms.every((term, index) => {
					const compactTerm = compactTerms[index];

					return (
						product.normalizedName.includes(term)
						|| product.normalizedSku.includes(term)
						|| (compactTerm.length > 0
							&& (product.compactName.includes(compactTerm)
								|| product.compactSku.includes(compactTerm)))
					);
				});

				if (!isMatch) {
					return null;
				}

				return {
					product,
					rank: getSearchRank(product, compactQuery, normalizedQuery),
				};
			})
			.filter(
				(
					result,
				): result is { product: IndexedProductSearchItem; rank: number } =>
					result !== null,
			)
			.sort((left, right) => {
				const rankComparison = left.rank - right.rank;

				if (rankComparison !== 0) {
					return rankComparison;
				}

				return left.product.name.localeCompare(right.product.name, "ru-RU");
			})
			.slice(0, SEARCH_RESULT_LIMIT)
			.map((result) => result.product);
	}, [compactQuery, hasQuery, indexedProducts, normalizedQuery]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const focusTimer = window.setTimeout(() => {
			inputRef.current?.focus();
		}, 40);

		return () => {
			window.clearTimeout(focusTimer);
		};
	}, [isOpen]);

	useEffect(() => {
		document.body.classList.toggle("search-overlay", isOpen);

		return () => {
			document.body.classList.remove("search-overlay");
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setQuery("");
				setIsOpen(false);
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!trimmedQuery) {
			return;
		}

		setQuery("");
		setIsOpen(false);
		router.push(createCatalogHref("/catalog", { search: trimmedQuery }));
	}

	async function loadSearchProducts() {
		if (hasLoadedSearchProducts || isLoadingProducts) {
			return;
		}

		setIsLoadingProducts(true);
		setSearchLoadFailed(false);

		try {
			const response = await fetch("/api/catalog/search", {
				cache: "no-store",
			});

			if (!response.ok) {
				throw new Error(`Search products request failed: ${response.status}`);
			}

			const payload = (await response.json()) as ProductSearchResponse;

			setSearchProducts(Array.isArray(payload.products) ? payload.products : []);
			setHasLoadedSearchProducts(true);
		} catch {
			setSearchLoadFailed(true);
		} finally {
			setIsLoadingProducts(false);
		}
	}

	function openSearch() {
		setQuery("");
		setIsOpen(true);
		void loadSearchProducts();
	}

	function closeSearch() {
		setQuery("");
		setIsOpen(false);
	}

	const transition = {
		duration: prefersReducedMotion ? 0.01 : 0.24,
		ease: [0.22, 1, 0.36, 1],
	};

	const searchDialog = (
		<AnimatePresence>
			{isOpen ? (
				<motion.div
					key="product-search-backdrop"
					className="fixed inset-0 z-[100] grid items-start justify-items-center bg-ink/15 px-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-5 sm:pt-[min(12vh,7rem)]"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={transition}
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) {
							closeSearch();
						}
					}}>
					<motion.section
						role="dialog"
						aria-modal="true"
						aria-label="Поиск по товарам"
						id="product-search-dialog"
						className="mx-auto grid max-h-[calc(100dvh-2rem)] w-full max-w-[720px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-chrome-panel border border-hairline bg-canvas shadow-surface-lg sm:max-h-[min(76vh,690px)]"
						initial={
							prefersReducedMotion
								? { opacity: 0 }
								: { opacity: 0, y: 12, scale: 0.985 }
						}
						animate={
							prefersReducedMotion
								? { opacity: 1 }
								: { opacity: 1, y: 0, scale: 1 }
						}
						exit={
							prefersReducedMotion
								? { opacity: 0 }
								: { opacity: 0, y: 8, scale: 0.99 }
						}
						transition={transition}>
						<form
							onSubmit={handleSubmit}
							className="flex h-[68px] min-w-0 items-center gap-3 border-b border-hairline px-4 text-ink-muted">
							<Search
								aria-hidden="true"
								className="size-5 shrink-0 text-ink-faint"
							/>
							<label className="min-w-0 flex-1">
								<span className="sr-only">Поиск по названию или артикулу</span>
								<input
									ref={inputRef}
									value={query}
									onChange={(event) => {
										setQuery(event.target.value);
									}}
									type="search"
									placeholder="Название или артикул"
									className="h-full w-full min-w-0 appearance-none border-0 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
								/>
							</label>
							<Button
								type="button"
								variant="secondary"
								size="icon"
								aria-label="Закрыть поиск"
								className="size-9 shadow-none"
								onClick={closeSearch}>
								<X aria-hidden="true" />
							</Button>
						</form>

						<div className="min-h-0 overflow-y-auto p-2.5">
							{hasQuery && results.length > 0 ? (
								<div className="grid gap-1">
									{results.map((product) => (
										<Link
											key={product.id}
											href={product.href}
											scroll={false}
											onPointerDown={closeSearch}
											onClick={closeSearch}
											className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-sm px-2 py-2.5 text-left transition-colors duration-200 hover:bg-ink-splash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
											<span className="relative isolate aspect-square overflow-hidden rounded-sm border border-hairline bg-toolbar">
												<Image
													src={getSafeProductImageSrc(product.image)}
													alt={product.imageAlt}
													fill
													unoptimized
													sizes="48px"
													className="object-cover object-center"
													onError={(event) => {
														event.currentTarget.src = "/no-image.png";
													}}
												/>
											</span>
											<span className="min-w-0">
												<strong className="block truncate text-sm font-semibold text-ink">
													{product.name}
												</strong>
												<small className="mt-1 block truncate text-xs text-ink-muted">
													{getProductMeta(product)}
												</small>
											</span>
											<span className="hidden max-w-[132px] truncate text-right text-xs font-semibold text-ink sm:block">
												{formatPrice(product.price, product.currency ?? "RUB")}
											</span>
										</Link>
									))}
								</div>
							) : (
								<div className="grid min-h-[270px] place-content-center justify-items-center gap-2 px-6 py-10 text-center text-ink-muted">
									<Search
										aria-hidden="true"
										className="size-8 text-ink-faint"
									/>
									<strong className="mt-1 text-sm font-semibold text-ink">
										{isLoadingProducts
											? "Загрузка товаров"
											: searchLoadFailed
												? "Поиск недоступен"
												: hasQuery
													? "Ничего не найдено"
													: "Поиск по товарам"}
									</strong>
									<span className="max-w-xs text-xs leading-relaxed">
										{isLoadingProducts
											? "Каталог скоро появится"
											: searchLoadFailed
												? "Откройте каталог или попробуйте позже"
												: hasQuery
													? "Проверьте название или артикул товара"
													: "Название, модель или артикул"}
									</span>
								</div>
							)}
						</div>
					</motion.section>
				</motion.div>
			) : null}
		</AnimatePresence>
	);

	return (
		<>
			<Button
				type="button"
				variant={isOpen ? "dark" : "secondary"}
				size="icon"
				aria-haspopup="dialog"
				aria-controls="product-search-dialog"
				aria-expanded={isOpen}
				aria-label="Поиск по товарам"
				className={cn(isNavigationOpen && "pointer-events-none opacity-45")}
				onClick={openSearch}>
				<Search aria-hidden="true" />
			</Button>
			{canUseDocument ? createPortal(searchDialog, document.body) : null}
		</>
	);
}
