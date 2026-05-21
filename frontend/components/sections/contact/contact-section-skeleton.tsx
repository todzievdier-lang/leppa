import { ContactCardsSkeleton } from "./contact-card-skeleton";
import { ContactMapSkeleton } from "./contact-map";

function ContactInfoSkeleton() {
	return (
		<article
			aria-hidden="true"
			className="flex h-full min-h-48 flex-col items-center rounded-md border border-hairline bg-frost p-5 text-center shadow-control sm:p-6">
			<div className="size-12 animate-pulse rounded-full bg-toolbar" />
			<div className="mt-5 h-8 w-1/2 animate-pulse rounded-full bg-toolbar" />
			<div className="mt-4 h-4 w-5/6 animate-pulse rounded-full bg-toolbar" />
			<div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-toolbar" />
		</article>
	);
}

export function ContactSectionSkeleton() {
	return (
		<div
			aria-live="polite"
			className="mt-10 lg:mt-12">
			<div
				role="status"
				className="flex items-center justify-center gap-3 text-sm text-ink-faint">
				<span
					aria-hidden="true"
					className="size-2 animate-pulse rounded-full bg-ink-faint"
				/>
				<span>Загружаем контакты...</span>
			</div>

			<ContactCardsSkeleton className="mt-8 lg:mt-10" />

			<div className="mt-4 grid gap-4 lg:grid-cols-2">
				<ContactInfoSkeleton />
				<ContactInfoSkeleton />
			</div>

			<ContactMapSkeleton className="mt-4" />
		</div>
	);
}
