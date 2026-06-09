import { cn } from "@/lib/utils";

export function ContactMap({
	mapEmbed,
	className,
}: {
	mapEmbed: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"rounded-md border border-hairline bg-canvas p-3 shadow-control",
				className,
			)}>
			<div className="aspect-[4/3] overflow-hidden rounded-sm border border-hairline bg-toolbar sm:aspect-[16/9]">
				<iframe
					src={mapEmbed}
					title="Карта проезда Leppa & WenSton"
					loading="lazy"
					referrerPolicy="no-referrer-when-downgrade"
					className="block h-full w-full border-0"
				/>
			</div>
		</div>
	);
}
