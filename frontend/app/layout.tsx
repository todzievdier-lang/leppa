import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShopToasts } from "@/components/shop/shop-toasts";

import { getProductSearchItems } from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

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
	const searchProducts = await getProductSearchItems();

	return (
		<html
			lang='ru'
			data-scroll-behavior='smooth'
			className={cn("h-full min-h-dvh scroll-smooth", "font-sans")}>
			<body
				className={cn(
					"flex min-h-dvh min-w-0 flex-col bg-background text-foreground antialiased",
				)}>
				<Header searchProducts={searchProducts} />
				<ShopToasts />

				<main className='flex flex-1 flex-col'>
					<div className='flex-1'>{children}</div>
					<Footer />
				</main>
				<SpeedInsights />
			</body>
		</html>
	);
}
