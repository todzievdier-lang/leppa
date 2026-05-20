import { cn } from "@/lib/utils";

export function CategoryCardSkeleton({
	className,
}: {
	className?: string;
}) {
	return (
		<article
			aria-hidden="true"
			className={cn(
				"flex h-full min-w-0 flex-col rounded-md border border-hairline bg-canvas p-3 shadow-control",
				className,
			)}>
			<div className="aspect-[4/3] animate-pulse rounded-sm bg-toolbar sm:aspect-[16/11]" />
			<div className="flex flex-1 flex-col px-2 pb-2 pt-5">
				<div className="flex min-h-[2.5em] items-start justify-between gap-4">
					<div className="h-8 w-2/3 animate-pulse rounded-full bg-toolbar sm:h-10" />
					<div className="size-10 shrink-0 animate-pulse rounded-md bg-toolbar" />
				</div>
				<div className="mt-4 space-y-3">
					<div className="h-3 w-full animate-pulse rounded-full bg-toolbar" />
					<div className="h-3 w-5/6 animate-pulse rounded-full bg-toolbar" />
					<div className="h-3 w-3/4 animate-pulse rounded-full bg-toolbar" />
				</div>
			</div>
		</article>
	);
}
