import { CategoryCardSkeleton } from "./category-card-skeleton";
import {
	CATEGORY_SKELETON_COUNT,
	getCategoryGridClassName,
} from "./category-layout";

type CategoryStateVariant = "loading" | "error" | "empty";

export function CategoryState({ variant }: { variant: CategoryStateVariant }) {
	if (variant === "loading") {
		return (
			<div
				aria-live="polite"
				className="mt-8">
				<div
					role="status"
					className="flex items-center justify-center gap-3 text-sm text-ink-faint">
					<span
						aria-hidden="true"
						className="size-2 rounded-full bg-ink-faint animate-pulse"
					/>
					<span>Загружаем категории...</span>
				</div>

				<div
					className={getCategoryGridClassName(
						CATEGORY_SKELETON_COUNT,
						"mt-8 lg:mt-10",
					)}>
					{Array.from({ length: CATEGORY_SKELETON_COUNT }).map((_, index) => (
						<CategoryCardSkeleton key={index} />
					))}
				</div>
			</div>
		);
	}

	if (variant === "error") {
		return (
			<div
				role="status"
				className="mx-auto mt-10 max-w-2xl rounded-md border border-dashed border-hairline-strong bg-frost px-6 py-10 text-center text-sm text-ink-muted lg:mt-12">
				Не удалось загрузить категории.
			</div>
		);
	}

	return (
		<div className="mx-auto mt-10 max-w-2xl rounded-md border border-dashed border-hairline-strong bg-frost px-6 py-10 text-center text-sm text-ink-muted lg:mt-12">
			Категории пока не добавлены.
		</div>
	);
}
