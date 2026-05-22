import { categories as categoryRegistry } from "@/data/catalog/categories";
import rawCatalogData from "@/data/catalog/products.json";
import {
	buildBrandOptions,
	buildFilterGroups,
	filterProducts,
	paginateProducts,
	sortProducts,
} from "@/lib/catalog/filters";
import {
	getCategoryByKey as findCategoryByKey,
	getCategoryBySlug as findCategoryBySlug,
	getProductPrimaryImage,
} from "@/lib/catalog/helpers";
import {
	DEFAULT_CATALOG_PAGE,
	DEFAULT_CATALOG_PER_PAGE,
	DEFAULT_CATALOG_SORT,
} from "@/lib/catalog/query";

import type {
	CatalogQuery,
	CatalogResult,
	Category,
	CategoryKey,
	CategoryLink,
	Product,
} from "@/types/catalog";

type CatalogData = {
	schemaVersion: number;
	products: Product[];
};

const catalogData = rawCatalogData as CatalogData;
const products = catalogData.products;

function getCategoryImage(category: Category): string | null {
	if (category.image) {
		return category.image;
	}

	const featuredProduct = products.find(
		(product) => product.categoryKey === category.key && product.images.length > 0,
	);

	return featuredProduct ? getProductPrimaryImage(featuredProduct) : null;
}

function withCategoryImage(category: Category): Category {
	return {
		...category,
		image: getCategoryImage(category),
	};
}

function normalizeCatalogQuery(query: CatalogQuery): CatalogResult["query"] {
	return {
		...query,
		page: query.page ?? DEFAULT_CATALOG_PAGE,
		perPage: query.perPage ?? DEFAULT_CATALOG_PER_PAGE,
		sort: query.sort ?? DEFAULT_CATALOG_SORT,
		brand: query.brand ?? [],
		filters: query.filters ?? {},
	};
}

export async function getCategories(): Promise<Category[]> {
	return categoryRegistry.map(withCategoryImage);
}

export async function getFooterCategories(): Promise<CategoryLink[]> {
	return categoryRegistry.map(({ key, slug, name }) => ({ key, slug, name }));
}

export async function getCategoryByKey(
	key: CategoryKey,
): Promise<Category | null> {
	const category = findCategoryByKey(key);

	return category ? withCategoryImage(category) : null;
}

export async function getCategoryBySlug(
	slug: string,
): Promise<Category | null> {
	const category = findCategoryBySlug(slug);

	return category ? withCategoryImage(category) : null;
}

export async function getProducts(): Promise<Product[]> {
	return products;
}

export async function getProductBySlug(
	slug: string,
	categoryKey?: CategoryKey,
): Promise<Product | null> {
	return (
		products.find((product) => {
			if (product.slug !== slug) {
				return false;
			}

			return categoryKey ? product.categoryKey === categoryKey : true;
		}) ?? null
	);
}

export async function getCatalog(
	query: CatalogQuery = {},
): Promise<CatalogResult> {
	const normalizedQuery = normalizeCatalogQuery(query);
	const categories = await getCategories();
	const activeCategory = normalizedQuery.categoryKey
		? (categories.find((category) => category.key === normalizedQuery.categoryKey)
			?? null)
		: null;
	const scopedProducts = normalizedQuery.categoryKey
		? products.filter(
			(product) => product.categoryKey === normalizedQuery.categoryKey,
		)
		: products;
	const filteredProducts = filterProducts(products, normalizedQuery);
	const sortedProducts = sortProducts(filteredProducts, normalizedQuery.sort);
	const paginatedProducts = paginateProducts(
		sortedProducts,
		normalizedQuery.page,
		normalizedQuery.perPage,
	);

	return {
		categories,
		activeCategory,
		products: paginatedProducts.items,
		total: filteredProducts.length,
		pagination: paginatedProducts.meta,
		query: normalizedQuery,
		brandOptions: buildBrandOptions(scopedProducts),
		filterGroups: buildFilterGroups(scopedProducts),
	};
}
