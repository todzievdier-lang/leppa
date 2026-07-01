import { Clock, MapPin } from "lucide-react";

import { getContact } from "@/lib/api/contact";

import { ContactGrid, getContactCardItems } from "./contact-grid";
import { ContactMap } from "./contact-map";
import { ContactState } from "./contact-state";

import type { Contact } from "@/types";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

function ContactInfoCard({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon: LucideIcon;
	children: ReactNode;
}) {
	return (
		<article className="flex h-full min-h-48 flex-col items-center rounded-md border border-hairline bg-frost p-5 text-center shadow-control sm:p-6">
			<span className="flex size-12 items-center justify-center rounded-full border border-hairline bg-canvas text-ink shadow-control">
				<Icon
					aria-hidden="true"
					className="h-6 w-6"
					strokeWidth={1.75}
				/>
			</span>

			<h2 className="mt-5 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
				{title}
			</h2>

			<div className="mt-4 w-full text-base leading-relaxed text-ink-muted">
				{children}
			</div>
		</article>
	);
}

function hasContactContent(contact: Contact, cardCount: number) {
	return (
		cardCount > 0 ||
		Boolean(contact.address) ||
		contact.hours.length > 0 ||
		Boolean(contact.mapEmbed)
	);
}

export async function ContactSection() {
	const contact = await getContact();

	if (!contact) {
		return <ContactState />;
	}

	const contactItems = getContactCardItems(contact);
	const hasContent = hasContactContent(contact, contactItems.length);

	return (
		<section
			id="contact"
			aria-labelledby="contact-title"
			className="bg-canvas text-ink">
			<div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-44 sm:px-8 sm:pb-20 sm:pt-48 lg:px-14 lg:pb-24 lg:pt-52">
				<div className="mx-auto max-w-3xl text-center">
					<h1
						id="contact-title"
						className="text-4xl font-semibold tracking-normal text-ink sm:text-5xl lg:text-7xl">
						{contact.contactTitle}
					</h1>

					<p className="mx-auto mt-5 max-w-2xl text-base text-ink-muted sm:text-lg">
						{contact.contactDescription}
					</p>
				</div>

				{hasContent ? (
					<>
						<ContactGrid
							items={contactItems}
							className="mt-10 lg:mt-12"
						/>

						<div className="mt-4 grid gap-4 lg:grid-cols-2">
							{contact.address ? (
								<ContactInfoCard
									title="Адрес"
									icon={MapPin}>
									<p>{contact.address}</p>
								</ContactInfoCard>
							) : null}

							{contact.hours.length > 0 ? (
								<ContactInfoCard
									title="Время работы"
									icon={Clock}>
									<dl className="grid gap-3">
										{contact.hours.map((hour) => (
											<div
												key={`${hour.label}-${hour.value}`}
												className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
												<dt className="font-semibold text-ink">{hour.label}</dt>
												<dd>{hour.value}</dd>
											</div>
										))}
									</dl>
								</ContactInfoCard>
							) : null}
						</div>

						{contact.mapEmbed ? (
							<section
								aria-labelledby="contact-map-title"
								className="mt-4">
								<h2
									id="contact-map-title"
									className="sr-only">
									Карта проезда
								</h2>
								<ContactMap
									mapEmbed={contact.mapEmbed}
									mapLink={contact.mapLink}
								/>
							</section>
						) : null}
					</>
				) : (
					<ContactState />
				)}
			</div>
		</section>
	);
}
