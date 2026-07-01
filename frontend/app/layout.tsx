import type { Metadata, Viewport } from "next";

import { Suspense } from "react";

import "./globals.css";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieConsentBanner } from "@/components/privacy/cookie-consent-banner";
import { ShopToasts } from "@/components/shop/shop-toasts";

import { CookieConsentProvider } from "@/lib/privacy/use-cookie-consent";
import { cn } from "@/lib/utils";
import { getSiteSettings } from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = {
	title: "Leppa & WenSton",
	description: "Премиальная витрина для современных товаров для ванной комнаты",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: "#ffffff",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const settings = await getSiteSettings();

	return (
		<html
			lang='ru'
			data-scroll-behavior='smooth'
			className={cn("h-full min-h-dvh scroll-smooth", "font-sans")}>
			<body
				className={cn(
					"flex min-h-dvh min-w-0 flex-col bg-background text-foreground antialiased",
				)}>
				<CookieConsentProvider>
					<Header companyName={settings?.companyName} />
					<ShopToasts />
					<CookieConsentBanner />

					<main className='flex flex-1 flex-col'>
						<div className='flex-1'>{children}</div>
						<Suspense fallback={null}>
							<Footer />
						</Suspense>
					</main>
				</CookieConsentProvider>
			</body>
		</html>
	);
}
