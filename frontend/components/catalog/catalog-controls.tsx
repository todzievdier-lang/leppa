"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
	CATALOG_SORT_OPTIONS,
} from "@/lib/catalog/query";
import { cn } from "@/lib/utils";

import type { CatalogSort } from "@/types/catalog";

export function CatalogSearch({
	className,
	isPending = false,
	onSearchChange,
	search,
}: {
	className?: string;
	isPending?: boolean;
	onSearchChange: (value: string) => void;
	search: string;
}) {
	function updateSearch(nextValue: string) {
		onSearchChange(nextValue);
	}

	return (
		<label className={cn("relative block min-w-0", className)}>
			<span className="sr-only">Поиск по каталогу</span>
			<Search
				aria-hidden="true"
				className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
			/>
			<Input
				value={search}
				onChange={(event) => {
					updateSearch(event.target.value);
				}}
				aria-busy={isPending}
				placeholder="Поиск по названию, артикулу или характеристикам"
				className="pl-11 pr-11"
			/>
			{search ? (
				<Button
					type="button"
					variant="secondary"
					size="icon"
					aria-label="Очистить поиск"
					className="absolute right-1.5 top-1/2 size-9 -translate-y-1/2 shadow-none"
					onClick={() => {
						updateSearch("");
					}}>
					<X aria-hidden="true" />
				</Button>
			) : null}
		</label>
	);
}

export function CatalogSortControl({
	onSortChange,
	sort,
}: {
	onSortChange: (sort: CatalogSort) => void;
	sort: CatalogSort;
}) {
	return (
		<label className="flex w-full items-center gap-2 text-sm text-ink-muted sm:w-auto">
			<span className="sr-only">Сортировка каталога</span>
			<Select
				value={sort}
				className="min-w-[190px]"
				onChange={(event) => {
					const nextSort = event.target.value as CatalogSort;
					onSortChange(nextSort);
				}}>
				{CATALOG_SORT_OPTIONS.map((option) => (
					<option
						key={option.value}
						value={option.value}>
						{option.label}
					</option>
				))}
			</Select>
		</label>
	);
}
