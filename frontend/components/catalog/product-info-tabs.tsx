"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { surfaceVariants } from "@/components/ui/surface";
import { formatAttributeValue } from "@/lib/utils/price";
import { cn } from "@/lib/utils";

import type { ProductAttribute } from "@/types/catalog";

type ProductInfoTab = "description" | "specifications";

const TECHNICAL_DESCRIPTION_PREFIXES = [
	"Название",
	"Производитель",
	"Артикул",
	"Цвет",
	"Материал",
	"Габариты",
];

const HIGHLIGHT_ATTRIBUTE_KEYS = [
	"material",
	"color",
	"countryOfOrigin",
	"warranty",
];

function getDescriptionItems(description: string): string[] {
	const technicalLinePattern = new RegExp(
		`^(${TECHNICAL_DESCRIPTION_PREFIXES.join("|")})\\s*:`,
		"i",
	);
	const lines = description
		.split(/\n+/)
		.map((line) => line.trim())
		.filter((line) => line && !technicalLinePattern.test(line));
	const joinedDescription = lines.join(" ").trim();
	const sentenceItems = (joinedDescription.match(/[^.!?;]+(?:[.!?;]+|$)/g) ?? [])
		.map((item) => item.trim())
		.filter(Boolean);

	if (lines.length > 1) {
		return lines;
	}

	return sentenceItems.length > 1
		? sentenceItems
		: [description.trim()].filter(Boolean);
}

function SpecificationItem({
	attribute,
	className,
}: {
	attribute: ProductAttribute;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid min-h-[3.25rem] items-center gap-3 px-4 py-2.5 text-sm sm:grid-cols-[minmax(160px,0.42fr)_minmax(0,1fr)] sm:px-7 lg:min-h-[3.5rem] lg:grid-cols-[minmax(170px,0.38fr)_minmax(0,1fr)] lg:px-8",
				className,
			)}>
			<dt className="text-ink-muted">{attribute.label}</dt>
			<dd className="font-medium text-ink">
				{formatAttributeValue(attribute)}
			</dd>
		</div>
	);
}

export function ProductInfoTabs({
	attributes,
	description,
}: {
	attributes: ProductAttribute[];
	description: string;
}) {
	const [activeTab, setActiveTab] = useState<ProductInfoTab>("description");
	const descriptionItems = useMemo(
		() => getDescriptionItems(description),
		[description],
	);
	const highlights = attributes.filter((attribute) =>
		HIGHLIGHT_ATTRIBUTE_KEYS.includes(attribute.key),
	);
	const specificationRows = useMemo(() => {
		const midpoint = Math.ceil(attributes.length / 2);
		const leftColumn = attributes.slice(0, midpoint);
		const rightColumn = attributes.slice(midpoint);

		return leftColumn.map((attribute, index) => ({
			left: attribute,
			right: rightColumn[index] ?? null,
		}));
	}, [attributes]);

	return (
		<section
			aria-labelledby="product-info-title"
			className="mt-14">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-normal text-ink-faint">
						Информация о товаре
					</p>
					<h2
						id="product-info-title"
						className="mt-2 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
						Описание и характеристики
					</h2>
				</div>

				<div
					role="tablist"
					aria-label="Информация о товаре"
					className={cn("grid grid-cols-2 gap-1 p-1 sm:min-w-80")}>
					<Button
						type="button"
						role="tab"
						aria-selected={activeTab === "description"}
						variant={activeTab === "description" ? "dark" : "secondary"}
						size="sm"
						className="shadow-none"
						onClick={() => {
							setActiveTab("description");
						}}>
						Описание
					</Button>
					<Button
						type="button"
						role="tab"
						aria-selected={activeTab === "specifications"}
						variant={activeTab === "specifications" ? "dark" : "secondary"}
						size="sm"
						className="shadow-none"
						onClick={() => {
							setActiveTab("specifications");
						}}>
						Характеристики
					</Button>
				</div>
			</div>

			<div
				className={cn(
					surfaceVariants({ variant: "card" }),
					"mt-6 overflow-hidden",
				)}>
				{activeTab === "description" ? (
					<div
						role="tabpanel"
						className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.36fr)]">
						<ul className="space-y-3 text-base text-ink-muted">
							{descriptionItems.length > 0 ? descriptionItems.map((item, index) => (
								<li
									key={`${item}-${index}`}
									className="grid grid-cols-[0.875rem_minmax(0,1fr)] gap-3">
									<span
										aria-hidden="true"
										className="mt-2 size-2 rounded-full bg-ink"
									/>
									<span>{item}</span>
								</li>
							)) : (
								<li>Описание пока не добавлено.</li>
							)}
						</ul>

						{highlights.length > 0 ? (
							<dl className="grid content-start gap-3">
								{highlights.map((attribute) => (
									<div
										key={`${attribute.key}-${attribute.value}`}
										className="border-b border-hairline pb-3 last:border-b-0 last:pb-0">
										<dt className="text-xs font-semibold uppercase tracking-normal text-ink-faint">
											{attribute.label}
										</dt>
										<dd className="mt-1 text-sm font-semibold text-ink">
											{formatAttributeValue(attribute)}
										</dd>
									</div>
								))}
							</dl>
						) : null}
					</div>
				) : (
					<div
						role="tabpanel">
						<dl className="divide-y divide-hairline lg:hidden">
							{attributes.map((attribute) => (
								<SpecificationItem
									key={`${attribute.key}-${attribute.value}`}
									attribute={attribute}
								/>
							))}
						</dl>

						<dl className="hidden divide-y divide-hairline lg:grid">
							{specificationRows.map(({ left, right }) => (
								<div
									key={`${left.key}-${left.value}`}
									className="grid grid-cols-2 divide-x divide-hairline">
									<SpecificationItem attribute={left} />
									{right ? (
										<SpecificationItem attribute={right} />
									) : (
										<div aria-hidden="true" />
									)}
								</div>
							))}
						</dl>
					</div>
				)}
			</div>
		</section>
	);
}
