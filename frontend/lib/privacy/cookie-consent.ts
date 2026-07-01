export const COOKIE_CONSENT_STORAGE_KEY = "leppa-cookie-consent";
export const COOKIE_CONSENT_VERSION = 1;

export type CookieConsentChoice = "all" | "necessary";

type StoredCookieConsent = {
	choice: CookieConsentChoice;
	updatedAt: string;
	version: number;
};

function isCookieConsentChoice(value: unknown): value is CookieConsentChoice {
	return value === "all" || value === "necessary";
}

export function readCookieConsent(): CookieConsentChoice | null {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const rawConsent = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

		if (!rawConsent) {
			return null;
		}

		const storedConsent = JSON.parse(rawConsent) as Partial<StoredCookieConsent>;

		if (
			storedConsent.version !== COOKIE_CONSENT_VERSION ||
			!isCookieConsentChoice(storedConsent.choice)
		) {
			return null;
		}

		return storedConsent.choice;
	} catch {
		return null;
	}
}

export function saveCookieConsent(choice: CookieConsentChoice) {
	if (typeof window === "undefined") {
		return;
	}

	const consent: StoredCookieConsent = {
		choice,
		updatedAt: new Date().toISOString(),
		version: COOKIE_CONSENT_VERSION,
	};

	try {
		window.localStorage.setItem(
			COOKIE_CONSENT_STORAGE_KEY,
			JSON.stringify(consent),
		);
	} catch {
		// The current page still honors the choice when storage is unavailable.
	}

}

export function clearCookieConsent() {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
	} catch {
		// Opening the controls is still possible when storage is unavailable.
	}

}
