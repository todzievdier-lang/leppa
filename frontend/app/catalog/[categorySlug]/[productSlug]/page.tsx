import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/catalog/product-detail";
import {
	getCategoryBySlug,
	getProductBySlug,
	getProducts,
} from "@/lib/api";
import {
	getProductColorVariants,
	getProductSizeVariants,
} from "@/lib/catalog/product-variants";
import { getProductImageSource } from "@/lib/catalog/product-image";

import type { Metadata } from "next";

export const revalidate = 300;

// Opt this dynamic route into on-demand ISR. The first request renders and
// stores a product page; subsequent global requests reuse it for `revalidate`.
export function generateStaticParams() {
	return [];
}

type ProductPageProps = {
	params: Promise<{
		categorySlug: string;
		productSlug: string;
	}>;
};

function getBundleProductSnapshot(product: Awaited<ReturnType<typeof getProducts>>[number]) {
	const primaryImage = product.images.find((image) => image.role === "main")
		?? product.images[0];

	return {
		...product,
		description: "",
		descriptionBlocks: [],
		videos: [],
		bundles: [],
		images: primaryImage
			? [{
				url: getProductImageSource(primaryImage, "card"),
				role: "main",
				alt: primaryImage.alt,
			}]
			: [],
	};
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

	const sizeVariants = getProductSizeVariants(product, products, category);
	const colorVariants = getProductColorVariants(product, products, category);
	const bundleProducts = product.bundles.length > 0
		? products.map((candidate) =>
			candidate.id === product.id ? product : getBundleProductSnapshot(candidate),
		)
		: [];

	return (
		<ProductDetail
			bundleProducts={bundleProducts}
			category={category}
			colorVariants={colorVariants}
			product={product}
			sizeVariants={sizeVariants}
		/>
	);
}
