import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { ProductCard } from "@/components/catalog/product-card";
import { CatalogPagination } from "@/components/catalog/pagination";
import { CATALOG_FILTER_PARAM, CATALOG_SORT_OPTIONS, encodeCatalogFilter } from "@/lib/catalog/query";
import { createCatalogHref, clearCatalogFilters, toggleCatalogBrand, toggleCatalogFilter } from "@/lib/catalog/url";
import { getCategoryHref } from "@/lib/catalog/helpers";
import { cn } from "@/lib/utils";

import type { CatalogFilterGroup, CatalogQuery, CatalogResult } from "@/types/catalog";

function HiddenCatalogFields({ query }: { query: CatalogQuery }) {
	return (
		<>
			{query.sort ? (
				<input
					type="hidden"
					name="sort"
					value={query.sort}
				/>
			) : null}
			{query.brand?.map((brand) => (
				<input
					key={brand}
					type="hidden"
					name="brand"
					value={brand}
				/>
			))}
			{Object.entries(query.filters ?? {}).flatMap(([key, values]) => {
				return values.map((value) => (
					<input
						key={`${key}-${value}`}
						type="hidden"
						name={CATALOG_FILTER_PARAM}
						value={encodeCatalogFilter(key, value)}
					/>
				));
			})}
		</>
	);
}

