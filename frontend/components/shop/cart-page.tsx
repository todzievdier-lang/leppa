"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
	ChevronLeft,
	ChevronUp,
	Share2,
	ShoppingBag,
	Trash2,
} from "lucide-react";

import { ProductCartControls, ProductFavoriteButton } from "@/components/shop/product-actions";
import { ProductSkuCopy } from "@/components/catalog/product-sku-copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FilledImage } from "@/components/media/filled-image";
import {
	getSafeProductImageSrc,
	productMediaFrameClassName,
} from "@/components/media/product-media-frame";
import { surfaceVariants } from "@/components/ui/surface";
import { copyTextToClipboard } from "@/lib/utils/clipboard";
import { emitShopToast, useShopState } from "@/lib/shop/store";
import { formatPrice } from "@/lib/utils/price";
import { cn } from "@/lib/utils";

import type { CartLine, ShopProductSnapshot } from "@/types/shop";

type BuyerType = "person" | "company";

const REGION_OPTIONS = [
	"Москва",
	"Московская область",
	"Санкт-Петербург",
	"Ленинградская область",
	"Краснодарский край",
	"Республика Татарстан",
];

function getProductUnitPrice(product: ShopProductSnapshot): number | null {
	if (typeof product.price === "number" && Number.isFinite(product.price)) {
		return product.price;
	}

	const digits = product.priceLabel.replace(/[^\d]/g, "");

	return digits ? Number(digits) : null;
}

function formatCartPrice(value: number | null, currency = "RUB") {
	return value == null ? "Цена по запросу" : formatPrice(value, currency);
}

function getLineTotal(line: CartLine): number | null {
	const unitPrice = getProductUnitPrice(line.product);

	return unitPrice == null ? null : unitPrice * line.quantity;
}

function CartPageSkeleton() {
	return (
		<div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.95fr)]">
			<div className={cn(surfaceVariants({ variant: "card" }), "h-[520px] animate-pulse bg-frost")} />
			<div className={cn(surfaceVariants({ variant: "muted" }), "h-[720px] animate-pulse")} />
		</div>
	);
}

function SummaryRow({
	label,
	value,
}: {
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-baseline gap-2 text-sm">
			<span className="shrink-0 text-ink-muted">{label}</span>
			<span className="min-w-6 flex-1 border-b border-dashed border-hairline-strong" />
			<span className="shrink-0 font-semibold text-ink">{value}</span>
		</div>
	);
}

function FormField({
	children,
	label,
	required = false,
}: {
	children: React.ReactNode;
	label: string;
	required?: boolean;
}) {
	return (
		<label className="grid gap-2 text-xs font-medium text-ink-muted">
			<span>
				{label}
				{required ? <span className="text-destructive"> *</span> : null}
			</span>
			{children}
		</label>
	);
}

function BuyerTypeToggle({
	buyerType,
	onChange,
}: {
	buyerType: BuyerType;
	onChange: (buyerType: BuyerType) => void;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			<Button
				type="button"
				variant={buyerType === "person" ? "dark" : "secondary"}
				size="sm"
				onClick={() => {
					onChange("person");
				}}>
				Физическое лицо
			</Button>
			<Button
				type="button"
				variant={buyerType === "company" ? "dark" : "secondary"}
				size="sm"
				onClick={() => {
					onChange("company");
				}}>
				Юридическое лицо
			</Button>
		</div>
	);
}

