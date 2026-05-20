import { cn } from "@/lib/utils";

export const CATEGORY_SKELETON_COUNT = 6;

export function getCategoryGridClassName(
	categoryCount: number,
	className?: string,
) {
	return cn(
		"grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3",
		className,
		categoryCount === 1 && "mx-auto max-w-xl sm:grid-cols-1 lg:grid-cols-1",
		categoryCount === 2 && "mx-auto max-w-4xl lg:grid-cols-2",
	);
}
