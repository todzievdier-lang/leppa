import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getProductCategory, getProductHref, getProductImageAlt, getProductPrimaryImage } from "@/lib/catalog/helpers";
import { formatAttributeValue, formatProductPrice } from "@/lib/utils/price";

import type { Product } from "@/types/catalog";

function getCardAttributes(product: Product) {
	return product.attributes
		.filter((attribute) => {
			return !["warranty", "countryOfOrigin"].includes(attribute.key);
		})
		.slice(0, 3);
}

export function ProductCard({ product }: { product: Product }) {
	const category = getProductCategory(product);
	const imageSrc = getProductPrimaryImage(product);
	const imageAlt = getProductImageAlt(product);
	const cardAttributes = getCardAttributes(product);

	return (
		<article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[8px] border border-hairline bg-canvas shadow-control">
			<Link
				href={getProductHref(product)}
				aria-label={`Открыть товар ${product.name}`}
				className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
				<div className="relative aspect-[4/3] overflow-hidden border-b border-hairline bg-toolbar">
					<div
						role="img"
						aria-label={imageAlt}
						className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
						style={{ backgroundImage: `url(${imageSrc})` }}
					/>
				</div>
			</Link>

			<div className="flex flex-1 flex-col p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						{category ? (
							<p className="text-xs font-semibold uppercase tracking-normal text-ink-faint">
								{category.name}
							</p>
						) : null}
						<Link
							href={getProductHref(product)}
							className="mt-2 block text-base font-semibold leading-snug text-ink hover:text-ink-muted">
							{product.name}
						</Link>
					</div>

					<span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-frost text-ink-muted transition-colors group-hover:bg-ink group-hover:text-on-dark">
						<ArrowUpRight
							aria-hidden="true"
							className="h-4 w-4"
							strokeWidth={1.8}
						/>
					</span>
				</div>

				<div className="mt-4 flex flex-wrap gap-2">
					{cardAttributes.map((attribute) => (
						<span
							key={`${attribute.key}-${attribute.value}`}
							className="rounded-full border border-hairline bg-frost px-2.5 py-1 text-xs text-ink-muted">
							{formatAttributeValue(attribute)}
						</span>
					))}
				</div>

				<div className="mt-auto pt-5">
					<p className="text-base font-semibold text-ink">
						{formatProductPrice(product)}
					</p>
					{product.sku ? (
						<p className="mt-1 text-xs text-ink-faint">Арт. {product.sku}</p>
					) : null}
				</div>
			</div>
		</article>
	);
}
