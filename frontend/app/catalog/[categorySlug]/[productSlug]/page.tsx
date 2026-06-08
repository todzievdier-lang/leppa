import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/catalog/product-detail";
import {
	getCategories,
	getCategoryBySlug,
	getProductBySlug,
	getProducts,
} from "@/lib/api";

import type { Metadata } from "next";

type ProductPageProps = {
	params: Promise<{
		categorySlug: string;
		productSlug: string;
	}>;
};

export async function generateStaticParams() {
	const [categories, products] = await Promise.all([
		getCategories(),
		getProducts(),
	]);

	return products.flatMap((product) => {
		const category = categories.find(
			(category) => category.key === product.categoryKey,
		);

		return category
			? [{ categorySlug: category.slug, productSlug: product.slug }]
			: [];
	});
}

export async function generateMetadata({
	params,
}: ProductPageProps): Promise<Metadata> {
	const { categorySlug, productSlug } = await params;
	const category = await getCategoryBySlug(categorySlug);
	const product = category
		? await getProductBySlug(productSlug, category.key)
		: null;

	if (!category || !product) {
		return {
			title: "Товар не найден | Leppa & WenSton",
		};
	}

	return {
		title: `${product.name} | Leppa & WenSton`,
		description: product.description.slice(0, 155),
	};
}

export default async function ProductPage({ params }: ProductPageProps) {
	const { categorySlug, productSlug } = await params;
	const category = await getCategoryBySlug(categorySlug);

	if (!category) {
		notFound();
	}

	const products = await getProducts();
	const product = products.find(
		(candidate) =>
			candidate.slug === productSlug
			&& candidate.categoryKey === category.key,
	);

	if (!product) {
		notFound();
	}

	return (
		<ProductDetail
			category={category}
			product={product}
			variantProducts={products}
		/>
	);
}
