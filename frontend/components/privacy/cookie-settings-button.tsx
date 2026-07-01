"use client";

import { useCookieConsent } from "@/lib/privacy/use-cookie-consent";

export function CookieSettingsButton() {
	const { resetConsent } = useCookieConsent();

	return (
		<button
			type="button"
			onClick={resetConsent}
			className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
			Настройки cookies
		</button>
	);
}
