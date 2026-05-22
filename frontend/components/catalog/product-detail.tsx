import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCategoryHref, getProductImageAlt, getProductPrimaryImage } from "@/lib/catalog/helpers";
import { formatAttributeValue, formatProductPrice } from "@/lib/utils/price";

import type { Category, Product } from "@/types/catalog";

export function ProductDetail({
	category,
	product,
}: {
	category: Category;
	product: Product;
}) {
	const mainImage = getProductPrimaryImage(product);
	const mainImageAlt = getProductImageAlt(product);
	const gallery = product.images.length > 0
		? product.images.slice(0, 5)
		: [{ url: "/no-image.png", alt: product.name, role: "placeholder" }];

	return (
		<article className="bg-canvas text-ink">
			<div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-36 sm:px-8 sm:pb-20 sm:pt-40 lg:px-10 lg:pb-24 lg:pt-44">
				<Link
					href={getCategoryHref(category)}
					className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink">
					<ArrowLeft
						aria-hidden="true"
						className="h-4 w-4"
					/>
					{category.name}
				</Link>

				<div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
					<div className="min-w-0">
						<div className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-hairline bg-toolbar shadow-control">
							<div
								role="img"
								aria-label={mainImageAlt}
								className="absolute inset-0 bg-contain bg-center bg-no-repeat"
								style={{ backgroundImage: `url(${mainImage})` }}
							/>
						</div>

						{gallery.length > 1 ? (
							<div className="mt-3 grid grid-cols-5 gap-3">
								{gallery.map((image) => (
									<div
										key={`${image.role}-${image.url}`}
										role="img"
										aria-label={image.alt ?? product.name}
										className="aspect-square rounded-[8px] border border-hairline bg-frost bg-contain bg-center bg-no-repeat"
										style={{ backgroundImage: `url(${image.url})` }}
									/>
								))}
							</div>
						) : null}
					</div>

					<div className="min-w-0">
						<p className="text-sm font-semibold uppercase tracking-normal text-ink-faint">
							{product.brand}
						</p>
						<h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink sm:text-4xl lg:text-5xl">
							{product.name}
						</h1>

						<div className="mt-5 flex flex-wrap items-center gap-3">
							<p className="text-2xl font-semibold text-ink">
								{formatProductPrice(product)}
							</p>
							{product.sku ? (
								<span className="rounded-full border border-hairline bg-frost px-3 py-1 text-xs font-semibold text-ink-muted">
									Арт. {product.sku}
								</span>
							) : null}
						</div>

						<p className="mt-6 whitespace-pre-line text-base leading-relaxed text-ink-muted">
							{product.description}
						</p>

						<div className="mt-8 flex flex-wrap gap-3">
							<Button
								asChild
								variant="dark">
								<Link href="/contact">
									<MessageCircle
										aria-hidden="true"
										className="h-4 w-4"
									/>
									Запросить консультацию
								</Link>
							</Button>
						</div>
					</div>
				</div>

				<section
					aria-labelledby="product-specs-title"
					className="mt-12">
					<h2
						id="product-specs-title"
						className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
						Характеристики
					</h2>

					<dl className="mt-5 grid overflow-hidden rounded-[8px] border border-hairline bg-canvas shadow-control sm:grid-cols-2">
						{product.attributes.map((attribute) => (
							<div
								key={`${attribute.key}-${attribute.value}`}
								className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-4 border-b border-hairline px-4 py-3 text-sm last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
								<dt className="text-ink-muted">{attribute.label}</dt>
								<dd className="font-medium text-ink">
									{formatAttributeValue(attribute)}
								</dd>
							</div>
						))}
					</dl>
				</section>
			</div>
		</article>
	);
}
