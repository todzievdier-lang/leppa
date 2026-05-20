import { cn } from "@/lib/utils";

import type { Category } from "@/types";

export const CATEGORY_SKELETON_COUNT = 6;

export function sortCategories(categories: Category[]) {
	return [...categories].sort((first, second) => {
		return first.sortOrder - second.sortOrder;
	});
}

export function shouldFeatureFirstCategory(categoryCount: number) {
	return categoryCount >= 5 && categoryCount % 3 === 2;
}

export function getCategoryGridClassName(
	categoryCount: number,
	className?: string,
) {
	return cn(
		"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12",
		className,
		categoryCount === 1 && "mx-auto max-w-xl",
		categoryCount === 2 && "mx-auto max-w-4xl",
	);
}

export function getCategoryCardLayoutClassName(
	index: number,
	categoryCount: number,
) {
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
