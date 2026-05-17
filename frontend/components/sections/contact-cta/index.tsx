"use client";

import { MessageCircle, Phone } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";

import { useApi } from "@/hooks/useApi";

import { getContacts } from "@/lib/api";
import { getContactActionLinks } from "@/lib/contact-actions";
import { FALLBACK_CONTACTS } from "@/lib/fallbacks";

import type { Contacts } from "@/types";

import { contactCtaContent } from "./data";

export function ContactCtaSection() {
	const {
		data: contacts,
		loading,
		error,
		isFallback,
	} = useApi<Contacts>(getContacts, FALLBACK_CONTACTS);

	const safeContacts = contacts ?? FALLBACK_CONTACTS;

	const actionLinks = useMemo(() => {
		return getContactActionLinks(safeContacts);
	}, [safeContacts]);

	const statusText = loading
		? contactCtaContent.loadingLabel
		: isFallback || error
			? contactCtaContent.fallbackLabel
			: "";

	return (
		<section
			id='contact-cta'
			aria-labelledby='contact-cta-title'
			className='relative bg-canvas px-5 pb-16 pt-0 text-ink sm:px-8 sm:pb-20 lg:px-14 lg:pb-24'>
			<div className='mx-auto w-full max-w-5xl'>
				<div
					aria-busy={loading}
					className='relative overflow-hidden rounded-3xl border border-hairline bg-ink px-5 py-12 text-center text-on-dark shadow-surface-lg sm:px-8 sm:py-14 lg:px-14 lg:py-16'>
					<div
						aria-hidden='true'
						className='absolute inset-0 opacity-80'
						style={{
							background:
								"linear-gradient(135deg, rgb(255 255 255 / 0.16), transparent 42%, rgb(255 255 255 / 0.08))",
						}}
					/>
					<div
						aria-hidden='true'
						className='absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent'
					/>

					<div className='relative z-10 mx-auto max-w-3xl'>
						<h2
							id='contact-cta-title'
							className='text-3xl font-semibold tracking-normal text-on-dark sm:text-4xl lg:text-6xl'>
							{contactCtaContent.title}
						</h2>

						<p className='mx-auto mt-5 max-w-2xl text-base text-on-dark/78 sm:text-lg'>
							{contactCtaContent.description}
						</p>

						<div className='mt-8 flex flex-col justify-center gap-3 sm:flex-row'>
							<Button
								asChild
								className='h-12 w-full rounded-md bg-canvas px-6 text-sm font-semibold text-ink shadow-control transition-all duration-200 hover:-translate-y-0.5 hover:bg-frost hover:opacity-100 sm:w-auto'>
								<a
									href={actionLinks.whatsappHref}
									target='_blank'
									rel='noreferrer'
									aria-label={`${contactCtaContent.whatsappButtonLabel}: ${actionLinks.whatsappLabel}`}>
									<MessageCircle
										aria-hidden='true'
										className='mr-2 h-5 w-5'
										strokeWidth={1.8}
									/>
									{contactCtaContent.whatsappButtonLabel}
								</a>
							</Button>

							<Button
								asChild
								variant='outline'
								className='h-12 w-full rounded-md border-white/22 bg-white/10 px-6 text-sm font-semibold text-on-dark shadow-control backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/16 hover:text-on-dark hover:opacity-100 sm:w-auto'>
								<a
									href={actionLinks.phoneHref}
									aria-label={`${contactCtaContent.phoneButtonLabel}: ${actionLinks.phoneLabel}`}>
									<Phone
										aria-hidden='true'
										className='mr-2 h-5 w-5'
										strokeWidth={1.8}
									/>
									{contactCtaContent.phoneButtonLabel}
								</a>
							</Button>
						</div>

						<p
							aria-live='polite'
							className='mt-5 min-h-5 text-sm text-on-dark/55'>
							{statusText}
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
