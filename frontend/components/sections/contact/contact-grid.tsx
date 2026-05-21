import { Mail, MessageCircle, Phone } from "lucide-react";

import {
	getEmailHref,
	getMessengerKey,
	getPhoneHref,
	isExternalContactHref,
} from "@/lib/contact";

import { ContactCard } from "./contact-card";
import { getContactGridClassName } from "./contact-layout";

import type { Contact } from "@/types";
import type { LucideIcon } from "lucide-react";

export type ContactCardItem = {
	id: string;
	title: string;
	value: string;
	href: string;
	icon: LucideIcon;
	external?: boolean;
};

export function getContactCardItems(contact: Contact): ContactCardItem[] {
	const items: ContactCardItem[] = [];

	if (contact.phone) {
		items.push({
			id: "phone",
			title: "Телефон",
			value: contact.phone,
			href: getPhoneHref(contact.phone),
			icon: Phone,
		});
	}

	if (contact.email) {
		items.push({
			id: "email",
			title: "Email",
			value: contact.email,
			href: getEmailHref(contact.email),
			icon: Mail,
		});
	}

	contact.messengers.forEach((messenger) => {
		items.push({
			id: getMessengerKey(messenger),
			title: messenger.label,
			value: messenger.value,
			href: messenger.href,
			icon: MessageCircle,
			external: isExternalContactHref(messenger.href),
		});
	});

	return items;
}

export function ContactGrid({
	items,
	className,
}: {
	items: ContactCardItem[];
	className?: string;
}) {
	if (items.length === 0) {
		return null;
	}

	return (
		<div className={getContactGridClassName(items.length, className)}>
			{items.map((item) => (
				<ContactCard
					key={item.id}
					title={item.title}
					value={item.value}
					href={item.href}
					icon={item.icon}
					external={item.external}
				/>
			))}
		</div>
	);
}
