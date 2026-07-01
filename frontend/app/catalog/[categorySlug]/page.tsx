import { notFound } from "next/navigation";

import { CatalogListing } from "@/components/catalog/catalog-listing";
import { getCatalog, getCategoryBySlug } from "@/lib/api";
import {
	parseCatalogSearchParams,
	type CatalogSearchParams,
} from "@/lib/catalog/query";

import type { Metadata } from "next";

export const revalidate = 300;

type CategoryPageProps = {
	params: Promise<{ categorySlug: string }>;
	searchParams: Promise<CatalogSearchParams>;
};

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
		<CatalogListing result={result} />
	);
}
