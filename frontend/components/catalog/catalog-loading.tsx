import { productMediaFrameClassName } from "@/components/media/product-media-frame";
import { surfaceVariants } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

function SkeletonLine({ className }: { className?: string }) {
	return (
		<div className={cn("animate-pulse rounded-full bg-toolbar", className)} />
	);
}

function SkeletonProductCard() {
	return (
		<article
			className={cn(
				surfaceVariants({ variant: "card" }),
				"flex h-full min-w-0 flex-col overflow-hidden p-3",
			)}>
			<div className={productMediaFrameClassName("card", "animate-pulse")} />
			<div className="flex flex-1 flex-col px-2 pb-2 pt-4 sm:px-3">
				<SkeletonLine className="h-6 w-28" />
				<SkeletonLine className="mt-3 h-5 w-11/12" />
				<SkeletonLine className="mt-2 h-5 w-4/5" />
				<SkeletonLine className="mt-4 h-7 w-24" />
				<div className="mt-4 flex min-h-8 flex-wrap gap-1.5">
					<SkeletonLine className="h-8 w-14" />
					<SkeletonLine className="h-8 w-16" />
					<SkeletonLine className="h-8 w-12" />
				</div>
				<div className="mt-auto border-t border-hairline pt-4">
					<div className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-2.5">
						<SkeletonLine className="h-11" />
						<SkeletonLine className="size-11" />
					</div>
				</div>
			</div>
		</article>
	);
}

export function CatalogPageSkeleton() {
	return (
		<section
			role="status"
			aria-label="Загрузка каталога"
			className="bg-canvas text-ink">
			<div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:px-10 lg:pb-24 lg:pt-40">
				<SkeletonLine className="h-4 w-56" />

				<div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.7fr)] lg:items-end">
					<div>
						<SkeletonLine className="h-12 w-64 sm:h-14 sm:w-80" />
						<SkeletonLine className="mt-5 h-5 w-full max-w-2xl" />
						<SkeletonLine className="mt-3 h-5 w-4/5 max-w-xl" />
					</div>
				</div>

				<div className="mb-2 mt-8 flex flex-col gap-2 sm:flex-row">
					<SkeletonLine className="h-12 flex-1" />
					<SkeletonLine className="h-12 w-full sm:w-56" />
				</div>

				<div className="flex gap-2 overflow-hidden py-4">
					{Array.from({ length: 6 }, (_, index) => (
						<SkeletonLine
							key={index}
							className="h-9 w-28 shrink-0"
						/>
					))}
				</div>

				<div className="mt-8 grid gap-x-3 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 8 }, (_, index) => (
						<SkeletonProductCard key={index} />
					))}
				</div>
			</div>
		</section>
	);
}

export function ProductPageSkeleton() {
	return (
		<article
			role="status"
			aria-label="Загрузка товара"
			className="bg-canvas text-ink">
			<div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:px-10 lg:pb-24 lg:pt-40">
				<div className="flex items-center gap-5">
					<SkeletonLine className="size-10" />
					<SkeletonLine className="h-4 w-72 max-w-full" />
				</div>

				<div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start">
					<div>
						<div className={productMediaFrameClassName("gallery", "animate-pulse")} />
						<div className="mt-3 grid grid-flow-col auto-cols-[clamp(4.75rem,18vw,7rem)] gap-3 overflow-hidden">
							{Array.from({ length: 5 }, (_, index) => (
								<div
									key={index}
									className={productMediaFrameClassName(
										"thumbnail",
										"animate-pulse",
									)}
								/>
							))}
						</div>
					</div>

					<div className="min-w-0">
						<div className="flex flex-wrap gap-3">
							<SkeletonLine className="h-8 w-28" />
							<SkeletonLine className="h-8 w-36" />
						</div>
						<SkeletonLine className="mt-6 h-4 w-32" />
						<SkeletonLine className="mt-4 h-10 w-full max-w-lg" />
						<SkeletonLine className="mt-3 h-10 w-4/5 max-w-md" />
						<SkeletonLine className="mt-6 h-5 w-full max-w-lg" />
						<SkeletonLine className="mt-3 h-5 w-5/6 max-w-md" />

						<div className="mt-6 flex flex-wrap gap-2">
							<SkeletonLine className="h-10 w-20" />
							<SkeletonLine className="h-10 w-20" />
							<SkeletonLine className="h-10 w-20" />
						</div>

						<div className="mt-6 border-b border-hairline py-5">
							<SkeletonLine className="h-9 w-44" />
						</div>
						<SkeletonLine className="mt-5 h-12 w-full" />
						<SkeletonLine className="mt-3 h-12 w-full" />
					</div>
				</div>

				<div className="mt-14">
					<SkeletonLine className="h-4 w-44" />
					<SkeletonLine className="mt-3 h-9 w-80 max-w-full" />
					<div
						className={cn(
							surfaceVariants({ variant: "card" }),
							"mt-6 grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.36fr)]",
						)}>
						<div className="space-y-4">
							<SkeletonLine className="h-5 w-full" />
							<SkeletonLine className="h-5 w-11/12" />
							<SkeletonLine className="h-5 w-10/12" />
						</div>
						<div className="space-y-4">
							<SkeletonLine className="h-5 w-full" />
							<SkeletonLine className="h-5 w-4/5" />
						</div>
					</div>
				</div>
			</div>
		</article>
	);
}