function CartLineItem({
	line,
	onRemove,
}: {
	line: CartLine;
	onRemove: () => void;
}) {
	const unitPrice = getProductUnitPrice(line.product);
	const lineTotal = getLineTotal(line);

	return (
		<li className="grid gap-4 border-b border-hairline py-5 last:border-b-0 sm:grid-cols-[84px_minmax(0,1fr)] lg:grid-cols-[84px_minmax(0,1fr)_9.5rem_7.5rem] lg:items-center">
			<Link
				href={line.product.href}
				className={productMediaFrameClassName("mini", "size-20")}
				aria-label={`Открыть товар ${line.product.name}`}>
				<FilledImage
					src={getSafeProductImageSrc(line.product.image)}
					alt={line.product.name}
					sizes="84px"
					className="absolute inset-0"
				/>
			</Link>

			<div className="min-w-0">
				<Link
					href={line.product.href}
					className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors hover:text-ink-muted">
					{line.product.name}
				</Link>
				<ProductSkuCopy
					sku={line.product.sku}
					className="mt-2"
				/>
				<p className="mt-2 text-xs text-ink-muted">
					{formatCartPrice(unitPrice, line.product.currency ?? "RUB")} / шт.
				</p>
			</div>

			<ProductCartControls
				layout="detail"
				product={line.product}
			/>

			<div className="flex items-center justify-between gap-3 lg:grid lg:justify-items-end">
				<p className="text-lg font-semibold text-ink">
					{formatCartPrice(lineTotal, line.product.currency ?? "RUB")}
				</p>
				<div className="flex items-center gap-2">
					<ProductFavoriteButton
						compact
						product={line.product}
					/>
					<Button
						type="button"
						variant="secondary"
						size="icon"
						aria-label={`Удалить из корзины: ${line.product.name}`}
						className="size-11 text-ink-faint hover:text-destructive"
						onClick={onRemove}>
						<Trash2 aria-hidden="true" />
					</Button>
				</div>
			</div>
		</li>
	);
}

