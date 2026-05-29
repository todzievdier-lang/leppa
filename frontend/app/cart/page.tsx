import type { Metadata } from "next";

import { CartPage } from "@/components/shop/cart-page";

export const metadata: Metadata = {
	title: "Корзина | Leppa & WenSton",
	description: "Корзина и оформление заказа Leppa & WenSton.",
};

export default function CartRoute() {
	return <CartPage />;
}
