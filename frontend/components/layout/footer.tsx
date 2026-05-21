"use client";

import Link from "next/link";
import contacts from "@/data/contacts.json";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { getCategories } from "@/lib/api";
import { getPhoneHref, isExternalContactHref } from "@/lib/contact";
import type { Category } from "@/types";

const footerBrandName = "Leppa & WenSton";
const footerDescription =
	"Премиальная сантехника, зеркала и оборудование для современных ванных комнат.";

export function Footer() {
	const {
		data: categories,
		loading,
		error,
	} = useApi<Category[]>(getCategories);

	if (loading) {
		return (
			<footer className="border-t border-hairline bg-canvas">
				<div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:px-10">
					<p className="text-sm text-ink-muted">Загружаем категории...</p>
				</div>
			</footer>
		);
	}

	if (error) {
		return (
			<footer className="border-t border-hairline bg-canvas">
				<div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:px-10">
					<p className="text-sm text-ink-muted">
						Не удалось загрузить категории.
					</p>
				</div>
			</footer>
		);
	}

	const footerCategories = categories ?? [];

	const phoneHref = getPhoneHref(contacts.phone);

	return (
		<footer className="border-t border-hairline bg-canvas">
			<div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] lg:px-10">
				<div>
					<Link
						href="/"
						className="text-xl font-semibold text-ink">
						{footerBrandName}
					</Link>

					<p className="mt-4 max-w-md text-sm text-ink-muted">
						{footerDescription}
					</p>
				</div>

				<div>
					<h2 className="text-sm font-semibold text-ink">Каталог</h2>

					<nav className="mt-4 grid gap-2 text-sm text-ink-muted">
						{footerCategories.map((category) => (
							<Link
								key={category.id}
								href={`/catalog/${category.slug}`}
								className="hover:text-ink">
								{category.name}
							</Link>
						))}
					</nav>
				</div>

				<div>
					<h2 className="text-sm font-semibold text-ink">Контакты</h2>

					<div className="mt-4 flex flex-col gap-3 text-sm text-ink-muted">
						{contacts.messengers.length > 0 ? (
							<div className="flex flex-wrap gap-3">
								{contacts.messengers.map((messenger) => {
									const isExternal = isExternalContactHref(messenger.href);

									return (
										<Button
											key={messenger.label}
											asChild
											variant="secondary"
											size="sm">
											<a
												href={messenger.href}
												target={isExternal ? "_blank" : undefined}
												rel={isExternal ? "noreferrer" : undefined}>
												{messenger.label}
											</a>
										</Button>
									);
								})}
							</div>
						) : null}

						<a
							href={phoneHref}
							className="transition-colors hover:text-ink">
							{contacts.phone}
						</a>

						<a
							href={`mailto:${contacts.email}`}
							className="transition-colors hover:text-ink">
							{contacts.email}
						</a>

						<a
							href="https://yandex.ru/maps/-/CPgcV-2r"
							target="_blank"
							rel="noreferrer"
							className="max-w-xs leading-relaxed transition-colors hover:text-ink">
							{contacts.address}
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
