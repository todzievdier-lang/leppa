"use client";

import { useApi } from "@/hooks/useApi";

import { getCategories } from "@/lib/api";

import { CategoryCard } from "./category-card";
import { CategoryState } from "./category-state";
import { getCategoryGridClassName } from "./category-layout";

import type { Category } from "@/types";

export function CategoriesSection() {
	const {
		data: categories,
		loading,
		error,
	} = useApi<Category[]>(getCategories);
	const visibleCategories = categories ?? [];
	const categoryCount = visibleCategories.length;

	return (
		<section
			id="categories"
			aria-labelledby="categories-title"
			className="bg-canvas text-ink">
			<div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24">
				<div className="mx-auto max-w-2xl text-center">
					<h2
						id="categories-title"
						className="text-3xl font-semibold tracking-normal text-ink sm:text-4xl lg:text-6xl">
						Категории
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-sm text-ink-muted sm:text-base lg:text-lg">
						Подборка ключевых направлений Leppa & WenSton для частных
						интерьеров, дизайнерских проектов и комплектации объектов.
					</p>
				</div>

				{loading ? (
					<CategoryState variant="loading" />
				) : categoryCount > 0 ? (
					<div
						className={getCategoryGridClassName(
							categoryCount,
							"mt-10 lg:mt-12",
						)}>
						{visibleCategories.map((category) => (
							<CategoryCard
								key={category.id}
								category={category}
							/>
						))}
					</div>
				) : error ? (
					<CategoryState variant="error" />
				) : (
					<CategoryState variant="empty" />
				)}
			</div>
		</section>
	);
}
