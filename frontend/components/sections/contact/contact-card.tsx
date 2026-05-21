import type { LucideIcon } from "lucide-react";

type ContactCardProps = {
	title: string;
	value: string;
	href: string;
	icon: LucideIcon;
	external?: boolean;
};

export function ContactCard({
	title,
	value,
	href,
	icon: Icon,
	external = false,
}: ContactCardProps) {
	return (
		<a
			href={href}
			target={external ? "_blank" : undefined}
			rel={external ? "noreferrer" : undefined}
			aria-label={`${title}: ${value}`}
			className="group hover-lift-card flex h-full min-h-52 min-w-0 flex-col items-center justify-center rounded-md border border-hairline bg-canvas p-5 text-center shadow-control hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-6">
			<span className="flex size-12 items-center justify-center rounded-full border border-hairline bg-frost text-ink shadow-control transition-colors duration-300 group-hover:border-hairline-strong group-hover:bg-toolbar">
				<Icon
					aria-hidden="true"
					className="h-6 w-6"
					strokeWidth={1.75}
				/>
			</span>

			<span className="mt-5 block text-xl font-semibold leading-tight tracking-normal text-ink sm:text-2xl">
				{title}
			</span>

			<span className="mt-3 block max-w-full truncate text-sm leading-relaxed text-ink-muted sm:text-base">
				{value}
			</span>
		</a>
	);
}
