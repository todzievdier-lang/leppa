import { notFound } from "next/navigation";

import { CatalogListing } from "@/components/catalog/catalog-listing";
import { getCatalog, getCategories, getCategoryBySlug } from "@/lib/api";
import {
	parseCatalogSearchParams,
	type CatalogSearchParams,
} from "@/lib/catalog/query";

import type { Metadata } from "next";

type CategoryPageProps = {
	params: Promise<{ categorySlug: string }>;
	searchParams: Promise<CatalogSearchParams>;
};

export async function generateStaticParams() {
	const categories = await getCategories();

	return categories.map((category) => ({
		categorySlug: category.slug,
	}));
}

export async function generateMetadata({
	params,
}: CategoryPageProps): Promise<Metadata> {
	const { categorySlug } = await params;
	const category = await getCategoryBySlug(categorySlug);

	if (!category) {
		return {
			title: "Категория не найдена | Leppa & WenSton",
		};
	}

	return {
		title: `${category.seo?.title ?? category.name} | Leppa & WenSton`,
		description: category.seo?.description ?? category.description,
	};
}

export default async function CategoryPage({
	params,
	searchParams,
}: CategoryPageProps) {
	const { categorySlug } = await params;
	const category = await getCategoryBySlug(categorySlug);

	if (!category) {
		notFound();
	}

	const query = parseCatalogSearchParams(await searchParams, {
		categoryKey: category.key,
	});
	const result = await getCatalog(query);

	return (
		<CatalogListing
			basePath={`/catalog/${category.slug}`}
			result={result}
		/>
	);
}
