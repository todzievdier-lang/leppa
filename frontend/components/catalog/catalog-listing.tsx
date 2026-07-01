"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
	CatalogSearch,
	CatalogSortControl,
} from "@/components/catalog/catalog-controls";
import { StorefrontBreadcrumbs } from "@/components/catalog/breadcrumbs";
import {
	ProductCard,
	ProductCardSkeleton,
} from "@/components/catalog/product-card";
import { CatalogPagination } from "@/components/catalog/pagination";
import { Button } from "@/components/ui/button";
import { surfaceVariants } from "@/components/ui/surface";
import {
	filterProducts,
	paginateProducts,
	sortProducts,
} from "@/lib/catalog/filters";
import {
	CATALOG_FILTER_PARAM,
	parseCatalogSearchParams,
} from "@/lib/catalog/query";
import { createCatalogHref } from "@/lib/catalog/url";
import { getCategoryHref } from "@/lib/catalog/helpers";
import { cn } from "@/lib/utils";

import type { MouseEvent } from "react";
import type { CatalogResult, PaginationMeta } from "@/types/catalog";

const SEARCH_SKELETON_DELAY_MS = 180;

function shouldUseBrowserNavigation(event: MouseEvent<HTMLAnchorElement>) {
	return (
		event.button !== 0
		|| event.altKey
		|| event.ctrlKey
		|| event.metaKey
		|| event.shiftKey
		|| event.currentTarget.target === "_blank"
	);
}

function CatalogStatePagination({
	onPageChange,
	pagination,
}: {
	onPageChange: (page: number) => void;
	pagination: PaginationMeta;
}) {
	if (pagination.totalPages <= 1) {
		return null;
	}

	const pages = Array.from(
		{ length: pagination.totalPages },
		(_, index) => index + 1,
	);

	return (
		<nav
			aria-label="Навигация по найденным товарам"
			className="mt-10 flex flex-wrap items-center justify-center gap-2">
			<Button
				type="button"
				variant="secondary"
				size="icon"
				disabled={!pagination.hasPreviousPage}
				onClick={() => {
					onPageChange(Math.max(1, pagination.page - 1));
				}}>
				<ChevronLeft
					aria-hidden="true"
					className="h-4 w-4"
				/>
				<span className="sr-only">Предыдущая страница</span>
			</Button>

			{pages.map((page) => {
				const isActive = page === pagination.page;

				return (
					<Button
						key={page}
						type="button"
						variant={isActive ? "dark" : "secondary"}
						size="icon"
						aria-current={isActive ? "page" : undefined}
						onClick={() => {
							onPageChange(page);
						}}>
						{page}
					</Button>
				);
			})}

			<Button
				type="button"
				variant="secondary"
				size="icon"
				disabled={!pagination.hasNextPage}
				onClick={() => {
					onPageChange(Math.min(pagination.totalPages, pagination.page + 1));
				}}>
				<ChevronRight
					aria-hidden="true"
					className="h-4 w-4"
				/>
				<span className="sr-only">Следующая страница</span>
			</Button>
		</nav>
	);
}

