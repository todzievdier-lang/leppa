"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
	CartLine,
	ShopProductSnapshot,
	ShopState,
	ShopToast,
} from "@/types/shop";

const SHOP_STORAGE_KEY = "leppa-shop-state-v1";
const SHOP_STATE_EVENT = "leppa-shop-state-change";
export const SHOP_TOAST_EVENT = "leppa-shop-toast";

const EMPTY_SHOP_STATE: ShopState = {
	cart: [],
	favorites: [],
};

function createToastId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeProductSnapshot(value: unknown): ShopProductSnapshot | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const product = value as Partial<ShopProductSnapshot>;
	if (
		typeof product.id !== "string" || product.id.length === 0
		|| typeof product.name !== "string" || product.name.length === 0
		|| typeof product.href !== "string" || product.href.length === 0
		|| typeof product.image !== "string" || product.image.length === 0
		|| typeof product.priceLabel !== "string"
		|| product.priceLabel.length === 0
	) {
		return null;
	}

	return {
		id: product.id,
		name: product.name,
		sku: product.sku ?? null,
		href: product.href,
		image: product.image,
		priceLabel: product.priceLabel,
		inStock:
			typeof product.inStock === "boolean" ? product.inStock : true,
		price: product.price,
		currency: product.currency,
	};
}

function normalizeCartLine(value: unknown): CartLine | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const line = value as Partial<CartLine>;

	const product = normalizeProductSnapshot(line.product);

	if (!product) {
		return null;
	}

	return {
		product,
		quantity:
			typeof line.quantity === "number" && line.quantity > 0
				? line.quantity
				: 1,
		addedAt:
			typeof line.addedAt === "number" && line.addedAt > 0
				? line.addedAt
				: Date.now(),
	};
}

function normalizeShopState(value: unknown): ShopState {
	if (!value || typeof value !== "object") {
		return EMPTY_SHOP_STATE;
	}

	const state = value as Partial<ShopState>;

	return {
		cart: Array.isArray(state.cart)
			? state.cart
				.map(normalizeCartLine)
				.filter((line): line is CartLine => Boolean(line))
			: [],
		favorites: Array.isArray(state.favorites)
			? state.favorites
				.map(normalizeProductSnapshot)
				.filter((product): product is ShopProductSnapshot => Boolean(product))
			: [],
	};
}

function readShopState(): ShopState {
	if (typeof window === "undefined") {
		return EMPTY_SHOP_STATE;
	}

	try {
		const rawState = window.localStorage.getItem(SHOP_STORAGE_KEY);

		return rawState
			? normalizeShopState(JSON.parse(rawState))
			: EMPTY_SHOP_STATE;
	} catch {
		return EMPTY_SHOP_STATE;
	}
}

function writeShopState(nextState: ShopState) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(nextState));
	window.dispatchEvent(
		new CustomEvent<ShopState>(SHOP_STATE_EVENT, { detail: nextState }),
	);
}

export function emitShopToast(toast: ShopToast) {
	if (typeof window === "undefined") {
		return;
	}

	window.dispatchEvent(
		new CustomEvent<ShopToast>(SHOP_TOAST_EVENT, {
			detail: {
				...toast,
				id: toast.id ?? createToastId(),
			},
		}),
	);
}

