import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { createCatalogHref } from "@/lib/catalog/url";
import { cn } from "@/lib/utils";

import type { CatalogQuery, PaginationMeta } from "@/types/catalog";

export function CatalogPagination({
	basePath,
	pagination,
	query,
}: {
	basePath: string;
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

	return (
		<nav
			aria-label="Навигация по страницам каталога"
			className="mt-10 flex flex-wrap items-center justify-center gap-2">
			<Link
				href={createCatalogHref(basePath, {
					...query,
					page: Math.max(1, pagination.page - 1),
				})}
				aria-disabled={!pagination.hasPreviousPage}
				className={cn(
					"flex size-10 items-center justify-center rounded-full border border-hairline bg-frost text-ink-muted shadow-control hover:bg-toolbar",
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

				return (
					<Link
						key={page}
						href={createCatalogHref(basePath, { ...query, page })}
						aria-current={isActive ? "page" : undefined}
						className={cn(
							"flex size-10 items-center justify-center rounded-full border text-sm font-semibold shadow-control",
							isActive
								? "border-ink bg-ink text-on-dark"
								: "border-hairline bg-frost text-ink-muted hover:bg-toolbar",
						)}>
						{page}
					</Link>
				);
			})}

			<Link
				href={createCatalogHref(basePath, {
					...query,
					page: Math.min(pagination.totalPages, pagination.page + 1),
				})}
				aria-disabled={!pagination.hasNextPage}
				className={cn(
					"flex size-10 items-center justify-center rounded-full border border-hairline bg-frost text-ink-muted shadow-control hover:bg-toolbar",
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
