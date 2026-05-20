import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

import type { Category } from "@/types";

export function CategoryCard({
	category,
	isFeatured,
	layoutClassName,
}: {
	category: Category;
	isFeatured: boolean;
	layoutClassName: string;
}) {
	const imageSrc = category.image || "/no-image.png";

	return (
		<Link
			href={`/catalog/${category.handle}`}
			className={cn(
				"group hover-lift-card flex h-full min-w-0 flex-col rounded-md border border-hairline bg-canvas p-3 shadow-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				layoutClassName,
			)}>
			<div
				className={cn(
					"relative aspect-[4/3] overflow-hidden rounded-sm border border-hairline sm:aspect-[16/11]",
					isFeatured && "lg:aspect-[21/9]",
				)}>
				<div
					aria-label={category.name}
					role="img"
					className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
					style={{ backgroundImage: `url(${imageSrc})` }}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
			</div>

			<div className="flex flex-1 flex-col px-2 pb-2 pt-5">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						{/* <p className="text-xs font-medium text-ink-faint">Категория</p> */}
						<h3 className="mt-2 break-words text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
							{category.name}
						</h3>
					</div>

					<span
						className={cn(
							buttonVariants({ variant: "secondary", size: "icon" }),
							"pointer-events-none group-hover:-translate-y-0.5 group-hover:border-hairline-strong group-hover:bg-toolbar group-hover:shadow-control",
						)}>
						<ArrowUpRight
							aria-hidden="true"
							className="h-5 w-5"
							strokeWidth={1.8}
						/>
					</span>
				</div>

				<p className="mt-4 break-words text-sm text-ink-muted sm:text-base">
					{category.description}
				</p>
			</div>
		</Link>
	);
}
