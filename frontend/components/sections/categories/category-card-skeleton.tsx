import { cn } from "@/lib/utils";

export function CategoryCardSkeleton({
	layoutClassName,
}: {
	layoutClassName: string;
}) {
	return (
		<article
			aria-hidden="true"
			className={cn(
				"h-full min-w-0 rounded-md border border-hairline bg-canvas p-3 shadow-control",
				layoutClassName,
			)}>
			<div className="aspect-[4/3] animate-pulse rounded-sm bg-toolbar sm:aspect-[16/11]" />
			<div className="px-2 pb-2 pt-5">
				<div className="h-3 w-20 animate-pulse rounded-full bg-toolbar" />
				<div className="mt-4 h-8 w-2/3 animate-pulse rounded-full bg-toolbar" />
				<div className="mt-5 space-y-3">
					<div className="h-3 w-full animate-pulse rounded-full bg-toolbar" />
					<div className="h-3 w-5/6 animate-pulse rounded-full bg-toolbar" />
				</div>
			</div>
		</article>
	);
}
