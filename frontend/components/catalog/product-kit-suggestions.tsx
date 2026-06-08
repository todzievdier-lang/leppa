"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { FilledImage } from "@/components/media/filled-image";
import {
	getProductHref,
	getProductPrimaryImage,
} from "@/lib/catalog/helpers";
import { formatProductPrice } from "@/lib/utils/price";
import { cn } from "@/lib/utils";

import type { Category, Product, ProductAttributeValue } from "@/types/catalog";

type KitPart = "toilet" | "installation" | "flush-button";

function normalizeText(value: string | null | undefined) {
	return (value ?? "").trim().toLocaleLowerCase("ru-RU");
}

function getAttributeValue(
	product: Product,
	key: string,
): ProductAttributeValue | null {
	return product.attributes.find((attribute) => attribute.key === key)?.value ?? null;
}

function getAttributeString(product: Product, key: string) {
	const value = getAttributeValue(product, key);

	return typeof value === "string" ? value : null;
}

function getKitPart(product: Product): KitPart | null {
	const productType = normalizeText(getAttributeString(product, "productType"));
	const kitRole = normalizeText(getAttributeString(product, "kitRole"));
	const name = normalizeText(product.name);

	if (
		productType.includes("инсталляц")
		|| kitRole.includes("инсталляц")
		|| name.includes("инсталляц")
	) {
		return "installation";
	}

	if (
		productType.includes("кноп")
		|| kitRole.includes("кноп")
		|| name.includes("кноп")
	) {
		return "flush-button";
	}

	if (name.includes("унитаз")) {
		return "toilet";
	}

	return null;
}

function getPartLabel(part: KitPart) {
	if (part === "installation") {
		return "Инсталляция";
	}

	if (part === "flush-button") {
		return "Кнопка";
	}

	return "Унитаз";
}

function uniqueProducts(products: Product[]) {
	const seenProductIds = new Set<string>();

	return products.filter((product) => {
		if (seenProductIds.has(product.id)) {
			return false;
		}

		seenProductIds.add(product.id);
		return true;
	});
}

function getSuggestedProducts(product: Product, products: Product[]) {
	const currentPart = getKitPart(product);

	if (!currentPart) {
		return [];
	}

	const candidates = products.filter((candidate) => candidate.id !== product.id);
	const toilets = candidates
		.filter((candidate) => getKitPart(candidate) === "toilet")
		.slice(0, 2);
	const installation = candidates.find(
		(candidate) => getKitPart(candidate) === "installation",
	);
	const flushButtons = candidates
		.filter((candidate) => getKitPart(candidate) === "flush-button")
		.slice(0, 3);

	if (currentPart === "toilet") {
		return uniqueProducts([
			...(installation ? [installation] : []),
			...flushButtons,
		]);
	}

	if (currentPart === "installation") {
		return uniqueProducts([...toilets.slice(0, 1), ...flushButtons]);
	}

	return uniqueProducts([
		...toilets.slice(0, 1),
		...(installation ? [installation] : []),
	]);
}

export function ProductKitSuggestions({
	category,
	className,
	product,
	products,
}: {
	category: Category;
	className?: string;
	product: Product;
	products: Product[];
}) {
	const suggestions = getSuggestedProducts(product, products);

	if (suggestions.length === 0) {
		return null;
	}

	return (
		<section
			aria-labelledby="product-kit-title"
			className={cn(
				"border-y border-hairline py-5",
				className,
			)}>
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-normal text-ink-faint">
						Комплект
					</p>
					<h2
						id="product-kit-title"
						className="mt-1 text-base font-semibold text-ink">
						Подобрать вместе
					</h2>
				</div>
			</div>

			<div className="mt-4 grid gap-3">
				{suggestions.map((suggestion) => {
					const part = getKitPart(suggestion);
					const href = getProductHref(suggestion);

					return (
						<Link
							key={suggestion.id}
							href={href}
							scroll={false}
							className="group grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 rounded-sm border border-hairline bg-frost/55 p-2 transition duration-200 hover:border-hairline-strong hover:bg-toolbar">
							<FilledImage
								src={getProductPrimaryImage(suggestion)}
								alt={suggestion.name}
								sizes="4rem"
								className="aspect-square rounded-sm"
								imageClassName="object-cover"
							/>

							<div className="min-w-0">
								<p className="text-xs font-semibold uppercase tracking-normal text-ink-faint">
									{part ? getPartLabel(part) : "Товар"}
								</p>
								<p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink">
									{suggestion.name}
								</p>
								<p className="mt-1 text-sm text-ink-muted">
									{formatProductPrice(suggestion)}
								</p>
							</div>

							<span className="inline-flex size-9 items-center justify-center rounded-full border border-hairline bg-canvas text-ink transition duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-on-dark">
								<ArrowUpRight
									aria-hidden="true"
									className="size-4"
								/>
							</span>
						</Link>
					);
				})}
			</div>
		</section>
	);
}
