"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { createPortal } from "react-dom";

import { HeaderShopActions } from "@/components/shop/header-shop-actions";
import { cn } from "@/lib/utils";

const Header = () => {
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
	const [isOpen, setIsOpen] = useState(false);

	const pathname = usePathname();
	const prefersReducedMotion = useReducedMotion();
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

	const menuTransition = {
		duration: prefersReducedMotion ? 0.01 : 0.46,
		ease: [0.22, 1, 0.36, 1],
	};

	const mobileNavigationMenu = (
		<AnimatePresence>
			{isOpen ? (
				<motion.div
					key="mobile-navigation-menu"
					id="mobile-navigation-menu"
					initial={
						prefersReducedMotion
							? { opacity: 0 }
							: { opacity: 0, scale: 0.985, y: -14 }
					}
					animate={
						prefersReducedMotion
							? { opacity: 1 }
							: { opacity: 1, scale: 1, y: 0 }
					}
					exit={
						prefersReducedMotion
							? { opacity: 0 }
							: { opacity: 0, scale: 0.985, y: -10 }
					}
					transition={menuTransition}
					className="fixed left-1/2 top-14 z-50 w-full max-w-5xl -translate-x-1/2 px-4 md:hidden">
					<motion.div
						initial={
							prefersReducedMotion
								? { opacity: 0 }
								: {
										clipPath: "inset(0 0 100% 0 round 40px)",
										opacity: 0,
								  }
						}
						animate={
							prefersReducedMotion
								? { opacity: 1 }
								: {
										clipPath: "inset(0 0 0% 0 round 40px)",
										opacity: 1,
								  }
						}
						exit={
							prefersReducedMotion
								? { opacity: 0 }
								: {
										clipPath: "inset(0 0 100% 0 round 40px)",
										opacity: 0,
								  }
						}
						transition={menuTransition}
						className="menu-content pointer-events-auto origin-top rounded-chrome-panel border border-hairline bg-overlay px-6 py-3 shadow-surface-lg">
						<motion.nav
							initial="closed"
							animate="open"
							exit="closed"
							variants={{
								open: {
									transition: {
										delayChildren: prefersReducedMotion ? 0 : 0.08,
										staggerChildren: prefersReducedMotion ? 0 : 0.045,
									},
								},
								closed: {
									transition: {
										staggerChildren: prefersReducedMotion ? 0 : 0.025,
										staggerDirection: -1,
									},
								},
							}}
							className="flex flex-col space-y-2">
							{navItems.map((item) => {
								const isActive = pathname === item.href;

								return (
									<motion.div
										key={item.href}
										variants={{
											open: {
												opacity: 1,
												y: 0,
											},
											closed: {
												opacity: 0,
												y: prefersReducedMotion ? 0 : -6,
											},
										}}
										transition={{
											duration: prefersReducedMotion ? 0.01 : 0.28,
											ease: [0.22, 1, 0.36, 1],
										}}>
										<Link
											href={item.href}
											onClick={handleNavClick}
											className={`block w-full rounded-full px-4 py-2 text-center text-sm font-medium transition-colors duration-300 ${
												isActive
													? "border bg-muted text-foreground shadow-control"
													: "border border-transparent text-ink-muted hover:bg-ink-splash"
											}`}>
											{item.label}
										</Link>
									</motion.div>
								);
							})}
						</motion.nav>
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);

	return (
		<>
			<header className="fixed left-1/2 top-4 z-50 isolate w-full max-w-5xl -translate-x-1/2 px-4">
				<div className="grid w-full grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-3 rounded-full border border-hairline bg-toolbar px-5 py-2 shadow-header md:grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] md:gap-4 md:px-6">
					{/* Logo */}
					<Link
						href="/"
						onClick={handleNavClick}
						aria-label="Leppa & WenSton — на главную"
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
