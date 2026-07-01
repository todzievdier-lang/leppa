"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import {
	COOKIE_CONSENT_STORAGE_KEY,
	clearCookieConsent,
	readCookieConsent,
	saveCookieConsent,
} from "./cookie-consent";

import type { CookieConsentChoice } from "./cookie-consent";
import type { ReactNode } from "react";

type CookieConsentContextValue = {
	choice: CookieConsentChoice | null;
	isReady: boolean;
	resetConsent: () => void;
	setConsent: (choice: CookieConsentChoice) => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
	null,
);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
	const [choice, setChoice] = useState<CookieConsentChoice | null>(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		const syncConsent = () => {
			setChoice(readCookieConsent());
			setIsReady(true);
		};

		const handleStorage = (event: StorageEvent) => {
			if (event.key === COOKIE_CONSENT_STORAGE_KEY || event.key === null) {
				syncConsent();
			}
		};

		syncConsent();
		window.addEventListener("storage", handleStorage);

		return () => {
			window.removeEventListener("storage", handleStorage);
		};
	}, []);

	const setConsent = useCallback((nextChoice: CookieConsentChoice) => {
		setChoice(nextChoice);
		saveCookieConsent(nextChoice);
	}, []);

	const resetConsent = useCallback(() => {
		setChoice(null);
		clearCookieConsent();
	}, []);

	const value = useMemo(
		() => ({ choice, isReady, resetConsent, setConsent }),
		[choice, isReady, resetConsent, setConsent],
	);

	return (
		<CookieConsentContext.Provider value={value}>
			{children}
		</CookieConsentContext.Provider>
	);
}

export function useCookieConsent() {
	const context = useContext(CookieConsentContext);

	if (!context) {
		throw new Error("useCookieConsent must be used within CookieConsentProvider");
	}

	return context;
}
