import { ContactSectionSkeleton } from "./contact-section-skeleton";

type ContactStateVariant = "loading" | "error" | "empty";

export function ContactState({ variant }: { variant: ContactStateVariant }) {
	if (variant === "loading") {
		return <ContactSectionSkeleton />;
	}

	if (variant === "error") {
		return (
			<div
				role="status"
				className="mx-auto mt-10 max-w-2xl rounded-md border border-dashed border-hairline-strong bg-frost px-6 py-10 text-center text-sm text-ink-muted lg:mt-12">
				Не удалось загрузить контакты.
			</div>
		);
	}

	return (
		<div className="mx-auto mt-10 max-w-2xl rounded-md border border-dashed border-hairline-strong bg-frost px-6 py-10 text-center text-sm text-ink-muted lg:mt-12">
			Контактные данные пока не добавлены.
		</div>
	);
}