function FilterGroup({
	basePath,
	group,
	query,
}: {
	basePath: string;
	group: CatalogFilterGroup;
	query: CatalogQuery;
}) {
	const activeValues = new Set(query.filters?.[group.key] ?? []);

	return (
		<div className="border-t border-hairline pt-5">
			<h3 className="text-sm font-semibold text-ink">{group.label}</h3>
			<div className="mt-3 flex flex-wrap gap-2">
				{group.options.map((option) => {
					const isActive = activeValues.has(option.value);

					return (
						<Link
							key={option.value}
							href={createCatalogHref(
								basePath,
								toggleCatalogFilter(query, group.key, option.value),
							)}
							className={cn(
								"rounded-full border px-3 py-1.5 text-xs font-medium",
								isActive
									? "border-ink bg-ink text-on-dark"
									: "border-hairline bg-frost text-ink-muted hover:bg-toolbar",
							)}>
							{option.label}
							<span className="ml-1 text-current opacity-60">
								{option.count}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}

function hasActiveCatalogState(query: CatalogQuery): boolean {
	return Boolean(
		query.search
			|| query.brand?.length
			|| Object.values(query.filters ?? {}).some((values) => values.length > 0),
	);
}

export function CatalogListing({
	basePath,
	result,
}: {
	basePath: string;
	result: CatalogResult;
}) {
	const { activeCategory, categories, query } = result;
	const title = activeCategory?.name ?? "Каталог";
	const description =
		activeCategory?.description
		?? "Единый каталог Leppa & WenSton: сантехника, зеркала и оборудование для современных ванных комнат.";
	const hasActiveState = hasActiveCatalogState(query);

	return (
		<section className="bg-canvas text-ink">
			<div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-36 sm:px-8 sm:pb-20 sm:pt-40 lg:px-10 lg:pb-24 lg:pt-44">
				<div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:items-end">
					<div>
						<p className="text-sm font-semibold uppercase tracking-normal text-ink-faint">
							Leppa & WenSton
						</p>
						<h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink sm:text-5xl lg:text-6xl">
							{title}
						</h1>
						<p className="mt-5 max-w-2xl text-base text-ink-muted sm:text-lg">
							{description}
						</p>
					</div>

					<form
						action={basePath}
						className="grid gap-3 rounded-[8px] border border-hairline bg-frost p-3 shadow-control sm:grid-cols-[minmax(0,1fr)_auto]">
						<label className="relative block min-w-0">
							<span className="sr-only">Поиск по каталогу</span>
							<Search
								aria-hidden="true"
								className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
							/>
							<input
								name="q"
								defaultValue={query.search ?? ""}
								placeholder="Поиск по названию, артикулу или характеристикам"
								className="min-h-12 w-full rounded-full border border-hairline bg-canvas py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-hairline-strong focus:ring-2 focus:ring-ring"
							/>
						</label>
						<HiddenCatalogFields query={{ ...query, search: undefined, page: 1 }} />
						<button
							type="submit"
							className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 text-sm font-semibold text-on-dark shadow-control hover:bg-ink-muted">
							<Search
								aria-hidden="true"
								className="h-4 w-4"
							/>
							Найти
						</button>
					</form>
				</div>

				<nav
					aria-label="Категории каталога"
					className="mt-8 flex gap-2 overflow-x-auto pb-2">
					<Link
						href={createCatalogHref("/catalog", {
							search: query.search,
							sort: query.sort,
						})}
						className={cn(
							"shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
							!activeCategory
								? "border-ink bg-ink text-on-dark"
								: "border-hairline bg-frost text-ink-muted hover:bg-toolbar",
						)}>
						Все товары
					</Link>
					{categories.map((category) => (
						<Link
							key={category.key}
							href={createCatalogHref(getCategoryHref(category), {
								search: query.search,
								sort: query.sort,
							})}
							className={cn(
								"shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
								activeCategory?.key === category.key
									? "border-ink bg-ink text-on-dark"
									: "border-hairline bg-frost text-ink-muted hover:bg-toolbar",
							)}>
							{category.name}
						</Link>
					))}
				</nav>

				<div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
					<aside className="h-fit rounded-[8px] border border-hairline bg-canvas p-5 shadow-control">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<SlidersHorizontal
									aria-hidden="true"
									className="h-4 w-4 text-ink-muted"
								/>
								<h2 className="text-base font-semibold text-ink">Фильтры</h2>
							</div>
							{hasActiveState ? (
								<Link
									href={createCatalogHref(
										basePath,
										clearCatalogFilters(query),
									)}
									className="flex size-8 items-center justify-center rounded-full border border-hairline bg-frost text-ink-muted hover:bg-toolbar">
									<X
										aria-hidden="true"
										className="h-4 w-4"
									/>
									<span className="sr-only">Сбросить фильтры</span>
								</Link>
							) : null}
						</div>

						{result.brandOptions.length > 1 ? (
							<div className="mt-5 border-t border-hairline pt-5">
								<h3 className="text-sm font-semibold text-ink">Бренд</h3>
								<div className="mt-3 flex flex-wrap gap-2">
									{result.brandOptions.map((brand) => {
										const isActive = query.brand?.includes(brand.value);

										return (
											<Link
												key={brand.value}
												href={createCatalogHref(
													basePath,
													toggleCatalogBrand(query, brand.value),
												)}
												className={cn(
													"rounded-full border px-3 py-1.5 text-xs font-medium",
													isActive
														? "border-ink bg-ink text-on-dark"
														: "border-hairline bg-frost text-ink-muted hover:bg-toolbar",
												)}>
												{brand.label}
												<span className="ml-1 text-current opacity-60">
													{brand.count}
												</span>
											</Link>
										);
									})}
								</div>
							</div>
						) : null}

						<div className="mt-5 grid gap-5">
							{result.filterGroups.map((group) => (
								<FilterGroup
									key={group.key}
									basePath={basePath}
									group={group}
									query={query}
								/>
							))}
						</div>
					</aside>

					<div className="min-w-0">
						<div className="flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm text-ink-muted">
								Найдено:{" "}
								<span className="font-semibold text-ink">{result.total}</span>
							</p>

							<form
								action={basePath}
								className="flex flex-wrap items-center gap-2">
								{query.search ? (
									<input
										type="hidden"
										name="q"
										value={query.search}
									/>
								) : null}
								<HiddenCatalogFields query={{ ...query, sort: undefined, page: 1 }} />
								<label className="text-sm text-ink-muted">
									<span className="sr-only">Сортировка</span>
									<select
										name="sort"
										defaultValue={query.sort}
										className="min-h-10 rounded-full border border-hairline bg-frost px-4 text-sm font-medium text-ink outline-none focus:border-hairline-strong focus:ring-2 focus:ring-ring">
										{CATALOG_SORT_OPTIONS.map((option) => (
											<option
												key={option.value}
												value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
								<button
									type="submit"
									className="min-h-10 rounded-full border border-hairline bg-frost px-4 text-sm font-semibold text-ink-muted hover:bg-toolbar">
									Применить
								</button>
							</form>
						</div>

						{result.products.length > 0 ? (
							<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
								{result.products.map((product) => (
									<ProductCard
										key={product.id}
										product={product}
									/>
								))}
							</div>
						) : (
							<div className="mt-6 rounded-[8px] border border-dashed border-hairline-strong bg-frost px-6 py-12 text-center text-sm text-ink-muted">
								По выбранным параметрам товаров не найдено.
							</div>
						)}

						<CatalogPagination
							basePath={basePath}
							pagination={result.pagination}
							query={query}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
