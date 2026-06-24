"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { surfaceVariants } from "@/components/ui/surface";
import { formatAttributeValue } from "@/lib/utils/price";
import { cn } from "@/lib/utils";

import type {
	ProductAttribute,
	ProductDescriptionBlock,
	ProductDescriptionInlineNode,
} from "@/types/catalog";

type ProductInfoTab = "description" | "specifications";

const HIGHLIGHT_ATTRIBUTE_KEYS = [
	"material",
	"color",
	"countryOfOrigin",
	"warranty",
];

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

function DescriptionInline({
	node,
	index,
}: {
	node: ProductDescriptionInlineNode;
	index: number;
}) {
	if (node.type === "link") {
		return (
			<a
				key={`link-${node.url}-${index}`}
				href={node.url}
				target="_blank"
				rel="noreferrer"
				className="font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink">
				{node.children.map((child, childIndex) => (
					<DescriptionInline
						key={`${node.url}-${childIndex}`}
						node={child}
						index={childIndex}
					/>
				))}
			</a>
		);
	}

	if (node.code) {
		return (
			<code
				key={`text-${index}`}
				className="rounded-sm bg-toolbar px-1 py-0.5 font-mono text-[0.9em] text-ink">
				{node.text}
			</code>
		);
	}

	const hasMarks = node.bold || node.italic || node.underline || node.strikethrough;

	return hasMarks ? (
		<span
			key={`text-${index}`}
			className={cn(
				node.bold ? "font-semibold text-ink" : null,
				node.italic ? "italic" : null,
				node.underline ? "underline underline-offset-4" : null,
				node.strikethrough ? "line-through" : null,
			)}>
			{node.text}
		</span>
	) : node.text;
}

function DescriptionChildren({
	children,
}: {
	children: ProductDescriptionInlineNode[];
}) {
	return children.map((node, index) => (
		<DescriptionInline
			key={`${node.type}-${index}`}
			node={node}
			index={index}
		/>
	));
}

function getDescriptionInlineText(children: ProductDescriptionInlineNode[]): string {
	return children
		.map((child) => child.type === "text"
			? child.text
			: getDescriptionInlineText(child.children))
		.join("");
}

function DescriptionBlockView({
	block,
	index,
}: {
	block: ProductDescriptionBlock;
	index: number;
}) {
	if (block.type === "list") {
		const ListTag = block.format === "ordered" ? "ol" : "ul";

		return (
			<ListTag
				key={`list-${index}`}
				className={cn(
					"space-y-2 pl-5",
					block.format === "ordered" ? "list-decimal" : "list-disc",
				)}>
				{block.children.map((item, itemIndex) => (
					<li key={`item-${itemIndex}`}>
						<DescriptionChildren>{item.children}</DescriptionChildren>
					</li>
				))}
			</ListTag>
		);
	}

	if (block.type === "heading") {
		return (
			<h3
				key={`heading-${index}`}
				className={cn(
					"pt-1 font-semibold leading-snug text-ink",
					block.level <= 2 ? "text-xl" : "text-lg",
				)}>
				<DescriptionChildren>{block.children}</DescriptionChildren>
			</h3>
		);
	}

	if (block.type === "quote") {
		return (
			<blockquote
				key={`quote-${index}`}
				className="border-l-2 border-hairline-strong pl-4 text-ink">
				<DescriptionChildren>{block.children}</DescriptionChildren>
			</blockquote>
		);
	}

	if (block.type === "code") {
		return (
			<pre
				key={`code-${index}`}
				className="overflow-x-auto rounded-sm bg-toolbar p-4 font-mono text-sm text-ink">
				<code>{getDescriptionInlineText(block.children)}</code>
			</pre>
		);
	}

	return (
		<p key={`paragraph-${index}`}>
			<DescriptionChildren>{block.children}</DescriptionChildren>
		</p>
	);
}

export function ProductInfoTabs({
	attributes,
	description,
	descriptionBlocks,
}: {
	attributes: ProductAttribute[];
	description: string;
	descriptionBlocks?: ProductDescriptionBlock[];
}) {
	const [activeTab, setActiveTab] = useState<ProductInfoTab>("description");
	const normalizedDescriptionBlocks = useMemo(() => {
		if (descriptionBlocks && descriptionBlocks.length > 0) {
			return descriptionBlocks;
		}

		return description
			.split(/\n{2,}/)
			.map((text) => text.trim())
			.filter(Boolean)
			.map((text): ProductDescriptionBlock => ({
				type: "paragraph",
				children: [{ type: "text", text }],
			}));
	}, [description, descriptionBlocks]);
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
						<div className="space-y-4 text-base leading-7 text-ink-muted">
							{normalizedDescriptionBlocks.length > 0 ? (
								normalizedDescriptionBlocks.map((block, index) => (
									<DescriptionBlockView
										key={`${block.type}-${index}`}
										block={block}
										index={index}
									/>
								))
							) : (
								<p>Описание пока не добавлено.</p>
							)}
						</div>

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
