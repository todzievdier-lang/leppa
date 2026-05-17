"use client";

import Link from "next/link";

import { useApi } from "@/hooks/useApi";

import { getPhoneHref } from "@/lib/contact-actions";
import { FALLBACK_CATEGORIES, FALLBACK_CONTACTS } from "@/lib/fallbacks";
import { getCategories, getContacts } from "@/lib/api";

import type { Category, Contacts } from "@/types";

export function Footer() {
	const {
		data: categories,
		loading: categoriesLoading,
	} = useApi<Category[]>(getCategories, FALLBACK_CATEGORIES);

	const {
		data: contacts,
		loading: contactsLoading,
	} = useApi<Contacts>(getContacts, FALLBACK_CONTACTS);

	if (categoriesLoading || contactsLoading) {
		return <footer>Loading...</footer>;
	}

	const footerCategories = categories ?? FALLBACK_CATEGORIES;
	const footerContacts = contacts ?? FALLBACK_CONTACTS;

	return (
		<footer className='border-t border-hairline bg-canvas'>
			<div className='mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] lg:px-10'>
				<div>
					<Link
						href='/'
						className='text-xl font-semibold text-ink'>
						{footerContacts.company}
					</Link>

					<p className='mt-4 max-w-md text-sm text-ink-muted'>
						{footerContacts.description}
					</p>
				</div>

				<div>
					<h2 className='text-sm font-semibold text-ink'>Каталог</h2>

					<nav className='mt-4 grid gap-2 text-sm text-ink-muted'>
						{footerCategories.map((category) => (
							<Link
								key={category.id}
								href={`/categories/${category.handle}`}
								className='hover:text-ink'>
								{category.name}
							</Link>
						))}
					</nav>
				</div>

				<div>
					<h2 className='text-sm font-semibold text-ink'>Контакты</h2>

					<div className='mt-4 flex flex-col gap-3 text-sm text-ink-muted'>
						<div className='flex flex-wrap gap-3'>
							{footerContacts.messengers.map((messenger) => (
								<a
									key={messenger.label}
									href={messenger.href}
									target='_blank'
									rel='noreferrer'
									className='rounded-full border border-hairline px-3 py-1.5 text-xs transition-all hover:border-ink hover:text-ink'>
									{messenger.label}
								</a>
							))}
						</div>
						<a
							href={getPhoneHref(footerContacts.phone)}
							className='transition-colors hover:text-ink'>
							{footerContacts.phone}
						</a>

						<a
							href={`mailto:${footerContacts.email}`}
							className='transition-colors hover:text-ink'>
							{footerContacts.email}
						</a>

						<a
							href='https://yandex.ru/maps/-/CPgcV-2r'
							target='_blank'
							rel='noreferrer'
							className='max-w-xs leading-relaxed transition-colors hover:text-ink'>
							{footerContacts.address}
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
