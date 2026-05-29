"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FilledImage } from "@/components/media/filled-image";
import {
	getSafeProductImageSrc,
	productMediaFrameClassName,
} from "@/components/media/product-media-frame";
import { surfaceVariants } from "@/components/ui/surface";
import { useShopState } from "@/lib/shop/store";
import { cn } from "@/lib/utils";

import type { ShopProductSnapshot } from "@/types/shop";

type OpenPanel = "cart" | "favorites" | null;

function CounterBadge({ count }: { count: number }) {
	if (count <= 0) {
		return null;
	}

	return (
		<span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full border border-canvas bg-ink px-1 text-[10px] font-semibold leading-4 text-on-dark">
			{count > 99 ? "99+" : count}
		</span>
	);
}

function PanelProductRow({
	onClose,
	onRemove,
	product,
	quantity,
}: {
	onClose: () => void;
	onRemove: () => void;
	product: ShopProductSnapshot;
	quantity?: number;
}) {
	return (
		<li className="grid grid-cols-[minmax(0,1fr)_2.25rem] gap-2 rounded-sm border border-hairline bg-frost p-2">
			<Link
				href={product.href}
				onClick={onClose}
				className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)] gap-3">
				<div className={productMediaFrameClassName("mini")}>
					<FilledImage
						src={getSafeProductImageSrc(product.image)}
						alt={product.name}
						sizes="48px"
						className="absolute inset-0"
					/>
				</div>
				<span className="min-w-0 self-center">
					<span className="line-clamp-2 text-xs font-semibold text-ink">
						{product.name}
						{quantity ? (
							<span className="text-ink-muted"> x {quantity} шт.</span>
						) : null}
					</span>
					<span className="mt-1 block text-xs text-ink-muted">
						{product.priceLabel}
					</span>
				</span>
			</Link>
			<Button
				type="button"
				variant="secondary"
				size="icon"
				aria-label={`Удалить ${product.name}`}
				className="size-9 self-center text-ink-faint hover:text-destructive"
				onClick={onRemove}>
				<Trash2
					aria-hidden="true"
					className="size-4"
				/>
			</Button>
		</li>
	);
}

export function HeaderShopActions() {
	const {
		cartCount,
		clearCart,
		favoritesCount,
		removeFromCart,
		removeFromFavorites,
		state,
	} = useShopState();
	const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
	const closeTimeoutRef = useRef<number | null>(null);
	const isCartOpen = openPanel === "cart";
	const isFavoritesOpen = openPanel === "favorites";
	const panelItemsCount = isCartOpen ? state.cart.length : state.favorites.length;
	const favoritesButtonVariant = favoritesCount > 0
		? "favorite"
		: isFavoritesOpen
			? "dark"
			: "secondary";
	const cartButtonVariant = isCartOpen || cartCount > 0 ? "dark" : "secondary";
	const panelTitle = isCartOpen ? "Корзина" : "Избранное";
	const emptyText = isCartOpen
		? "Корзина пока пуста"
		: "В избранном пока нет товаров";
	const panelHref = isCartOpen ? "/cart" : "/favorites";
	const panelActionText = isCartOpen ? "Перейти в корзину" : "Открыть избранное";

	function clearCloseTimeout() {
		if (closeTimeoutRef.current) {
			window.clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
	}

	function openHoverPanel(panel: OpenPanel) {
		clearCloseTimeout();
		setOpenPanel(panel);
	}

	function scheduleClosePanel() {
		clearCloseTimeout();
		closeTimeoutRef.current = window.setTimeout(() => {
			setOpenPanel(null);
			closeTimeoutRef.current = null;
		}, 180);
	}

	useEffect(() => {
		if (!openPanel) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setOpenPanel(null);
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [openPanel]);

	useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				window.clearTimeout(closeTimeoutRef.current);
				closeTimeoutRef.current = null;
			}
		};
	}, []);

	return (
		<div
			className="relative flex items-center justify-end gap-2 md:gap-3"
			onMouseEnter={clearCloseTimeout}
			onMouseLeave={scheduleClosePanel}>
			<div className="relative">
				<Button
					asChild
					variant={favoritesButtonVariant}
					size="icon"
					onMouseEnter={() => {
						openHoverPanel("favorites");
					}}
					onFocus={() => {
						openHoverPanel("favorites");
					}}>
					<Link
						href="/favorites"
						aria-label={`Избранное, товаров: ${favoritesCount}`}
						aria-expanded={isFavoritesOpen}>
						<Heart
							aria-hidden="true"
							className={cn(favoritesCount > 0 && "fill-current")}
						/>
					</Link>
				</Button>
				<CounterBadge count={favoritesCount} />
			</div>

			<div className="relative">
				<Button
					asChild
					variant={cartButtonVariant}
					size="icon"
					onMouseEnter={() => {
						openHoverPanel("cart");
					}}
					onFocus={() => {
						openHoverPanel("cart");
					}}>
					<Link
						href="/cart"
						aria-label={`Корзина, товаров: ${cartCount}`}
						aria-expanded={isCartOpen}>
						<ShoppingBag aria-hidden="true" />
					</Link>
				</Button>
				<CounterBadge count={cartCount} />
			</div>

			{openPanel ? (
				<div
					className={cn(
						surfaceVariants({ variant: "card" }),
						"absolute right-0 top-12 w-[min(420px,calc(100vw-2rem))] p-4",
					)}>
					<div className="flex items-baseline justify-between gap-4">
						<p className="text-sm font-semibold text-ink">{panelTitle}</p>
						<p className="text-xs text-ink-faint">
							{isCartOpen ? cartCount : favoritesCount}
						</p>
					</div>

					{isCartOpen && state.cart.length > 0 ? (
						<div className="mt-3 flex justify-end">
							<Button
								type="button"
								variant="secondary"
								size="sm"
								className="h-8 min-h-8 text-ink-muted hover:text-destructive"
								onClick={clearCart}>
								<Trash2
									aria-hidden="true"
									className="size-4"
								/>
								Очистить
							</Button>
						</div>
					) : null}

					{panelItemsCount > 0 ? (
						<ul className="mt-3 grid max-h-[min(420px,calc(100vh-9rem))] gap-2 overflow-y-auto pr-1">
							{isCartOpen
								? state.cart.map((line) => (
										<PanelProductRow
											key={line.product.id}
											product={line.product}
											quantity={line.quantity}
											onClose={() => {
												setOpenPanel(null);
											}}
											onRemove={() => {
												removeFromCart(line.product.id);
											}}
										/>
									))
								: state.favorites.map((product) => (
										<PanelProductRow
											key={product.id}
											product={product}
											onClose={() => {
												setOpenPanel(null);
											}}
											onRemove={() => {
												removeFromFavorites(product.id);
											}}
										/>
									))}
						</ul>
					) : (
						<p className="mt-3 rounded-sm border border-dashed border-hairline-strong bg-frost px-3 py-4 text-center text-sm text-ink-muted">
							{emptyText}
						</p>
					)}

					<Button
						asChild
						variant="dark"
						className="mt-3 w-full">
						<Link
							href={panelHref}
							onClick={() => {
								setOpenPanel(null);
							}}>
							{panelActionText}
							<ArrowRight aria-hidden="true" />
						</Link>
					</Button>
				</div>
			) : null}
		</div>
	);
}
