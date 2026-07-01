"use client";

import { ExternalLink, MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/lib/privacy/use-cookie-consent";
import { cn } from "@/lib/utils";

export function ContactMap({
	mapEmbed,
	mapLink,
	className,
}: {
	mapEmbed: string;
	mapLink: string;
	className?: string;
}) {
	const { choice, isReady, setConsent } = useCookieConsent();
	const canLoadMap = isReady && choice === "all";

	return (
		<div
			className={cn(
				"rounded-md border border-hairline bg-canvas p-3 shadow-control",
				className,
			)}>
			<div className="aspect-[4/3] overflow-hidden rounded-sm border border-hairline bg-toolbar sm:aspect-[16/9]">
				{canLoadMap ? (
					<iframe
						src={mapEmbed}
						title="Карта проезда Leppa & WenSton"
						loading="lazy"
						referrerPolicy="no-referrer-when-downgrade"
						className="block h-full w-full border-0"
					/>
				) : (
					<div className="flex h-full flex-col items-center justify-center px-5 py-8 text-center">
						<span className="flex size-12 items-center justify-center rounded-full border border-hairline bg-canvas text-ink shadow-control">
							<MapPinned
								aria-hidden="true"
								className="size-6"
								strokeWidth={1.75}
							/>
						</span>
						<h3 className="mt-4 text-xl font-semibold text-ink">
							Карта отключена
						</h3>
						<p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
							Чтобы показать встроенную Яндекс Карту, разрешите загрузку
							стороннего сервиса и его cookies.
						</p>
						<div className="mt-5 flex flex-col items-stretch gap-2 min-[390px]:flex-row min-[390px]:items-center">
							<Button
								type="button"
								variant="dark"
								size="sm"
								className="min-h-11"
								onClick={() => setConsent("all")}>
								Разрешить и показать
							</Button>
							<Button
								asChild
								variant="secondary"
								size="sm"
								className="min-h-11">
								<a
									href={mapLink}
									target="_blank"
									rel="noreferrer">
									Открыть отдельно
									<ExternalLink aria-hidden="true" />
								</a>
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