export function CatalogListing({
	result,
}: {
	result: CatalogResult;
}) {
	const { categories, query } = result;
	const categoryByKey = useMemo(
		() => new Map(categories.map((category) => [category.key, category])),
		[categories],
	);
	const [activeCategoryKey, setActiveCategoryKey] = useState(
		result.activeCategory?.key,
	);
	const [searchValue, setSearchValue] = useState(query.search ?? "");
	const [appliedSearch, setAppliedSearch] = useState(query.search ?? "");
	const [page, setPage] = useState(query.page);
	const [perPage, setPerPage] = useState(query.perPage);
	const [sort, setSort] = useState(query.sort);
	const [brand, setBrand] = useState(query.brand ?? []);
	const [filters, setFilters] = useState(query.filters ?? {});
	const activeCategory = activeCategoryKey
		? (categoryByKey.get(activeCategoryKey) ?? null)
		: null;
	const basePath = activeCategory
		? getCategoryHref(activeCategory)
		: "/catalog";
	const isSearchPending = searchValue !== appliedSearch;
	const appliedSearchText = appliedSearch.trim();
	const inputSearchText = searchValue.trim();
	const isSearchMode = inputSearchText.length > 0 || appliedSearchText.length > 0;
	const filteredProducts = useMemo(() => {
		return sortProducts(
			filterProducts(result.searchableProducts, {
				categoryKey: activeCategoryKey,
				search: appliedSearchText || undefined,
				brand,
				filters,
			}),
			sort,
		);
	}, [
		activeCategoryKey,
		appliedSearchText,
		brand,
		filters,
		result.searchableProducts,
		sort,
	]);
	const visibleResult = useMemo(
		() =>
			paginateProducts(
				filteredProducts,
				page,
				perPage,
			),
		[filteredProducts, page, perPage],
	);
	const visibleProducts = visibleResult.items;
	const visiblePagination = visibleResult.meta;
	const linkQuery = {
		brand,
		filters,
		perPage,
		sort,
	};
	const skeletonCount = Math.max(
		4,
		Math.min(
			perPage,
			visibleProducts.length || perPage,
		),
	);
	const title = activeCategory?.name ?? "Каталог";
	const description =
		activeCategory?.description ??
		"Единый каталог Leppa & WenSton: сантехника, зеркала и оборудование для современных ванных комнат.";
	const breadcrumbItems = activeCategory
		? [
				{ label: "Главная", href: "/" },
				{ label: "Каталог", href: "/catalog" },
				{ label: activeCategory.name },
			]
		: [{ label: "Главная", href: "/" }, { label: "Каталог" }];

	const applyUrlState = useCallback(
		(url: URL) => {
			const pathname = url.pathname.replace(/\/+$/, "") || "/";
			const nextCategory = categories.find(
				(category) => getCategoryHref(category) === pathname,
			);
			const nextQuery = parseCatalogSearchParams(
				{
					q: url.searchParams.get("q") ?? undefined,
					page: url.searchParams.get("page") ?? undefined,
					perPage: url.searchParams.get("perPage") ?? undefined,
					sort: url.searchParams.get("sort") ?? undefined,
					brand: url.searchParams.getAll("brand"),
					[CATALOG_FILTER_PARAM]: url.searchParams.getAll(
						CATALOG_FILTER_PARAM,
					),
				},
				nextCategory ? { categoryKey: nextCategory.key } : {},
			);

			setActiveCategoryKey(nextCategory?.key);
			setSearchValue(nextQuery.search ?? "");
			setAppliedSearch(nextQuery.search ?? "");
			setPage(nextQuery.page ?? 1);
			setPerPage(nextQuery.perPage ?? 12);
			setSort(nextQuery.sort ?? "featured");
			setBrand(nextQuery.brand ?? []);
			setFilters(nextQuery.filters ?? {});
		},
		[categories],
	);

	const navigateCatalog = useCallback(
		(href: string, mode: "push" | "replace") => {
			const url = new URL(href, window.location.origin);
			const relativeUrl = `${url.pathname}${url.search}${url.hash}`;

			if (mode === "replace") {
				window.history.replaceState(null, "", relativeUrl);
			} else {
				window.history.pushState(null, "", relativeUrl);
			}

			applyUrlState(url);
		},
		[applyUrlState],
	);

	useEffect(() => {
		function handlePopState() {
			applyUrlState(new URL(window.location.href));
		}

		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [applyUrlState]);

	useEffect(() => {
		if (searchValue === appliedSearch) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setAppliedSearch(searchValue);
		}, SEARCH_SKELETON_DELAY_MS);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [appliedSearch, searchValue]);

	function handleSearchChange(nextValue: string) {
		setSearchValue(nextValue);
		setPage(1);
	}

	function handleSortChange(nextSort: CatalogResult["query"]["sort"]) {
		navigateCatalog(
			createCatalogHref(basePath, {
				perPage,
				sort: nextSort,
			}),
			"replace",
		);
	}

	return (
		<section className="bg-canvas text-ink">
			<div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:px-10 lg:pb-24 lg:pt-40">
				<StorefrontBreadcrumbs items={breadcrumbItems} />

				<div className="mt-3 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.7fr)] lg:items-end">
					<div>
						<h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink sm:text-5xl lg:text-6xl">
							{title}
						</h1>
						<p className="mt-5 max-w-2xl text-base text-ink-muted sm:text-lg">
							{description}
						</p>
					</div>
				</div>

				<div className="mt-8 mb-2 flex flex-col gap-2 sm:flex-row">
					<CatalogSearch
						className="lg:justify-self-end lg:w-full"
						isPending={isSearchPending}
						onSearchChange={handleSearchChange}
						search={searchValue}
					/>
					<CatalogSortControl
						onSortChange={handleSortChange}
						sort={sort}
					/>
				</div>

				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<nav
						aria-label="Категории каталога"
						className="flex gap-2 overflow-x-auto py-4">
						<Button
							asChild
							variant={!activeCategory ? "dark" : "secondary"}
							size="sm">
							<Link
								href={createCatalogHref("/catalog", { sort })}
								onClick={(event) => {
									if (shouldUseBrowserNavigation(event)) {
										return;
									}

									event.preventDefault();
									navigateCatalog(
										createCatalogHref("/catalog", { sort }),
										"push",
									);
								}}
								className="shrink-0">
								Все товары
							</Link>
						</Button>
						{categories.map((category) => (
							<Button
								key={category.key}
								asChild
								variant={
									activeCategory?.key === category.key ? "dark" : "secondary"
								}
								size="sm">
								<Link
									href={createCatalogHref(getCategoryHref(category), {
										sort,
									})}
									onClick={(event) => {
										if (shouldUseBrowserNavigation(event)) {
											return;
										}

										event.preventDefault();
										navigateCatalog(
											createCatalogHref(getCategoryHref(category), {
												sort,
											}),
											"push",
										);
									}}
									className="shrink-0">
									{category.name}
								</Link>
							</Button>
						))}
					</nav>
				</div>

				{isSearchPending ? (
					<div className="mt-8 grid gap-x-3 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: skeletonCount }, (_, index) => (
							<ProductCardSkeleton key={index} />
						))}
					</div>
				) : visibleProducts.length > 0 ? (
					<div className="mt-8 grid gap-x-3 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{visibleProducts.map((product) => (
							<ProductCard
								key={product.id}
								category={categoryByKey.get(product.categoryKey) ?? null}
								product={product}
								variantProducts={result.searchableProducts}
							/>
						))}
					</div>
				) : (
					<div
						className={cn(
							surfaceVariants({ variant: "empty" }),
							"mt-8 px-6 py-12 text-sm text-ink-muted",
						)}>
						{isSearchMode
							? "По запросу ничего не найдено."
							: "По выбранным параметрам товаров не найдено."}
					</div>
				)}

				{isSearchMode ? (
					!isSearchPending && (
						<CatalogStatePagination
							pagination={visiblePagination}
							onPageChange={setPage}
						/>
					)
				) : (
					<CatalogPagination
						basePath={basePath}
						onPageChange={(href) => {
							navigateCatalog(href, "push");
						}}
						pagination={visiblePagination}
						query={linkQuery}
					/>
				)}
			</div>
		</section>
	);
}
