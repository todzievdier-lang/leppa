import { cn } from "@/lib/utils";

import {
	CONTACT_CARD_SKELETON_COUNT,
	getContactGridClassName,
} from "./contact-layout";

function ContactCardSkeleton() {
	return (
		<article
			aria-hidden="true"
			className="flex h-full min-h-52 min-w-0 flex-col items-center justify-center rounded-md border border-hairline bg-canvas p-5 text-center shadow-control sm:p-6">
			<div className="size-12 animate-pulse rounded-full bg-toolbar" />
			<div className="mt-5 h-7 w-2/3 animate-pulse rounded-full bg-toolbar sm:h-8" />
			<div className="mt-4 h-4 w-5/6 animate-pulse rounded-full bg-toolbar" />
		</article>
	);
}

export function ContactCardsSkeleton({
	count = CONTACT_CARD_SKELETON_COUNT,
	className,
}: {
	count?: number;
	className?: string;
}) {
	return (
		<div className={cn(getContactGridClassName(count), className)}>
			{Array.from({ length: count }).map((_, index) => (
				<ContactCardSkeleton key={index} />
			))}
		</div>
	);
}
