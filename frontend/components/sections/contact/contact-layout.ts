import { cn } from "@/lib/utils";

export const CONTACT_CARD_SKELETON_COUNT = 5;

export function getContactGridClassName(
	contactCount: number,
	className?: string,
) {
	return cn(
		"grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-5",
		className,
		contactCount === 1 && "mx-auto max-w-sm sm:grid-cols-1 lg:grid-cols-1",
		contactCount === 2 && "mx-auto max-w-3xl lg:grid-cols-2",
		contactCount === 3 && "mx-auto max-w-5xl lg:grid-cols-3",
		contactCount === 4 && "lg:grid-cols-4",
	);
}
