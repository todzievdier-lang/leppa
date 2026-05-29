import type { Metadata } from "next";

import { FavoritesPage } from "@/components/shop/favorites-page";

export const metadata: Metadata = {
	title: "Избранное | Leppa & WenSton",
	description: "Товары Leppa & WenSton, которые вы добавили в избранное.",
};

export default function FavoritesRoute() {
	return <FavoritesPage />;
}
