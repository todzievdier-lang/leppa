import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { createCatalogHref } from "@/lib/catalog/url";
import { cn } from "@/lib/utils";

import type { CatalogQuery, PaginationMeta } from "@/types/catalog";
import type { MouseEvent } from "react";

function shouldUseBrowserNavigation(event: MouseEvent<HTMLAnchorElement>) {
	return (
		event.button !== 0
		|| event.altKey
		|| event.ctrlKey
		|| event.metaKey
		|| event.shiftKey
		|| event.currentTarget.target === "_blank"
	);
}

export function CatalogPagination({
	basePath,
	onPageChange,
	pagination,
	query,
}: {
	basePath: string;
	onPageChange: (href: string, page: number) => void;
	pagination: PaginationMeta;
	query: CatalogQuery;
}) {
	if (pagination.totalPages <= 1) {
		return null;
	}

	const pages = Array.from(
		{ length: pagination.totalPages },
		(_, index) => index + 1,
	);
	const previousPage = Math.max(1, pagination.page - 1);
	const previousHref = createCatalogHref(basePath, {
		...query,
		page: previousPage,
	});
	const nextPage = Math.min(pagination.totalPages, pagination.page + 1);
	const nextHref = createCatalogHref(basePath, {
		...query,
		page: nextPage,
	});

	return (
		<nav
			aria-label="Навигация по страницам каталога"
			className="w-fit mx-auto mt-10 flex flex-wrap items-center justify-center gap-1 rounded-full border border-hairline bg-frost p-2 shadow-surface-lg backdrop-blur">
			<Link
				href={previousHref}
				aria-disabled={!pagination.hasPreviousPage}
				onClick={(event) => {
					if (shouldUseBrowserNavigation(event)) {
						return;
					}

					event.preventDefault();
					if (pagination.hasPreviousPage) {
						onPageChange(previousHref, previousPage);
					}
				}}
				className={cn(
					buttonVariants({ variant: "secondary", size: "icon" }),
					!pagination.hasPreviousPage && "pointer-events-none opacity-45",
				)}>
				<ChevronLeft
					aria-hidden="true"
					className="h-4 w-4"
				/>
				<span className="sr-only">Предыдущая страница</span>
			</Link>

			{pages.map((page) => {
				const isActive = page === pagination.page;
				const href = createCatalogHref(basePath, { ...query, page });

				return (
					<Link
						key={page}
						href={href}
						aria-current={isActive ? "page" : undefined}
						onClick={(event) => {
							if (shouldUseBrowserNavigation(event)) {
								return;
							}

							event.preventDefault();
							onPageChange(href, page);
						}}
							className={buttonVariants({
								className: "border-none",
								variant: isActive ? "dark" : "secondary",
								size: "icon",
							})}>
						{page}
					</Link>
				);
			})}

			<Link
				href={nextHref}
				aria-disabled={!pagination.hasNextPage}
				onClick={(event) => {
					if (shouldUseBrowserNavigation(event)) {
						return;
					}

					event.preventDefault();
					if (pagination.hasNextPage) {
						onPageChange(nextHref, nextPage);
					}
				}}
				className={cn(
					buttonVariants({ variant: "secondary", size: "icon" }),
					!pagination.hasNextPage && "pointer-events-none opacity-45",
				)}>
				<ChevronRight
					aria-hidden="true"
					className="h-4 w-4"
				/>
				<span className="sr-only">Следующая страница</span>
			</Link>
		</nav>
	);
}