export function useShopState() {
	const [state, setState] = useState<ShopState>(EMPTY_SHOP_STATE);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		function syncState(nextState = readShopState()) {
			setState(nextState);
			setHydrated(true);
		}

		function handleStateChange(event: Event) {
			const customEvent = event as CustomEvent<ShopState>;

			syncState(normalizeShopState(customEvent.detail));
		}

		function handleStorageChange(event: StorageEvent) {
			if (event.key === SHOP_STORAGE_KEY) {
				syncState();
			}
		}

		syncState();

		window.addEventListener(SHOP_STATE_EVENT, handleStateChange);
		window.addEventListener("storage", handleStorageChange);

		return () => {
			window.removeEventListener(SHOP_STATE_EVENT, handleStateChange);
			window.removeEventListener("storage", handleStorageChange);
		};
	}, []);

	const cartIds = useMemo(
		() => new Set(state.cart.map((line) => line.product.id)),
		[state.cart],
	);
	const cartQuantityById = useMemo(
		() =>
			new Map(
				state.cart.map((line) => [line.product.id, line.quantity]),
			),
		[state.cart],
	);
	const favoriteIds = useMemo(
		() => new Set(state.favorites.map((product) => product.id)),
		[state.favorites],
	);

	const addToCart = useCallback((product: ShopProductSnapshot) => {
		if (!product.inStock) {
			emitShopToast({
				title: "Товара нет в наличии",
				description: product.name,
			});

			return "unavailable" as const;
		}

		const currentState = readShopState();
		const alreadyInCart = currentState.cart.some(
			(line) => line.product.id === product.id,
		);

		if (alreadyInCart) {
			emitShopToast({
				title: "Товар уже в корзине",
				description: product.name,
			});

			return "exists" as const;
		}

		writeShopState({
			...currentState,
			cart: [
				{
					product,
					quantity: 1,
					addedAt: Date.now(),
				},
				...currentState.cart,
			],
		});
		emitShopToast({
			title: "Добавлено в корзину",
			description: product.name,
		});

		return "added" as const;
	}, []);

	const incrementCartQuantity = useCallback((product: ShopProductSnapshot) => {
		if (!product.inStock) {
			emitShopToast({
				title: "Товара нет в наличии",
				description: product.name,
			});

			return;
		}

		const currentState = readShopState();
		const existingLine = currentState.cart.find(
			(line) => line.product.id === product.id,
		);

		writeShopState({
			...currentState,
			cart: existingLine
				? currentState.cart.map((line) =>
						line.product.id === product.id
							? { ...line, quantity: line.quantity + 1 }
							: line,
					)
				: [
						{
							product,
							quantity: 1,
							addedAt: Date.now(),
						},
						...currentState.cart,
					],
		});
	}, []);

	const decrementCartQuantity = useCallback((productId: string) => {
		const currentState = readShopState();

		writeShopState({
			...currentState,
			cart: currentState.cart
				.map((line) =>
					line.product.id === productId
						? { ...line, quantity: line.quantity - 1 }
						: line,
				)
				.filter((line) => line.quantity > 0),
		});
	}, []);

	const removeFromCart = useCallback((productId: string) => {
		const currentState = readShopState();
		const line = currentState.cart.find(
			(item) => item.product.id === productId,
		);

		writeShopState({
			...currentState,
			cart: currentState.cart.filter(
				(item) => item.product.id !== productId,
			),
		});

		if (line) {
			emitShopToast({
				title: "Удалено из корзины",
				description: line.product.name,
			});
		}
	}, []);

	const clearCart = useCallback(() => {
		const currentState = readShopState();

		if (currentState.cart.length === 0) {
			return;
		}

		writeShopState({
			...currentState,
			cart: [],
		});
		emitShopToast({
			title: "Корзина очищена",
		});
	}, []);

	const toggleFavorite = useCallback((product: ShopProductSnapshot) => {
		const currentState = readShopState();
		const isFavorite = currentState.favorites.some(
			(item) => item.id === product.id,
		);

		writeShopState({
			...currentState,
			favorites: isFavorite
				? currentState.favorites.filter((item) => item.id !== product.id)
				: [product, ...currentState.favorites],
		});
		emitShopToast({
			title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
			description: product.name,
		});

		return isFavorite ? "removed" : "added";
	}, []);

	const removeFromFavorites = useCallback((productId: string) => {
		const currentState = readShopState();
		const product = currentState.favorites.find(
			(item) => item.id === productId,
		);

		writeShopState({
			...currentState,
			favorites: currentState.favorites.filter(
				(item) => item.id !== productId,
			),
		});

		if (product) {
			emitShopToast({
				title: "Удалено из избранного",
				description: product.name,
			});
		}
	}, []);

	const clearFavorites = useCallback(() => {
		const currentState = readShopState();

		if (currentState.favorites.length === 0) {
			return;
		}

		writeShopState({
			...currentState,
			favorites: [],
		});
		emitShopToast({
			title: "Избранное очищено",
		});
	}, []);

	return {
		state,
		hydrated,
		cartCount: state.cart.reduce((total, line) => total + line.quantity, 0),
		favoritesCount: state.favorites.length,
		isInCart: useCallback(
			(productId: string) => cartIds.has(productId),
			[cartIds],
		),
		getCartQuantity: useCallback(
			(productId: string) => cartQuantityById.get(productId) ?? 0,
			[cartQuantityById],
		),
		isFavorite: useCallback(
			(productId: string) => favoriteIds.has(productId),
			[favoriteIds],
		),
		addToCart,
		clearCart,
		clearFavorites,
		incrementCartQuantity,
		decrementCartQuantity,
		removeFromCart,
		removeFromFavorites,
		toggleFavorite,
	};
}
