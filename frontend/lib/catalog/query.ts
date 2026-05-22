import type { CatalogFilters, CatalogQuery, CatalogSort } from "@/types/catalog";

export type SearchParamsValue = string | string[] | undefined;
export type CatalogSearchParams = Record<string, SearchParamsValue>;

export const CATALOG_FILTER_PARAM = "filter";
export const DEFAULT_CATALOG_PAGE = 1;
export const DEFAULT_CATALOG_PER_PAGE = 12;
export const DEFAULT_CATALOG_SORT: CatalogSort = "featured";

export const CATALOG_SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
	{ value: "featured", label: "По умолчанию" },
	{ value: "name-asc", label: "Название: А-Я" },
	{ value: "name-desc", label: "Название: Я-А" },
	{ value: "price-asc", label: "Сначала дешевле" },
	{ value: "price-desc", label: "Сначала дороже" },
];

const SORT_VALUES = new Set<CatalogSort>(
	CATALOG_SORT_OPTIONS.map((option) => option.value),
);

function toArray(value: SearchParamsValue): string[] {
	if (Array.isArray(value)) {
		return value.filter(Boolean);
	}

	return value ? [value] : [];
}

function parsePositiveInteger(
	value: SearchParamsValue,
	fallback: number,
): number {
	const rawValue = Array.isArray(value) ? value[0] : value;
	const parsedValue = Number.parseInt(rawValue ?? "", 10);

	return Number.isFinite(parsedValue) && parsedValue > 0
		? parsedValue
		: fallback;
}

function parseCatalogSort(value: SearchParamsValue): CatalogSort {
	const rawValue = Array.isArray(value) ? value[0] : value;

	return rawValue && SORT_VALUES.has(rawValue as CatalogSort)
		? (rawValue as CatalogSort)
		: DEFAULT_CATALOG_SORT;
}

function parseFilters(value: SearchParamsValue): CatalogFilters {
	const filters: CatalogFilters = {};

	toArray(value).forEach((token) => {
		const separatorIndex = token.indexOf(":");

		if (separatorIndex <= 0) {
			return;
		}

		const key = token.slice(0, separatorIndex);
		const filterValue = token.slice(separatorIndex + 1);

		if (!key || !filterValue) {
			return;
		}

		filters[key] = [...(filters[key] ?? []), filterValue];
	});

	return filters;
}

export function encodeCatalogFilter(key: string, value: string): string {
	return `${key}:${value}`;
}

export function parseCatalogSearchParams(
	searchParams: CatalogSearchParams,
	overrides: Pick<CatalogQuery, "categoryKey"> = {},
): CatalogQuery {
	const search = Array.isArray(searchParams.q)
		? searchParams.q[0]
		: searchParams.q;

	return {
		...overrides,
		search: search?.trim() || undefined,
		page: parsePositiveInteger(searchParams.page, DEFAULT_CATALOG_PAGE),
		perPage: parsePositiveInteger(
			searchParams.perPage,
			DEFAULT_CATALOG_PER_PAGE,
		),
		sort: parseCatalogSort(searchParams.sort),
		brand: toArray(searchParams.brand),
		filters: parseFilters(searchParams[CATALOG_FILTER_PARAM]),
	};
}
