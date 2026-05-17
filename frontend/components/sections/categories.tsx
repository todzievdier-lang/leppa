"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { useApi } from "@/hooks/useApi";

import { getCategories } from "@/lib/api";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

import type { Category } from "@/types";

const CATEGORY_SKELETON_COUNT = 6;

function sortCategories(categories: Category[]) {
	return [...categories].sort((first, second) => {
		return first.sortOrder - second.sortOrder;
	});
}

function shouldFeatureFirstCategory(categoryCount: number) {
	return categoryCount >= 5 && categoryCount % 3 === 2;
}

function getCategoryGridClassName(categoryCount: number, className?: string) {
	return cn(
		"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12",
		className,
		categoryCount === 1 && "mx-auto max-w-xl",
		categoryCount === 2 && "mx-auto max-w-4xl",
	);
}

function getCategoryCardLayoutClassName(index: number, categoryCount: number) {
	const isFeatured = shouldFeatureFirstCategory(categoryCount) && index === 0;

	if (categoryCount === 1) {
		return "sm:col-span-2 lg:col-span-12";
	}

	if (categoryCount === 2 || categoryCount === 4) {
		return "lg:col-span-6";
	}

	if (isFeatured) {
		return "lg:col-span-8";
	}

	return "lg:col-span-4";
}

function CategoryMedia({
	category,
	isFeatured,
}: {
	category: Category;
	isFeatured: boolean;
}) {
	const imageSrc = category.image || "/no-image.png";

	return (
		<div
			className={cn(
				"relative aspect-[4/3] overflow-hidden rounded-sm border border-hairline sm:aspect-[16/11]",
				isFeatured && "lg:aspect-[21/9]",
			)}>
			<div
				aria-label={category.name}
				role='img'
				className='absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105'
				style={{ backgroundImage: `url(${imageSrc})` }}
			/>
			<div className='absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent' />
		</div>
	);
}

function CategoryCard({
	category,
	isFeatured,
	layoutClassName,
}: {
	category: Category;
	isFeatured: boolean;
	layoutClassName: string;
}) {
	return (
		<Link
			href={`/categories/${category.handle}`}
			className={cn(
				"group hover-lift-card flex h-full min-w-0 flex-col rounded-md border border-hairline bg-canvas p-3 shadow-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				layoutClassName,
			)}>
			<CategoryMedia
				category={category}
				isFeatured={isFeatured}
			/>

			<div className='flex flex-1 flex-col px-2 pb-2 pt-5'>
				<div className='flex items-start justify-between gap-4'>
					<div className='min-w-0'>
						<p className='text-xs font-medium text-ink-faint'>Категория</p>
						<h3 className='mt-2 break-words text-2xl font-semibold tracking-normal text-ink sm:text-3xl'>
							{category.name}
						</h3>
					</div>

					<span
						className={cn(
							buttonVariants({ variant: "secondary", size: "icon" }),
							"pointer-events-none group-hover:-translate-y-0.5 group-hover:border-hairline-strong group-hover:bg-toolbar group-hover:shadow-control",
						)}>
						<ArrowUpRight
							aria-hidden='true'
							className='h-5 w-5'
							strokeWidth={1.8}
						/>
					</span>
				</div>

				<p className='mt-4 break-words text-sm text-ink-muted sm:text-base'>
					{category.description}
				</p>
			</div>
		</Link>
	);
}

function CategoryCardSkeleton({ layoutClassName }: { layoutClassName: string }) {
	return (
		<article
			aria-hidden='true'
			className={cn(
				"h-full min-w-0 rounded-md border border-hairline bg-canvas p-3 shadow-control",
				layoutClassName,
			)}>
			<div className='aspect-[4/3] animate-pulse rounded-sm bg-toolbar sm:aspect-[16/11]' />
			<div className='px-2 pb-2 pt-5'>
				<div className='h-3 w-20 animate-pulse rounded-full bg-toolbar' />
				<div className='mt-4 h-8 w-2/3 animate-pulse rounded-full bg-toolbar' />
				<div className='mt-5 space-y-3'>
					<div className='h-3 w-full animate-pulse rounded-full bg-toolbar' />
					<div className='h-3 w-5/6 animate-pulse rounded-full bg-toolbar' />
				</div>
			</div>
		</article>
	);
}

function CategoryLoadingState() {
	return (
		<div
			aria-live='polite'
			className='mt-8'>
			<div
				role='status'
				className='flex items-center justify-center gap-3 text-sm text-ink-faint'>
				<span
					aria-hidden='true'
					className='size-2 rounded-full bg-ink-faint animate-pulse'
				/>
				<span>Загружаем категории...</span>
			</div>

			<div
				className={getCategoryGridClassName(
					CATEGORY_SKELETON_COUNT,
					"mt-8 lg:mt-10",
				)}>
				{Array.from({ length: CATEGORY_SKELETON_COUNT }).map((_, index) => (
					<CategoryCardSkeleton
						key={index}
						layoutClassName={getCategoryCardLayoutClassName(
							index,
							CATEGORY_SKELETON_COUNT,
						)}
					/>
				))}
			</div>
		</div>
	);
}

function CategoryEmptyState() {
	return (
		<div className='mx-auto mt-10 max-w-2xl rounded-md border border-dashed border-hairline-strong bg-frost px-6 py-10 text-center text-sm text-ink-muted lg:mt-12'>
			Категории пока не добавлены.
		</div>
	);
}

function CategoryErrorState() {
	return (
		<div
			role='status'
			className='mx-auto mt-10 max-w-2xl rounded-md border border-dashed border-hairline-strong bg-frost px-6 py-10 text-center text-sm text-ink-muted lg:mt-12'>
			Не удалось загрузить категории.
		</div>
	);
}

export function CategoriesSection() {
	const {
		data: categories,
		loading,
		error,
	} = useApi<Category[]>(getCategories);

	const sortedCategories = sortCategories(categories ?? []);
	const categoryCount = sortedCategories.length;
	const shouldShowFeaturedCard = shouldFeatureFirstCategory(categoryCount);

	return (
		<section
			id='categories'
			aria-labelledby='categories-title'
			className='bg-canvas text-ink'>
			<div className='mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24'>
				<div className='mx-auto max-w-2xl text-center'>
					<h2
						id='categories-title'
						className='text-3xl font-semibold tracking-normal text-ink sm:text-4xl lg:text-6xl'>
						Категории
					</h2>
					<p className='mx-auto mt-4 max-w-2xl text-sm text-ink-muted sm:text-base lg:text-lg'>
						Подборка ключевых направлений Leppa & WenSton для частных
						интерьеров, дизайнерских проектов и комплектации объектов.
					</p>
				</div>

				{loading ? (
					<CategoryLoadingState />
				) : categoryCount > 0 ? (
					<div className={getCategoryGridClassName(categoryCount, "mt-10 lg:mt-12")}>
						{sortedCategories.map((category, index) => (
							<CategoryCard
								key={category.id}
								category={category}
								isFeatured={shouldShowFeaturedCard && index === 0}
								layoutClassName={getCategoryCardLayoutClassName(
									index,
									categoryCount,
								)}
							/>
						))}
					</div>
				) : error ? (
					<CategoryErrorState />
				) : (
					<CategoryEmptyState />
				)}
			</div>
		</section>
	);
}
