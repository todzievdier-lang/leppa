import type { Contacts, Messenger } from "@/types";

export type ContactActionLinks = {
	phoneHref: string;
	phoneLabel: string;
	whatsappHref: string;
	whatsappLabel: string;
};

export function normalizePhoneForHref(phone: string) {
	return phone.replace(/[^\d+]/g, "");
}

export function getPhoneHref(phone: string) {
	return `tel:${normalizePhoneForHref(phone)}`;
}

export function getPrimaryWhatsAppMessenger(contacts: Contacts): Messenger | null {
	return (
		contacts.messengers.find((messenger) => {
			const searchValue =
				`${messenger.label} ${messenger.href}`.toLocaleLowerCase("ru-RU");

			return searchValue.includes("whatsapp") || searchValue.includes("wa.me");
		}) ??
		contacts.messengers[0] ??
		null
	);
}

export function getWhatsAppHref(contacts: Contacts) {
	const messenger = getPrimaryWhatsAppMessenger(contacts);

	if (messenger?.href) {
		return messenger.href;
	}

	const phone = normalizePhoneForHref(contacts.phone).replace(/^\+/, "");

	return phone ? `https://wa.me/${phone}` : "#";
}

export function getContactActionLinks(
	contacts: Contacts,
): ContactActionLinks {
	const whatsappMessenger = getPrimaryWhatsAppMessenger(contacts);

	return {
		phoneHref: getPhoneHref(contacts.phone),
		phoneLabel: contacts.phone,
		whatsappHref: getWhatsAppHref(contacts),
		whatsappLabel: whatsappMessenger?.label ?? "WhatsApp",
	};
}
