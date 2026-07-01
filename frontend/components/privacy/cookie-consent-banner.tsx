"use client";

import Link from "next/link";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Cookie } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/lib/privacy/use-cookie-consent";

export function CookieConsentBanner() {
	const { choice, isReady, setConsent } = useCookieConsent();
	const shouldReduceMotion = useReducedMotion();

	return (
		<AnimatePresence>
			{isReady && choice === null ? (
				<motion.aside
					key="cookie-consent"
					role="dialog"
					aria-labelledby="cookie-consent-title"
					aria-describedby="cookie-consent-description"
					aria-live="polite"
					initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
					transition={{
						duration: shouldReduceMotion ? 0.01 : 0.42,
						ease: [0.16, 1, 0.3, 1],
					}}
					className="fixed bottom-4 left-4 z-[80] w-[calc(100%-2rem)] max-w-[28rem] rounded-lg border border-hairline bg-canvas/95 p-4 shadow-surface-lg backdrop-blur-xl sm:bottom-6 sm:left-auto sm:right-6 sm:p-5">
					<div className="flex items-start gap-3">
						<span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-frost text-ink shadow-control">
							<Cookie
								aria-hidden="true"
								className="size-5"
								strokeWidth={1.8}
							/>
						</span>

						<div className="min-w-0">
							<h2
								id="cookie-consent-title"
								className="text-base font-semibold text-ink">
								Настройки cookies
							</h2>
							<p
								id="cookie-consent-description"
								className="mt-1 text-sm leading-relaxed text-ink-muted">
								Мы сохраняем на устройстве только необходимые настройки. Яндекс
								Карта загружается с вашего разрешения и может использовать cookies.
							</p>
							<Link
								href="/privacy#services"
								className="mt-2 inline-flex text-xs font-medium text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
								Подробнее в политике
							</Link>
						</div>
					</div>

					<div className="mt-4 grid gap-2 min-[390px]:grid-cols-2">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							className="min-h-11 w-full"
							onClick={() => setConsent("necessary")}>
							Только необходимые
						</Button>
						<Button
							type="button"
							variant="dark"
							size="sm"
							className="min-h-11 w-full"
							onClick={() => setConsent("all")}>
							Разрешить карту
						</Button>
					</div>
				</motion.aside>
			) : null}
		</AnimatePresence>
	);
}
