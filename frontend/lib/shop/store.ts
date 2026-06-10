"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
	CartBundle,
	CartLine,
	ShopProductOption,
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
const DEFAULT_BUNDLE_TITLE = "Комплект";

type AddManyToCartOptions = {
	bundleTitle?: string;
	discountPercent?: number | null;
};

export function getShopProductKey(product: Pick<ShopProductSnapshot, "id" | "lineId">) {
	return product.lineId ?? product.id;
}

function createToastId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createCartBundleId(): string {
	return `bundle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeCartBundle(value: unknown): CartBundle | undefined {
	if (!value || typeof value !== "object") {
		return undefined;
	}

	const bundle = value as Partial<CartBundle>;

	if (typeof bundle.id !== "string" || bundle.id.length === 0) {
		return undefined;
	}

	return {
		id: bundle.id,
		title:
			typeof bundle.title === "string" && bundle.title.length > 0
				? bundle.title
				: DEFAULT_BUNDLE_TITLE,
		discountPercent:
			typeof bundle.discountPercent === "number"
			&& Number.isFinite(bundle.discountPercent)
			&& bundle.discountPercent > 0
				? bundle.discountPercent
				: undefined,
	};
}

function createCartBundle(options: AddManyToCartOptions = {}): CartBundle {
	return {
		id: createCartBundleId(),
		title: options.bundleTitle ?? DEFAULT_BUNDLE_TITLE,
		discountPercent:
			typeof options.discountPercent === "number"
			&& Number.isFinite(options.discountPercent)
			&& options.discountPercent > 0
				? options.discountPercent
				: undefined,
	};
}

function getLineBundleId(line: CartLine): string | null {
	return line.bundle?.id ?? null;
}

function getBundleQuantity(lines: CartLine[]): number {
	return Math.max(1, ...lines.map((line) => line.quantity));
}

function confirmBundleRemoval(
	bundle: CartBundle,
	bundleLines: CartLine[],
): boolean {
	if (typeof window === "undefined") {
		return true;
	}

	return window.confirm(
		[
			`Товар входит в комплект «${bundle.title}».`,
			`Если удалить одну позицию, из корзины удалится весь комплект: ${bundleLines.length} позиций.`,
			"Удалить комплект?",
		].join("\n\n"),
	);
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

	const selectedOptions = Array.isArray(product.selectedOptions)
		? product.selectedOptions
			.map((option): ShopProductOption | null => {
				if (
					!option
					|| typeof option !== "object"
					|| typeof option.label !== "string"
					|| typeof option.value !== "string"
				) {
					return null;
				}

				return {
					label: option.label,
					value: option.value,
				};
			})
			.filter((option): option is ShopProductOption => Boolean(option))
		: [];

	return {
		id: product.id,
		lineId:
			typeof product.lineId === "string" && product.lineId.length > 0
				? product.lineId
				: undefined,
		name: product.name,
		sku: product.sku ?? null,
		href: product.href,
		image: product.image,
		priceLabel: product.priceLabel,
		inStock:
			typeof product.inStock === "boolean" ? product.inStock : true,
		price: product.price,
		originalPrice:
			typeof product.originalPrice === "number" && Number.isFinite(product.originalPrice)
				? product.originalPrice
				: undefined,
		currency: product.currency,
		selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
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
		bundle: normalizeCartBundle(line.bundle),
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
		() => new Set(state.cart.map((line) => getShopProductKey(line.product))),
		[state.cart],
	);
	const cartQuantityById = useMemo(
		() =>
			new Map(
				state.cart.map((line) => [getShopProductKey(line.product), line.quantity]),
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
		const productKey = getShopProductKey(product);
		const alreadyInCart = currentState.cart.some(
			(line) => getShopProductKey(line.product) === productKey,
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

	const addManyToCart = useCallback((
		products: ShopProductSnapshot[],
		options: AddManyToCartOptions = {},
	) => {
		const availableProducts = products.filter((product) => product.inStock);
		const unavailableCount = products.length - availableProducts.length;

		if (products.length === 0 || unavailableCount > 0) {
			emitShopToast({
				title: "Комплект недоступен",
				description: "Товары из комплекта сейчас не в наличии.",
			});

			return {
				added: 0,
				existing: 0,
				unavailable: unavailableCount,
			};
		}

		const currentState = readShopState();
		const currentCartKeys = new Set(
			currentState.cart.map((line) => getShopProductKey(line.product)),
		);
		const uniqueProducts = availableProducts.filter((product, index, list) => {
			const productKey = getShopProductKey(product);

			return list.findIndex((item) => getShopProductKey(item) === productKey) === index;
		});
		const existingCount = uniqueProducts.filter((product) =>
			currentCartKeys.has(getShopProductKey(product)),
		).length;

		if (uniqueProducts.length === 0 || existingCount > 0) {
			emitShopToast({
				title: "Комплект уже в корзине",
				description:
					existingCount === uniqueProducts.length
						? `${uniqueProducts.length} позиций уже добавлены.`
						: "Сначала удалите текущий комплект из корзины.",
			});

			return {
				added: 0,
				existing: existingCount,
				unavailable: unavailableCount,
			};
		}

		const bundle = createCartBundle(options);
		const newLines = uniqueProducts
			.map((product, index) => ({
				product,
				quantity: 1,
				addedAt: Date.now() - index,
				bundle,
			}));

		writeShopState({
			...currentState,
			cart: [...newLines, ...currentState.cart],
		});
		emitShopToast({
			title:
				newLines.length === availableProducts.length && unavailableCount === 0
					? "Комплект добавлен в корзину"
					: "Добавлены товары из комплекта",
			description: `${newLines.length} из ${products.length} позиций.`,
		});

		return {
			added: newLines.length,
			existing: 0,
			unavailable: unavailableCount,
		};
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
		const productKey = getShopProductKey(product);
		const existingLine = currentState.cart.find(
			(line) => getShopProductKey(line.product) === productKey,
		);
		const bundle = existingLine?.bundle;
		const bundleId = bundle?.id ?? null;

		if (bundleId) {
			const bundleLines = currentState.cart.filter(
				(line) => getLineBundleId(line) === bundleId,
			);
			const nextQuantity = getBundleQuantity(bundleLines) + 1;

			writeShopState({
				...currentState,
				cart: currentState.cart.map((line) =>
					getLineBundleId(line) === bundleId
						? { ...line, quantity: nextQuantity }
						: line,
				),
			});

			return;
		}

		writeShopState({
			...currentState,
			cart: existingLine
				? currentState.cart.map((line) =>
						getShopProductKey(line.product) === productKey
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

	const decrementCartQuantity = useCallback((productKey: string) => {
		const currentState = readShopState();
		const existingLine = currentState.cart.find(
			(line) => getShopProductKey(line.product) === productKey,
		);
		const bundle = existingLine?.bundle;

		if (bundle) {
			const bundleId = bundle.id;
			const bundleLines = currentState.cart.filter(
				(line) => getLineBundleId(line) === bundleId,
			);
			const nextQuantity = Math.min(...bundleLines.map((line) => line.quantity)) - 1;

			if (nextQuantity <= 0 && !confirmBundleRemoval(bundle, bundleLines)) {
				return;
			}

			writeShopState({
				...currentState,
				cart:
					nextQuantity > 0
						? currentState.cart.map((line) =>
								getLineBundleId(line) === bundleId
									? { ...line, quantity: nextQuantity }
									: line,
							)
						: currentState.cart.filter(
								(line) => getLineBundleId(line) !== bundleId,
							),
			});

			return;
		}

		writeShopState({
			...currentState,
			cart: currentState.cart
				.map((line) =>
					getShopProductKey(line.product) === productKey
						? { ...line, quantity: line.quantity - 1 }
						: line,
				)
				.filter((line) => line.quantity > 0),
		});
	}, []);

	const removeFromCart = useCallback((productKey: string) => {
		const currentState = readShopState();
		const line = currentState.cart.find(
			(item) => getShopProductKey(item.product) === productKey,
		);

		if (!line) {
			return;
		}

		const bundleId = getLineBundleId(line);
		const removedLines = bundleId
			? currentState.cart.filter((item) => getLineBundleId(item) === bundleId)
			: [line];

		if (line.bundle && !confirmBundleRemoval(line.bundle, removedLines)) {
			return;
		}

		writeShopState({
			...currentState,
			cart: bundleId
				? currentState.cart.filter(
						(item) => getLineBundleId(item) !== bundleId,
					)
				: currentState.cart.filter(
						(item) => getShopProductKey(item.product) !== productKey,
					),
		});

		emitShopToast({
			title: bundleId ? "Комплект удален из корзины" : "Удалено из корзины",
			description: bundleId
				? `${removedLines.length} позиций удалены вместе.`
				: line.product.name,
		});
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
		addManyToCart,
		clearCart,
		clearFavorites,
		incrementCartQuantity,
		decrementCartQuantity,
		removeFromCart,
		removeFromFavorites,
		toggleFavorite,
	};
}