function CartItemsPanel({
	cartCount,
	lines,
	onClear,
	onPromoApply,
	onRemove,
	onShare,
	positionsCount,
	promo,
	setPromo,
	subtotalLabel,
}: {
	cartCount: number;
	lines: CartLine[];
	onClear: () => void;
	onPromoApply: () => void;
	onRemove: (productId: string) => void;
	onShare: () => void;
	positionsCount: number;
	promo: string;
	setPromo: (value: string) => void;
	subtotalLabel: string;
}) {
	return (
		<div>
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
					Корзина
				</h1>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						className="text-ink-muted hover:text-destructive"
						onClick={onClear}>
						<Trash2
							aria-hidden="true"
							className="size-4"
						/>
						Очистить корзину
					</Button>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={onShare}>
						<Share2
							aria-hidden="true"
							className="size-4"
						/>
						Поделиться
					</Button>
				</div>
			</div>

			<div className={cn(surfaceVariants({ variant: "card" }), "p-4 sm:p-6")}>
				<ul>
					{lines.map((line) => (
						<CartLineItem
							key={line.product.id}
							line={line}
							onRemove={() => {
								onRemove(line.product.id);
							}}
						/>
					))}
				</ul>

				<div className="mt-5 grid gap-3 border-t border-hairline pt-5">
					<div className="flex flex-col gap-2 sm:flex-row">
						<Input
							value={promo}
							onChange={(event) => {
								setPromo(event.target.value);
							}}
							placeholder="Промокод"
							className="sm:max-w-56"
						/>
						<Button
							type="button"
							variant="secondary"
							onClick={onPromoApply}>
							Активировать
						</Button>
					</div>

					<p className="text-xs text-ink-muted">
						Этот заказ добавит бонусные баллы после подтверждения менеджером.
					</p>

					<div className="mt-2 grid gap-2">
						<SummaryRow
							label="Товаров на сумму"
							value={subtotalLabel}
						/>
						<SummaryRow
							label="Позиций в корзине"
							value={`${positionsCount}`}
						/>
						<SummaryRow
							label="Общее количество"
							value={`${cartCount}`}
						/>
					</div>

					<div className="mt-6 flex items-baseline justify-between gap-4">
						<p className="text-base font-medium text-ink">Итого</p>
						<p className="text-3xl font-semibold text-ink sm:text-4xl">
							{subtotalLabel}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function CheckoutPanel({
	cartCount,
	hasRequestedPrice,
	subtotalLabel,
}: {
	cartCount: number;
	hasRequestedPrice: boolean;
	subtotalLabel: string;
}) {
	const [buyerType, setBuyerType] = useState<BuyerType>("person");
	const [region, setRegion] = useState("");
	const [callBack, setCallBack] = useState(false);

	return (
		<aside className={cn(surfaceVariants({ variant: "muted" }), "p-5 sm:p-7")}>
			<h2 className="text-3xl font-semibold tracking-normal text-ink">
				Оформление заказа
			</h2>

			<div className="mt-6 flex flex-wrap items-center gap-4">
				<h3 className="text-lg font-semibold text-ink">
					{buyerType === "person" ? "Физическое лицо" : "Юридическое лицо"}
				</h3>
				<button
					type="button"
					className="text-sm font-medium text-ink-muted transition-colors hover:text-ink">
					Войти или зарегистрироваться
				</button>
			</div>

			<div className="mt-5 grid gap-2">
				<span className="text-xs font-medium text-ink-muted">
					Тип покупателя
				</span>
				<BuyerTypeToggle
					buyerType={buyerType}
					onChange={setBuyerType}
				/>
			</div>

			{buyerType === "company" ? (
				<div className="mt-5">
					<FormField label="Поиск организации или ИП">
						<Input placeholder="Введите название, ИНН или адрес" />
					</FormField>
				</div>
			) : null}

			<div className="mt-5 grid gap-4 sm:grid-cols-2">
				{buyerType === "person" ? (
					<>
						<FormField
							label="Имя"
							required>
							<Input autoComplete="given-name" />
						</FormField>
						<FormField label="Фамилия">
							<Input autoComplete="family-name" />
						</FormField>
						<FormField
							label="Телефон"
							required>
							<Input
								autoComplete="tel"
								placeholder="+X 111 222-33-44"
							/>
						</FormField>
						<FormField label="Электронная почта">
							<Input
								type="email"
								autoComplete="email"
							/>
						</FormField>
					</>
				) : (
					<>
						<FormField
							label="Телефон"
							required>
							<Input
								autoComplete="tel"
								placeholder="+X 111 222-33-44"
							/>
						</FormField>
						<FormField
							label="Электронная почта"
							required>
							<Input
								type="email"
								autoComplete="email"
							/>
						</FormField>
						<FormField
							label="Компания"
							required>
							<Input />
						</FormField>
						<FormField label="ИНН">
							<Input inputMode="numeric" />
						</FormField>
						<FormField label="КПП">
							<Input inputMode="numeric" />
						</FormField>
						<FormField label="ОГРН">
							<Input inputMode="numeric" />
						</FormField>
						<FormField label="Юридический адрес">
							<Input />
						</FormField>
						<FormField label="БИК">
							<Input inputMode="numeric" />
						</FormField>
						<FormField label="Наименование банка">
							<Input />
						</FormField>
						<FormField label="Корр. счет">
							<Input inputMode="numeric" />
						</FormField>
						<FormField label="Расчетный счет">
							<Input inputMode="numeric" />
						</FormField>
					</>
				)}
			</div>

			<h3 className="mt-8 text-xl font-semibold text-ink">Доставка</h3>
			<p className="mt-3 text-xs text-ink-muted">
				<span className="text-destructive">*</span> Для расчета стоимости и
				срока доставки заполните поля со звездочкой
			</p>

			<div className="mt-5 grid gap-4 sm:grid-cols-2">
				<FormField
					label="Страна"
					required>
					<Input
						value="Российская Федерация"
						readOnly
					/>
				</FormField>
				<FormField
					label="Регион"
					required>
					<Select
						value={region}
						onChange={(event) => {
							setRegion(event.target.value);
						}}>
						<option value="">Выберите регион</option>
						{REGION_OPTIONS.map((option) => (
							<option
								key={option}
								value={option}>
								{option}
							</option>
						))}
					</Select>
				</FormField>
				<FormField
					label="Город"
					required>
					<Input autoComplete="address-level2" />
				</FormField>
			</div>

			<div className="mt-7">
				<div className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
					Комментарий к заказу
					<ChevronUp
						aria-hidden="true"
						className="size-4"
					/>
				</div>
				<textarea
					className="min-h-28 w-full resize-y rounded-md border border-hairline bg-canvas px-4 py-3 text-sm text-ink shadow-control outline-none placeholder:text-ink-faint focus-visible:border-hairline-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				/>
			</div>

			<div className="mt-7 grid gap-3">
				<SummaryRow
					label="Стоимость товаров"
					value={subtotalLabel}
				/>
				<SummaryRow
					label="Стоимость доставки"
					value="не выбрано"
				/>
			</div>

			<div className="mt-7 flex flex-wrap items-baseline justify-between gap-4">
				<p className="text-base font-medium text-ink">
					Итого без учета доставки:
				</p>
				<p className="text-3xl font-semibold text-ink sm:text-4xl">
					{subtotalLabel}
				</p>
			</div>

			{hasRequestedPrice ? (
				<p className="mt-3 text-xs text-ink-muted">
					В корзине есть товары с ценой по запросу. Менеджер уточнит итоговую
					стоимость после оформления.
				</p>
			) : null}

			<Button
				type="button"
				variant="dark"
				className="mt-6 w-full"
				onClick={() => {
					emitShopToast({
						title: "Доставка будет рассчитана менеджером",
						description: `${cartCount} товаров в заказе`,
					});
				}}>
				Выбрать доставку
			</Button>

			<div className="mt-5 rounded-md border border-hairline bg-canvas p-4 text-sm leading-relaxed text-ink">
				<p className="font-semibold">
					Вы можете отказаться от обязательного звонка менеджера для
					подтверждения заказа, Ваш заказ сразу будет собран и отправлен.
				</p>
				<p className="mt-3 text-ink-muted">
					При необходимости мы все же перезвоним Вам для уточнения контактной
					информации или наличия товара.
				</p>
				<label className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink">
					<input
						type="checkbox"
						checked={callBack}
						onChange={(event) => {
							setCallBack(event.target.checked);
						}}
						className="size-5 rounded-sm border border-hairline accent-ink"
					/>
					Перезвоните мне для подтверждения заказа
				</label>
			</div>
		</aside>
	);
}

export function CartPage() {
	const {
		cartCount,
		clearCart,
		hydrated,
		removeFromCart,
		state,
	} = useShopState();
	const [promo, setPromo] = useState("");
	const subtotal = useMemo(() => {
		return state.cart.reduce((total, line) => {
			const lineTotal = getLineTotal(line);

			return lineTotal == null ? total : total + lineTotal;
		}, 0);
	}, [state.cart]);
	const hasRequestedPrice = state.cart.some((line) => getLineTotal(line) == null);
	const subtotalLabel =
		subtotal > 0 ? formatPrice(subtotal, "RUB") : "Цена по запросу";

	async function handleShare() {
		const shareText = `Корзина Leppa & WenSton: ${cartCount} товаров`;

		if (typeof navigator !== "undefined" && navigator.share) {
			try {
				await navigator.share({
					title: "Корзина Leppa & WenSton",
					text: shareText,
					url: window.location.href,
				});
				return;
			} catch {
				// User may cancel native sharing; fall through to copy.
			}
		}

		const didCopy = await copyTextToClipboard(window.location.href);

		emitShopToast({
			title: didCopy ? "Ссылка на корзину скопирована" : "Не удалось скопировать ссылку",
			description: shareText,
		});
	}

	function handlePromoApply() {
		emitShopToast({
			title: promo.trim() ? "Промокод принят к проверке" : "Введите промокод",
			description: promo.trim() || undefined,
		});
	}

	return (
		<section className="bg-canvas text-ink">
			<div className="mx-auto w-full max-w-[1480px] px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:px-10 lg:pb-24 lg:pt-40">
				<Link
					href="/catalog"
					className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
					<ChevronLeft
						aria-hidden="true"
						className="size-4"
					/>
					Вернуться к покупкам
				</Link>

				<div className="mt-8">
					{!hydrated ? (
						<CartPageSkeleton />
					) : state.cart.length > 0 ? (
						<div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.95fr)] lg:items-start">
							<CartItemsPanel
								cartCount={cartCount}
								lines={state.cart}
								onClear={clearCart}
								onPromoApply={handlePromoApply}
								onRemove={removeFromCart}
								onShare={handleShare}
								positionsCount={state.cart.length}
								promo={promo}
								setPromo={setPromo}
								subtotalLabel={subtotalLabel}
							/>
							<CheckoutPanel
								cartCount={cartCount}
								hasRequestedPrice={hasRequestedPrice}
								subtotalLabel={subtotalLabel}
							/>
						</div>
					) : (
						<div
							className={cn(
								surfaceVariants({ variant: "empty" }),
								"px-6 py-14",
							)}>
							<div className="mx-auto flex size-14 items-center justify-center rounded-full border border-hairline bg-canvas text-ink-muted shadow-control">
								<ShoppingBag
									aria-hidden="true"
									className="size-6"
								/>
							</div>
							<h1 className="mt-5 text-3xl font-semibold text-ink">
								Корзина пуста
							</h1>
							<p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
								Добавьте товары из каталога, чтобы оформить заказ.
							</p>
							<Button
								asChild
								variant="dark"
								className="mt-6">
								<Link href="/catalog">Перейти в каталог</Link>
							</Button>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
