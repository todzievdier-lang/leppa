import { formatAttributeValue } from "@/lib/utils/price";

import type {
	CatalogFilterGroup,
	CatalogFilterOption,
	CatalogQuery,
	CatalogSort,
	Product,
	ProductAttribute,
} from "@/types/catalog";

const FACET_VALUE_LIMIT = 16;
const EXCLUDED_ATTRIBUTE_KEYS = new Set([
	"widthMm",
	"heightMm",
	"depthMm",
	"lengthMm",
	"warranty",
	"countryOfOrigin",
]);

function normalizeSearchText(value: unknown): string {
	return String(value ?? "").trim().toLocaleLowerCase("ru-RU");
}

function normalizeCompactSearchText(value: unknown): string {
	return normalizeSearchText(value).replace(/[^0-9a-zа-яё]+/giu, "");
}

function getSearchContent(product: Product): string {
	return normalizeSearchText(
		[
			product.name,
			product.brand,
			product.model,
			product.sku,
			product.description,
			...product.attributes.flatMap((attribute) => [
				attribute.label,
				attribute.value,
			]),
		].join(" "),
	);
}

function matchesSearch(product: Product, search?: string): boolean {
	const query = normalizeSearchText(search);

	if (!query) {
		return true;
	}

	const searchContent = getSearchContent(product);
	const compactSearchContent = normalizeCompactSearchText(searchContent);

	return query
		.split(/\s+/)
		.every((term) => {
			const compactTerm = normalizeCompactSearchText(term);

			return (
				searchContent.includes(term)
				|| (compactTerm.length > 0
					&& compactSearchContent.includes(compactTerm))
			);
		});
}

function getAttributeValue(attribute: ProductAttribute): string {
	return String(attribute.value);
}

function matchesAttributeFilters(product: Product, query: CatalogQuery): boolean {
	return Object.entries(query.filters ?? {}).every(([key, values]) => {
		if (values.length === 0) {
			return true;
		}

		const productValues = new Set(
			product.attributes
				.filter((attribute) => attribute.key === key)
				.map(getAttributeValue),
		);

		return values.some((value) => productValues.has(value));
	});
}

export function filterProducts(
	products: Product[],
	query: CatalogQuery,
): Product[] {
	const activeBrands = new Set(query.brand ?? []);

	return products.filter((product) => {
		if (query.categoryKey && product.categoryKey !== query.categoryKey) {
			return false;
		}

		if (activeBrands.size > 0 && !activeBrands.has(product.brand ?? "")) {
			return false;
		}

		return matchesSearch(product, query.search)
			&& matchesAttributeFilters(product, query);
	});
}

function getComparablePrice(product: Product, direction: "asc" | "desc"): number {
	if (product.price == null) {
		return direction === "asc" ? Number.POSITIVE_INFINITY : 0;
	}

	return product.price;
}

export function sortProducts(
	products: Product[],
	sort: CatalogSort = "featured",
): Product[] {
	return [...products].sort((left, right) => {
		if (sort === "name-asc") {
			return left.name.localeCompare(right.name, "ru-RU");
		}

		if (sort === "name-desc") {
			return right.name.localeCompare(left.name, "ru-RU");
		}

		if (sort === "price-asc") {
			return getComparablePrice(left, "asc") - getComparablePrice(right, "asc");
		}

		if (sort === "price-desc") {
			return getComparablePrice(right, "desc") - getComparablePrice(left, "desc");
		}

		return left.id.localeCompare(right.id, "ru-RU");
	});
}

export function paginateProducts(
	products: Product[],
	page = 1,
	perPage = 12,
) {
	const safePerPage = Math.max(1, perPage);
	const total = products.length;
	const totalPages = Math.max(1, Math.ceil(total / safePerPage));
	const safePage = Math.min(Math.max(1, page), totalPages);
	const startIndex = (safePage - 1) * safePerPage;

	return {
		items: products.slice(startIndex, startIndex + safePerPage),
		meta: {
			page: safePage,
			perPage: safePerPage,
			total,
			totalPages,
			hasNextPage: safePage < totalPages,
			hasPreviousPage: safePage > 1,
		},
	};
}

export function buildBrandOptions(products: Product[]): CatalogFilterOption[] {
	const counts = new Map<string, number>();

	products.forEach((product) => {
		if (!product.brand) {
			return;
		}

		counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
	});

	return [...counts.entries()]
		.map(([value, count]) => ({ value, label: value, count }))
		.sort((left, right) => left.label.localeCompare(right.label, "ru-RU"));
}

export function buildFilterGroups(products: Product[]): CatalogFilterGroup[] {
	const groups = new Map<
		string,
		{ label: string; options: Map<string, CatalogFilterOption> }
	>();

	products.forEach((product) => {
		product.attributes.forEach((attribute) => {
			if (EXCLUDED_ATTRIBUTE_KEYS.has(attribute.key)) {
				return;
			}

			const value = getAttributeValue(attribute);
			const group = groups.get(attribute.key) ?? {
				label: attribute.label,
				options: new Map<string, CatalogFilterOption>(),
			};
			const option = group.options.get(value) ?? {
				value,
				label: formatAttributeValue(attribute),
				count: 0,
			};

			option.count += 1;
			group.options.set(value, option);
			groups.set(attribute.key, group);
		});
	});

	return [...groups.entries()]
		.map(([key, group]) => ({
			key,
			label: group.label,
			options: [...group.options.values()].sort((left, right) =>
				left.label.localeCompare(right.label, "ru-RU", { numeric: true }),
			),
		}))
		.filter((group) => {
			return group.options.length > 1
				&& group.options.length <= FACET_VALUE_LIMIT;
		})
		.sort((left, right) => left.label.localeCompare(right.label, "ru-RU"));
}
