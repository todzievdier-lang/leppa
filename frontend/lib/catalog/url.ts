import {
	CATALOG_FILTER_PARAM,
	DEFAULT_CATALOG_PAGE,
	DEFAULT_CATALOG_PER_PAGE,
	DEFAULT_CATALOG_SORT,
	encodeCatalogFilter,
} from "@/lib/catalog/query";

import type { CatalogQuery } from "@/types/catalog";

function withoutEmptyValues(query: CatalogQuery): CatalogQuery {
	return {
		...query,
		search: query.search?.trim() || undefined,
		brand: query.brand?.filter(Boolean),
		filters: Object.fromEntries(
			Object.entries(query.filters ?? {})
				.map(([key, values]) => [key, values.filter(Boolean)])
				.filter(([, values]) => values.length > 0),
		),
	};
}

export function createCatalogHref(
	basePath: string,
	query: CatalogQuery = {},
): string {
	const cleanQuery = withoutEmptyValues(query);
	const params = new URLSearchParams();

	if (cleanQuery.search) {
		params.set("q", cleanQuery.search);
	}

	if (cleanQuery.sort && cleanQuery.sort !== DEFAULT_CATALOG_SORT) {
		params.set("sort", cleanQuery.sort);
	}

	if (cleanQuery.page && cleanQuery.page !== DEFAULT_CATALOG_PAGE) {
		params.set("page", String(cleanQuery.page));
	}

	if (
		cleanQuery.perPage &&
		cleanQuery.perPage !== DEFAULT_CATALOG_PER_PAGE
	) {
		params.set("perPage", String(cleanQuery.perPage));
	}

	cleanQuery.brand?.forEach((brand) => {
		params.append("brand", brand);
	});

	Object.entries(cleanQuery.filters ?? {}).forEach(([key, values]) => {
		values.forEach((value) => {
			params.append(CATALOG_FILTER_PARAM, encodeCatalogFilter(key, value));
		});
	});

	const queryString = params.toString();

	return queryString ? `${basePath}?${queryString}` : basePath;
}

export function toggleCatalogBrand(
	query: CatalogQuery,
	brand: string,
): CatalogQuery {
	const activeBrands = new Set(query.brand ?? []);

	if (activeBrands.has(brand)) {
		activeBrands.delete(brand);
	} else {
		activeBrands.add(brand);
	}

	return {
		...query,
		page: DEFAULT_CATALOG_PAGE,
		brand: [...activeBrands],
	};
}

export function toggleCatalogFilter(
	query: CatalogQuery,
	key: string,
	value: string,
): CatalogQuery {
	const filters = { ...(query.filters ?? {}) };
	const activeValues = new Set(filters[key] ?? []);

	if (activeValues.has(value)) {
		activeValues.delete(value);
	} else {
		activeValues.add(value);
	}

	if (activeValues.size > 0) {
		filters[key] = [...activeValues];
	} else {
		delete filters[key];
	}

	return {
		...query,
		page: DEFAULT_CATALOG_PAGE,
		filters,
	};
}

export function clearCatalogFilters(query: CatalogQuery): CatalogQuery {
	return {
		categoryKey: query.categoryKey,
		search: query.search,
		sort: query.sort,
		page: DEFAULT_CATALOG_PAGE,
		perPage: query.perPage,
	};
}
