"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { Menu, X } from "lucide-react";
import { createPortal } from "react-dom";

import { HeaderProductSearch } from "@/components/layout/header-product-search";
import { HeaderShopActions } from "@/components/shop/header-shop-actions";
import { cn } from "@/lib/utils";

import type { ProductSearchItem } from "@/types/catalog";

const navItems = [
	{
		label: "Главная",
		href: "/",
	},
	{
		label: "Каталог",
		href: "/catalog",
	},
	{
		label: "Контакты",
		href: "/contact",
	},
];

const Header = ({
	companyName,
	searchProducts = [],
}: {
	companyName?: string;
	searchProducts?: ProductSearchItem[];
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const pathname = usePathname();
	const router = useRouter();
	const canUseDocument = typeof document !== "undefined";

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
	};

	const handleNavClick = () => {
		setIsOpen(false);
	};

	useEffect(() => {
		document.body.classList.toggle("overlay", isOpen);

		return () => {
			document.body.classList.remove("overlay");
		};
	}, [isOpen]);

	useEffect(() => {
		navItems.forEach((item) => {
			if (item.href !== pathname) {
				router.prefetch(item.href);
			}
		});
	}, [pathname, router]);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(min-width: 768px)");

		const handleDesktopChange = (event: MediaQueryListEvent) => {
			if (event.matches) {
				setIsOpen(false);
			}
		};

		mediaQuery.addEventListener("change", handleDesktopChange);

		return () => {
			mediaQuery.removeEventListener("change", handleDesktopChange);
		};
	}, []);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const mobileNavigationMenu = (
		<>
			<div
						aria-hidden="true"
						onClick={() => handleOpenChange(false)}
						className={cn(
							"mobile-menu-backdrop fixed inset-0 z-40 backdrop-blur-[2px] md:hidden",
							isOpen && "is-open",
						)}
					/>
			<div
						id="mobile-navigation-menu"
						aria-hidden={!isOpen}
						className={cn(
							"mobile-navigation-menu pointer-events-none fixed inset-x-0 top-[5.25rem] z-[60] px-4 md:hidden",
							isOpen && "is-open",
						)}>
						<div className="mx-auto w-full max-w-5xl">
							<div className="mobile-menu-panel pointer-events-auto max-h-[calc(100dvh-6.5rem)] overflow-y-auto overscroll-contain rounded-chrome-panel border border-hairline bg-frost px-4 py-3 shadow-surface-lg">
								<nav className="flex flex-col gap-2">
									{navItems.map((item) => {
										const isActive = pathname === item.href;

										return (
											<div key={item.href}>
												<Link
													href={item.href}
													prefetch={true}
													onClick={handleNavClick}
													className={`block min-h-11 w-full rounded-full border px-4 py-2.5 text-center text-sm font-medium transition-colors duration-300 ${
														isActive
															? "border-hairline bg-muted text-foreground shadow-control"
															: "border-transparent text-ink-muted hover:bg-ink-splash"
													}`}>
													{item.label}
												</Link>
											</div>
										);
									})}
								</nav>
							</div>
						</div>
			</div>
		</>
	);

	return (
		<>
			<header className="fixed left-1/2 top-4 z-[70] isolate w-full max-w-5xl -translate-x-1/2 px-4">
				<div
					className={cn(
						"grid w-full grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-3 rounded-full border border-hairline px-5 py-2 transition-[background-color,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] md:gap-4 md:px-6",
						isOpen ? "bg-canvas shadow-surface-md" : "bg-toolbar shadow-header",
					)}>
					{/* Logo */}
					<Link
						href="/"
						prefetch={true}
						onClick={handleNavClick}
						aria-label={`${companyName || "L&W"} — на главную`}
						className="flex shrink-0 items-center text-lg font-bold text-ink transition-opacity hover:opacity-85">
						L&W
					</Link>

					{/* Desktop navigation */}
					<nav className="hidden justify-center gap-1 rounded-full border border-hairline bg-overlay p-1 shadow-control md:flex md:justify-self-center">
						{navItems.map((item) => {
							const isActive = pathname === item.href;

							return (
								<Link
									key={item.href}
									href={item.href}
									prefetch={true}
									className={`rounded-full border px-3 py-1 text-sm font-medium transition-all duration-300 ${
										isActive
											? "border-hairline bg-muted text-foreground shadow-control"
											: "border-transparent text-ink-muted hover:bg-ink-splash"
									}`}>
									{item.label}
								</Link>
							);
						})}
					</nav>

					{/* Actions */}
					<div className="flex items-center justify-end gap-2 md:gap-3">
						<HeaderProductSearch
							key={pathname}
							isNavigationOpen={isOpen}
							products={searchProducts}
						/>
						<HeaderShopActions isNavigationOpen={isOpen} />

						{/* Mobile menu */}
						<div className="relative md:hidden">
							<button
								type="button"
								onClick={() => handleOpenChange(!isOpen)}
								aria-controls="mobile-navigation-menu"
								aria-expanded={isOpen}
								aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
								className={`relative flex size-8 items-center justify-center overflow-hidden rounded-full border border-hairline shadow-control transition-all duration-300 ${
									isOpen
										? "bg-ink text-on-dark"
										: "bg-canvas text-ink-muted hover:bg-ink hover:text-on-dark"
								}`}>
								<Menu
									aria-hidden="true"
									className={cn(
										"absolute h-4 w-4 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
										isOpen
											? "rotate-90 scale-75 opacity-0"
											: "rotate-0 scale-100 opacity-100",
									)}
								/>
								<X
									aria-hidden="true"
									className={cn(
										"absolute h-4 w-4 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
										isOpen
											? "rotate-0 scale-100 opacity-100"
											: "-rotate-90 scale-75 opacity-0",
									)}
								/>
							</button>
						</div>
					</div>
				</div>
			</header>
			{canUseDocument ? createPortal(mobileNavigationMenu, document.body) : null}
		</>
	);
};

export { Header };
